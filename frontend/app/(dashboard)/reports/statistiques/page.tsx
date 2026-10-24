'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api, type ApiStudent, type ApiGrade, type ApiModule } from '@/lib/api';

const colors = ['#6366f1', '#14b8a6', '#f59e0b', '#ef4444', '#22c55e', '#0ea5e9'];

export default function ReportsStatsPage() {
  const [students, setStudents] = useState<ApiStudent[]>([]);
  const [grades, setGrades] = useState<ApiGrade[]>([]);
  const [modules, setModules] = useState<ApiModule[]>([]);

  useEffect(() => {
    Promise.all([api.listStudents(), api.listGrades(), api.listModules()]).then(([s, g, m]) => {
      setStudents(s);
      setGrades(g);
      setModules(m);
    });
  }, []);

  const rate = useMemo(() => {
    if (!grades.length) return 0;
    return Math.round((grades.filter((g) => g.note_obtenue >= 10).length / grades.length) * 100);
  }, [grades]);

  const byParcours = useMemo(() => {
    const map = new Map<string, number>();
    students.forEach((s) => {
      const key = s.parcours?.nom ?? s.filiere ?? 'Non défini';
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [students]);

  const bySemestre = useMemo(() => {
    const map = new Map<string, number[]>();
    grades.forEach((g) => map.set(g.semestre ?? 'S?', [...(map.get(g.semestre ?? 'S?') ?? []), g.note_obtenue]));
    return [...map.entries()].map(([semestre, arr]) => ({ semestre, moyenne: Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)) }));
  }, [grades]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Statistiques Générales de l’Université</h1>
        <p className="text-muted-foreground">Vue agrégée étudiants, modules et performances.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Taux de réussite global" value={`${rate}%`} icon={BarChart3} />
        <StatCard title="Étudiants uniques" value={String(students.length)} icon={BarChart3} delay={0.05} />
        <StatCard title="Modules" value={String(modules.length)} icon={BarChart3} delay={0.1} />
        <StatCard title="Notes traitées" value={String(grades.length)} icon={BarChart3} delay={0.15} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader><CardTitle>Répartition des étudiants par parcours</CardTitle></CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byParcours} dataKey="value" nameKey="name" outerRadius={110} label>
                  {byParcours.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader><CardTitle>Notes moyennes par semestre</CardTitle></CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySemestre}>
                <XAxis dataKey="semestre" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="moyenne" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

