'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Download,
  GraduationCap,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Upload,
  UserPlus,
  Users,
  UserX,
} from 'lucide-react';
import { motion } from 'framer-motion';

import { StatCard } from '@/components/dashboard/stat-card';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { StudentFormDialog } from '@/components/students/student-form-dialog';
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
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { api, type ApiStudent } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const SEL_ALL = '__all__';

function formatDateFr(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('fr-FR');
}

function exportStudentsCsv(rows: ApiStudent[]) {
  const headers = [
    'Matricule',
    'Nom',
    'Prénom',
    'Email',
    'Téléphone',
    'Date naissance',
    'Parcours',
    'Niveau',
    'Année universitaire',
    'Statut',
  ];
  const esc = (v: string | number | null | undefined) => {
    const s = String(v ?? '');
    return `"${s.replace(/"/g, '""')}"`;
  };
  const lines = [
    headers.join(';'),
    ...rows.map((s) =>
      [
        esc(s.numero_matricule),
        esc(s.nom_etudiant),
        esc(s.prenom_etudiant),
        esc(s.email_etudiant),
        esc(s.contact_etudiant),
        esc(s.date_naissance),
        esc(s.parcours?.nom ?? s.filiere),
        esc(s.niveau?.nom ?? ''),
        esc(s.annee_academique),
        esc(s.statut),
      ].join(';')
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `etudiants_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function StudentsPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [students, setStudents] = useState<ApiStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const [filterParcours, setFilterParcours] = useState<string>(SEL_ALL);
  const [filterNiveau, setFilterNiveau] = useState<string>(SEL_ALL);
  const [filterAnnee, setFilterAnnee] = useState<string>(SEL_ALL);
  const [filterStatut, setFilterStatut] = useState<string>(SEL_ALL);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editTarget, setEditTarget] = useState<ApiStudent | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<ApiStudent | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      setStudents(await api.listStudents());
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Chargement impossible',
        description: e instanceof Error ? e.message : 'Erreur réseau ou serveur.',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const thirtyDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  }, []);

  const stats = useMemo(() => {
    const total = students.length;
    const actifs = students.filter((s) => s.statut === 'Actif').length;
    const suspendus = students.filter((s) => s.statut === 'Suspendu').length;
    const nouveaux = students.filter((s) => {
      if (!s.created_at) return false;
      const c = new Date(s.created_at);
      return !Number.isNaN(c.getTime()) && c >= thirtyDaysAgo;
    }).length;
    return {
      total,
      actifs,
      nouveaux,
      suspendus,
    };
  }, [students, thirtyDaysAgo]);

  const parcoursOptions = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((s) => {
      if (s.parcours?.id) map.set(s.parcours.id, s.parcours.nom);
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [students]);

  const niveauOptions = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((s) => {
      if (s.niveau?.id) map.set(s.niveau.id, s.niveau.nom);
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [students]);

  const anneeOptions = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => set.add(s.annee_academique));
    return Array.from(set).sort();
  }, [students]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (filterParcours !== SEL_ALL && s.parcours?.id !== filterParcours) return false;
      if (filterNiveau !== SEL_ALL && s.niveau?.id !== filterNiveau) return false;
      if (filterAnnee !== SEL_ALL && s.annee_academique !== filterAnnee) return false;
      if (filterStatut !== SEL_ALL && s.statut !== filterStatut) return false;
      if (!q) return true;
      const hay = [
        s.nom_etudiant,
        s.prenom_etudiant,
        s.numero_matricule,
        s.email_etudiant,
        s.contact_etudiant,
        s.filiere,
        s.parcours?.nom,
        s.niveau?.nom,
        s.annee_academique,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [students, search, filterParcours, filterNiveau, filterAnnee, filterStatut]);

  const columns = useMemo<ColumnDef<ApiStudent>[]>(
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
            className="translate-y-0.5"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(Boolean(v))}
            aria-label="Sélectionner la ligne"
            className="translate-y-0.5"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 36,
      },
      {
        accessorKey: 'avatar',
        header: '',
        enableSorting: false,
        cell: ({ row }) => {
          const s = row.original;
          const initials = `${s.prenom_etudiant?.[0] ?? ''}${s.nom_etudiant?.[0] ?? ''}`.toUpperCase();
          return (
            <Avatar className="h-9 w-9 border border-border/60">
              <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">{initials}</AvatarFallback>
            </Avatar>
          );
        },
        size: 48,
      },
      {
        accessorKey: 'numero_matricule',
        header: ({ column }) => <DataTableColumnHeader column={column} title="ID / Matricule" />,
        cell: ({ row }) => (
          <Link
            href={`/students/${row.original.id_etudiant}`}
            className="font-mono text-sm text-primary underline-offset-4 hover:underline"
          >
            {row.original.numero_matricule}
          </Link>
        ),
      },
      {
        accessorKey: 'nom_etudiant',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nom" />,
      },
      {
        accessorKey: 'prenom_etudiant',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Prénom" />,
      },
      {
        accessorKey: 'email_etudiant',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.email_etudiant || '—'}</span>,
      },
      {
        accessorKey: 'contact_etudiant',
        header: 'Téléphone',
        cell: ({ row }) => row.original.contact_etudiant || '—',
      },
      {
        accessorKey: 'date_naissance',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Naissance" />,
        cell: ({ row }) => formatDateFr(row.original.date_naissance),
      },
      {
        id: 'parcours_display',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Parcours" />,
        accessorFn: (row) => row.parcours?.nom ?? row.filiere,
      },
      {
        id: 'niveau_display',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Niveau" />,
        accessorFn: (row) => row.niveau?.nom ?? '—',
      },
      {
        accessorKey: 'annee_academique',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Année univ." />,
      },
      {
        accessorKey: 'statut',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Statut" />,
        cell: ({ row }) => {
          const st = row.original.statut;
          const statusClass =
            st === 'Actif'
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              : st === 'Suspendu'
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                : st === 'Redoublant'
                  ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400'
                  : st === 'Diplome'
                    ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                    : st === 'Abandon'
                      ? 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400'
                      : st === 'Exclu'
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                        : st === 'Transfere'
                          ? 'bg-violet-500/15 text-violet-600 dark:text-violet-400'
                          : 'bg-muted text-muted-foreground';
          const statusLabel =
            st === 'Diplome'
              ? 'Diplomé'
              : st === 'Transfere'
                ? 'Transfere'
                : st === 'Supprime'
                  ? 'Supprimé'
                  : st;
          return (
            <Badge variant="secondary" className={cn(statusClass)}>
              {statusLabel}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        enableSorting: false,
        header: '',
        cell: ({ row }) => {
          const s = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" aria-label="Actions">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href={`/students/${s.id_etudiant}`}>Voir détails</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setDialogMode('edit');
                    setEditTarget(s);
                    setDialogOpen(true);
                  }}
                >
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(s)}>
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
    data: filteredRows,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id_etudiant,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 7 } },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedIds = selectedRows.map((r) => r.original.id_etudiant);

  const onConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteStudent(deleteTarget.id_etudiant);
      toast({ title: 'Étudiant supprimé', description: 'Le dossier a été envoyé à la corbeille.' });
      setDeleteTarget(null);
      await loadStudents();
      setRowSelection({});
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Suppression impossible',
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const onBulkDelete = async () => {
    try {
      for (const id of selectedIds) {
        await api.deleteStudent(id);
      }
      toast({ title: 'Suppression groupée', description: `${selectedIds.length} dossier(s) envoyé(s) à la corbeille.` });
      setBulkDeleteOpen(false);
      await loadStudents();
      setRowSelection({});
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Suppression impossible',
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const onImportCsv = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) {
      toast({ variant: 'destructive', title: 'Fichier vide ou invalide' });
      return;
    }
    const header = lines[0].toLowerCase();
    const startRow = header.includes('matricule') ? 1 : 0;
    let ok = 0;
    let fail = 0;
    for (let i = startRow; i < lines.length; i++) {
      const parts = lines[i].split(/[,;]/).map((p) => p.trim().replace(/^"|"$/g, ''));
      if (parts.length < 4) {
        fail++;
        continue;
      }
      const [matricule, nom, prenom, email, tel, , parcoursNom, , annee] = parts;
      try {
        await api.createStudent({
          numero_matricule: matricule,
          nom_etudiant: nom,
          prenom_etudiant: prenom,
          email_etudiant: email || null,
          contact_etudiant: tel || null,
          filiere: parcoursNom || 'Non renseigné',
          annee_academique: annee || '2025-2026',
        });
        ok++;
      } catch {
        fail++;
      }
    }
    toast({
      title: 'Import terminé',
      description: `${ok} créé(s), ${fail} ligne(s) en erreur.`,
    });
    await loadStudents();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
      >
        <div>
          <h1 className="page-title">Gestion des Étudiants</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            className="rounded-xl"
            onClick={() => {
              setDialogMode('create');
              setEditTarget(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un étudiant
          </Button>
          <Button variant="outline" className="rounded-xl" type="button" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Importer
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => onImportCsv(e.target.files?.[0] ?? null)}
          />
          <Button variant="outline" className="rounded-xl" type="button" onClick={() => exportStudentsCsv(filteredRows)}>
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total étudiants" value={stats.total} icon={Users} delay={0} />
        <StatCard title="Étudiants actifs" value={stats.actifs} icon={UserPlus} delay={0.05} />
        <StatCard title="Nouveaux (30 jours)" value={stats.nouveaux} icon={GraduationCap} delay={0.1} />
        <StatCard title="Suspendus" value={stats.suspendus} icon={UserX} delay={0.15} />
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="space-y-4 p-4 md:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="rounded-xl pl-9"
                placeholder="Rechercher dans le tableau…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={filterParcours} onValueChange={setFilterParcours}>
                <SelectTrigger className="w-[200px] rounded-xl">
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
              <Select value={filterNiveau} onValueChange={setFilterNiveau}>
                <SelectTrigger className="w-[180px] rounded-xl">
                  <SelectValue placeholder="Niveau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SEL_ALL}>Tous les niveaux</SelectItem>
                  {niveauOptions.map(([id, label]) => (
                    <SelectItem key={id} value={id}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterAnnee} onValueChange={setFilterAnnee}>
                <SelectTrigger className="w-[160px] rounded-xl">
                  <SelectValue placeholder="Année" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SEL_ALL}>Toutes les années</SelectItem>
                  {anneeOptions.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatut} onValueChange={setFilterStatut}>
                <SelectTrigger className="w-[170px] rounded-xl">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SEL_ALL}>Tous les statuts</SelectItem>
                  <SelectItem value="Actif">Actif</SelectItem>
                  <SelectItem value="Suspendu">Suspendu</SelectItem>
                  <SelectItem value="Redoublant">Redoublant</SelectItem>
                  <SelectItem value="Diplome">Diplomé</SelectItem>
                  <SelectItem value="Abandon">Abandon</SelectItem>
                  <SelectItem value="Exclu">Exclu</SelectItem>
                  <SelectItem value="Transfere">Transfere</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedIds.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-sm">
              <span>
                {selectedIds.length} ligne(s) sélectionnée(s)
              </span>
              <Button variant="destructive" size="sm" className="rounded-xl" onClick={() => setBulkDeleteOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer la sélection
              </Button>
            </div>
          ) : null}

          <div className="rounded-xl border border-border/60">
          <Table>
            <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id} className="hover:bg-transparent">
                    {hg.headers.map((header) => (
                      <TableHead key={header.id} className="whitespace-nowrap">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
              </TableRow>
                ))}
            </TableHeader>
            <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {columns.map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-8 w-full rounded-lg" />
                  </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="p-0">
                      <Empty className="border-0">
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <Users className="h-6 w-6" />
                          </EmptyMedia>
                          <EmptyTitle>Aucun étudiant à afficher</EmptyTitle>
                          <EmptyDescription>
                            Ajustez les filtres ou ajoutez un étudiant pour commencer.
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                  </TableCell>
                </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className="group">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
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
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Suivant
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <StudentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initial={editTarget}
        onSaved={async () => {
          toast({
            title: dialogMode === 'create' ? 'Étudiant créé' : 'Étudiant mis à jour',
            description: 'Les données ont été synchronisées avec le serveur.',
          });
          await loadStudents();
        }}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet étudiant ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action applique une suppression logique (corbeille). Vous pourrez restaurer depuis la corbeille.
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

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {selectedIds.length} étudiant(s) ?</AlertDialogTitle>
            <AlertDialogDescription>
              Suppression logique vers la corbeille pour chaque dossier sélectionné.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl" onClick={onBulkDelete}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
