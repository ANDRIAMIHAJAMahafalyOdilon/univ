'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';
import {
  Building2,
  Filter,
  Landmark,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Users,
  Route,
} from 'lucide-react';

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
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import { api, type ApiAcademicParcours, type ApiInstitutionStatut } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const PAGE_SIZES = [7] as const;

type UniRow = {
  id: string;
  nom: string;
  sigle: string;
  adresse: string | null;
  ville: string | null;
  pays: string | null;
  email_contact: string | null;
  site_web: string | null;
  description: string | null;
  created_at: string;
  nb_parcours: number;
  nb_etudiants: number;
  statut: ApiInstitutionStatut;
};

function statutLabel(s: ApiInstitutionStatut) {
  if (s === 'Active') return 'Active';
  if (s === 'En_Projet') return 'En projet';
  return 'Archivée';
}

function statutBadge(s: ApiInstitutionStatut) {
  const map: Record<ApiInstitutionStatut, string> = {
    Active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    En_Projet: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
    Archivee: 'bg-muted text-muted-foreground',
  };
  return map[s];
}

const EMPTY_FORM = {
  nom: '',
  sigle: '',
  adresse: '',
  ville: '',
  pays: '',
  email_contact: '',
  site_web: '',
  description: '',
  statut: 'Active' as ApiInstitutionStatut,
  parcours_ids: [] as string[],
};

