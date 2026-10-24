'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, Bell, Clock3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api, type ApiAuditLog, type ApiNotification } from '@/lib/api';

export default function SuiviSystemePage() {
  const [logs, setLogs] = useState<ApiAuditLog[]>([]);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);

  useEffect(() => {
    Promise.all([api.listAuditLogs({ limit: 500 }), api.listNotifications({ limit: 500 })]).then(([l, n]) => {
      setLogs(l);
      setNotifications(n);
    });
  }, []);

  const stats = useMemo(() => {
    const now = Date.now();
    const in24h = (ts: string) => now - new Date(ts).getTime() <= 24 * 60 * 60 * 1000;
    const in1h = (ts: string) => now - new Date(ts).getTime() <= 60 * 60 * 1000;
    return {
      audit24: logs.filter((l) => in24h(l.created_at)).length,
      criticalUnread: notifications.filter((n) => !n.lu && n.type === 'Alerte').length,
      notif24: notifications.filter((n) => in24h(n.created_at)).length,
      activeUsers1h: new Set(logs.filter((l) => in1h(l.created_at) && l.user_id).map((l) => l.user_id)).size,
      recent: logs.slice(0, 8),
    };
  }, [logs, notifications]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de Bord de Suivi Système</h1>
          <p className="text-muted-foreground">Surveillance des logs d’audit et des notifications.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="rounded-xl"><Link href="/suivi-systeme/audit-log">Voir les logs critiques</Link></Button>
          <Button asChild variant="secondary" className="rounded-xl"><Link href="/suivi-systeme/notifications">Envoyer notification</Link></Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Événements d'audit (24h)" value={String(stats.audit24)} icon={Activity} />
        <StatCard title="Alertes critiques non lues" value={String(stats.criticalUnread)} icon={AlertTriangle} delay={0.05} />
        <StatCard title="Notifications envoyées (24h)" value={String(stats.notif24)} icon={Bell} delay={0.1} />
        <StatCard title="Utilisateurs actifs (1h)" value={String(stats.activeUsers1h)} icon={Clock3} delay={0.15} />
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="rounded-2xl">
          <CardHeader><CardTitle>Activité récente</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {stats.recent.map((r) => (
              <div key={r.id} className="rounded-xl border p-3 text-sm">
                <div className="font-medium">{r.action} • {r.table_cible}</div>
                <div className="text-muted-foreground">{r.details || '—'}</div>
              </div>
            ))}
            {!stats.recent.length ? <div className="text-sm text-muted-foreground">Aucune activité récente.</div> : null}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

