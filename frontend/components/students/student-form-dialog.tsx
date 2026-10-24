'use client';

import { useEffect, useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api, type ApiAcademicAnnee, type ApiAcademicNiveau, type ApiAcademicParcours, type ApiStudent } from '@/lib/api';

const SEL_NONE = '__none__';

const studentFormSchema = z.object({
  numero_matricule: z.string().min(1, 'Matricule requis'),
  nom_etudiant: z.string().min(1, 'Nom requis'),
  prenom_etudiant: z.string().min(1, 'Prénom requis'),
  date_naissance: z.string().optional().nullable(),
  filiere: z.string().min(1, 'Programme / filière requis'),
  annee_academique: z.string().min(1, 'Année universitaire requise'),
  contact_etudiant: z.string().optional().nullable(),
  email_etudiant: z.union([z.string().email('Email invalide'), z.literal('')]).optional(),
  parcours_id: z.string().optional().nullable(),
  niveau_id: z.string().optional().nullable(),
  statut: z.enum(['Actif', 'Suspendu', 'Redoublant', 'Diplome', 'Abandon', 'Exclu', 'Transfere']),
});

export type StudentFormValues = z.infer<typeof studentFormSchema>;

type StudentFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  initial?: ApiStudent | null;
  onSaved: () => void;
};

const emptyValues: StudentFormValues = {
  numero_matricule: '',
  nom_etudiant: '',
  prenom_etudiant: '',
  date_naissance: '',
  filiere: '',
  annee_academique: '',
  contact_etudiant: '',
  email_etudiant: '',
  parcours_id: null,
  niveau_id: null,
  statut: 'Actif',
};

function toPayload(v: StudentFormValues) {
  return {
    numero_matricule: v.numero_matricule.trim(),
    nom_etudiant: v.nom_etudiant.trim(),
    prenom_etudiant: v.prenom_etudiant.trim(),
    date_naissance: v.date_naissance || null,
    filiere: v.filiere.trim(),
    annee_academique: v.annee_academique.trim(),
    contact_etudiant: v.contact_etudiant?.trim() || null,
    email_etudiant: v.email_etudiant?.trim() || null,
    parcours_id: v.parcours_id && v.parcours_id.length > 0 ? v.parcours_id : null,
    niveau_id: v.niveau_id && v.niveau_id.length > 0 ? v.niveau_id : null,
    statut: v.statut,
  };
}