export default function UniversitesPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [institutions, setInstitutions] = useState<UniRow[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZES[0] });
  const [cityFilter, setCityFilter] = useState('');
  const [statusFilters, setStatusFilters] = useState<Set<ApiInstitutionStatut>>(
    () => new Set(['Active', 'En_Projet', 'Archivee'])
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [parcoursList, setParcoursList] = useState<ApiAcademicParcours[]>([]);

  useEffect(() => {
    api
      .listCursusParcours(true)
      .then(setParcoursList)
      .catch(() => {
        setParcoursList([]);
      });
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    api
      .listInstitutions()
      .then((list) => {
        setInstitutions(
          list.map((i) => ({
            id: i.id,
            nom: i.nom,
            sigle: i.sigle,
            adresse: i.adresse ?? null,
            ville: i.ville ?? null,
            pays: i.pays ?? null,
            email_contact: i.email_contact ?? null,
            site_web: i.site_web ?? null,
            description: i.description ?? null,
            created_at: i.created_at,
            nb_parcours: i.nb_parcours,
            nb_etudiants: i.nb_etudiants,
            statut: i.statut,
          }))
        );
      })
      .catch((e) => {
        toast({ variant: 'destructive', title: 'Erreur', description: e instanceof Error ? e.message : 'Chargement' });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredRows = useMemo(() => {
    const q = globalFilter.trim().toLowerCase();
    return institutions.filter((r) => {
      if (!statusFilters.has(r.statut)) return false;
      if (cityFilter.trim()) {
        const c = (r.ville ?? '').toLowerCase();
        if (!c.includes(cityFilter.trim().toLowerCase())) return false;
      }
      if (!q) return true;
      const blob = [r.nom, r.sigle, r.adresse, r.ville, r.pays, r.email_contact ?? ''].join(' ').toLowerCase();
      return blob.includes(q);
    });
  }, [institutions, globalFilter, cityFilter, statusFilters]);

  const openCreate = useCallback(() => {
    setForm(EMPTY_FORM);
    setMode('create');
    setEditingId(null);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((row: UniRow) => {
    setForm({
      nom: row.nom,
      sigle: row.sigle,
      adresse: row.adresse ?? '',
      ville: row.ville ?? '',
      pays: row.pays ?? '',
      email_contact: row.email_contact ?? '',
      site_web: row.site_web ?? '',
      description: row.description ?? '',
      statut: row.statut,
      parcours_ids: parcoursList.filter((p) => p.institution_id === row.id).map((p) => p.id),
    });
    setMode('edit');
    setEditingId(row.id);
    setDialogOpen(true);
  }, [parcoursList]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        nom: form.nom.trim(),
        sigle: form.sigle.trim(),
        adresse: form.adresse.trim() || null,
        ville: form.ville.trim() || null,
        pays: form.pays.trim() || null,
        email_contact: form.email_contact.trim() || null,
        site_web: form.site_web.trim() || null,
        description: form.description.trim() || null,
        statut: form.statut,
      };
      let targetId: string | null = null;
      if (mode === 'create') {
        const created = await api.createInstitution(payload);
        targetId = created.id;
      } else if (editingId) {
        const updated = await api.updateInstitution(editingId, payload);
        targetId = updated.id;
      }
      if (targetId) {
        const selected = new Set(form.parcours_ids);
        for (const p of parcoursList) {
          const wanted = selected.has(p.id);
          if (wanted && p.institution_id !== targetId) {
            await api.updateCursusParcours(p.id, { institution_id: targetId });
          }
          if (!wanted && p.institution_id === targetId) {
            await api.updateCursusParcours(p.id, { institution_id: 'default' });
          }
        }
        const next = await api.listInstitutions();
        setParcoursList(await api.listCursusParcours(true));
        setInstitutions(
          next.map((i) => ({
            id: i.id,
            nom: i.nom,
            sigle: i.sigle,
            adresse: i.adresse ?? null,
            ville: i.ville ?? null,
            pays: i.pays ?? null,
            email_contact: i.email_contact ?? null,
            site_web: i.site_web ?? null,
            description: i.description ?? null,
            created_at: i.created_at,
            nb_parcours: i.nb_parcours,
            nb_etudiants: i.nb_etudiants,
            statut: i.statut,
          }))
        );
      }
      toast({ title: mode === 'create' ? 'Université ajoutée' : 'Université enregistrée' });
      setDialogOpen(false);
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: e instanceof Error ? e.message : 'Enregistrement impossible',
      });
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo<ColumnDef<UniRow>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
            aria-label="Tout sélectionner"
          />
        ),
        cell: ({ row }) => (
          <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} aria-label="Sélection" />
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'nom',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nom" />,
        cell: ({ row }) => (
          <Link href={`/universites/${row.original.id}`} className="font-medium text-primary hover:underline">
            {row.original.nom}
          </Link>
        ),
      },
      {
        accessorKey: 'sigle',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Sigle" />,
      },
      {
        accessorKey: 'adresse',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Adresse" />,
        cell: ({ row }) => (
          <span className="line-clamp-1 max-w-[180px] text-muted-foreground" title={row.original.adresse ?? ''}>
            {row.original.adresse ?? '—'}
          </span>
        ),
      },
      {
        accessorKey: 'ville',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Ville" />,
        cell: ({ row }) => row.original.ville ?? '—',
      },
      {
        accessorKey: 'pays',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Pays" />,
        cell: ({ row }) => row.original.pays ?? '—',
      },
      {
        accessorKey: 'email_contact',
        header: 'Email contact',
        cell: ({ row }) => row.original.email_contact ?? '—',
      },
      {
        accessorKey: 'nb_parcours',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Parcours" />,
        cell: ({ row }) => (
          <Link href="/parcours" className="tabular-nums text-primary hover:underline">
            {row.original.nb_parcours}
          </Link>
        ),
      },
      {
        accessorKey: 'nb_etudiants',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Étudiants" />,
        cell: ({ row }) => (
          <Link href="/students" className="tabular-nums text-primary hover:underline">
            {row.original.nb_etudiants}
          </Link>
        ),
      },
      {
        accessorKey: 'statut',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Statut" />,
        cell: ({ row }) => (
          <Badge variant="secondary" className={cn('rounded-full font-normal', statutBadge(row.original.statut))}>
            {statutLabel(row.original.statut)}
          </Badge>
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" aria-label="Actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem asChild className="rounded-lg">
                <Link href={`/universites/${row.original.id}`}>Voir détails</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg" onClick={() => openEdit(row.original)}>
                <Pencil className="mr-2 h-4 w-4" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="rounded-lg">
                <Link href="/parcours">Gérer les parcours</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [openEdit]
  );

  const table = useReactTable({
    data: filteredRows,
    columns,
    state: { sorting, rowSelection, pagination },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const selectedCount = Object.keys(rowSelection).filter((k) => rowSelection[k]).length;

  const totalUniversites = institutions.length;
  const actives = institutions.filter((i) => i.statut === 'Active').length;
  const avecParcours = institutions.filter((i) => i.nb_parcours > 0).length;
  const partenariatRecent = useMemo(
    () =>
      institutions.filter((i) => {
        const age = Date.now() - new Date(i.created_at).getTime();
        return age < 90 * 24 * 60 * 60 * 1000;
      }).length,
    [institutions]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Universités"
        actions={
          <Button className="rounded-xl" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une université
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total universités" value={loading ? '—' : totalUniversites} icon={Building2} />
        <StatCard
          title="Universités actives"
          value={loading ? '—' : actives}
          icon={Landmark}
          delay={0.05}
        />
        <StatCard title="Avec parcours" value={loading ? '—' : avecParcours} icon={Route} delay={0.1} />
        <StatCard title="Nouveaux partenariats (90j)" value={loading ? '—' : partenariatRecent} icon={Sparkles} delay={0.15} />
      </div>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardContent className="space-y-4 p-4 pt-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, sigle, ville…"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="rounded-xl pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-xl gap-2">
                    <Filter className="h-4 w-4" />
                    Filtres
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 space-y-4 rounded-xl" align="end">
                  <div className="space-y-2">
                    <Label>Ville (contient)</Label>
                    <Input value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Statut</Label>
                    {(['Active', 'En_Projet', 'Archivee'] as const).map((s) => (
                      <label key={s} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={statusFilters.has(s)}
                          onCheckedChange={(v) => {
                            setStatusFilters((prev) => {
                              const n = new Set(prev);
                              if (v) n.add(s);
                              else n.delete(s);
                              if (n.size === 0) return new Set(['Active', 'En_Projet', 'Archivee']);
                              return n;
                            });
                          }}
                        />
                        {statutLabel(s)}
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              {selectedCount > 0 ? (
                <Button variant="secondary" size="sm" className="rounded-xl" type="button">
                  Actions groupe ({selectedCount})
                </Button>
              ) : null}
            </div>
          </div>

          {loading ? (
            <div className="rounded-xl border border-border/60">
              <Table>
                <TableBody>
                  <TableSkeleton rows={4} columns={columns.length} />
                </TableBody>
              </Table>
            </div>
          ) : filteredRows.length === 0 ? (
            <EntityEmptyState
              title="Aucune université"
              description="Cliquez sur « Ajouter une université » pour créer la première fiche."
              icon={Users}
            />
          ) : (
            <div className="rounded-xl border border-border/60">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((hg) => (
                    <TableRow key={hg.id} className="hover:bg-transparent">
                      {hg.headers.map((h) => (
                        <TableHead key={h.id} className="whitespace-nowrap">
                          {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className="group">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Lignes / page</span>
              <Select
                value={String(table.getState().pagination.pageSize)}
                onValueChange={(v) => table.setPageSize(Number(v))}
              >
                <SelectTrigger className="h-9 w-[72px] rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
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
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{mode === 'create' ? 'Ajouter une université' : "Modifier l'université"}</DialogTitle>
            <DialogDescription>
              {mode === 'create'
                ? 'Renseignez les informations de la nouvelle université.'
                : 'Mettez à jour les informations de cette université.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input id="nom" value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sigle">Sigle *</Label>
                <Input id="sigle" value={form.sigle} onChange={(e) => setForm((f) => ({ ...f, sigle: e.target.value }))} className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Input
                id="adresse"
                value={form.adresse}
                onChange={(e) => setForm((f) => ({ ...f, adresse: e.target.value }))}
                className="rounded-xl"
                placeholder="Rue, numéro, bâtiment…"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ville">Ville</Label>
                <Input id="ville" value={form.ville} onChange={(e) => setForm((f) => ({ ...f, ville: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pays">Pays</Label>
                <Input id="pays" value={form.pays} onChange={(e) => setForm((f) => ({ ...f, pays: e.target.value }))} className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email contact</Label>
              <Input
                id="email"
                type="email"
                value={form.email_contact}
                onChange={(e) => setForm((f) => ({ ...f, email_contact: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site">Site web</Label>
              <Input id="site" value={form.site_web} onChange={(e) => setForm((f) => ({ ...f, site_web: e.target.value }))} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="min-h-[100px] rounded-xl"
                placeholder="Présentation de l'établissement…"
              />
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={form.statut} onValueChange={(v) => setForm((f) => ({ ...f, statut: v as ApiInstitutionStatut }))}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="En_Projet">En projet</SelectItem>
                  <SelectItem value="Archivee">Archivée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Parcours</Label>
            {parcoursList.filter((p) => p.statut !== 'Supprime').length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/60 px-3 py-3 text-xs text-muted-foreground">
                Aucun parcours disponible pour le moment.
              </p>
            ) : (
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-border/60 p-2">
                {parcoursList
                  .filter((p) => p.statut !== 'Supprime')
                  .map((p) => (
                    <label
                      key={p.id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-muted"
                    >
                      <Checkbox
                        checked={form.parcours_ids.includes(p.id)}
                        onCheckedChange={(v) =>
                          setForm((f) => ({
                            ...f,
                            parcours_ids: v
                              ? [...f.parcours_ids, p.id]
                              : f.parcours_ids.filter((x) => x !== p.id),
                          }))
                        }
                      />
                      <span className="truncate">{p.nom}</span>
                      <span className="ml-auto shrink-0 font-mono text-xs text-muted-foreground">{p.code}</span>
                    </label>
                  ))}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button type="button" className="rounded-xl" disabled={saving || !form.nom.trim() || !form.sigle.trim()} onClick={() => void save()}>
              {saving ? 'Enregistrement…' : mode === 'create' ? 'Ajouter' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
