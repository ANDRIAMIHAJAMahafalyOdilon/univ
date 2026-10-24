'use client';

import Link from 'next/link';
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
  Building2,
  GraduationCap,
  Layers,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';

import { PageHeader } from '@/components/dashboard/page-header';
import { StatCard } from '@/components/dashboard/stat-card';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { EntityEmptyState } from '@/components/data-table/entity-empty-state';
import { TableSkeleton } from '@/components/data-table/table-skeleton';
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
import { api, type ApiTeacher } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { TeacherFormDialog } from '@/components/teachers/teacher-form-dialog';

const SEL_ALL = '__all__';

export default function TeachersPage() {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<ApiTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState(SEL_ALL);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [deleteTarget, setDeleteTarget] = useState<ApiTeacher | null>(null);
  const [teacherDialogOpen, setTeacherDialogOpen] = useState(false);
  const [teacherDialogMode, setTeacherDialogMode] = useState<'create' | 'edit'>('create');
  const [teacherEdit, setTeacherEdit] = useState<ApiTeacher | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTeachers(await api.listTeachers());
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Chargement impossible',
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const departments = useMemo(() => {
    const s = new Set(teachers.map((t) => t.departement));
    return Array.from(s).sort();
  }, [teachers]);

  const stats = useMemo(() => {
    const total = teachers.length;
    const active = teachers.filter((t) => t.statut === 'Actif').length;
    const depts = new Set(teachers.map((t) => t.departement)).size;
    const modulesSum = teachers.reduce((acc, t) => acc + (t.modules_count ?? 0), 0);
    return { total, active, depts, modulesSum };
  }, [teachers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teachers.filter((t) => {
      if (filterDept !== SEL_ALL && t.departement !== filterDept) return false;
      if (!q) return true;
      const hay = [
        t.nom_enseignant,
        t.prenom_enseignant,
        t.departement,
        t.email_enseignant,
        t.contact_enseignant,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [teachers, search, filterDept]);

  const columns = useMemo<ColumnDef<ApiTeacher>[]>(
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
          />
        ),
        cell: ({ row }) => (
          <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(Boolean(v))} />
        ),
      },
      {
        id: 'avatar',
        header: '',
        cell: ({ row }) => {
          const t = row.original;
          const initials = `${t.prenom_enseignant?.[0] ?? ''}${t.nom_enseignant?.[0] ?? ''}`.toUpperCase();
          return (
            <Avatar className="h-9 w-9 border border-border/60">
              <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">{initials}</AvatarFallback>
            </Avatar>
          );
        },
      },
      {
        id: 'code',
        accessorFn: () => '',
        header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
        cell: ({ row }) => (
          <Link
            href={`/teachers/${row.original.id_enseignant}`}
            className="font-mono text-xs text-primary underline-offset-4 hover:underline"
          >
            {row.original.id_enseignant.slice(0, 8)}…
          </Link>
        ),
      },
      {
        accessorKey: 'nom_enseignant',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nom" />,
      },
      {
        accessorKey: 'prenom_enseignant',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Prénom" />,
      },
      {
        accessorKey: 'email_enseignant',
        header: 'Email',
        cell: ({ row }) => row.original.email_enseignant || '—',
      },
      {
        accessorKey: 'contact_enseignant',
        header: 'Téléphone',
        cell: ({ row }) => row.original.contact_enseignant || '—',
      },
      {
        accessorKey: 'departement',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Département" />,
      },
      {
        id: 'modules',
        header: 'Modules',
        cell: ({ row }) => (
          <Badge variant="secondary" className="rounded-lg font-mono tabular-nums">
            {row.original.modules_count ?? 0}
          </Badge>
        ),
      },
      {
        accessorKey: 'statut',
        header: 'Statut',
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className={
              row.original.statut === 'Actif'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : ''
            }
          >
            {row.original.statut === 'Actif' ? 'Actif' : 'Inactif'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/teachers/${row.original.id_enseignant}`}>Voir détails</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setTeacherDialogMode('edit');
                  setTeacherEdit(row.original);
                  setTeacherDialogOpen(true);
                }}
              >
                Modifier
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(row.original)}>
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
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
    getRowId: (r) => r.id_enseignant,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 7 } },
  });

  const onConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteTeacher(deleteTarget.id_enseignant);
      toast({ title: 'Enseignant désactivé' });
      setDeleteTarget(null);
      await load();
      setRowSelection({});
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
        title="Gestion des Enseignants"
        actions={
          <Button
            className="rounded-xl"
            onClick={() => {
              setTeacherDialogMode('create');
              setTeacherEdit(null);
              setTeacherDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un enseignant
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total enseignants" value={stats.total} icon={Users} delay={0} />
        <StatCard title="Actifs" value={stats.active} icon={GraduationCap} delay={0.05} />
        <StatCard title="Départements (uniques)" value={stats.depts} icon={Building2} delay={0.1} />
        <StatCard title="Modules attribués (total)" value={stats.modulesSum} icon={Layers} delay={0.15} />
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="space-y-4 p-4 md:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="rounded-xl pl-9"
                placeholder="Rechercher…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger className="w-[220px] rounded-xl">
                <SelectValue placeholder="Département" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEL_ALL}>Tous les départements</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
                        icon={GraduationCap}
                        title="Aucun enseignant"
                        description="Créez un enseignant ou vérifiez l’API."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
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
            <span className="text-sm text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
            </span>
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

      <TeacherFormDialog
        open={teacherDialogOpen}
        onOpenChange={setTeacherDialogOpen}
        mode={teacherDialogMode}
        initial={teacherEdit}
        onSaved={load}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet enseignant ?</AlertDialogTitle>
            <AlertDialogDescription>Suppression logique vers la corbeille.</AlertDialogDescription>
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
