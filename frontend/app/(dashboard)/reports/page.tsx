'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BarChart3, FileText, PieChart, Sparkles } from 'lucide-react';

import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<Awaited<ReturnType<typeof api.cursusOverview>> | null>(null);
  const [gradesCount, setGradesCount] = useState(0);

  useEffect(() => {
    let c = false;
    setLoading(true);
    Promise.all([api.cursusOverview(), api.listGrades()])
      .then(([o, g]) => {
        if (c) return;
        setOverview(o);
        setGradesCount(g.filter((x) => x.statut === 'Valide').length);
      })
      .finally(() => {
        if (!c) setLoading(false);
      });
    return () => {
      c = true;
    };
  }, []);

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de Bord des Rapports</h1>
          <p className="text-sm text-muted-foreground">Relevés de notes et statistiques agrégées</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="rounded-xl">
            <Link href="/reports/releves">Générer un relevé</Link>
          </Button>
          <Button asChild variant="secondary" className="rounded-xl">
            <Link href="/reports/statistiques">Statistiques</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Notes validées (base)"
          value={loading ? '—' : gradesCount}
          icon={FileText}
          subtitle="données disponibles pour relevés"
        />
        <StatCard
          title="Parcours"
          value={loading ? '—' : overview?.totalParcours ?? '—'}
          icon={PieChart}
          delay={0.05}
        />
        <StatCard
          title="Modules"
          value={loading ? '—' : overview?.totalModules ?? '—'}
          icon={BarChart3}
          delay={0.1}
        />
        <StatCard
          title="Année active"
          value={loading ? '—' : overview?.activeAnneeLibelle ?? '—'}
          icon={Sparkles}
          delay={0.15}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5" />
              Générer Relevé Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Produire un relevé officiel à partir des notes et modules enregistrés.
            </p>
            {loading ? <Skeleton className="h-10 w-32 rounded-xl" /> : null}
            <Button asChild className="rounded-xl">
              <Link href="/reports/releves">Ouvrir</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5" />
              Statistiques Générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Graphiques et exports à partir des données réelles du système.</p>
            {loading ? <Skeleton className="h-10 w-32 rounded-xl" /> : null}
            <Button asChild variant="secondary" className="rounded-xl">
              <Link href="/reports/statistiques">Ouvrir</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
