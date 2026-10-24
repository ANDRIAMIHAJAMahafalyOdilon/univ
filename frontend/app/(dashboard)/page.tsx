'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users,
  GraduationCap,
  BookOpen,
  Route,
  Calendar,
  Percent,
  Activity,
  UserPlus,
  ClipboardList,
  Layers,
  Building2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  api,
  type ApiGrade,
  type ApiStudent,
  type ApiAuditLog,
  type ApiAcademicAnnee,
  type ApiAcademicParcours,
  type ApiTeacher,
  type ApiModule,
  type ApiInstitutionResponse,
} from '@/lib/api';

const CHART = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

type Bin = { range: string; min: number; max: number; count: number; fill: string };

function bucketGrades(grades: ApiGrade[]): Bin[] {
  const bins: Bin[] = [
    { range: '0-5', min: 0, max: 5, count: 0, fill: CHART[0] },
    { range: '5-10', min: 5, max: 10, count: 0, fill: CHART[1] },
    { range: '10-12', min: 10, max: 12, count: 0, fill: CHART[2] },
    { range: '12-14', min: 12, max: 14, count: 0, fill: CHART[3] },
    { range: '14-16', min: 14, max: 16, count: 0, fill: CHART[4] },
    { range: '16-20', min: 16, max: 20.01, count: 0, fill: CHART[5 % CHART.length] },
  ];
  for (const g of grades) {
    if (g.statut !== 'Valide') continue;
    const n = g.note_obtenue;
    for (const b of bins) {
      if (n >= b.min && n < b.max) {
        b.count++;
        break;
      }
    }
  }
  return bins;
}

function monthlyEnrollments(students: ApiStudent[]) {
  const now = new Date();
  const months: { key: string; label: string; count: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      count: 0,
    });
  }
  for (const s of students) {
    const raw = s.created_at;
    if (!raw) continue;
    const cd = new Date(raw);
    const key = `${cd.getFullYear()}-${cd.getMonth()}`;
    const m = months.find((x) => x.key === key);
    if (m) m.count++;
  }
  return months.map(({ label, count }) => ({ month: label, students: count }));
}

function parcoursStudentCounts(students: ApiStudent[]) {
  const map = new Map<string, { name: string; value: number }>();
  for (const s of students) {
    if (s.statut === 'Supprime') continue;
    const p = s.parcours;
    const key = p?.id ?? '_none';
    const name = p?.nom ?? 'Sans parcours';
    const cur = map.get(key) ?? { name, value: 0 };
    cur.value++;
    map.set(key, cur);
  }
  return [...map.values()].filter((x) => x.value > 0).slice(0, 10);
}

