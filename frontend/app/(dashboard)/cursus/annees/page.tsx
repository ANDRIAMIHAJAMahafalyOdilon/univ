'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format, isAfter, isValid, parse, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Archive,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock,
  Filter,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';

import { PageHeader } from '@/components/dashboard/page-header';
import { StatCard } from '@/components/dashboard/stat-card';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { EntityEmptyState } from '@/components/data-table/entity-empty-state';
import { TableSkeleton } from '@/components/data-table/table-skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
import { api, type ApiAcademicAnnee } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const PAGE_SIZES = [7] as const;

export type AnneeStatutAffiche = 'En cours' | 'Archivée' | 'À venir';

function statutAffiche(r: ApiAcademicAnnee): AnneeStatutAffiche {
  const now = Date.now();
  const start = new Date(r.date_debut).getTime();
  const end = new Date(r.date_fin).getTime();
  if (r.est_active) return 'En cours';
  if (r.statut !== 'Actif' || (!Number.isNaN(end) && end < now)) return 'Archivée';
  if (!Number.isNaN(start) && start <= now && !Number.isNaN(end) && end >= now) return 'En cours';
  return 'À venir';
}

function StatutBadge({ s }: { s: AnneeStatutAffiche }) {
  const cls =
    s === 'En cours'
      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
      : s === 'Archivée'
        ? 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-300'
        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
  return (
    <Badge variant="outline" className={cn('rounded-lg border-border/60', cls)}>
      {s}
    </Badge>
  );
}

function formatFrDate(iso: string) {
  const d = parseISO(iso);
  if (!isValid(d)) return iso;
  return format(d, 'dd/MM/yyyy', { locale: fr });
}

const anneeFormSchema = z
  .object({
    libelle: z
      .string()
      .min(1, 'Année universitaire requise')
      .regex(/^\d{4}-\d{4}$/, 'Format attendu : AAAA-AAAA (ex. 2025-2026)'),
    date_debut: z.string().min(1, 'Date de début requise'),
    date_fin: z.string().min(1, 'Date de fin requise'),
    est_active: z.boolean(),
    statut: z.enum(['Actif', 'Supprime']).optional(),
  })
  .refine(
    (d) => {
      const a = parseISO(d.date_debut);
      const b = parseISO(d.date_fin);
      if (!isValid(a) || !isValid(b)) return true;
      return !isAfter(a, b);
    },
    { message: 'La date de début ne doit pas être postérieure à la date de fin.', path: ['date_debut'] }
  );

type AnneeFormValues = z.infer<typeof anneeFormSchema>;

function formatAnneeLibelle(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

function DateFormField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const parsed = value && parseISO(value);
  const date = parsed && isValid(parsed) ? parsed : undefined;
  const [text, setText] = useState(value && date ? format(date, 'dd/MM/yyyy') : '');
  const typingRef = useRef(false);

  useEffect(() => {
    if (typingRef.current) return;
    setText(value && isValid(parseISO(value)) ? format(parseISO(value), 'dd/MM/yyyy') : '');
  }, [value]);

  const handleText = (raw: string) => {
    typingRef.current = true;
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    let next = digits;
    if (digits.length > 4) next = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    else if (digits.length > 2) next = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    setText(next);
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(next)) {
      const d = parse(next, 'dd/MM/yyyy', new Date());
      if (isValid(d)) {
        typingRef.current = false;
        onChange(format(d, 'yyyy-MM-dd'));
      } else {
        onChange('');
      }
    } else {
      onChange('');
    }
  };

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <Popover>
        <PopoverTrigger asChild>
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={text}
              onChange={(e) => handleText(e.target.value)}
              placeholder="JJ/MM/AAAA"
              inputMode="numeric"
              maxLength={10}
              className={cn('rounded-xl pl-9', error && 'border-destructive')}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => onChange(d ? format(d, 'yyyy-MM-dd') : '')}
            locale={fr}
            captionLayout="dropdown"
            defaultMonth={date}
          />
        </PopoverContent>
      </Popover>
      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
    </FormItem>
  );
}

