'use client';

import { useEffect, useMemo, useState } from 'react';
import { flexRender, type ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Plus, UserCog } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { TableSkeleton } from '@/components/data-table/table-skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api, type ApiAcademicParcours, type ApiModule, type ApiTeacher } from '@/lib/api';
import { useClientTable } from '@/lib/data-table/use-client-table';
import { useToast } from '@/hooks/use-toast';

const SEL_NONE = '__none__';

const NIVEAU_OPTIONS = ['Licence 1', 'Licence 2', 'Licence 3', 'Maîtrise 1', 'Maîtrise 2'] as const;

type AttributionRow = {
  id: string;
  moduleObj: ApiModule;
  enseignant: string;
  module: string;
  niveau: string;
  parcours: string;
  statut: 'Confirmee' | 'A verifier';
};

export default function AttributionsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AttributionRow[]>([]);
  const [teachers, setTeachers] = useState<ApiTeacher[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Confirmee' | 'A verifier'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<AttributionRow | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedNiveau, setSelectedNiveau] = useState<string>(SEL_NONE);
  const [selectedParcours, setSelectedParcours] = useState<string>(SEL_NONE);
  const [parcoursList, setParcoursList] = useState<ApiAcademicParcours[]>([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [mods, ts, ps] = await Promise.all([
        api.listModules(),
        api.listTeachers(),
        api.listAcademicParcours(),
      ]);
      const mapped: AttributionRow[] = mods.map((m: ApiModule) => ({
        id: m.id_module,
        moduleObj: m,
        enseignant: m.enseignant ? `${m.enseignant.nom_enseignant} ${m.enseignant.prenom_enseignant}` : 'Non attribué',
        module: `${m.code_module} - ${m.nom_module}`,
        niveau: m.niveau_libelle ?? m.niveau?.nom ?? '—',
        parcours: m.parcours?.nom ?? '—',
        statut: m.enseignant ? 'Confirmee' : 'A verifier',
      }));
      setRows(mapped);
      setTeachers(ts);
      setParcoursList(ps);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return rows.filter((r) => {
      const matchesSearch = !q || `${r.enseignant} ${r.module} ${r.parcours}`.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || r.statut === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  const columns = useMemo<ColumnDef<AttributionRow>[]>(() => [
    { accessorKey: 'enseignant', header: ({ column }) => <DataTableColumnHeader column={column} title="Enseignant" /> },
    { accessorKey: 'module', header: ({ column }) => <DataTableColumnHeader column={column} title="Matière/Module" /> },
    { accessorKey: 'niveau', header: ({ column }) => <DataTableColumnHeader column={column} title="Niveau" /> },
    { accessorKey: 'parcours', header: ({ column }) => <DataTableColumnHeader column={column} title="Parcours" /> },
    {
      accessorKey: 'statut',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Statut" />,
      cell: ({ row }) => <Badge variant={row.original.statut === 'Confirmee' ? 'default' : 'secondary'}>{row.original.statut}</Badge>,
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="rounded-xl"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem
                onClick={() => {
                  setEditingRow(row.original);
                  setSelectedModuleId(row.original.moduleObj.id_module);
                  prefillFromModule(row.original.moduleObj);
                  setDialogOpen(true);
                }}
              >
                Modifier attribution
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], []);

  const { table } = useClientTable({ data: filtered, columns, getRowId: (r) => r.id });
  const confirmed = rows.filter((r) => r.statut === 'Confirmee').length;
  const toAssign = rows.length - confirmed;

  const targetModule = useMemo(
    () => editingRow?.moduleObj ?? rows.find((r) => r.moduleObj.id_module === selectedModuleId)?.moduleObj,
    [editingRow, rows, selectedModuleId]
  );

  const niveauOptions = useMemo(() => {
    const set = new Set<string>(NIVEAU_OPTIONS);
    if (selectedNiveau !== SEL_NONE) set.add(selectedNiveau);
    return Array.from(set);
  }, [selectedNiveau]);

  const prefillFromModule = (m: ApiModule) => {
    setSelectedTeacherId(m.id_enseignant_responsable);
    setSelectedNiveau(m.niveau_libelle ?? m.niveau?.nom ?? SEL_NONE);
    setSelectedParcours(m.parcours?.id ?? SEL_NONE);
  };

  const openCreate = () => {
    setEditingRow(null);
    setSelectedModuleId('');
    setSelectedTeacherId('');
    setSelectedNiveau(SEL_NONE);
    setSelectedParcours(SEL_NONE);
    setDialogOpen(true);
  };

  const submitAttribution = async () => {
    if (!selectedTeacherId) {
      toast({ title: 'Enseignant requis', description: 'Choisis un enseignant responsable.', variant: 'destructive' });
      return;
    }
    const m = editingRow?.moduleObj ?? rows.find((r) => r.moduleObj.id_module === selectedModuleId)?.moduleObj;
    if (!m) {
      toast({ title: 'Module requis', description: 'Choisis une matière/module.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await api.updateModule(m.id_module, {
        code_module: m.code_module,
        nom_module: m.nom_module,
        credits_ects: m.credits_ects,
        coefficient_module: m.coefficient_module,
        semestre: m.semestre,
        annee_academique: m.annee_academique,
        id_enseignant_responsable: selectedTeacherId,
        annee_universitaire_id: m.annee_universitaire_id ?? m.annee_universitaire?.id ?? null,
        parcours_id: selectedParcours === SEL_NONE ? null : selectedParcours,
        niveau_id: m.niveau_id ?? m.niveau?.id ?? null,
        niveau_libelle: selectedNiveau === SEL_NONE ? null : selectedNiveau,
      });
      toast({ title: 'Attribution mise à jour' });
      setDialogOpen(false);
      await load();
    } catch (e) {
      toast({ title: 'Erreur', description: e instanceof Error ? e.message : 'Mise à jour impossible', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attributions des Enseignants</h1>
        </div>
        <Button className="rounded-xl" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Ajouter une attribution</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total attributions" value={loading ? '—' : String(rows.length)} icon={UserCog} />
        <StatCard title="Confirmées" value={loading ? '—' : String(confirmed)} icon={UserCog} delay={0.05} />
        <StatCard title="À vérifier" value={loading ? '—' : String(toAssign)} icon={UserCog} delay={0.1} />
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-5">
          <DataTableToolbar
            searchPlaceholder="Rechercher..."
            searchValue={search}
            onSearchChange={setSearch}
            filters={
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-[180px] rounded-xl"><SelectValue placeholder="Statut" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="Confirmee">Confirmée</SelectItem>
                  <SelectItem value="A verifier">À vérifier</SelectItem>
                </SelectContent>
              </Select>
            }
            actions={
              <Button className="rounded-xl" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Attribuer un enseignant</Button>
            }
          />
        </CardContent>
      </Card>

      <Card className="rounded-2xl"><CardContent className="p-0 overflow-x-auto">
        <Table><TableHeader>{table.getHeaderGroups().map((g)=><TableRow key={g.id}>{g.headers.map((h)=><TableHead key={h.id}>{h.isPlaceholder?null:flexRender(h.column.columnDef.header,h.getContext())}</TableHead>)}</TableRow>)}</TableHeader>
          <TableBody>{loading ? <TableSkeleton rows={6} columns={6}/> : table.getRowModel().rows.map((r)=><TableRow key={r.id}>{r.getVisibleCells().map((c)=><TableCell key={c.id}>{flexRender(c.column.columnDef.cell,c.getContext())}</TableCell>)}</TableRow>)}</TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>Attribuer un enseignant</DialogTitle>
            <DialogDescription>
              Associe un enseignant responsable, un niveau et un parcours à la matière/module.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {editingRow ? (
              <div className="space-y-2">
                <Label>Matière/Module</Label>
                <div className="rounded-xl border px-3 py-2 text-sm">{editingRow.module}</div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Matière/Module</Label>
                <Select
                  value={selectedModuleId}
                  onValueChange={(value) => {
                    setSelectedModuleId(value);
                    const module = rows.find((r) => r.moduleObj.id_module === value)?.moduleObj;
                    if (module) prefillFromModule(module);
                  }}
                >
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Choisir une matière/module" /></SelectTrigger>
                  <SelectContent>
                    {rows.map((r) => (
                      <SelectItem key={r.moduleObj.id_module} value={r.moduleObj.id_module}>
                        {r.module}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Enseignant</Label>
              <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Choisir un enseignant" /></SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id_enseignant} value={t.id_enseignant}>
                      {t.nom_enseignant} {t.prenom_enseignant}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Niveau</Label>
                <Select value={selectedNiveau} onValueChange={setSelectedNiveau}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Sélectionner le niveau" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SEL_NONE}>— Aucun —</SelectItem>
                    {niveauOptions.map((n) => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Parcours</Label>
                <Select value={selectedParcours} onValueChange={setSelectedParcours}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Sélectionner le parcours" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SEL_NONE}>— Aucun —</SelectItem>
                    {parcoursList.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {targetModule && (
              <p className="text-xs text-muted-foreground">
                Semestre {targetModule.semestre} — {targetModule.credits_ects} ECTS — année {targetModule.annee_academique}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)} disabled={saving}>Annuler</Button>
            <Button
              className="rounded-xl"
              onClick={submitAttribution}
              disabled={saving || !selectedTeacherId || !targetModule}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

