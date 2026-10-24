'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, BookOpen, ClipboardList, GraduationCap, History, Layers, Route, Users } from 'lucide-react';
import { api, type ApiAuditLog, type ApiEnseignantRef, type ApiStudent, type ParcoursEtatMetier } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/dashboard/stat-card';
import { cn } from '@/lib/utils';

type ParcoursDetailPayload = {
  id: string;
  code: string;
  nom: string;
  description: string | null;
  statut?: string;
  etat_metier?: ParcoursEtatMetier;
  updated_at?: string;
  responsable?: ApiEnseignantRef | null;
  niveaux: Array<{ id: string; code: string; nom: string }>;
  modules: Array<{
    id_module: string;
    code_module: string;
    nom_module: string;
    credits_ects: number;
    coefficient_module: number;
    semestre: string;
    niveau_libelle?: string | null;
    niveau?: { id: string; code: string; nom: string } | null;
  }>;
  etudiants: ApiStudent[];
};

function studentStatutBadge(statut: ApiStudent['statut']) {
  const map: Record<string, { label: string; className: string }> = {
    Actif: { label: 'Actif', className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
    Suspendu: { label: 'Suspendu', className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
    Redoublant: { label: 'Redoublant', className: 'bg-sky-500/15 text-sky-600 dark:text-sky-400' },
    Diplome: { label: 'Diplômé', className: 'bg-violet-500/15 text-violet-600 dark:text-violet-400' },
    Abandon: { label: 'Abandon', className: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-300' },
    Exclu: { label: 'Exclu', className: 'bg-destructive/15 text-destructive' },
    Transfere: { label: 'Transféré', className: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
    Supprime: { label: 'Corbeille', className: '' },
  };
  const m = map[statut] ?? { label: statut, className: '' };
  return (
    <Badge variant="outline" className={cn('rounded-lg border-border/60', m.className)}>
      {m.label}
    </Badge>
  );
}

function etatMetierLabel(e?: ParcoursEtatMetier | null) {
  const labels: Record<string, string> = {
    Actif: 'Actif',
    En_Developpement: 'En développement',
    Archive: 'Archivé',
    Obsolete: 'Obsolète',
  };
  return e ? labels[e] ?? e : '—';
}

export default function ParcoursDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  const [parcours, setParcours] = useState<ParcoursDetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<ApiAuditLog[]>([]);
  const [passRate, setPassRate] = useState<number | null>(null);
  const [filterModuleNiveau, setFilterModuleNiveau] = useState<string>('__all__');

  useEffect(() => {
    let cancelled = false;
    if (!id) return;
    (async () => {
      try {
        const data = (await api.getParcoursDetail(id)) as ParcoursDetailPayload;
        if (!cancelled) setParcours(data);
      } catch {
        if (!cancelled) setParcours(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    api
      .listAuditLogs({ search: id, limit: 40 })
      .then(setLogs)
      .catch(() => setLogs([]));
  }, [id]);

  useEffect(() => {
    if (!parcours) return;
    const mids = parcours.modules.map((m) => m.id_module);
    let cancelled = false;
    api
      .listGrades()
      .then((grades) => {
        if (cancelled) return;
        const rel = grades.filter((g) => mids.includes(g.id_module) && g.statut === 'Valide');
        if (!rel.length) {
          setPassRate(null);
          return;
        }
        setPassRate(rel.filter((g) => g.note_obtenue >= 10).length / rel.length);
      })
      .catch(() => {
        if (!cancelled) setPassRate(null);
      });
    return () => {
      cancelled = true;
    };
  }, [parcours]);

  const stats = useMemo(() => {
    if (!parcours) return { niveaux: 0, modules: 0, etudiants: 0, ects: 0 };
    return {
      niveaux: parcours.niveaux.length,
      modules: parcours.modules.length,
      etudiants: parcours.etudiants.length,
      ects: parcours.modules.reduce((acc, m) => acc + m.credits_ects, 0),
    };
  }, [parcours]);

  const niveauDistribution = useMemo(() => {
    if (!parcours) return [];
    const m = new Map<string, number>();
    parcours.etudiants.forEach((e) => {
      const label = e.niveau?.nom ?? 'Non défini';
      m.set(label, (m.get(label) ?? 0) + 1);
    });
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [parcours]);

  const filteredModules = useMemo(() => {
    if (!parcours) return [];
    if (filterModuleNiveau === '__all__') return parcours.modules;
    return parcours.modules.filter((m) => (m.niveau_libelle ?? m.niveau?.nom ?? '') === filterModuleNiveau);
  }, [parcours, filterModuleNiveau]);

  const moduleNiveauOptions = useMemo(() => {
    if (!parcours) return [];
    const labels = new Set<string>();
    parcours.modules.forEach((m) => {
      const label = m.niveau_libelle ?? m.niveau?.nom;
      if (label) labels.add(label);
    });
    return Array.from(labels).sort();
  }, [parcours]);

  const exportCsv = (kind: 'modules' | 'etudiants') => {
    if (!parcours) return;
    const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
    if (kind === 'modules') {
      const header = ['code_module', 'nom_module', 'niveau', 'credits', 'coef', 'semestre'];
      const lines = parcours.modules.map((m) =>
        [m.code_module, m.nom_module, m.niveau_libelle ?? m.niveau?.nom ?? '', m.credits_ects, m.coefficient_module, m.semestre]
          .map((x) => esc(String(x)))
          .join(',')
      );
      const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `parcours-${parcours.code}-modules.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
      return;
    }
    const header = ['matricule', 'nom', 'prenom', 'email', 'niveau', 'statut'];
    const lines = parcours.etudiants.map((s) =>
      [
        s.numero_matricule,
        s.nom_etudiant,
        s.prenom_etudiant,
        s.email_etudiant ?? '',
        s.niveau?.nom ?? '',
        s.statut,
      ]
        .map((x) => esc(String(x)))
        .join(',')
    );
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `parcours-${parcours.code}-etudiants.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (!loading && !parcours) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Parcours non trouvé</h2>
          <p className="text-muted-foreground">Le parcours demandé n&apos;existe pas.</p>
          <Link href="/parcours" className="mt-4 inline-block">
            <Button className="rounded-xl">Retour à la liste</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <Link href="/parcours">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            {loading ? (
              <Skeleton className="h-8 w-72" />
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">Détails : {parcours?.nom}</h1>
                  <Badge variant="outline" className="rounded-lg font-mono">
                    {parcours?.code}
                  </Badge>
                  {parcours?.etat_metier ? (
                    <Badge variant="secondary" className="rounded-lg">
                      {etatMetierLabel(parcours.etat_metier)}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-muted-foreground">
                  Fiche programme — mise à jour{' '}
                  {parcours?.updated_at ? new Date(parcours.updated_at).toLocaleString('fr-FR') : '—'}
                </p>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-xl" asChild>
            <Link href={`/parcours`}>Modifier (liste)</Link>
          </Button>
          <Button variant="outline" className="rounded-xl" asChild>
            <Link href={`/cursus/niveaux?parcoursId=${encodeURIComponent(id)}`}>Niveaux</Link>
          </Button>
          <Button variant="outline" className="rounded-xl" asChild>
            <Link href={`/modules?parcoursId=${encodeURIComponent(id)}`}>Modules</Link>
          </Button>
          <Button variant="secondary" className="rounded-xl" type="button" onClick={() => exportCsv('modules')}>
            Export modules CSV
          </Button>
          <Button variant="secondary" className="rounded-xl" type="button" onClick={() => exportCsv('etudiants')}>
            Export étudiants CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Niveaux" value={loading ? '…' : stats.niveaux} icon={Route} delay={0} />
        <StatCard title="Modules" value={loading ? '…' : stats.modules} icon={BookOpen} delay={0.05} />
        <StatCard title="Crédits ECTS" value={loading ? '…' : stats.ects} icon={GraduationCap} delay={0.1} />
        <StatCard title="Étudiants" value={loading ? '…' : stats.etudiants} icon={Users} delay={0.12} />
        <StatCard
          title="Notes ≥ 10 (approx.)"
          value={
            loading ? '…' : passRate === null ? '—' : `${Math.round(passRate * 100)} %`
          }
          icon={ClipboardList}
          subtitle="Sur modules du parcours"
          delay={0.15}
        />
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
          <CardDescription>Nom, description et pilotage pédagogique</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Description</p>
            <p className="text-foreground">{parcours?.description?.trim() || 'Aucune description renseignée.'}</p>
          </div>
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Responsable pédagogique</p>
              {parcours?.responsable ? (
                <Link
                  href={`/teachers/${parcours.responsable.id_enseignant}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {parcours.responsable.prenom_enseignant} {parcours.responsable.nom_enseignant}{' '}
                  <span className="text-muted-foreground">({parcours.responsable.departement})</span>
                </Link>
              ) : (
                <span className="text-muted-foreground">Non assigné</span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">État métier</p>
              <p>{etatMetierLabel(parcours?.etat_metier)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Répartition par niveau (étudiants)
          </CardTitle>
          <CardDescription>Effectifs par niveau d&apos;inscription</CardDescription>
        </CardHeader>
        <CardContent>
          {niveauDistribution.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun étudiant ou niveau non renseigné.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {niveauDistribution.map(([label, count]) => (
                <Badge key={label} variant="secondary" className="rounded-lg px-3 py-1">
                  {label}: {count}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Niveaux du parcours
          </CardTitle>
          <CardDescription>Structure du cursus — accès rapide à la gestion</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parcours?.niveaux.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell className="font-mono text-sm">{n.code}</TableCell>
                    <TableCell>{n.nom}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="rounded-xl" asChild>
                        <Link href={`/cursus/niveaux?parcoursId=${encodeURIComponent(id)}`}>Voir liste</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && (parcours?.niveaux.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                      Aucun niveau associé.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Modules du parcours
            </CardTitle>
            <CardDescription>Filtrer par niveau pour analyser l&apos;offre de cours</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Niveau</span>
            <select
              className="h-9 rounded-xl border border-input bg-background px-3 text-sm"
              value={filterModuleNiveau}
              onChange={(e) => setFilterModuleNiveau(e.target.value)}
            >
              <option value="__all__">Tous</option>
              {moduleNiveauOptions.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Niveau</TableHead>
                  <TableHead className="text-center">Crédits</TableHead>
                  <TableHead className="text-center">Coefficient</TableHead>
                  <TableHead className="text-center">Semestre</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredModules.map((module) => (
                  <TableRow key={module.id_module}>
                    <TableCell className="font-mono font-medium">{module.code_module}</TableCell>
                    <TableCell>{module.nom_module}</TableCell>
                    <TableCell>{module.niveau_libelle ?? module.niveau?.nom ?? '—'}</TableCell>
                    <TableCell className="text-center">{module.credits_ects}</TableCell>
                    <TableCell className="text-center">{module.coefficient_module}</TableCell>
                    <TableCell className="text-center">{module.semestre}</TableCell>
                  </TableRow>
                ))}
                {!loading && filteredModules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Aucun module pour ce filtre.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Étudiants inscrits
          </CardTitle>
          <CardDescription>Statut académique et rattachement au niveau</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matricule</TableHead>
                  <TableHead>Nom complet</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Niveau</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parcours?.etudiants.map((student) => (
                  <TableRow key={student.id_etudiant}>
                    <TableCell className="font-mono">{student.numero_matricule}</TableCell>
                    <TableCell className="font-medium">
                      {student.nom_etudiant} {student.prenom_etudiant}
                    </TableCell>
                    <TableCell>{student.email_etudiant || '—'}</TableCell>
                    <TableCell>{student.niveau?.nom ?? '—'}</TableCell>
                    <TableCell>{studentStatutBadge(student.statut)}</TableCell>
                  </TableRow>
                ))}
                {!loading && (parcours?.etudiants.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Aucun étudiant inscrit.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique (audit)
          </CardTitle>
          <CardDescription>Entrées récentes du journal liées à cet identifiant</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Détails</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.slice(0, 25).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString('fr-FR')}
                    </TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>{log.table_cible}</TableCell>
                    <TableCell className="max-w-md truncate text-xs">{log.details ?? '—'}</TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                      Aucune entrée trouvée pour ce parcours.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