type ActivityLine = { id: string; description: string; user: string; ts: string; badge: string };

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<ApiStudent[]>([]);
  const [teachers, setTeachers] = useState<ApiTeacher[]>([]);
  const [modules, setModules] = useState<ApiModule[]>([]);
  const [grades, setGrades] = useState<ApiGrade[]>([]);
  const [annees, setAnnees] = useState<ApiAcademicAnnee[]>([]);
  const [parcours, setParcours] = useState<ApiAcademicParcours[]>([]);
  const [audit, setAudit] = useState<ApiAuditLog[]>([]);
  const [institutionInfo, setInstitutionInfo] = useState<ApiInstitutionResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.listStudents(),
      api.listTeachers(),
      api.listModules(),
      api.listGrades(),
      api.listCursusAnnees(true),
      api.listCursusParcours(true),
      api.listAuditLogs({ limit: 40 }),
      api.getInstitution().catch(() => null),
    ])
      .then(([st, te, mo, gr, an, pa, au, inst]) => {
        if (cancelled) return;
        setStudents(st);
        setTeachers(te);
        setModules(mo);
        setGrades(gr);
        setAnnees(an);
        setParcours(pa);
        setAudit(au);
        setInstitutionInfo(inst);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeAnnee = useMemo(() => annees.find((a) => a.est_active), [annees]);
  const activeYearLabel = activeAnnee?.libelle ?? '—';

  const gradesForYear = useMemo(() => {
    const lib = activeAnnee?.libelle;
    const valid = grades.filter((g) => g.statut === 'Valide');
    if (!lib) return valid;
    return valid.filter((g) => g.annee_academique === lib);
  }, [grades, activeAnnee]);

  const successRate = useMemo(() => {
    if (!gradesForYear.length) return 0;
    return (gradesForYear.filter((x) => x.note_obtenue >= 10).length / gradesForYear.length) * 100;
  }, [gradesForYear]);

  const activeStudents = useMemo(
    () => students.filter((s) => s.statut === 'Actif').length,
    [students]
  );

  const activeTeachers = useMemo(
    () => teachers.filter((t) => t.statut === 'Actif').length,
    [teachers]
  );

  const activeModules = useMemo(
    () => modules.filter((m) => m.statut === 'Actif').length,
    [modules]
  );

  const activeParcoursCount = useMemo(
    () =>
      parcours.filter(
        (p) => p.statut !== 'Supprime' && (p.etat_metier === 'Actif' || p.etat_metier === undefined)
      ).length,
    [parcours]
  );

  const gradeDistribution = useMemo(
    () => bucketGrades(grades.filter((g) => g.statut === 'Valide')),
    [grades]
  );
  const enrollData = useMemo(() => monthlyEnrollments(students), [students]);
  const pieParcours = useMemo(() => parcoursStudentCounts(students), [students]);

  const activities = useMemo(() => {
    const lines: ActivityLine[] = [];
    for (const g of grades.filter((x) => x.statut === 'Valide').slice(0, 6)) {
      lines.push({
        id: `g-${g.id_note}`,
        description: `Note ${g.note_obtenue}/20 (${g.type_evaluation})`,
        user: g.nom_module ?? 'Module',
        ts: g.date_saisie,
        badge: 'note',
      });
    }
    for (const a of audit.slice(0, 12)) {
      lines.push({
        id: `a-${a.id}`,
        description: `${a.action} — ${a.table_cible}`,
        user: a.user?.email ?? 'Système',
        ts: a.created_at,
        badge: 'audit',
      });
    }
    return lines
      .sort((x, y) => new Date(y.ts).getTime() - new Date(x.ts).getTime())
      .slice(0, 12);
  }, [grades, audit]);

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Tableau de bord</h1>
      </div>

      {institutionInfo ? (
        <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-card to-primary/5 shadow-sm">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Établissement</p>
                <p className="text-lg font-semibold tracking-tight">{institutionInfo.institution.nom}</p>
                <p className="text-sm text-muted-foreground">
                  {institutionInfo.institution.sigle}
                  {institutionInfo.institution.ville ? ` · ${institutionInfo.institution.ville}` : ''}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="rounded-xl">
                <Link href={`/universites/${institutionInfo.institution.id}`}>Fiche & détails</Link>
              </Button>
              <Button asChild className="rounded-xl">
                <Link href="/universites">Configurer</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : loading ? (
        <Skeleton className="h-24 w-full rounded-2xl" />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          title="Étudiants actifs"
          value={loading ? '—' : activeStudents}
          icon={Users}
          subtitle="hors corbeille"
        />
        <StatCard title="Enseignants" value={loading ? '—' : activeTeachers} icon={GraduationCap} delay={0.05} />
        <StatCard title="Parcours actifs" value={loading ? '—' : activeParcoursCount} icon={Route} delay={0.1} />
        <StatCard title="Modules" value={loading ? '—' : activeModules} icon={BookOpen} delay={0.15} />
        <StatCard
          title="Année universitaire active"
          value={loading ? '—' : activeYearLabel}
          icon={Calendar}
          delay={0.2}
        />
        <StatCard
          title="Taux de réussite (année active)"
          value={loading ? '—' : gradesForYear.length ? `${successRate.toFixed(1)} %` : '—'}
          icon={Percent}
          subtitle="notes ≥ 10/20"
          delay={0.25}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="secondary" className="rounded-xl">
          <Link href="/students">
            <UserPlus className="mr-2 h-4 w-4" />
            Ajouter un étudiant
          </Link>
        </Button>
        <Button asChild className="rounded-xl">
          <Link href="/grades">
            <ClipboardList className="mr-2 h-4 w-4" />
            Saisir des notes
          </Link>
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/parcours">
            <Layers className="mr-2 h-4 w-4" />
            Parcours
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Distribution des notes</CardTitle>
            <p className="text-sm text-muted-foreground">Tranches sur toutes les notes validées</p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {loading ? (
                <Skeleton className="h-full w-full rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gradeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="range" className="text-xs" tick={{ fill: 'var(--muted-foreground)' }} />
                    <YAxis className="text-xs" allowDecimals={false} tick={{ fill: 'var(--muted-foreground)' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        borderColor: 'var(--border)',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {gradeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Inscriptions (créations de fiches)</CardTitle>
            <p className="text-sm text-muted-foreground">12 derniers mois, par mois</p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {loading ? (
                <Skeleton className="h-full w-full rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={enrollData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" tick={{ fill: 'var(--muted-foreground)' }} />
                    <YAxis className="text-xs" allowDecimals={false} tick={{ fill: 'var(--muted-foreground)' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        borderColor: 'var(--border)',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="students"
                      stroke="hsl(var(--chart-1))"
                      fill="hsl(var(--chart-1))"
                      fillOpacity={0.25}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Étudiants par parcours</CardTitle>
            <p className="text-sm text-muted-foreground">Répartition actuelle</p>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              {loading ? (
                <Skeleton className="h-full w-full rounded-xl" />
              ) : pieParcours.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune donnée de parcours.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieParcours}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="name"
                    >
                      {pieParcours.map((_, index) => (
                        <Cell key={`c-${index}`} fill={CHART[index % CHART.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        borderColor: 'var(--border)',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mt-3 max-h-28 space-y-1 overflow-y-auto text-xs">
              {pieParcours.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 truncate text-muted-foreground">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: CHART[i % CHART.length] }} />
                    {p.name}
                  </span>
                  <span className="font-medium tabular-nums">{p.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activité récente
            </CardTitle>
            <p className="text-sm text-muted-foreground">Notes saisies et événements d&apos;audit</p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/50 p-3"
                  >
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary/70" />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm font-medium text-foreground">{activity.description}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{activity.user}</span>
                        <span>•</span>
                        <span suppressHydrationWarning>
                          {new Date(activity.ts).toLocaleString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-[10px] uppercase">
                      {activity.badge}
                    </Badge>
                  </div>
                ))}
                {!activities.length ? (
                  <p className="text-sm text-muted-foreground">Aucune activité récente.</p>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
