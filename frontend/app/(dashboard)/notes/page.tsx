'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CalendarRange, ClipboardList, History, TrendingUp } from 'lucide-react';

import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api, type ApiGrade, type ApiSessionExamen } from '@/lib/api';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';

export default function NotesOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState<ApiGrade[]>([]);
  const [sessions, setSessions] = useState<ApiSessionExamen[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([api.listGrades(), api.listSessionsExamen()])
      .then(([g, s]) => {
        if (cancelled) return;
        setGrades(g);
        setSessions(s);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Erreur de chargement');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const totalNotes = grades.length;
    const totalSessions = sessions.length;
    const validated = grades.filter((g) => g.statut === 'Valide').length;
    const average =
      totalNotes > 0 ? grades.reduce((acc, g) => acc + Number(g.note_obtenue || 0), 0) / totalNotes : 0;
    return { totalNotes, totalSessions, validated, average };
  }, [grades, sessions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Vue d’ensemble des Notes</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" className="rounded-xl">
            <Link href="/notes/sessions">Gérer les sessions</Link>
          </Button>
          <Button asChild className="rounded-xl">
            <Link href="/grades">Saisir des notes</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Notes saisies" value={loading ? '—' : String(stats.totalNotes)} icon={ClipboardList} delay={0} />
        <StatCard title="Notes validées" value={loading ? '—' : String(stats.validated)} icon={TrendingUp} delay={0.05} />
        <StatCard title="Sessions d’examen" value={loading ? '—' : String(stats.totalSessions)} icon={CalendarRange} delay={0.1} />
        <StatCard
          title="Moyenne globale"
          value={loading ? '—' : stats.totalNotes === 0 ? '—' : stats.average.toFixed(2)}
          icon={History}
          delay={0.15}
        />
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Raccourcis</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Button asChild variant="outline" className="h-auto justify-start rounded-2xl p-4">
              <Link href="/notes/sessions" className="flex w-full items-center gap-3">
                <CalendarRange className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Sessions d’examen</div>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto justify-start rounded-2xl p-4">
              <Link href="/grades" className="flex w-full items-center gap-3">
                <ClipboardList className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Saisie des notes</div>
                  <div className="text-xs text-muted-foreground">Créer et gérer les notes</div>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto justify-start rounded-2xl p-4">
              <Link href="/notes/history" className="flex w-full items-center gap-3">
                <History className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Historique</div>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {error ? (
        <Card className="rounded-2xl border-destructive/40">
          <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      {loading ? (
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="grid gap-3">
              <Skeleton className="h-10 w-2/3 rounded-xl" />
              <Skeleton className="h-10 w-1/2 rounded-xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
          </CardContent>
        </Card>
      ) : grades.length === 0 && sessions.length === 0 ? (
        <Empty className="rounded-2xl border">
          <EmptyHeader>
            <EmptyTitle>Aucune donnée “Notes”</EmptyTitle>
            <EmptyDescription>
              Commence par planifier une session, puis saisis des notes pour voir les statistiques.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyMedia />
          <div className="flex gap-2">
            <Button asChild className="rounded-xl">
              <Link href="/notes/sessions">Créer une session</Link>
            </Button>
            <Button asChild variant="secondary" className="rounded-xl">
              <Link href="/grades">Saisir des notes</Link>
            </Button>
          </div>
        </Empty>
      ) : null}
    </div>
  );
}

