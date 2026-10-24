'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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
  Archive,
  BookOpen,
  GraduationCap,
  Layers,
  MoreHorizontal,
  Plus,
  Route,
  Search,
  Sparkles,
  Trash2,
  Users,
  Filter,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import { api, type ApiAcademicParcours, type ApiInstitutionListItem, type ApiModule, type ApiTeacher, type ParcoursEtatMetier } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const RESP_ALL = '__all__';
const RESP_NONE = '__none__';
const PAGE_SIZES = [7] as const;

const PARCOURS_OPTIONS = [
  'Licence 1',
  'Licence 2',
  'Licence 3',
  'Maîtrise 1',
  'Maîtrise 2',
  'Doctorat',
] as const;

const ETAT_OPTS: { value: ParcoursEtatMetier; label: string }[] = [
  { value: 'Actif', label: 'Actif' },
  { value: 'En_Developpement', label: 'En développement' },
  { value: 'Archive', label: 'Archivé' },
  { value: 'Obsolete', label: 'Obsolète' },
];

function labelEtat(e?: ParcoursEtatMetier | null) {
  return ETAT_OPTS.find((x) => x.value === e)?.label ?? '—';
}

function ParcoursEtatBadge({ etat }: { etat?: ParcoursEtatMetier | null }) {
  const cls =
    etat === 'Actif'
      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
      : etat === 'En_Developpement'
        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
        : etat === 'Archive'
          ? 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-300'
          : etat === 'Obsolete'
            ? 'bg-destructive/15 text-destructive'
            : '';
  return (
    <Badge variant="outline" className={cn('rounded-lg border-border/60', cls)}>
      {labelEtat(etat)}
    </Badge>
  );
}

