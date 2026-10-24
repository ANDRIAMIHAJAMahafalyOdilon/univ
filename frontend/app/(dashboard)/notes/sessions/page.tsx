'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { CalendarRange, MoreHorizontal, Plus, Trash2 } from 'lucide-react';

import { StatCard } from '@/components/dashboard/stat-card';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { TableSkeleton } from '@/components/data-table/table-skeleton';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api, type ApiAcademicAnnee, type ApiSessionExamen } from '@/lib/api';
import { useClientTable } from '@/lib/data-table/use-client-table';
import { useToast } from '@/hooks/use-toast';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

function formatDateTimeFr(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('fr-FR');
}

const sessionTypes = [
  { value: 'Normale', label: 'Normale' },
  { value: 'Rattrapage', label: 'Rattrapage' },
  { value: 'Speciale', label: 'Spéciale' },
] as const;

type FormState = {
  nom: string;
  type_session: ApiSessionExamen['type_session'];
  date_debut: string;
  date_fin: string;
  annee_universitaire_id: string;
};

export default function SessionsExamenPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ApiSessionExamen[]>([]);
  const [annees, setAnnees] = useState<ApiAcademicAnnee[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ApiSessionExamen | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const defaultAnneeId = useMemo(() => annees.find((a) => a.est_active)?.id ?? annees[0]?.id ?? '', [annees]);

  const [form, setForm] = useState<FormState>({
    nom: '',
    type_session: 'Normale',
    date_debut: '',
    date_fin: '',
    annee_universitaire_id: '',
  });

  const refresh = async () => {
    setLoading(true);
    try {
      const [s, a] = await Promise.all([api.listSessionsExamen(), api.listCursusAnnees(true)]);
      setRows(s);
      setAnnees(a);
    } catch (e) {
      toast({
        title: 'Erreur',
        description: e instanceof Error ? e.message : 'Impossible de charger les sessions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!dialogOpen) return;
    setForm((prev) => ({
      ...prev,
      annee_universitaire_id: prev.annee_universitaire_id || defaultAnneeId,
    }));
  }, [dialogOpen, defaultAnneeId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = `${r.nom} ${r.type_session} ${r.annee_universitaire?.libelle ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search]);

  const stats = useMemo(() => {
    const total = rows.length;
    const upcoming = rows.filter((r) => new Date(r.date_debut).getTime() > Date.now()).length;
    const past = rows.filter((r) => new Date(r.date_fin).getTime() < Date.now()).length;
    const activeAnnee = defaultAnneeId ? rows.filter((r) => r.annee_universitaire_id === defaultAnneeId).length : 0;
    return { total, upcoming, past, activeAnnee };
  }, [rows, defaultAnneeId]);

  const columns = useMemo<ColumnDef<ApiSessionExamen>[]>(() => {
    return [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(Boolean(v))}
            aria-label="Tout sélectionner"
          />
        ),
        cell: ({ row }) => (
          <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(Boolean(v))} aria-label="Sélectionner" />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      },
      {
        accessorKey: 'nom',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Session" />,
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <div className="font-medium leading-tight">{row.original.nom}</div>
            <span className="text-xs text-muted-foreground">{row.original.type_session}</span>
          </div>
        ),
      },
      {
        accessorKey: 'annee_universitaire_id',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Année universitaire" />,
        cell: ({ row }) => row.original.annee_universitaire?.libelle ?? '—',
      },
      {
        accessorKey: 'date_debut',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Début" />,
        cell: ({ row }) => formatDateTimeFr(row.original.date_debut),
      },
      {
        accessorKey: 'date_fin',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Fin" />,
        cell: ({ row }) => formatDateTimeFr(row.original.date_fin),
      },
      {
        id: 'actions',
        enableSorting: false,
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const session = row.original;
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-xl">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem
                    onClick={() => {
                      setEditing(session);
                      setForm({
                        nom: session.nom,
                        type_session: session.type_session,
                        date_debut: session.date_debut,
                        date_fin: session.date_fin,
                        annee_universitaire_id: session.annee_universitaire_id,
                      });
                      setDialogOpen(true);
                    }}
                  >
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={async () => {
                      try {
                        await api.deleteSessionExamen(session.id);
                        toast({ title: 'Session supprimée' });
                        refresh();
                      } catch (e) {
                        toast({
                          title: 'Erreur',
                          description: e instanceof Error ? e.message : 'Suppression impossible',
                          variant: 'destructive',
                        });
                      }
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ];
  }, [toast]);

  const { table, globalFilter, setGlobalFilter } = useClientTable<ApiSessionExamen>({
    data: filtered,
    columns,
    getRowId: (r) => r.id,
  });

  useEffect(() => {
    setGlobalFilter(search);
  }, [search, setGlobalFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      nom: '',
      type_session: 'Normale',
      date_debut: '',
      date_fin: '',
      annee_universitaire_id: defaultAnneeId,
    });
    setDialogOpen(true);
  };

  const submit = async () => {
    if (!form.nom.trim()) {
      toast({ title: 'Nom requis', variant: 'destructive' });
      return;
    }
    if (!form.annee_universitaire_id) {
      toast({ title: 'Année universitaire requise', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.updateSessionExamen(editing.id, form);
        toast({ title: 'Session mise à jour' });
      } else {
        await api.createSessionExamen(form);
        toast({ title: 'Session créée' });
      }
      setDialogOpen(false);
      refresh();
    } catch (e) {
      toast({
        title: 'Erreur',
        description: e instanceof Error ? e.message : 'Enregistrement impossible',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestion des Sessions d’examen</h1>
        </div>
        <Button onClick={openCreate} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" />
          Planifier une session
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total sessions" value={loading ? '—' : String(stats.total)} icon={CalendarRange} delay={0} />
        <StatCard title="À venir" value={loading ? '—' : String(stats.upcoming)} icon={CalendarRange} delay={0.05} />
        <StatCard title="Passées" value={loading ? '—' : String(stats.past)} icon={CalendarRange} delay={0.1} />
        <StatCard title="Année active" value={loading ? '—' : String(stats.activeAnnee)} icon={CalendarRange} delay={0.15} />
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <DataTableToolbar
              searchPlaceholder="Rechercher une session (nom, type, année)…"
              searchValue={search}
              onSearchChange={setSearch}
              actions={
                <Button variant="outline" className="rounded-xl" onClick={() => refresh()}>
                  Actualiser
                </Button>
              }
            />
          </CardContent>
        </Card>
      </motion.div>

      <Card className="rounded-2xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
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
                  <TableSkeleton rows={6} columns={6} />
                ) : table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="p-6">
                      <Empty className="rounded-2xl border">
                        <EmptyHeader>
                          <EmptyTitle>Aucune session</EmptyTitle>
                          <EmptyDescription>Crée une première session pour organiser la saisie des notes.</EmptyDescription>
                        </EmptyHeader>
                        <EmptyMedia />
                        <Button onClick={openCreate} className="rounded-xl">
                          <Plus className="mr-2 h-4 w-4" />
                          Planifier une session
                        </Button>
                      </Empty>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier la session' : 'Planifier une session'}</DialogTitle>
            <DialogDescription>Renseigne les informations clés (type, dates, année universitaire).</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom</Label>
              <Input
                id="nom"
                className="rounded-xl"
                value={form.nom}
                onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))}
                placeholder="Partiel INFO101 S1"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type_session} onValueChange={(v) => setForm((p) => ({ ...p, type_session: v as any }))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Type de session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessionTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Année universitaire</Label>
                <Select
                  value={form.annee_universitaire_id}
                  onValueChange={(v) => setForm((p) => ({ ...p, annee_universitaire_id: v }))}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Choisir une année" />
                  </SelectTrigger>
                  <SelectContent>
                    {annees.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.libelle}
                        {a.est_active ? ' (Active)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date_debut">Début (ISO)</Label>
                <Input
                  id="date_debut"
                  className="rounded-xl"
                  value={form.date_debut}
                  onChange={(e) => setForm((p) => ({ ...p, date_debut: e.target.value }))}
                  placeholder="2026-05-10T08:00:00.000Z"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_fin">Fin (ISO)</Label>
                <Input
                  id="date_fin"
                  className="rounded-xl"
                  value={form.date_fin}
                  onChange={(e) => setForm((p) => ({ ...p, date_fin: e.target.value }))}
                  placeholder="2026-05-10T10:00:00.000Z"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button className="rounded-xl" onClick={submit} disabled={saving}>
              {saving ? 'Enregistrement…' : editing ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

