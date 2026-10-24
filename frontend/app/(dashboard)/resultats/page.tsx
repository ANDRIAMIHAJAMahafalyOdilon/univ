'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Gavel, Trophy, Award, FileText } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

export default function ResultatsOverviewPage() {
  const [results, setResults] = useState({ deliberations: 0, decisions: 0, mentions: 0, admitted: 0 });

  useEffect(() => {
    api.listDeliberations().then((rows) => setResults({
      deliberations: rows.length,
      decisions: rows.filter((row) => row.decision_jury).length,
      mentions: rows.filter((row) => row.mention).length,
      admitted: rows.filter((row) => row.decision_jury?.decision === 'Admis').length,
    }));
  }, []);

  const stats = useMemo(() => ({
    ...results,
  }), [results]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vue d’ensemble des Résultats</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Délibérations" value={String(stats.deliberations)} icon={Gavel} />
        <StatCard title="Décisions finales" value={String(stats.decisions)} icon={Trophy} delay={0.05} />
        <StatCard title="Mentions attribuées" value={String(stats.mentions)} icon={Award} delay={0.1} />
        <StatCard title="Étudiants admis" value={String(stats.admitted)} icon={FileText} delay={0.15} />
      </div>
      <Card className="rounded-2xl">
        <CardHeader><CardTitle>Accès rapide</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild className="rounded-xl"><Link href="/resultats/deliberations">Délibérations</Link></Button>
          <Button asChild variant="secondary" className="rounded-xl"><Link href="/resultats/decisions">Décisions du jury</Link></Button>
          <Button asChild variant="outline" className="rounded-xl"><Link href="/resultats/mentions">Mentions</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}