export default function ParcoursPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<ApiAcademicParcours[]>([]);
  const [teachers, setTeachers] = useState<ApiTeacher[]>([]);
  const [institutions, setInstitutions] = useState<ApiInstitutionListItem[]>([]);
  const [modules, setModules] = useState<ApiModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [filterResponsable, setFilterResponsable] = useState(RESP_ALL);
  const [filterEtats, setFilterEtats] = useState<ParcoursEtatMetier[]>([]);
  const [niveauxMin, setNiveauxMin] = useState<string>('');
  const [niveauxMax, setNiveauxMax] = useState<string>('');
  const [matchNiveaux, setMatchNiveaux] = useState<number | null>(null);
  const [matchModules, setMatchModules] = useState<number | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    code: '',
    nom: '',
    description: '',
    etat_metier: 'Actif' as ParcoursEtatMetier,
    responsable_id: RESP_NONE,
    institution_id: 'default',
    module_id: RESP_NONE,
  });
  const [editing, setEditing] = useState<ApiAcademicParcours | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiAcademicParcours | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, t, i, m] = await Promise.all([
        api.listCursusParcours(true),
        api.listTeachers(),
        api.listInstitutions(),
        api.listModules(),
      ]);
      setRows(p);
      setTeachers(t);
      setInstitutions(i);
      setModules(m);
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const currentYear = new Date().getFullYear();

  const stats = useMemo(() => {
    const total = rows.filter((r) => r.statut !== 'Supprime').length;
    const actifs = rows.filter(
      (r) => r.statut === 'Actif' && r.etat_metier === 'Actif'
    ).length;
    const avecEtudiants = rows.filter((r) => (r._count?.etudiants ?? 0) > 0 && r.statut === 'Actif').length;
    const nouveauxAnnee = rows.filter((r) => {
      const c = r.created_at ? new Date(r.created_at).getFullYear() : null;
      const u = r.updated_at ? new Date(r.updated_at).getFullYear() : null;
      return (c === currentYear || u === currentYear) && r.statut === 'Actif';
    }).length;
    return { total, actifs, avecEtudiants, nouveauxAnnee };
  }, [rows, currentYear]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const nMin = niveauxMin === '' ? null : Number(niveauxMin);
    const nMax = niveauxMax === '' ? null : Number(niveauxMax);
    return rows.filter((r) => {
      if (r.statut === 'Supprime') return false;
      if (filterResponsable !== RESP_ALL) {
        if (filterResponsable === RESP_NONE) {
          if (r.responsable_id) return false;
        } else if (r.responsable_id !== filterResponsable) return false;
      }
      if (filterEtats.length && (!r.etat_metier || !filterEtats.includes(r.etat_metier))) return false;
      const nc = r._count?.niveaux ?? 0;
      const mc = r._count?.modules ?? 0;
      if (matchNiveaux !== null && nc !== matchNiveaux) return false;
      if (matchModules !== null && mc !== matchModules) return false;
      if (nMin !== null && !Number.isNaN(nMin) && nc < nMin) return false;
      if (nMax !== null && !Number.isNaN(nMax) && nc > nMax) return false;
      if (!q) return true;
      const respNom =
        r.responsable != null
          ? `${r.responsable.prenom_enseignant} ${r.responsable.nom_enseignant}`.toLowerCase()
          : '';
      return (
        r.nom.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q) ||
        respNom.includes(q)
      );
    });
  }, [
    rows,
    search,
    filterResponsable,
    filterEtats,
    niveauxMin,
    niveauxMax,
    matchNiveaux,
    matchModules,
  ]);

  const toggleEtatFilter = (v: ParcoursEtatMetier) => {
    setFilterEtats((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  };

  const columns = useMemo<ColumnDef<ApiAcademicParcours>[]>(
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
        accessorKey: 'nom',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nom du parcours" />,
        cell: ({ row }) => (
          <Link
            href={`/parcours/${row.original.id}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {row.original.nom}
          </Link>
        ),
      },
      {
        accessorKey: 'code',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Code" />,
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.code}</span>,
      },
      {
        id: 'desc',
        header: 'Description',
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-[220px] text-sm text-muted-foreground">
            {row.original.description?.trim() || '—'}
          </span>
        ),
      },
      {
        id: 'responsable',
        accessorFn: (r) =>
          r.responsable ? `${r.responsable.prenom_enseignant} ${r.responsable.nom_enseignant}` : '',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Responsable pédagogique" />,
        cell: ({ row }) => {
          const r = row.original.responsable;
          if (!r)
            return <span className="text-sm text-muted-foreground">Non assigné</span>;
          const initials = `${r.prenom_enseignant?.[0] ?? ''}${r.nom_enseignant?.[0] ?? ''}`.toUpperCase();
          return (
            <Link
              href={`/teachers/${r.id_enseignant}`}
              className="flex items-center gap-2 text-sm text-foreground hover:text-primary"
            >
              <Avatar className="h-8 w-8 border border-border/60">
                <AvatarFallback className="bg-primary/10 text-[10px] font-medium text-primary">{initials}</AvatarFallback>
              </Avatar>
              <span>
                Dr. {r.prenom_enseignant} {r.nom_enseignant}
              </span>
            </Link>
          );
        },
      },
      {
        id: 'universite',
        accessorFn: (r) => r.institution?.nom ?? '',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Université" />,
        cell: ({ row }) => {
          const inst = row.original.institution;
          return inst ? (
            <span className="text-sm">{inst.nom}</span>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          );
        },
      },
      {
        id: 'niveaux_count',
        accessorFn: (r) => r._count?.niveaux ?? 0,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Niveaux" />,
        cell: ({ row }) => {
          const n = row.original._count?.niveaux ?? 0;
          return (
            <button
              type="button"
              className={cn(
                'rounded-lg border px-2 py-0.5 text-xs font-medium transition-colors',
                matchNiveaux === n
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/60 bg-muted/40 hover:bg-muted'
              )}
              onClick={() => setMatchNiveaux((prev) => (prev === n ? null : n))}
            >
              {n}
            </button>
          );
        },
      },
      {
        id: 'modules_count',
        accessorFn: (r) => r._count?.modules ?? 0,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Modules" />,
        cell: ({ row }) => {
          const n = row.original._count?.modules ?? 0;
          return (
            <button
              type="button"
              className={cn(
                'rounded-lg border px-2 py-0.5 text-xs font-medium transition-colors',
                matchModules === n
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/60 bg-muted/40 hover:bg-muted'
              )}
              onClick={() => setMatchModules((prev) => (prev === n ? null : n))}
            >
              {n}
            </button>
          );
        },
      },
      {
        id: 'statut',
        header: 'Statut métier',
        cell: ({ row }) => <ParcoursEtatBadge etat={row.original.etat_metier} />,
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
                <Link href={`/parcours/${row.original.id}`}>Voir détails</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setEditing(row.original);
                  setForm({
                    code: row.original.code,
                    nom: row.original.nom,
                    description: row.original.description ?? '',
                    etat_metier: row.original.etat_metier ?? 'Actif',
                    responsable_id: row.original.responsable_id ?? RESP_NONE,
                    institution_id: row.original.institution_id ?? 'default',
                    module_id: modules.some((m) => m.parcours_id === row.original.id)
                      ? modules.find((m) => m.parcours_id === row.original.id)!.id_module
                      : RESP_NONE,
                  });
                  setDialogOpen(true);
                }}
              >
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/cursus/niveaux?parcoursId=${encodeURIComponent(row.original.id)}`}>
                  Gérer les niveaux
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/modules?parcoursId=${encodeURIComponent(row.original.id)}`}>
                  Gérer les modules
                </Link>
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
    [matchModules, matchNiveaux, modules]
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getRowId: (r) => r.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 7 } },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedIds = selectedRows.map((r) => r.original.id);

  const save = async () => {
    const normalizedCode =
      form.code.trim().length > 0
        ? form.code.trim().toUpperCase()
        : form.nom
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .slice(0, 32);
    if (!form.nom.trim()) {
      toast({ variant: 'destructive', title: 'Nom requis' });
      return;
    }
    if (!normalizedCode) {
      toast({ variant: 'destructive', title: 'Code invalide' });
      return;
    }
    try {
      const payload = {
        code: normalizedCode,
        nom: form.nom.trim(),
        description: form.description.trim() || null,
        etat_metier: form.etat_metier,
        responsable_id: form.responsable_id === RESP_NONE ? null : form.responsable_id,
        institution_id: form.institution_id,
      };
      let pid = editing?.id ?? '';
      if (editing) {
        await api.updateCursusParcours(editing.id, payload);
        toast({ title: 'Parcours mis à jour' });
      } else {
        const created = await api.createCursusParcours(payload);
        pid = created.id;
        toast({ title: 'Parcours créé' });
      }

      const modulePayload = (m: ApiModule) => ({
        code_module: m.code_module,
        nom_module: m.nom_module,
        credits_ects: m.credits_ects,
        coefficient_module: m.coefficient_module,
        semestre: m.semestre,
        annee_academique: m.annee_academique,
        id_enseignant_responsable: m.id_enseignant_responsable,
        annee_universitaire_id: m.annee_universitaire_id ?? null,
        niveau_id: m.niveau_id ?? null,
        niveau_libelle: m.niveau_libelle ?? null,
      });
      const prevModule = modules.find((m) => m.parcours_id === pid);
      const nextModuleId = form.module_id === RESP_NONE ? null : form.module_id;
      if (prevModule && prevModule.id_module !== nextModuleId) {
        await api.updateModule(prevModule.id_module, { ...modulePayload(prevModule), parcours_id: null });
      }
      if (nextModuleId && (!prevModule || prevModule.id_module !== nextModuleId)) {
        const target = modules.find((m) => m.id_module === nextModuleId);
        if (target) {
          await api.updateModule(target.id_module, { ...modulePayload(target), parcours_id: pid });
        }
      }

      setDialogOpen(false);
      setEditing(null);
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

  const confirmDeleteOne = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteCursusParcours(deleteTarget.id);
      toast({ title: 'Parcours archivé' });
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

  const confirmBulkDelete = async () => {
    try {
      for (const id of selectedIds) {
        await api.deleteCursusParcours(id);
      }
      toast({ title: `${selectedIds.length} parcours archivés` });
      setBulkDeleteOpen(false);
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

  const resetFilters = () => {
    setFilterResponsable(RESP_ALL);
    setFilterEtats([]);
    setNiveauxMin('');
    setNiveauxMax('');
    setMatchNiveaux(null);
    setMatchModules(null);
    setSearch('');
  };

  const depsStudents = deleteTarget?._count?.etudiants ?? 0;
  const depsModules = deleteTarget?._count?.modules ?? 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestion des Parcours"
        actions={
          <Button
            className="rounded-xl"
            onClick={() => {
              setEditing(null);
              setForm({
                code: '',
                nom: '',
                description: '',
                etat_metier: 'Actif',
                responsable_id: RESP_NONE,
                institution_id: 'default',
                module_id: RESP_NONE,
              });
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un parcours
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total parcours" value={stats.total} icon={Route} delay={0} />
        <StatCard title="Parcours actifs (état métier)" value={stats.actifs} icon={Sparkles} delay={0.05} />
        <StatCard title="Avec étudiants inscrits" value={stats.avecEtudiants} icon={Users} delay={0.1} />
        <StatCard
          title="Nouveaux / mis à jour (année)"
          value={stats.nouveauxAnnee}
          icon={GraduationCap}
          subtitle={`Année ${currentYear}`}
          delay={0.15}
        />
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="space-y-4 p-4 md:p-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="rounded-xl pl-9"
                placeholder="Rechercher par nom, code, description ou responsable…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-xl gap-2">
                    <Filter className="h-4 w-4" />
                    États métier
                    {filterEtats.length ? (
                      <Badge variant="secondary" className="rounded-md px-1">
                        {filterEtats.length}
                      </Badge>
                    ) : null}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 rounded-xl p-3" align="end">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Filtrer par état</p>
                  <div className="space-y-2">
                    {ETAT_OPTS.map((o) => (
                      <label key={o.value} className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox checked={filterEtats.includes(o.value)} onCheckedChange={() => toggleEtatFilter(o.value)} />
                        {o.label}
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Select value={filterResponsable} onValueChange={setFilterResponsable}>
                <SelectTrigger className="w-[220px] rounded-xl">
                  <SelectValue placeholder="Responsable" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value={RESP_ALL}>Tous les responsables</SelectItem>
                  <SelectItem value={RESP_NONE}>Non assigné</SelectItem>
                  {teachers.map((t) => (
                    <SelectItem key={t.id_enseignant} value={t.id_enseignant}>
                      {t.prenom_enseignant} {t.nom_enseignant}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Input
                  className="h-9 w-16 rounded-xl"
                  placeholder="Min"
                  inputMode="numeric"
                  value={niveauxMin}
                  onChange={(e) => setNiveauxMin(e.target.value.replace(/[^\d]/g, ''))}
                />
                <span className="text-xs text-muted-foreground">à</span>
                <Input
                  className="h-9 w-16 rounded-xl"
                  placeholder="Max"
                  inputMode="numeric"
                  value={niveauxMax}
                  onChange={(e) => setNiveauxMax(e.target.value.replace(/[^\d]/g, ''))}
                />
                <span className="text-xs text-muted-foreground">niveaux</span>
              </div>

              <Button variant="ghost" size="sm" className="rounded-xl" type="button" onClick={resetFilters}>
                Réinitialiser
              </Button>
            </div>
          </div>

          {(matchNiveaux !== null || matchModules !== null) && (
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {matchNiveaux !== null ? (
                <Badge variant="secondary" className="rounded-lg">
                  Filtre niveaux = {matchNiveaux}
                  <button type="button" className="ml-2 text-primary" onClick={() => setMatchNiveaux(null)}>
                    ×
                  </button>
                </Badge>
              ) : null}
              {matchModules !== null ? (
                <Badge variant="secondary" className="rounded-lg">
                  Filtre modules = {matchModules}
                  <button type="button" className="ml-2 text-primary" onClick={() => setMatchModules(null)}>
                    ×
                  </button>
                </Badge>
              ) : null}
            </div>
          )}

          {selectedIds.length > 0 ? (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
              <span className="text-sm font-medium">{selectedIds.length} sélectionné(s)</span>
              <Button variant="destructive" size="sm" className="rounded-xl" onClick={() => setBulkDeleteOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Archiver la sélection
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
                        icon={Route}
                        title="Aucun parcours"
                        description="Créez un parcours ou ajustez les filtres."
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
              </span>
              <Select
                value={String(table.getState().pagination.pageSize)}
                onValueChange={(v) => table.setPageSize(Number(v))}
              >
                <SelectTrigger className="h-9 w-[120px] rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s} / page
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier le parcours' : 'Nouveau parcours'}</DialogTitle>
            <DialogDescription className="sr-only">
              {editing ? 'Modifier le parcours' : 'Nouveau parcours'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="flex flex-col gap-3">
              <Label className="text-sm font-medium leading-none">Parcours</Label>
              <Select value={form.nom} onValueChange={(v) => setForm((f) => ({ ...f, nom: v }))}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Choisir le parcours" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {form.nom && !(PARCOURS_OPTIONS as readonly string[]).includes(form.nom) && (
                    <SelectItem value={form.nom}>{form.nom}</SelectItem>
                  )}
                  {PARCOURS_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-3">
              <Label className="text-sm font-medium leading-none">Module</Label>
              <Select
                value={form.module_id}
                onValueChange={(v) => setForm((f) => ({ ...f, module_id: v }))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Aucun module" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value={RESP_NONE}>Aucun module</SelectItem>
                  {modules
                    .filter((m) => m.statut !== 'Supprime')
                    .map((m) => (
                      <SelectItem key={m.id_module} value={m.id_module}>
                        {m.nom_module} ({m.code_module})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {form.module_id !== RESP_NONE && (
                <p className="text-xs text-muted-foreground">Le module sélectionné sera rattaché à ce parcours.</p>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <Label className="text-sm font-medium leading-none">Code</Label>
              <Input
                className="rounded-xl"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="Ex. LINFO"
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label className="text-sm font-medium leading-none">Description</Label>
              <Input
                className="rounded-xl"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label className="text-sm font-medium leading-none">Responsable pédagogique</Label>
              <Select value={form.responsable_id} onValueChange={(v) => setForm((f) => ({ ...f, responsable_id: v }))}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value={RESP_NONE}>Non assigné</SelectItem>
                  {teachers.map((t) => (
                    <SelectItem key={t.id_enseignant} value={t.id_enseignant}>
                      {t.prenom_enseignant} {t.nom_enseignant}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-3">
              <Label className="text-sm font-medium leading-none">Université</Label>
              <Select value={form.institution_id} onValueChange={(v) => setForm((f) => ({ ...f, institution_id: v }))}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {institutions.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.nom}
                      {i.sigle ? ` (${i.sigle})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-3">
              <Label className="text-sm font-medium leading-none">État métier</Label>
              <Select
                value={form.etat_metier}
                onValueChange={(v) => setForm((f) => ({ ...f, etat_metier: v as ParcoursEtatMetier }))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {ETAT_OPTS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button className="rounded-xl" onClick={save}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Archiver ce parcours ?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span>Suppression logique (corbeille). Vérifiez les dépendances avant de confirmer.</span>
              <span className="flex flex-wrap gap-2 pt-2">
                <Badge variant="outline" className="rounded-lg">
                  <Users className="mr-1 h-3 w-3" />
                  {depsStudents} étudiant(s)
                </Badge>
                <Badge variant="outline" className="rounded-lg">
                  <BookOpen className="mr-1 h-3 w-3" />
                  {depsModules} module(s)
                </Badge>
                <Badge variant="outline" className="rounded-lg">
                  <Layers className="mr-1 h-3 w-3" />
                  {deleteTarget?._count?.niveaux ?? 0} niveau(x)
                </Badge>
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl" onClick={confirmDeleteOne}>
              <Archive className="mr-2 h-4 w-4" />
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Archiver {selectedIds.length} parcours ?</AlertDialogTitle>
            <AlertDialogDescription>Suppression logique pour chaque élément sélectionné.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl" onClick={confirmBulkDelete}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
