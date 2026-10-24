'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { Layers, Plus, Search } from 'lucide-react';

import { PageHeader } from '@/components/dashboard/page-header';
import { StatCard } from '@/components/dashboard/stat-card';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { EntityEmptyState } from '@/components/data-table/entity-empty-state';
import { TableSkeleton } from '@/components/data-table/table-skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { api, type ApiAcademicAnnee, type ApiAcademicNiveau, type ApiAcademicParcours } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

function NiveauxPageInner() {
  const searchParams = useSearchParams();
  const parcoursIdFromUrl = searchParams.get('parcoursId');
  const { toast } = useToast();
  const [niveaux, setNiveaux] = useState<ApiAcademicNiveau[]>([]);
  const [parcours, setParcours] = useState<ApiAcademicParcours[]>([]);
  const [annees, setAnnees] = useState<ApiAcademicAnnee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ApiAcademicNiveau | null>(null);
  const [form, setForm] = useState({ code: '', nom: '', parcours_id: '', annee_universitaire_id: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [n, p, a] = await Promise.all([
        api.listCursusNiveaux({ all: true }),
        api.listCursusParcours(true),
        api.listCursusAnnees(true),
      ]);
      setNiveaux(n);
      setParcours(p);
      setAnnees(a);
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

  const stats = useMemo(() => {
    const licenceLike = niveaux.filter((n) => /^(l|L)[123]/i.test(n.code) || n.nom.toLowerCase().includes('licence')).length;
    const masterLike = niveaux.filter((n) => /^(m|M)[12]/i.test(n.code) || n.nom.toLowerCase().includes('master')).length;
    return { total: niveaux.length, licenceLike, masterLike };
  }, [niveaux]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return niveaux.filter((n) => {
      if (parcoursIdFromUrl && n.parcours_id !== parcoursIdFromUrl) return false;
      return (
        !q ||
        n.nom.toLowerCase().includes(q) ||
        n.code.toLowerCase().includes(q) ||
        n.parcours?.nom?.toLowerCase().includes(q)
      );
    });
  }, [niveaux, search, parcoursIdFromUrl]);

  const columns = useMemo<ColumnDef<ApiAcademicNiveau>[]>(
    () => [
      {
        accessorKey: 'code',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Code" />,
      },
      {
        accessorKey: 'nom',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nom" />,
      },
      {
        id: 'cycle',
        header: 'Cycle (heuristique)',
        cell: ({ row }) => {
          const c = row.original.code;
          if (/^m/i.test(c)) return 'Master';
          if (/^l/i.test(c)) return 'Licence';
          return '—';
        },
      },
      {
        id: 'parcours',
        header: 'Parcours',
        accessorFn: (r) => r.parcours?.nom ?? '—',
      },
      {
        id: 'annee',
        header: 'Année universitaire',
        cell: ({ row }) => row.original.annee_universitaire?.libelle ?? '—',
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="rounded-xl"
              onClick={() => {
                setEditing(row.original);
                setForm({
                  code: row.original.code,
                  nom: row.original.nom,
                  parcours_id: row.original.parcours_id,
                  annee_universitaire_id: row.original.annee_universitaire_id ?? '',
                });
                setDialogOpen(true);
              }}
            >
              Modifier
            </Button>
            <Button size="sm" variant="ghost" className="text-destructive rounded-xl" onClick={() => setDeleteId(row.original.id)}>
              Supprimer
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const save = async () => {
    if (!form.code.trim() || !form.nom.trim()) {
      toast({
        variant: 'destructive',
        title: 'Champs requis',
        description: 'Le Code et le Nom sont obligatoires.',
      });
      return;
    }
    try {
      if (editing) {
        await api.updateCursusNiveau(editing.id, form);
        toast({ title: 'Niveau mis à jour' });
      } else {
        await api.createCursusNiveau(form);
        toast({ title: 'Niveau créé' });
      }
      setDialogOpen(false);
      setEditing(null);
      await load();
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
        title="Gestion des Niveaux"
        actions={
          <Button
            className="rounded-xl"
            onClick={() => {
              setEditing(null);
              setForm({ code: '', nom: '', parcours_id: parcours[0]?.id ?? '', annee_universitaire_id: annees[0]?.id ?? '' });
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total niveaux" value={stats.total} icon={Layers} />
        <StatCard title="Profils Licence (heuristique)" value={stats.licenceLike} icon={Layers} />
        <StatCard title="Profils Master (heuristique)" value={stats.masterLike} icon={Layers} />
      </div>

      <Card className="border-border/60">
        <CardContent className="space-y-4 p-4 md:p-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="rounded-xl pl-9" placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} />
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
                  <TableSkeleton rows={5} columns={columns.length} />
                ) : table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="p-0">
                      <EntityEmptyState icon={Layers} title="Aucun niveau" description="Créez un niveau lié à un parcours." />
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
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier le niveau' : 'Nouveau niveau'}</DialogTitle>
            <DialogDescription>
              Un niveau est rattaché à un parcours et à une année universitaire.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Code</Label>
              <Input className="rounded-xl" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} required />
            </div>
            <div>
              <Label>Nom</Label>
              <Input className="rounded-xl" value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} required />
            </div>
            <div>
              <Label>Parcours</Label>
              <Select value={form.parcours_id} onValueChange={(v) => setForm((f) => ({ ...f, parcours_id: v }))}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Parcours" />
                </SelectTrigger>
                <SelectContent>
                  {parcours.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Année universitaire</Label>
              <Select value={form.annee_universitaire_id} onValueChange={(v) => setForm((f) => ({ ...f, annee_universitaire_id: v }))}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Année" />
                </SelectTrigger>
                <SelectContent>
                  {annees.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.libelle}
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

      <AlertDialog open={Boolean(deleteId)} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce niveau ?</AlertDialogTitle>
            <AlertDialogDescription>Suppression logique.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl"
              onClick={async () => {
                if (!deleteId) return;
                try {
                  await api.deleteCursusNiveau(deleteId);
                  toast({ title: 'Niveau archivé' });
                  setDeleteId(null);
                  await load();
                } catch (e) {
                  toast({
                    variant: 'destructive',
                    title: 'Erreur',
                    description: e instanceof Error ? e.message : undefined,
                  });
                }
              }}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function NiveauxPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          Chargement…
        </div>
      }
    >
      <NiveauxPageInner />
    </Suspense>
  );
}
