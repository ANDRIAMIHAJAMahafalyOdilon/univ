'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { flexRender, type ColumnDef } from '@tanstack/react-table';
import { History, Link2, RefreshCw } from 'lucide-react';

import { StatCard } from '@/components/dashboard/stat-card';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { TableSkeleton } from '@/components/data-table/table-skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api, type ApiNoteHistory } from '@/lib/api';
import { useClientTable } from '@/lib/data-table/use-client-table';
import { useToast } from '@/hooks/use-toast';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

function formatDateTimeFr(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('fr-FR');
}

export default function NoteHistoryPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ApiNoteHistory[]>([]);
  const [search, setSearch] = useState('');

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await api.listNoteHistory({ limit: 500 });
      setRows(data);
    } catch (e) {
      toast({
        title: 'Erreur',
        description: e instanceof Error ? e.message : 'Impossible de charger l’historique',
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((h) => {
      const student = h.note?.etudiant ? `${h.note.etudiant.nom_etudiant} ${h.note.etudiant.prenom_etudiant}` : '';
      const module = h.note?.module ? `${h.note.module.code_module} ${h.note.module.nom_module}` : '';
      const hay = `${student} ${module} ${h.motif ?? ''} ${h.modifie_par ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search]);

  const stats = useMemo(() => {
    const total = rows.length;
    const withReason = rows.filter((r) => (r.motif ?? '').trim().length > 0).length;
    const last = rows[0]?.date_modif ?? null;
    return { total, withReason, last };
  }, [rows]);

  const columns = useMemo<ColumnDef<ApiNoteHistory>[]>(() => {
    return [
      {
        accessorKey: 'date_modif',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
        cell: ({ row }) => <span className="text-muted-foreground">{formatDateTimeFr(row.original.date_modif)}</span>,
      },
      {
        id: 'etudiant',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Étudiant" />,
        cell: ({ row }) => {
          const e = row.original.note?.etudiant;
          if (!e) return '—';
          return (
            <Button asChild variant="link" className="h-auto p-0">
              <Link href={`/students/${encodeURIComponent(e.id_etudiant)}`}>
                {e.nom_etudiant} {e.prenom_etudiant}
              </Link>
            </Button>
          );
        },
      },
      {
        id: 'module',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Module" />,
        cell: ({ row }) => {
          const m = row.original.note?.module;
          if (!m) return '—';
          return (
            <Button asChild variant="link" className="h-auto p-0">
              <Link href={`/modules/${encodeURIComponent(m.id_module)}`}>{m.code_module}</Link>
            </Button>
          );
        },
      },
      {
        accessorKey: 'ancienne_valeur',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Ancienne" />,
        cell: ({ row }) => <span className="font-mono">{row.original.ancienne_valeur}</span>,
      },
      {
        accessorKey: 'nouvelle_valeur',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nouvelle" />,
        cell: ({ row }) => <span className="font-mono">{row.original.nouvelle_valeur}</span>,
      },
      {
        accessorKey: 'motif',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Motif" />,
        cell: ({ row }) => row.original.motif ?? '—',
      },
      {
        accessorKey: 'modifie_par',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Modifié par" />,
        cell: ({ row }) => row.original.modifie_par ?? '—',
      },
      {
        id: 'note',
        enableSorting: false,
        header: () => <div className="text-right">Note</div>,
        cell: ({ row }) => {
          const noteId = row.original.note_id;
          return (
            <div className="flex justify-end">
              <Button asChild variant="ghost" size="icon" className="rounded-xl" title="Ouvrir la note (table)">
                <Link href={`/tables/note?highlight=${encodeURIComponent(noteId)}`}>
                  <Link2 className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          );
        },
      },
    ];
  }, []);

  const { table, setGlobalFilter } = useClientTable<ApiNoteHistory>({
    data: filtered,
    columns,
    getRowId: (r) => r.id,
  });

  useEffect(() => {
    setGlobalFilter(search);
  }, [search, setGlobalFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Historique des Notes</h1>
        </div>
        <Button variant="outline" className="rounded-xl" onClick={refresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualiser
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total entrées" value={loading ? '—' : String(stats.total)} icon={History} delay={0} />
        <StatCard title="Avec motif" value={loading ? '—' : String(stats.withReason)} icon={History} delay={0.05} />
        <StatCard title="Dernière modif" value={loading ? '—' : stats.last ? formatDateTimeFr(stats.last) : '—'} icon={History} delay={0.1} />
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <DataTableToolbar
              searchPlaceholder="Rechercher (étudiant, module, motif, modifié par)…"
              searchValue={search}
              onSearchChange={setSearch}
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
                  <TableSkeleton rows={8} columns={8} />
                ) : table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="p-6">
                      <Empty className="rounded-2xl border">
                        <EmptyHeader>
                          <EmptyTitle>Aucun historique</EmptyTitle>
                          <EmptyDescription>
                            Les entrées apparaissent quand une note est modifiée (ancienne → nouvelle valeur).
                          </EmptyDescription>
                        </EmptyHeader>
                        <EmptyMedia />
                      </Empty>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

