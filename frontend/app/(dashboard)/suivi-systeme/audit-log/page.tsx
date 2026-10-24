'use client';

import { useEffect, useMemo, useState } from 'react';
import { flexRender, type ColumnDef } from '@tanstack/react-table';
import { Download, Eye, Trash2 } from 'lucide-react';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { TableSkeleton } from '@/components/data-table/table-skeleton';
import { StatCard } from '@/components/dashboard/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api, type ApiAuditLog } from '@/lib/api';
import { useClientTable } from '@/lib/data-table/use-client-table';
import { useToast } from '@/hooks/use-toast';

export default function AuditLogPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<ApiAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ApiAuditLog | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setRows(await api.listAuditLogs({ limit: 1000 }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) => `${r.action} ${r.table_cible} ${r.details ?? ''}`.toLowerCase().includes(search.toLowerCase())), [rows, search]);
  const critical = rows.filter((r) => /erreur|tentative|unauthorized|failed/i.test(`${r.action} ${r.details ?? ''}`)).length;
  const userLogs = rows.filter((r) => !!r.user_id).length;

  const columns = useMemo<ColumnDef<ApiAuditLog>[]>(() => [
    { accessorKey: 'id', header: ({ column }) => <DataTableColumnHeader column={column} title="ID Log" />, cell: ({ row }) => row.original.id.slice(0, 8) },
    { accessorKey: 'created_at', header: ({ column }) => <DataTableColumnHeader column={column} title="Date & Heure" />, cell: ({ row }) => new Date(row.original.created_at).toLocaleString('fr-FR') },
    { id: 'user', header: 'Utilisateur', cell: ({ row }) => row.original.user ? `${row.original.user.nom} ${row.original.user.prenom}` : 'Système' },
    { accessorKey: 'action', header: ({ column }) => <DataTableColumnHeader column={column} title="Action" />, cell: ({ row }) => <Badge variant="secondary">{row.original.action}</Badge> },
    { accessorKey: 'table_cible', header: ({ column }) => <DataTableColumnHeader column={column} title="Entité" /> },
    { accessorKey: 'details', header: 'Description', cell: ({ row }) => (row.original.details || '—').slice(0, 80) },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setSelected(row.original)}>
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], []);

  const { table } = useClientTable<ApiAuditLog>({ data: filtered, columns, getRowId: (r) => r.id });

  const exportCsv = () => {
    const headers = ['id', 'created_at', 'action', 'table_cible', 'details', 'ip_address'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [headers.join(';'), ...filtered.map((r) => [r.id, r.created_at, r.action, r.table_cible, r.details, r.ip_address].map(esc).join(';'))];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const purge = async () => {
    try {
      await api.purgeAuditLogs();
      toast({ title: 'Logs purgés' });
      await load();
    } catch (e) {
      toast({ title: 'Erreur purge', description: e instanceof Error ? e.message : 'Erreur', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Journal d&apos;Audit</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />Exporter les Logs</Button>
          <Button variant="destructive" className="rounded-xl" onClick={purge}><Trash2 className="mr-2 h-4 w-4" />Purger les Logs</Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total logs" value={loading ? '—' : String(rows.length)} icon={Eye} />
        <StatCard title="Logs critiques" value={loading ? '—' : String(critical)} icon={Trash2} delay={0.05} />
        <StatCard title="Logs utilisateurs" value={loading ? '—' : String(userLogs)} icon={Eye} delay={0.1} />
        <StatCard title="Logs système" value={loading ? '—' : String(rows.length - userLogs)} icon={Eye} delay={0.15} />
      </div>

      <Card className="rounded-2xl"><CardContent className="p-5"><DataTableToolbar searchPlaceholder="Rechercher par action, entité, description..." searchValue={search} onSearchChange={setSearch} /></CardContent></Card>
      <Card className="rounded-2xl"><CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>{table.getHeaderGroups().map((g) => <TableRow key={g.id}>{g.headers.map((h) => <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>)}</TableHeader>
          <TableBody>{loading ? <TableSkeleton rows={8} columns={7} /> : table.getRowModel().rows.map((r) => <TableRow key={r.id}>{r.getVisibleCells().map((c) => <TableCell key={c.id}>{flexRender(c.column.columnDef.cell, c.getContext())}</TableCell>)}</TableRow>)}</TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="rounded-2xl max-w-3xl">
          <DialogHeader>
            <DialogTitle>Détails du Log</DialogTitle>
            <DialogDescription>ID: {selected?.id}</DialogDescription>
          </DialogHeader>
          <pre className="max-h-[60vh] overflow-auto rounded-xl border p-3 text-xs">{selected ? JSON.stringify(selected, null, 2) : ''}</pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}

