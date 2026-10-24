'use client';

import { useEffect, useMemo, useState } from 'react';
import { flexRender, type ColumnDef } from '@tanstack/react-table';
import { Bell, Eye, EyeOff, Plus, Send, Trash2 } from 'lucide-react';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { TableSkeleton } from '@/components/data-table/table-skeleton';
import { StatCard } from '@/components/dashboard/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api, type ApiNotification, type ApiSystemUser } from '@/lib/api';
import { useClientTable } from '@/lib/data-table/use-client-table';
import { useToast } from '@/hooks/use-toast';

const ALL_USERS = '__all_users__';

export default function NotificationsPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<ApiNotification[]>([]);
  const [users, setUsers] = useState<ApiSystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openSend, setOpenSend] = useState(false);
  const [form, setForm] = useState<{ type: 'Info' | 'Alerte' | 'Systeme'; titre: string; message: string; user_id: string }>({
    type: 'Info',
    titre: '',
    message: '',
    user_id: ALL_USERS,
  });

  const load = async () => {
    setLoading(true);
    try {
      const [n, u] = await Promise.all([api.listNotifications({ limit: 1000 }), api.listUsers()]);
      setRows(n);
      setUsers(u);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) => `${r.titre} ${r.message} ${r.type}`.toLowerCase().includes(search.toLowerCase())), [rows, search]);
  const unread = rows.filter((r) => !r.lu).length;
  const sent24 = rows.filter((r) => Date.now() - new Date(r.created_at).getTime() <= 24 * 60 * 60 * 1000).length;
  const failed = rows.filter((r) => r.type === 'Alerte' && !r.lu).length;

  const columns = useMemo<ColumnDef<ApiNotification>[]>(() => [
    { accessorKey: 'created_at', header: ({ column }) => <DataTableColumnHeader column={column} title="Date & Heure" />, cell: ({ row }) => new Date(row.original.created_at).toLocaleString('fr-FR') },
    { id: 'dest', header: 'Destinataire', cell: ({ row }) => row.original.user ? `${row.original.user.nom} ${row.original.user.prenom}` : row.original.user_id || 'Système' },
    { accessorKey: 'type', header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />, cell: ({ row }) => <Badge variant="secondary">{row.original.type}</Badge> },
    { accessorKey: 'titre', header: ({ column }) => <DataTableColumnHeader column={column} title="Sujet / Titre" /> },
    { accessorKey: 'message', header: 'Contenu', cell: ({ row }) => row.original.message.slice(0, 70) },
    { accessorKey: 'lu', header: ({ column }) => <DataTableColumnHeader column={column} title="Statut" />, cell: ({ row }) => <Badge variant={row.original.lu ? 'default' : 'secondary'}>{row.original.lu ? 'Lue' : 'Non lue'}</Badge> },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={async () => {
              try {
                await api.markNotificationRead(row.original.id, !row.original.lu);
                await load();
                toast({ title: row.original.lu ? 'Notification marquée non lue' : 'Notification marquée lue' });
              } catch (e) {
                toast({
                  title: 'Action impossible',
                  description: e instanceof Error ? e.message : 'Erreur réseau',
                  variant: 'destructive',
                });
              }
            }}
          >
            {row.original.lu ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl text-destructive"
            onClick={async () => {
              try {
                await api.deleteNotification(row.original.id);
                await load();
                toast({ title: 'Notification supprimée' });
              } catch (e) {
                toast({
                  title: 'Suppression impossible',
                  description: e instanceof Error ? e.message : 'Erreur réseau',
                  variant: 'destructive',
                });
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], []);

  const { table } = useClientTable<ApiNotification>({ data: filtered, columns, getRowId: (r) => r.id });

  const sendNotification = async () => {
    if (!form.titre.trim() || !form.message.trim()) return;
    try {
      await api.createNotification({
        type: form.type,
        titre: form.titre,
        message: form.message,
        user_id: form.user_id === ALL_USERS ? undefined : form.user_id,
      });
      toast({ title: 'Notification envoyée' });
      setOpenSend(false);
      setForm({ type: 'Info', titre: '', message: '', user_id: ALL_USERS });
      await load();
    } catch (e) {
      toast({ title: 'Erreur envoi', description: e instanceof Error ? e.message : 'Erreur', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Gestion des Notifications</h1><p className="text-muted-foreground">Historique d’envoi, lecture et gestion des alertes.</p></div>
        <Button className="rounded-xl" onClick={() => setOpenSend(true)}><Plus className="mr-2 h-4 w-4" />Envoyer une Notification</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Envoyées (24h)" value={String(sent24)} icon={Send} />
        <StatCard title="Non lues" value={String(unread)} icon={Bell} delay={0.05} />
        <StatCard title="Alertes critiques" value={String(failed)} icon={Bell} delay={0.1} />
        <StatCard title="Types actifs" value="3" icon={Bell} delay={0.15} />
      </div>
      <Card className="rounded-2xl"><CardContent className="p-5"><DataTableToolbar searchPlaceholder="Rechercher par destinataire, type, sujet..." searchValue={search} onSearchChange={setSearch} /></CardContent></Card>
      <Card className="rounded-2xl"><CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>{table.getHeaderGroups().map((g) => <TableRow key={g.id}>{g.headers.map((h) => <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>)}</TableHeader>
          <TableBody>{loading ? <TableSkeleton rows={8} columns={7} /> : table.getRowModel().rows.map((r) => <TableRow key={r.id}>{r.getVisibleCells().map((c) => <TableCell key={c.id}>{flexRender(c.column.columnDef.cell, c.getContext())}</TableCell>)}</TableRow>)}</TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={openSend} onOpenChange={setOpenSend}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Envoyer une Notification Personnalisée</DialogTitle>
            <DialogDescription>Choisis le destinataire, le type et rédige le message.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1">
              <Label>Destinataire</Label>
              <Select value={form.user_id} onValueChange={(v) => setForm((p) => ({ ...p, user_id: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Tous (système)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_USERS}>Tous (système)</SelectItem>
                  {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.nom} {u.prenom} ({u.email})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v as any }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Info">Info</SelectItem>
                  <SelectItem value="Alerte">Alerte</SelectItem>
                  <SelectItem value="Systeme">Système</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Sujet</Label><Input className="rounded-xl" value={form.titre} onChange={(e) => setForm((p) => ({ ...p, titre: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Contenu</Label><Input className="rounded-xl" value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setOpenSend(false)}>Annuler</Button>
            <Button className="rounded-xl" onClick={sendNotification}>Envoyer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

