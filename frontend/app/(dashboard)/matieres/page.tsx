'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { flexRender, type ColumnDef } from '@tanstack/react-table';
import { Archive, BookCopy, MoreHorizontal, Plus, Search } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { TableSkeleton } from '@/components/data-table/table-skeleton';
import { Badge } from '@/components/ui/badge';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { api, type ApiMatiere, type ApiModule } from '@/lib/api';
import { useClientTable } from '@/lib/data-table/use-client-table';
import { useToast } from '@/hooks/use-toast';

const MOD_NONE = '__none__';

const SEMESTRES = Array.from({ length: 10 }, (_, i) => ({
  value: `S${i + 1}`,
  label: `Semestre ${i + 1}`,
}));

type MatiereForm = { code: string; nom: string; coefficient: string; module_id: string; semestre: string };

const EMPTY_FORM: MatiereForm = {
  code: '',
  nom: '',
  coefficient: '1',
  module_id: MOD_NONE,
  semestre: 'S1',
};

export default function MatieresPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<ApiMatiere[]>([]);
  const [modules, setModules] = useState<ApiModule[]>([]);
  const [moduleFilter, setModuleFilter] = useState('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ApiMatiere | null>(null);
  const [form, setForm] = useState<MatiereForm>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<ApiMatiere | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, mods] = await Promise.all([api.listMatieres(), api.listModules()]);
      setRows(m);
      setModules(mods);
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

  const moduleMap = useMemo(() => new Map(modules.map((m) => [m.id_module, m])), [modules]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return rows.filter((r) => {
      const modLabel = r.module
        ? `${r.module.nom_module} ${r.module.code_module} (${r.module.semestre ?? ''})`.toLowerCase()
        : '';
      const matchesSearch =
        !q ||
        `${r.nom} ${r.code} ${r.semestre ?? ''} ${modLabel}`.toLowerCase().includes(q);
      const matchesModule = moduleFilter === 'all' || r.module_id === moduleFilter;
      return matchesSearch && matchesModule;
    });
  }, [rows, search, moduleFilter]);

  const columns = useMemo<ColumnDef<ApiMatiere>[]>(
    () => [
      {
        accessorKey: 'nom',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Matière" />,
        cell: ({ row }) => <span className="font-medium">{row.original.nom}</span>,
      },
      {
        accessorKey: 'code',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Code" />,
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.code}</span>,
      },
      {
        accessorKey: 'module_id',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Module" />,
        cell: ({ row }) => {
          const mod = row.original.module;
          return mod ? (
            <Badge variant="outline" className="rounded-lg border-border/60 font-normal">
              {mod.nom_module}
              <span className="ml-1 font-mono text-[10px] text-muted-foreground">{mod.code_module}</span>
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          );
        },
      },
      {
        id: 'semestre',
        accessorFn: (r) => r.semestre ?? r.module?.semestre ?? '',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Semestre" />,
        cell: ({ row }) => row.original.semestre ?? row.original.module?.semestre ?? '—',
      },
      {
        id: 'coefficient',
        accessorFn: (r) => r.coefficient,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Coefficient" />,
        cell: ({ row }) => <span className="text-sm">{row.original.coefficient}</span>,
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="rounded-xl">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem
                  onClick={() => {
                    setEditing(row.original);
                    setForm({
                      code: row.original.code,
                      nom: row.original.nom,
                      coefficient: String(row.original.coefficient),
                      module_id: row.original.module_id,
                      semestre: row.original.semestre ?? row.original.module?.semestre ?? 'S1',
                    });
                    setDialogOpen(true);
                  }}
                >
                  Modifier
                </DropdownMenuItem>
                {row.original.module && (
                  <DropdownMenuItem asChild>
                    <Link href={`/modules/${row.original.module.id_module}`}>Voir le module</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(row.original)}>
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    []
  );

  const { table } = useClientTable<ApiMatiere>({ data: filtered, columns, getRowId: (r) => r.id });
  const withTeacher = rows.filter((r) => (r._count?.enseignants ?? 0) > 0).length;

  const resetForm = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const onModuleChange = (moduleId: string) => {
    setForm((f) => ({
      ...f,
      module_id: moduleId,
      semestre: (moduleId !== MOD_NONE && moduleMap.get(moduleId)?.semestre) || f.semestre,
    }));
  };

  const save = async () => {
    if (form.module_id === MOD_NONE) {
      toast({ variant: 'destructive', title: 'Module requis', description: 'Choisissez le module auquel rattacher la matière.' });
      return;
    }
    const code = form.code.trim();
    const nom = form.nom.trim();
    const coefficient = Number(form.coefficient);
    if (!code || !nom) {
      toast({ variant: 'destructive', title: 'Champs requis', description: 'Code et nom de la matière sont obligatoires.' });
      return;
    }
    if (Number.isNaN(coefficient) || coefficient <= 0) {
      toast({ variant: 'destructive', title: 'Coefficient invalide', description: 'Le coefficient doit être un nombre positif.' });
      return;
    }
    try {
      const payload = { code, nom, coefficient, module_id: form.module_id, semestre: form.semestre };
      if (editing) {
        await api.updateMatiere(editing.id, payload);
        toast({ title: 'Matière mise à jour' });
      } else {
        await api.createMatiere(payload);
        toast({ title: 'Matière ajoutée' });
      }
      setDialogOpen(false);
      resetForm();
      await load();
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteMatiere(deleteTarget.id);
      toast({ title: 'Matière supprimée' });
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des Matières</h1>
          <p className="text-muted-foreground">Chaque matière est rattachée à un module.</p>
        </div>
        <Button className="rounded-xl" onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une matière
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total matières" value={loading ? '—' : String(rows.length)} icon={BookCopy} />
        <StatCard title="Avec enseignant(s)" value={loading ? '—' : String(withTeacher)} icon={BookCopy} delay={0.05} />
        <StatCard title="Sans enseignant" value={loading ? '—' : String(rows.length - withTeacher)} icon={BookCopy} delay={0.1} />
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="rounded-xl pl-9"
                placeholder="Rechercher une matière, un code ou un module..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-[220px] rounded-xl">
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les modules</SelectItem>
                {modules.map((m) => (
                  <SelectItem key={m.id_module} value={m.id_module}>
                    {m.nom_module} ({m.code_module})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((g) => (
                <TableRow key={g.id}>
                  {g.headers.map((h) => (
                    <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton rows={6} columns={columns.length} />
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    Aucune matière. Ajoutez-en une en choisissant son module.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((r) => (
                  <TableRow key={r.id}>
                    {r.getVisibleCells().map((c) => (
                      <TableCell key={c.id}>{flexRender(c.column.columnDef.cell, c.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier la matière' : 'Ajouter une matière'}</DialogTitle>
            <DialogDescription className="sr-only">
              {editing ? 'Modifier la matière' : 'Ajouter une matière'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="flex flex-col gap-3">
              <Label className="text-sm font-medium leading-none">Module</Label>
              <Select value={form.module_id} onValueChange={onModuleChange}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Choisir le module" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value={MOD_NONE}>— Choisir un module —</SelectItem>
                  {modules.map((m) => (
                    <SelectItem key={m.id_module} value={m.id_module}>
                      {m.nom_module} ({m.code_module})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.module_id !== MOD_NONE && moduleMap.get(form.module_id) && (
                <p className="text-xs text-muted-foreground">
                  Module : {moduleMap.get(form.module_id)?.nom_module} — semestre du module{' '}
                  {moduleMap.get(form.module_id)?.semestre}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <Label className="text-sm font-medium leading-none">Semestre</Label>
              <Select
                value={form.semestre}
                onValueChange={(v) => setForm((f) => ({ ...f, semestre: v }))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Choisir le semestre" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {SEMESTRES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-3">
              <Label className="text-sm font-medium leading-none">Code</Label>
              <Input
                className="rounded-xl"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="Ex. INF301"
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label className="text-sm font-medium leading-none">Nom de la matière</Label>
              <Input
                className="rounded-xl"
                value={form.nom}
                onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                placeholder="Ex. Algorithmique avancée"
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label className="text-sm font-medium leading-none">Coefficient</Label>
              <Input
                className="rounded-xl"
                type="number"
                min="0.5"
                max="10"
                step="0.5"
                value={form.coefficient}
                onChange={(e) => setForm((f) => ({ ...f, coefficient: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button className="rounded-xl" onClick={save} disabled={form.module_id === MOD_NONE || loading}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette matière ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `« ${deleteTarget.nom} » (${deleteTarget.code}) sera supprimée du module « ${deleteTarget.module?.nom_module ?? '—'} ».`
                : ''}{' '}
              {deleteTarget?._count?.enseignants ? (
                <span className="mt-2 block">
                  Attention : {deleteTarget._count.enseignants} enseignant(s) y sont rattaché(s).
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl" onClick={confirmDelete}>
              <Archive className="mr-2 h-4 w-4" />
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}