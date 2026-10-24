'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  GraduationCap,
  Percent,
  Route,
  Users,
} from 'lucide-react';

import { PageHeader } from '@/components/dashboard/page-header';
import { StatCard } from '@/components/dashboard/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  api,
  type ApiAcademicParcours,
  type ApiInstitutionResponse,
  type ApiStudent,
  type ApiTeacher,
  type ApiAuditLog,
} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function UniversiteDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [inst, setInst] = useState<ApiInstitutionResponse | null>(null);
  const [parcours, setParcours] = useState<ApiAcademicParcours[]>([]);
  const [students, setStudents] = useState<ApiStudent[]>([]);
  const [teachers, setTeachers] = useState<ApiTeacher[]>([]);
  const [grades, setGrades] = useState<Awaited<ReturnType<typeof api.listGrades>>>([]);
  const [audit, setAudit] = useState<ApiAuditLog[]>([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.getInstitutionDetail(id),
      api.listCursusParcours(true),
      api.listStudents(),
      api.listTeachers(),
      api.listGrades(),
      api.listAuditLogs({ limit: 15 }),
    ])
      .then(([i, p, st, te, gr, au]) => {
        if (i.institution.id !== id) {
          toast({ variant: 'destructive', title: 'Université introuvable' });
          return;
        }
        setInst(i);
        setParcours(p);
        setStudents(st);
        setTeachers(te.filter((t) => t.statut === 'Actif'));
        setGrades(gr);
        setAudit(au);
      })
      .catch((e) => {
        toast({ variant: 'destructive', title: 'Erreur', description: e instanceof Error ? e.message : '' });
      })
      .finally(() => setLoading(false));
  }, [id, toast]);

  const institution = inst?.institution;
  const counts = inst?.counts;

  const successRate = useMemo(() => {
    const g = grades.filter((x) => x.statut === 'Valide');
    if (!g.length) return 0;
    return (g.filter((x) => x.note_obtenue >= 10).length / g.length) * 100;
  }, [grades]);

  const parcoursRows = useMemo(
    () => parcours.filter((p) => p.statut !== 'Supprime').slice(0, 20),
    [parcours]
  );

  if (!id) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="rounded-xl">
          <Link href="/universites">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Link>
        </Button>
      </div>

      <PageHeader
        title={loading ? 'Chargement…' : `Détails : ${institution?.nom ?? ''}`}
        actions={
          <Button asChild variant="secondary" className="rounded-xl">
            <Link href="/universites">Modifier</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Étudiants" value={loading ? '—' : counts?.totalEtudiants ?? '—'} icon={Users} />
        <StatCard title="Enseignants" value={loading ? '—' : counts?.totalEnseignants ?? '—'} icon={GraduationCap} delay={0.05} />
        <StatCard title="Parcours" value={loading ? '—' : counts?.totalParcours ?? '—'} icon={Route} delay={0.1} />
        <StatCard
          title="Taux de réussite (notes)"
          value={loading ? '—' : grades.length ? `${successRate.toFixed(1)} %` : '—'}
          icon={Percent}
          delay={0.15}
        />
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            {loading ? (
              <Skeleton className="h-24 w-full rounded-xl" />
            ) : (
              <>
                <div>
                  <p className="text-muted-foreground">Sigle</p>
                  <p className="font-medium">{institution?.sigle}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Statut</p>
                  <Badge variant="secondary" className="mt-1 rounded-full">
                    {institution?.statut === 'Active' ? 'Active' : institution?.statut === 'En_Projet' ? 'En projet' : 'Archivée'}
                  </Badge>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-muted-foreground">Description</p>
                  <p className="font-medium">{institution?.description ?? '—'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-muted-foreground">Adresse</p>
                  <p className="font-medium whitespace-pre-wrap">{institution?.adresse ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ville / Pays</p>
                  <p className="font-medium">
                    {[institution?.ville, institution?.pays].filter(Boolean).join(', ') || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Contact</p>
                  <p className="font-medium">{institution?.email_contact ?? '—'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-muted-foreground">Site web</p>
                  <p className="font-medium break-all">{institution?.site_web ?? '—'}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Parcours</CardTitle>
            <Button asChild variant="link" size="sm" className="h-auto p-0">
              <Link href="/parcours">Voir tout</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Étudiants</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading
                    ? [1, 2, 3].map((i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={3}>
                            <Skeleton className="h-8 w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    : parcoursRows.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>
                            <Link href={`/parcours/${p.id}`} className="font-medium text-primary hover:underline">
                              {p.nom}
                            </Link>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{p.code}</TableCell>
                          <TableCell className="text-right tabular-nums">{p._count?.etudiants ?? '—'}</TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Enseignants</CardTitle>
            <Button asChild variant="link" size="sm" className="h-auto p-0">
              <Link href="/teachers">Voir tout</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Département</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading
                    ? [1, 2, 3].map((i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={2}>
                            <Skeleton className="h-8 w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    : teachers.slice(0, 12).map((t) => (
                        <TableRow key={t.id_enseignant}>
                          <TableCell>
                            <Link href={`/teachers/${t.id_enseignant}`} className="font-medium text-primary hover:underline">
                              {t.prenom_enseignant} {t.nom_enseignant}
                            </Link>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{t.departement}</TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">Aperçu étudiants</CardTitle>
          <Button asChild variant="link" size="sm" className="h-auto p-0">
            <Link href="/students">Voir tout</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matricule</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Parcours</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? [1, 2, 3, 4].map((i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={4}>
                          <Skeleton className="h-8 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  : students.slice(0, 15).map((s) => (
                      <TableRow key={s.id_etudiant}>
                        <TableCell className="font-mono text-xs">{s.numero_matricule}</TableCell>
                        <TableCell>
                          <Link href={`/students/${s.id_etudiant}`} className="font-medium text-primary hover:underline">
                            {s.prenom_etudiant} {s.nom_etudiant}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{s.parcours?.nom ?? '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-full text-xs">
                            {s.statut}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Historique (audit récent)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading
            ? [1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)
            : audit.map((a) => (
                <div key={a.id} className="rounded-xl border border-border/60 p-3 text-sm">
                  <div className="font-medium">
                    {a.action} · {a.table_cible}
                  </div>
                  <div className="text-muted-foreground">{a.details ?? '—'}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleString('fr-FR')}
                  </div>
                </div>
              ))}
          {!loading && !audit.length ? <p className="text-sm text-muted-foreground">Aucun événement.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
