'use client';

import { useEffect } from 'react';
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
import { api, type ApiTeacher } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const DEPTS = ['Informatique', 'Mathématiques', 'Physique', 'Chimie', 'Biologie', 'Droit', 'Économie', 'Lettres'];

const teacherFormSchema = z.object({
  nom_enseignant: z.string().min(1, 'Nom requis'),
  prenom_enseignant: z.string().min(1, 'Prénom requis'),
  departement: z.string().min(1, 'Département requis'),
  email_enseignant: z.union([z.string().email('Email invalide'), z.literal('')]).optional(),
  contact_enseignant: z.string().optional(),
  statut: z.enum(['Actif', 'Supprime']).optional(),
});

export type TeacherFormValues = z.infer<typeof teacherFormSchema>;

type TeacherFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  initial?: ApiTeacher | null;
  onSaved: () => void;
};

const emptyValues: TeacherFormValues = {
  nom_enseignant: '',
  prenom_enseignant: '',
  departement: '',
  email_enseignant: '',
  contact_enseignant: '',
  statut: 'Actif',
};

export function TeacherFormDialog({ open, onOpenChange, mode, initial, onSaved }: TeacherFormDialogProps) {
  const { toast } = useToast();
  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && initial) {
      form.reset({
        nom_enseignant: initial.nom_enseignant,
        prenom_enseignant: initial.prenom_enseignant,
        departement: initial.departement,
        email_enseignant: initial.email_enseignant ?? '',
        contact_enseignant: initial.contact_enseignant ?? '',
        statut: initial.statut,
      });
    } else {
      form.reset({ ...emptyValues, statut: 'Actif' });
    }
  }, [open, mode, initial, form]);

  async function onSubmit(values: TeacherFormValues) {
    const payload = {
      nom_enseignant: values.nom_enseignant.trim(),
      prenom_enseignant: values.prenom_enseignant.trim(),
      departement: values.departement.trim(),
      email_enseignant: values.email_enseignant?.trim() || null,
      contact_enseignant: values.contact_enseignant?.trim() || null,
    };
    try {
      if (mode === 'create') {
        await api.createTeacher(payload);
        toast({ title: 'Enseignant créé' });
      } else if (initial) {
        await api.updateTeacher(initial.id_enseignant, {
          ...payload,
          ...(values.statut ? { statut: values.statut } : {}),
        });
        toast({ title: 'Enseignant mis à jour' });
      }
      onOpenChange(false);
      onSaved();
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border/60 px-6 py-4">
          <DialogTitle>{mode === 'create' ? 'Nouvel enseignant' : 'Modifier l’enseignant'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Créer un nouveau profil enseignant — données d’identité et rattachement.'
              : 'Mettre à jour les informations de l’enseignant.'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[min(70vh,560px)] px-6 py-4">
          <Form {...form}>
            <form id="teacher-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground">Informations personnelles</h3>
                <p className="text-xs text-muted-foreground">Données d&apos;identité de l&apos;enseignant</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="nom_enseignant"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input className="rounded-xl" placeholder="Mbaye" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prenom_enseignant"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom</FormLabel>
                      <FormControl>
                        <Input className="rounded-xl" placeholder="Cheikh" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email_enseignant"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input className="rounded-xl" type="email" placeholder="prenom.nom@univ.edu" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contact_enseignant"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input className="rounded-xl" placeholder="+221 77 123 45 67" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground">Informations professionnelles</h3>
              </div>
              <FormField
                control={form.control}
                name="departement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Département</FormLabel>
                    <FormControl>
                      <div>
                        <Input className="rounded-xl" list="teacher-dept-datalist" placeholder="Ex. Informatique" {...field} />
                        <datalist id="teacher-dept-datalist">
                          {DEPTS.map((d) => (
                            <option key={d} value={d} />
                          ))}
                        </datalist>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {mode === 'edit' ? (
                <FormField
                  control={form.control}
                  name="statut"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Actif">Actif</SelectItem>
                          <SelectItem value="Supprime">Inactif (corbeille)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
            </form>
          </Form>
        </ScrollArea>
        <DialogFooter className="border-t border-border/60 px-6 py-4">
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="submit" form="teacher-form" className="rounded-xl">
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