export default function AnneesUniversitairesPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<ApiAcademicAnnee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [filterStatuts, setFilterStatuts] = useState<AnneeStatutAffiche[]>([]);
  const [onlyActiveToggle, setOnlyActiveToggle] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ApiAcademicAnnee | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<ApiAcademicAnnee | null>(null);
  const [depCounts, setDepCounts] = useState({ niveaux: 0, sessions: 0 });
  const [depsLoading, setDepsLoading] = useState(false);

  const [bulkArchiveOpen, setBulkArchiveOpen] = useState(false);

  const form = useForm<AnneeFormValues>({
    resolver: zodResolver(anneeFormSchema),
    defaultValues: {
      libelle: '',
      date_debut: '',
      date_fin: '',
      est_active: false,
      statut: 'Actif',
    },
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await api.listCursusAnnees(true));
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

  const visibleRows = useMemo(() => rows.slice(), [rows]);

  const stats = useMemo(() => {
    const total = visibleRows.length;
    const activeRow = visibleRows.find((r) => r.est_active && r.statut === 'Actif');
    const archived = visibleRows.filter((r) => statutAffiche(r) === 'Archivée').length;
    const aVenir = visibleRows.filter((r) => statutAffiche(r) === 'À venir').length;
    return { total, activeLibelle: activeRow?.libelle ?? null, archived, aVenir };
  }, [visibleRows]);

  useEffect(() => {
    if (!deleteTarget) {
      setDepCounts({ niveaux: 0, sessions: 0 });
      return;
    }
    let cancelled = false;
    setDepsLoading(true);
    (async () => {
      try {
        const [niv, sess] = await Promise.all([api.listCursusNiveaux({ all: true }), api.listSessionsExamen()]);
        if (cancelled) return;
        setDepCounts({
          niveaux: niv.filter((n) => n.annee_universitaire_id === deleteTarget.id).length,
          sessions: sess.filter((s) => s.annee_universitaire_id === deleteTarget.id).length,
        });
      } catch {
        if (!cancelled) setDepCounts({ niveaux: 0, sessions: 0 });
      } finally {
        if (!cancelled) setDepsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deleteTarget]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visibleRows.filter((r) => {
      if (onlyActiveToggle && !r.est_active) return false;
      if (filterStatuts.length) {
        const s = statutAffiche(r);
        if (!filterStatuts.includes(s)) return false;
      }
      if (!q) return true;
      const st = statutAffiche(r).toLowerCase();
      return r.libelle.toLowerCase().includes(q) || st.includes(q);
    });
  }, [visibleRows, search, filterStatuts, onlyActiveToggle]);

  const toggleStatutFilter = (s: AnneeStatutAffiche) => {
    setFilterStatuts((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const openCreate = () => {
    setEditing(null);
    form.reset({ libelle: '', date_debut: '', date_fin: '', est_active: false, statut: 'Actif' });
    setDialogOpen(true);
  };

  const openEdit = (row: ApiAcademicAnnee) => {
    setEditing(row);
    form.reset({
      libelle: row.libelle,
      date_debut: row.date_debut,
      date_fin: row.date_fin,
      est_active: Boolean(row.est_active),
      statut: row.statut === 'Supprime' ? 'Supprime' : 'Actif',
    });
    setDialogOpen(true);
  };

  const onSubmitForm = form.handleSubmit(async (values) => {
    try {
      if (editing) {
        await api.updateCursusAnnee(editing.id, {
          libelle: values.libelle.trim(),
          date_debut: values.date_debut,
          date_fin: values.date_fin,
          est_active: values.est_active,
          statut: values.statut,
        });
        toast({ title: 'Année mise à jour' });
      } else {
        await api.createCursusAnnee({
          libelle: values.libelle.trim(),
          date_debut: values.date_debut,
          date_fin: values.date_fin,
          est_active: values.est_active,
          statut: values.statut,
        });
        toast({ title: 'Année créée' });
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
  });

  const setActive = async (id: string) => {
    try {
      await api.activateCursusAnnee(id);
      toast({ title: 'Année définie comme active' });
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

  const archiveRow = async (id: string) => {
    try {
      await api.deleteCursusAnnee(id);
      toast({ title: 'Année archivée' });
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

  const selectedIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((k) => rowSelection[k])
      .map((id) => id);
  }, [rowSelection]);

  const bulkArchive = async () => {
    try {
      for (const id of selectedIds) {
        await api.deleteCursusAnnee(id);
      }
      toast({ title: `${selectedIds.length} année(s) archivée(s)` });
      setBulkArchiveOpen(false);
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

  const bulkSetActive = async () => {
    if (selectedIds.length !== 1) {
      toast({
        variant: 'destructive',
        title: 'Sélection invalide',
        description: 'Choisissez une seule année pour la définir comme active.',
      });
      return;
    }
    await setActive(selectedIds[0]);
  };

  const columns = useMemo<ColumnDef<ApiAcademicAnnee>[]>(
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
        accessorKey: 'libelle',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Année universitaire" />,
      },
      {
        accessorKey: 'date_debut',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Date de début" />,
        sortingFn: (a, b) =>
          new Date(a.original.date_debut).getTime() - new Date(b.original.date_debut).getTime(),
        cell: ({ row }) => formatFrDate(row.original.date_debut),
      },
      {
        accessorKey: 'date_fin',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Date de fin" />,
        sortingFn: (a, b) =>
          new Date(a.original.date_fin).getTime() - new Date(b.original.date_fin).getTime(),
        cell: ({ row }) => formatFrDate(row.original.date_fin),
      },
      {
        id: 'statut',
        accessorFn: (r) => statutAffiche(r),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Statut" />,
        cell: ({ row }) => <StatutBadge s={statutAffiche(row.original)} />,
      },
      {
        id: 'est_active',
        accessorFn: (r) => (r.est_active ? 'oui' : 'non'),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Active (cursus)" />,
        cell: ({ row }) =>
          row.original.est_active ? (
            <Badge className="rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400">
              <CheckCircle2 className="mr-1 inline h-3 w-3" />
              Oui
            </Badge>
          ) : (
            <Badge variant="outline" className="rounded-lg text-muted-foreground">
              Non
            </Badge>
          ),
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const r = row.original;
          const end = new Date(r.date_fin).getTime();
          const past = !Number.isNaN(end) && end < Date.now();
          const canArchive = r.statut === 'Actif' && past && !r.est_active;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem className="rounded-lg" onClick={() => openEdit(r)}>
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="rounded-lg"
                  disabled={r.est_active}
                  onClick={() => setActive(r.id)}
                >
                  Définir comme active
                </DropdownMenuItem>
                {canArchive ? (
                  <DropdownMenuItem className="rounded-lg" onClick={() => archiveRow(r.id)}>
                    <Archive className="mr-2 h-4 w-4" />
                    Archiver
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="rounded-lg text-destructive focus:text-destructive"
                  onClick={() => setDeleteTarget(r)}
                >
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
    getRowId: (r) => r.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 7 } },
  });

  const statutOptions: AnneeStatutAffiche[] = ['En cours', 'Archivée', 'À venir'];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestion des Années Universitaires"
        actions={
          <Button className="rounded-xl" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une année
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total années universitaires" value={stats.total} icon={CalendarClock} delay={0} />
        <StatCard
          title="Année active (cursus)"
          value={stats.activeLibelle ?? '—'}
          icon={CheckCircle2}
          delay={0.05}
          className={stats.activeLibelle ? 'ring-1 ring-primary/30' : ''}
        />
        <StatCard title="Années archivées / historiques" value={stats.archived} icon={Archive} delay={0.1} />
        <StatCard title="Années à venir" value={stats.aVenir} icon={Clock} delay={0.15} />
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="space-y-4 p-4 md:p-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="rounded-xl pl-9"
                placeholder="Rechercher par année ou statut…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-xl gap-2">
                    <Filter className="h-4 w-4" />
                    Statut
                    {filterStatuts.length ? (
                      <Badge variant="secondary" className="rounded-md px-1">
                        {filterStatuts.length}
                      </Badge>
                    ) : null}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 rounded-xl p-3" align="end">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Filtrer par statut affiché</p>
                  <div className="space-y-2">
                    {statutOptions.map((s) => (
                      <label key={s} className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox checked={filterStatuts.includes(s)} onCheckedChange={() => toggleStatutFilter(s)} />
                        {s}
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <div className="flex items-center gap-2 rounded-xl border border-border/60 px-3 py-2">
                <Switch id="only-active-filter" checked={onlyActiveToggle} onCheckedChange={setOnlyActiveToggle} />
                <Label htmlFor="only-active-filter" className="cursor-pointer text-sm">
                  Uniquement l&apos;année active
                </Label>
              </div>
            </div>
          </div>

          {selectedIds.length > 0 ? (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
              <span className="text-sm font-medium">{selectedIds.length} sélectionnée(s)</span>
              <Button size="sm" variant="secondary" className="rounded-xl" onClick={bulkSetActive}>
                Définir comme active
              </Button>
              <Button size="sm" variant="destructive" className="rounded-xl" onClick={() => setBulkArchiveOpen(true)}>
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
                        icon={CalendarClock}
                        title="Aucune année"
                        description="Ajoutez une année ou modifiez les filtres."
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
            <DialogTitle>{editing ? 'Modifier l’année universitaire' : 'Nouvelle année universitaire'}</DialogTitle>
            <DialogDescription>
              Période académique et activation du cursus. Une seule année peut être active à la fois.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={onSubmitForm} className="space-y-4">
              <FormField
                control={form.control}
                name="libelle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Année universitaire</FormLabel>
                    <FormControl>
                      <Input
                        className="rounded-xl"
                        placeholder="2025-2026"
                        inputMode="numeric"
                        maxLength={9}
                        {...field}
                        onChange={(e) => field.onChange(formatAnneeLibelle(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="date_debut"
                  render={({ field, fieldState }) => (
                    <DateFormField
                      label="Date de début"
                      value={field.value}
                      onChange={field.onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />
                <FormField
                  control={form.control}
                  name="date_fin"
                  render={({ field, fieldState }) => (
                    <DateFormField
                      label="Date de fin"
                      value={field.value}
                      onChange={field.onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="est_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/60 px-4 py-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active (cursus)</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        L&apos;activation désactive automatiquement les autres années.
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="statut"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/60 px-4 py-3">
                    <div className="space-y-0.5">
                      <FormLabel>Statut</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Une année en statut « Archivée » est masquée des listes du cursus.
                      </p>
                    </div>
                    <FormControl>
                      <Select value={field.value ?? 'Actif'} onValueChange={field.onChange}>
                        <SelectTrigger className="w-36 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="Actif">En cours</SelectItem>
                          <SelectItem value="Supprime">Archivée</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" className="rounded-xl" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement…
                    </>
                  ) : (
                    'Enregistrer'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette année ?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Suppression logique (corbeille). Vérifiez les rattachements avant de confirmer.</p>
                {depsLoading ? (
                  <p className="flex items-center gap-2 text-xs">
                    <Loader2 className="h-3 w-3 animate-spin" /> Analyse des dépendances…
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="rounded-lg">
                      {depCounts.niveaux} niveau(x)
                    </Badge>
                    <Badge variant="outline" className="rounded-lg">
                      {depCounts.sessions} session(s)
                    </Badge>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl"
              onClick={async () => {
                if (!deleteTarget) return;
                try {
                  await api.deleteCursusAnnee(deleteTarget.id);
                  toast({ title: 'Année archivée' });
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
              }}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkArchiveOpen} onOpenChange={setBulkArchiveOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Archiver {selectedIds.length} année(s) ?</AlertDialogTitle>
            <AlertDialogDescription>Suppression logique pour chaque élément sélectionné.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl" onClick={bulkArchive}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
