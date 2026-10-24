'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  CalendarRange,
  GraduationCap,
  Layers,
  Route,
  TrendingUp,
} from 'lucide-react';

import { PageHeader } from '@/components/dashboard/page-header';
import { StatCard } from '@/components/dashboard/stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api, type ApiCursusOverview } from '@/lib/api';

export default function CursusOverviewPage() {
  const [ov, setOv] = useState<ApiCursusOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const d = await api.cursusOverview();
        if (!cancel) setOv(d);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const shortcuts = [
    { title: 'Années Universitaires', desc: 'Créer, archiver, définir l’année active', href: '/cursus/annees', icon: CalendarRange },
    { title: 'Parcours', desc: 'Programmes et filières', href: '/parcours', icon: Route },
    { title: 'Modules', desc: 'Unités d’enseignement et ECTS', href: '/modules', icon: BookOpen },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Vue d’ensemble du Cursus" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : ov ? (
          <>
            <StatCard title="Parcours actifs" value={ov.totalParcours} icon={Route} delay={0} />
            <StatCard title="Niveaux" value={ov.totalNiveaux} icon={Layers} delay={0.05} />
            <StatCard title="Modules" value={ov.totalModules} icon={BookOpen} delay={0.1} />
            <StatCard
              title="Année universitaire active"
              value={ov.activeAnneeLibelle ?? '—'}
              subtitle={ov.activeAnneeId ? `ID: ${ov.activeAnneeId.slice(0, 8)}…` : undefined}
              icon={GraduationCap}
              delay={0.15}
            />
          </>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4" />
                Activité récente
              </CardTitle>
              <CardDescription>
                Les journaux détaillés (audit) sont disponibles via la navigation « Suivi Système ».
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Graphiques</CardTitle>
              <CardDescription>
                Visualisations avancées : utilisez les pages Parcours et Modules pour les répartitions détaillées.
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {shortcuts.map((s, i) => (
          <motion.div
            key={s.href}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
          >
            <Link href={s.href}>
              <Card className="group h-full border-border/60 transition-all hover:border-primary/40 hover:shadow-md">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <s.icon className="h-5 w-5 text-primary" />
                      {s.title}
                    </CardTitle>
                    <CardDescription>{s.desc}</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0 rounded-xl opacity-70 transition group-hover:opacity-100">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardHeader>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
