'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
import { BookOpen, Layers, MoreHorizontal, Plus, Search, User } from 'lucide-react';

import { PageHeader } from '@/components/dashboard/page-header';
import { StatCard } from '@/components/dashboard/stat-card';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { EntityEmptyState } from '@/components/data-table/entity-empty-state';
import { TableSkeleton } from '@/components/data-table/table-skeleton';
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
import { api, type ApiModule } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const SEL_ALL = '__all__';

function ModulesPageInner() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [modules, setModules] = useState<ApiModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTeacher, setFilterTeacher] = useState(SEL_ALL);
  const [filterParcours, setFilterParcours] = useState(SEL_ALL);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [deleteTarget, setDeleteTarget] = useState<ApiModule | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setModules(await api.listModules());
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

  useEffect(() => {
    const pid = searchParams.get('parcoursId');
    if (pid) setFilterParcours(pid);
  }, [searchParams]);

  const teachersOptions = useMemo(() => {
    const m = new Map<string, string>();
    modules.forEach((mod) => {
      if (mod.enseignant)
        m.set(mod.enseignant.id_enseignant, `${mod.enseignant.prenom_enseignant} ${mod.enseignant.nom_enseignant}`);
    });
    return Array.from(m.entries());
  }, [modules]);

  const parcoursOptions = useMemo(() => {
    const m = new Map<string, string>();
    modules.forEach((mod) => {
      if (mod.parcours) m.set(mod.parcours.id, mod.parcours.nom);
    });
    return Array.from(m.entries());
  }, [modules]);

  const stats = useMemo(() => {
    const total = modules.length;
    const withTeacher = modules.filter((m) => Boolean(m.enseignant)).length;
    const withoutTeacher = total - withTeacher;
    const s1 = modules.filter((m) => m.semestre === 'S1').length;
    return { total, withTeacher, withoutTeacher, s1 };
  }, [modules]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return modules.filter((m) => {
      if (filterTeacher !== SEL_ALL && m.id_enseignant_responsable !== filterTeacher) return false;
      if (filterParcours !== SEL_ALL && m.parcours?.id !== filterParcours) return false;
      if (!q) return true;
      const hay = [m.nom_module, m.code_module, m.semestre, m.annee_academique].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [modules, search, filterTeacher, filterParcours]);

  const columns = useMemo<ColumnDef<ApiModule>[]>(
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
        accessorKey: 'code_module',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Code" />,
        cell: ({ row }) => (
          <Link className="font-mono text-sm text-primary hover:underline" href={`/modules/${row.original.id_module}`}>
            {row.original.code_module}
          </Link>
        ),
      },
      {
        accessorKey: 'nom_module',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Module" />,
      },
      {
        id: 'ects',
        accessorKey: 'credits_ects',
        header: 'ECTS',
      },
      {
        id: 'coefficient',
        accessorKey: 'coefficient_module',
        header: 'Coefficient',
        cell: ({ row }) => String(row.original.coefficient_module),
      },
      {
        accessorKey: 'semestre',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Semestre" />,
      },
      {
        id: 'annee',
        accessorKey: 'annee_academique',
        header: 'Année universitaire',
        cell: ({ row }) => row.original.annee_academique,
      },
      {
        id: 'enseignant',
        header: 'Enseignant',
        cell: ({ row }) =>
          row.original.enseignant ? (
            <span className="text-sm">
              {row.original.enseignant.prenom_enseignant} {row.original.enseignant.nom_enseignant}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: 'niveau',
        header: 'Niveau',
        cell: ({ row }) => row.original.niveau_libelle ?? row.original.niveau?.nom ?? '—',
      },
      {
        id: 'parcours',
        header: 'Parcours',
        cell: ({ row }) => row.original.parcours?.nom ?? '—',
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
                <Link href={`/modules/${row.original.id_module}`}>Voir détails</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/modules/create?edit=${row.original.id_module}`}>Modifier</Link>
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
    getRowId: (r) => r.id_module,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 7 } },
  });

  const onDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteModule(deleteTarget.id_module);
      toast({ title: 'Module désactivé' });
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
        title="Gestion des Modules"
        actions={
          <Button className="rounded-xl" asChild>
            <Link href="/modules/create">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un module
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total modules" value={stats.total} icon={BookOpen} />
        <StatCard title="Avec enseignant" value={stats.withTeacher} icon={User} />
        <StatCard title="Sans enseignant" value={stats.withoutTeacher} icon={User} />
        <StatCard title="Semestre S1" value={stats.s1} icon={Layers} />
      </div>

      <Card className="border-border/60">
        <CardContent className="space-y-4 p-4 md:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="rounded-xl pl-9"
                placeholder="Rechercher code, nom, semestre…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterTeacher} onValueChange={setFilterTeacher}>
              <SelectTrigger className="w-full rounded-xl lg:w-[220px]">
                <SelectValue placeholder="Enseignant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEL_ALL}>Tous les enseignants</SelectItem>
                {teachersOptions.map(([id, label]) => (
                  <SelectItem key={id} value={id}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterParcours} onValueChange={setFilterParcours}>
              <SelectTrigger className="w-full rounded-xl lg:w-[200px]">
                <SelectValue placeholder="Parcours" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEL_ALL}>Tous les parcours</SelectItem>
                {parcoursOptions.map(([id, label]) => (
                  <SelectItem key={id} value={id}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
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
                      <EntityEmptyState icon={BookOpen} title="Aucun module" description="Créez un module ou ajustez les filtres." />
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

          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-xl" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
                Précédent
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
                Suivant
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce module ?</AlertDialogTitle>
            <AlertDialogDescription>Envoi vers la corbeille (suppression logique).</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl" onClick={onDelete}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function ModulesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          Chargement…
        </div>
      }
    >
      <ModulesPageInner />
    </Suspense>
  );
}
