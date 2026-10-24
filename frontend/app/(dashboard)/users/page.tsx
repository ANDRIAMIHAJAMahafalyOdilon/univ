'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';
import {
  KeyRound,
  MoreHorizontal,
  Plus,
  Search,
  Shield,
  Trash2,
  UserCog,
  Users,
  Clock,
} from 'lucide-react';

import { PageHeader } from '@/components/dashboard/page-header';
import { StatCard } from '@/components/dashboard/stat-card';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { EntityEmptyState } from '@/components/data-table/entity-empty-state';
import { TableSkeleton } from '@/components/data-table/table-skeleton';
import { SystemUserDialog } from '@/components/system-users/system-user-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { api, type ApiSystemUser } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const SEL_ALL = '__all__';

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  it_support: 'IT Support',
  gestionnaire_notes: 'Gestionnaire de Notes',
  enseignant: 'Enseignant',
  etudiant: 'Étudiant',
};

function formatLoginAt(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('fr-FR');
}

export default function SystemUsersPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<ApiSystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState(SEL_ALL);
  const [filterStatut, setFilterStatut] = useState(SEL_ALL);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editUser, setEditUser] = useState<ApiSystemUser | null>(null);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<ApiSystemUser | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const [permOpen, setPermOpen] = useState(false);
  const [permMatrix, setPermMatrix] = useState<Record<string, string[]> | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<ApiSystemUser | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await api.listUsers());
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Erreur chargement',
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const now = Date.now();
  const dayMs = 86400000;
  const stats = useMemo(() => {
    const active = rows.filter((u) => u.statut === 'Actif').length;
    const admins = rows.filter((u) => u.role === 'admin' || u.role === 'super_admin').length;
    const suspended = rows.filter((u) => u.statut !== 'Actif').length;
    const recentLogins = rows.filter((u) => {
      if (!u.last_login_at) return false;
      const t = new Date(u.last_login_at).getTime();
      return !Number.isNaN(t) && now - t < 24 * dayMs;
    }).length;
    return { active, admins, suspended, recentLogins };
  }, [rows, now]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((u) => {
      if (filterRole !== SEL_ALL && u.role !== filterRole) return false;
      if (filterStatut !== SEL_ALL && u.statut !== filterStatut) return false;
      if (!q) return true;
      const hay = [u.email, u.nom, u.prenom, u.role].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search, filterRole, filterStatut]);

  const columns = useMemo<ColumnDef<ApiSystemUser>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected()
                ? true
                : table.getIsSomePageRowsSelected()
                  ? 'indeterminate'
                  : false
            }
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(Boolean(v))}
            aria-label="Tout sélectionner"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(Boolean(v))}
            aria-label="Sélectionner"
          />
        ),
        size: 36,
      },
      {
        id: 'avatar',
        header: '',
        cell: ({ row }) => {
          const u = row.original;
          const initials = `${u.prenom?.[0] ?? ''}${u.nom?.[0] ?? ''}`.toUpperCase();
          return (
            <Avatar className="h-9 w-9 border border-border/60">
              <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">{initials}</AvatarFallback>
            </Avatar>
          );
        },
      },
      {
        accessorKey: 'email',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
      },
      {
        id: 'name',
        accessorFn: (r) => `${r.prenom} ${r.nom}`,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nom complet" />,
      },
      {
        accessorKey: 'role',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Rôle" />,
        cell: ({ row }) => (
          <Badge variant="secondary" className="rounded-lg font-normal">
            {ROLE_LABEL[row.original.role] ?? row.original.role}
          </Badge>
        ),
      },
      {
        accessorKey: 'statut',
        header: 'Statut',
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className={cn(
              row.original.statut === 'Actif'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {row.original.statut === 'Actif' ? 'Actif' : 'Inactif'}
          </Badge>
        ),
      },
      {
        accessorKey: 'last_login_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Dernière connexion" />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{formatLoginAt(row.original.last_login_at)}</span>
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const u = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem
                  onClick={() => {
                    setDialogMode('edit');
                    setEditUser(u);
                    setDialogOpen(true);
                  }}
                >
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setResetTarget(u);
                    setNewPassword('');
                    setResetOpen(true);
                  }}
                >
                  Réinitialiser mot de passe
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(u)}>
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 7 } },
  });

  const selectedIds = table.getFilteredSelectedRowModel().rows.map((r) => r.original.id);

  const onBulkDelete = async () => {
    try {
      for (const id of selectedIds) await api.deleteUser(id);
      toast({ title: 'Comptes désactivés', description: `${selectedIds.length} compte(s).` });
      setRowSelection({});
      await load();
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const onConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteUser(deleteTarget.id);
      toast({ title: 'Compte désactivé' });
      setDeleteTarget(null);
      await load();
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const onConfirmReset = async () => {
    if (!resetTarget || newPassword.length < 6) {
      toast({ variant: 'destructive', title: 'Mot de passe trop court (min 6)' });
      return;
    }
    try {
      await api.resetUserPassword(resetTarget.id, newPassword);
      toast({ title: 'Mot de passe réinitialisé' });
      setResetOpen(false);
      setResetTarget(null);
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestion des Comptes Système"
        actions={
          <Button
            className="rounded-xl"
            onClick={() => {
              setDialogMode('create');
              setEditUser(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un compte
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Comptes actifs" value={stats.active} icon={Users} delay={0} />
        <StatCard title="Administrateurs" value={stats.admins} icon={Shield} delay={0.05} />
        <StatCard title="Connexions (24h)" value={stats.recentLogins} icon={Clock} delay={0.1} />
        <StatCard title="Comptes suspendus / inactifs" value={stats.suspended} icon={UserCog} delay={0.15} />
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="space-y-4 p-4 md:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="rounded-xl pl-9"
                placeholder="Rechercher email, nom…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                type="button"
                onClick={async () => {
                  try {
                    const m = await api.usersPermissionsMatrix();
                    setPermMatrix(m);
                    setPermOpen(true);
                  } catch {
                    toast({ variant: 'destructive', title: 'Impossible de charger les permissions' });
                  }
                }}
              >
                <Shield className="mr-2 h-4 w-4" />
                Matrice des rôles
              </Button>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-[200px] rounded-xl">
                  <SelectValue placeholder="Rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SEL_ALL}>Tous les rôles</SelectItem>
                  {Object.entries(ROLE_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatut} onValueChange={setFilterStatut}>
                <SelectTrigger className="w-[180px] rounded-xl">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SEL_ALL}>Tous</SelectItem>
                  <SelectItem value="Actif">Actif</SelectItem>
                  <SelectItem value="Supprime">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedIds.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-sm">
              <span>{selectedIds.length} sélectionné(s)</span>
              <Button variant="destructive" size="sm" className="rounded-xl" onClick={onBulkDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Désactiver la sélection
              </Button>
            </div>
          ) : null}

          <div className="rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id} className="hover:bg-transparent">
                    {hg.headers.map((h) => (
                      <TableHead key={h.id}>
                        {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableSkeleton rows={6} columns={columns.length} />
                ) : table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="p-0">
                      <EntityEmptyState
                        icon={Users}
                        title="Aucun compte"
                        description="Créez un compte système ou vérifiez la connexion API."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
              <Select
                value={String(table.getState().pagination.pageSize)}
                onValueChange={(v) => table.setPageSize(Number(v))}
              >
                <SelectTrigger className="h-9 w-[110px] rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[7].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
              >
                Suivant
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <SystemUserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initial={editUser}
        onSaved={async () => {
          toast({ title: dialogMode === 'create' ? 'Compte créé' : 'Compte mis à jour' });
          await load();
        }}
      />

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>
              Utilisateur : {resetTarget?.email}. Le nouveau mot de passe remplace l’ancien immédiatement.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="password"
            className="rounded-xl"
            placeholder="Nouveau mot de passe"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setResetOpen(false)}>
              Annuler
            </Button>
            <Button className="rounded-xl" onClick={onConfirmReset}>
              <KeyRound className="mr-2 h-4 w-4" />
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={permOpen} onOpenChange={setPermOpen}>
        <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Permissions par rôle</DialogTitle>
            <DialogDescription>Vue synthétique — à adapter selon votre politique métier.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {permMatrix &&
              Object.entries(permMatrix).map(([role, perms]) => (
                <div key={role} className="rounded-xl border border-border/60 p-3">
                  <p className="font-medium">{ROLE_LABEL[role] ?? role}</p>
                  <ul className="mt-1 list-inside list-disc text-muted-foreground">
                    {perms.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Désactiver ce compte ?</AlertDialogTitle>
            <AlertDialogDescription>
              Suppression logique (statut). Les données liées restent cohérentes avec la base.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl" onClick={onConfirmDelete}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