export function StudentFormDialog({ open, onOpenChange, mode, initial, onSaved }: StudentFormDialogProps) {
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: emptyValues,
  });

  const [parcours, setParcours] = useState<ApiAcademicParcours[]>([]);
  const [annees, setAnnees] = useState<ApiAcademicAnnee[]>([]);
  const [niveaux, setNiveaux] = useState<ApiAcademicNiveau[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);

  const watchedParcours = form.watch('parcours_id');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoadingMeta(true);
      try {
        const [p, a] = await Promise.all([api.listAcademicParcours(), api.listAcademicAnnees()]);
        if (!cancelled) {
          setParcours(p);
          setAnnees(a);
        }
      } finally {
        if (!cancelled) setLoadingMeta(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !watchedParcours) {
      setNiveaux([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const n = await api.listAcademicNiveaux(watchedParcours);
        if (!cancelled) setNiveaux(n);
      } catch {
        if (!cancelled) setNiveaux([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, watchedParcours]);

  useEffect(() => {
    if (!open) return;
    if (initial && mode === 'edit') {
      form.reset({
        numero_matricule: initial.numero_matricule,
        nom_etudiant: initial.nom_etudiant,
        prenom_etudiant: initial.prenom_etudiant,
        date_naissance: initial.date_naissance || '',
        filiere: initial.filiere,
        annee_academique: initial.annee_academique,
        contact_etudiant: initial.contact_etudiant || '',
        email_etudiant: initial.email_etudiant || '',
        parcours_id: initial.parcours?.id ?? null,
        niveau_id: initial.niveau?.id ?? null,
        statut: initial.statut === 'Supprime' ? 'Actif' : initial.statut,
      });
    } else if (!initial && mode === 'create') {
      form.reset(emptyValues);
    }
  }, [open, initial, mode, form]);

  const onParcoursChange = (id: string | null) => {
    form.setValue('parcours_id', id, { shouldValidate: true });
    form.setValue('niveau_id', null);
    const p = parcours.find((x) => x.id === id);
    if (p) {
      form.setValue('filiere', p.nom, { shouldValidate: true });
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = toPayload(values);
    if (mode === 'create') {
      await api.createStudent(payload);
    } else if (initial) {
      await api.updateStudent(initial.id_etudiant, payload);
    }
    onSaved();
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,800px)] gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border/60 px-6 py-4">
          <DialogTitle className="text-lg">
            {mode === 'create' ? 'Ajouter un étudiant' : 'Modifier l’étudiant'}
          </DialogTitle>
          <DialogDescription>Renseigne les informations de l’étudiant puis enregistre.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} className="flex max-h-[min(90vh,800px)] flex-col">
            <ScrollArea className="max-h-[60vh] px-6">
              <div className="space-y-4 py-4 pr-2">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="nom_etudiant"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom</FormLabel>
                        <FormControl>
                          <Input className="rounded-xl" placeholder="Nom" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="prenom_etudiant"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prénom</FormLabel>
                        <FormControl>
                          <Input className="rounded-xl" placeholder="Prénom" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="statut"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut</FormLabel>
                      <Select value={field.value} onValueChange={(v) => form.setValue('statut', v as StudentFormValues['statut'])}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Sélectionner un statut" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Actif">Actif</SelectItem>
                          <SelectItem value="Suspendu">Suspendu</SelectItem>
                          <SelectItem value="Redoublant">Redoublant</SelectItem>
                          <SelectItem value="Diplome">Diplomé</SelectItem>
                          <SelectItem value="Abandon">Abandon</SelectItem>
                          <SelectItem value="Exclu">Exclu</SelectItem>
                          <SelectItem value="Transfere">Transfere</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numero_matricule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Matricule</FormLabel>
                      <FormControl>
                        <Input className="rounded-xl font-mono" placeholder="ID étudiant / matricule" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="email_etudiant"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            className="rounded-xl"
                            type="email"
                            placeholder="email@univ.edu"
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact_etudiant"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone</FormLabel>
                        <FormControl>
                          <Input className="rounded-xl" placeholder="+33 …" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="date_naissance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de naissance</FormLabel>
                      <FormControl>
                        <Input className="rounded-xl" type="date" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="parcours_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parcours</FormLabel>
                        <Select
                          value={field.value ? field.value : SEL_NONE}
                          onValueChange={(v) => onParcoursChange(v === SEL_NONE ? null : v)}
                          disabled={loadingMeta}
                        >
                          <FormControl>
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Sélectionner un parcours" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={SEL_NONE}>— Aucun —</SelectItem>
                            {parcours.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.nom}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="niveau_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Niveau</FormLabel>
                        <Select
                          value={field.value ? field.value : SEL_NONE}
                          onValueChange={(v) =>
                            form.setValue('niveau_id', v === SEL_NONE ? null : v, { shouldValidate: true })
                          }
                          disabled={!watchedParcours}
                        >
                          <FormControl>
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Niveau" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={SEL_NONE}>— Aucun —</SelectItem>
                            {niveaux.map((n) => (
                              <SelectItem key={n.id} value={n.id}>
                                {n.nom} ({n.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="filiere"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Programme / Filière (libellé)</FormLabel>
                      <FormControl>
                        <Input className="rounded-xl" placeholder="Libellé (ex. Informatique)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="annee_academique"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Année universitaire</FormLabel>
                      <FormControl>
                        <div>
                          <Input className="rounded-xl" list="annees-univ-list" placeholder="2024-2025" {...field} />
                          <datalist id="annees-univ-list">
                            {annees.map((a) => (
                              <option key={a.id} value={a.libelle} />
                            ))}
                          </datalist>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>
            <DialogFooter className="border-t border-border/60 bg-background/80 px-6 py-4">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" className="rounded-xl" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Enregistrement…' : mode === 'create' ? 'Créer' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
