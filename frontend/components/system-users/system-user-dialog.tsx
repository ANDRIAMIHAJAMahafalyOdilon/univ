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
import { api, type ApiSystemUser } from '@/lib/api';

const ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'it_support', label: 'IT Support' },
  { value: 'gestionnaire_notes', label: 'Gestionnaire de Notes' },
  { value: 'enseignant', label: 'Enseignant' },
  { value: 'etudiant', label: 'Étudiant' },
] as const;

const schemaCreate = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nom: z.string().min(1),
  prenom: z.string().min(1),
  role: z.string().min(1),
  statut: z.enum(['Actif', 'Supprime']),
});

const schemaEdit = z.object({
  email: z.string().email(),
  password: z.union([z.string().min(6), z.literal('')]).optional(),
  nom: z.string().min(1),
  prenom: z.string().min(1),
  role: z.string().min(1),
  statut: z.enum(['Actif', 'Supprime']),
});

export type SystemUserFormCreate = z.infer<typeof schemaCreate>;
export type SystemUserFormEdit = z.infer<typeof schemaEdit>;

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: 'create' | 'edit';
  initial?: ApiSystemUser | null;
  onSaved: () => void;
};

export function SystemUserDialog({ open, onOpenChange, mode, initial, onSaved }: Props) {
  const formCreate = useForm<SystemUserFormCreate>({
    resolver: zodResolver(schemaCreate),
    defaultValues: {
      email: '',
      password: '',
      nom: '',
      prenom: '',
      role: 'gestionnaire_notes',
      statut: 'Actif',
    },
  });

  const formEdit = useForm<SystemUserFormEdit>({
    resolver: zodResolver(schemaEdit),
    defaultValues: {
      email: '',
      password: '',
      nom: '',
      prenom: '',
      role: 'admin',
      statut: 'Actif',
    },
  });

  useEffect(() => {
    if (!open || !initial || mode !== 'edit') return;
    formEdit.reset({
      email: initial.email,
      password: '',
      nom: initial.nom,
      prenom: initial.prenom,
      role: initial.role,
      statut: initial.statut,
    });
  }, [open, initial, mode, formEdit]);

  useEffect(() => {
    if (!open && mode === 'create') {
      formCreate.reset({
        email: '',
        password: '',
        nom: '',
        prenom: '',
        role: 'gestionnaire_notes',
        statut: 'Actif',
      });
    }
  }, [open, mode, formCreate]);

  const onSubmitCreate = formCreate.handleSubmit(async (v) => {
    await api.createUser({
      email: v.email,
      password: v.password,
      nom: v.nom,
      prenom: v.prenom,
      role: v.role,
      statut: v.statut,
    });
    onSaved();
    onOpenChange(false);
  });

  const onSubmitEdit = formEdit.handleSubmit(async (v) => {
    if (!initial) return;
    await api.updateUser(initial.id, {
      email: v.email,
      nom: v.nom,
      prenom: v.prenom,
      role: v.role,
      statut: v.statut,
      ...(v.password ? { password: v.password } : {}),
    });
    onSaved();
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Nouveau compte système' : 'Modifier le compte'}</DialogTitle>
          <DialogDescription>Rôles normalisés côté API — mot de passe hashé (bcrypt) en base.</DialogDescription>
        </DialogHeader>
        {mode === 'create' ? (
          <Form {...formCreate}>
            <form onSubmit={onSubmitCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={formCreate.control}
                  name="prenom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom</FormLabel>
                      <FormControl>
                        <Input className="rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formCreate.control}
                  name="nom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input className="rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={formCreate.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input className="rounded-xl" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={formCreate.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe</FormLabel>
                    <FormControl>
                      <Input className="rounded-xl" type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={formCreate.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rôle</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={formCreate.control}
                name="statut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Actif">Actif</SelectItem>
                        <SelectItem value="Supprime">Inactif / supprimé logiquement</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
                <Button type="submit" className="rounded-xl" disabled={formCreate.formState.isSubmitting}>
                  Créer
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <Form {...formEdit}>
            <form onSubmit={onSubmitEdit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={formEdit.control}
                  name="prenom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom</FormLabel>
                      <FormControl>
                        <Input className="rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formEdit.control}
                  name="nom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input className="rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={formEdit.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input className="rounded-xl" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={formEdit.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nouveau mot de passe</FormLabel>
                    <FormControl>
                      <Input
                        className="rounded-xl"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Laisser vide pour ne pas changer"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={formEdit.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rôle</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={formEdit.control}
                name="statut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Actif">Actif</SelectItem>
                        <SelectItem value="Supprime">Inactif / supprimé logiquement</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
                <Button type="submit" className="rounded-xl" disabled={formEdit.formState.isSubmitting}>
                  Enregistrer
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
