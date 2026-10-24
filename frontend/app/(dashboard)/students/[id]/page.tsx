'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  LineChart,
  Mail,
  Pencil,
  Phone,
  School,
} from 'lucide-react';

import { StudentFormDialog } from '@/components/students/student-form-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api, type ApiGrade, type ApiModule, type ApiStudentDetail } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

function formatDateFr(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('fr-FR');
}

export default function StudentDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  const { toast } = useToast();

  const [student, setStudent] = useState<ApiStudentDetail | null>(null);
  const [grades, setGrades] = useState<ApiGrade[]>([]);
  const [modules, setModules] = useState<ApiModule[]>([]);
  const [avgStat, setAvgStat] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [s, g, st, allMods] = await Promise.all([
        api.getStudent(id),
        api.listGrades({ studentId: id }),
        api.studentStats(id),
        api.listModules(),
      ]);
      setStudent(s);
      setGrades(g);
      setModules(allMods);
      setAvgStat(st[0]?.moyenne_ponderee ?? null);
    } catch {
      setStudent(null);
      toast({
        variant: 'destructive',
        title: 'Chargement impossible',
        description: 'Vérifiez que l’étudiant existe et que l’API répond.',
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const moduleMap = useMemo(() => new Map(modules.map((m) => [m.id_module, m])), [modules]);

  const moduleBestNote = useMemo(() => {
    const m = new Map<string, number>();
    for (const g of grades) {
      const prev = m.get(g.id_module) ?? 0;
      m.set(g.id_module, Math.max(prev, g.note_obtenue));
    }
    return m;
  }, [grades]);

  const creditsEarned = useMemo(() => {
    let total = 0;
    for (const [mid, note] of moduleBestNote.entries()) {
      if (note >= 10) total += moduleMap.get(mid)?.credits_ects ?? 0;
    }
    return total;
  }, [moduleBestNote, moduleMap]);

  const validatedModulesCount = useMemo(() => {
    return [...moduleBestNote.values()].filter((n) => n >= 10).length;
  }, [moduleBestNote]);

  const modulesFollowed = useMemo(() => {
    const seen = new Map<string, ApiGrade>();
    for (const g of grades) {
      if (!seen.has(g.id_module)) seen.set(g.id_module, g);
    }
    return Array.from(seen.values());
  }, [grades]);

  const distinctModulesCount = useMemo(() => new Set(grades.map((g) => g.id_module)).size, [grades]);

  if (!id) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Identifiant manquant.
      </div>
    );
  }

  if (!loading && !student) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-lg font-medium">Étudiant introuvable</p>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/students">Retour à la liste</Link>
        </Button>
      </div>
    );
  }

  const initials = student
    ? `${student.prenom_etudiant?.[0] ?? ''}${student.nom_etudiant?.[0] ?? ''}`.toUpperCase()
    : '';

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" className="mt-0.5 rounded-xl" asChild>
            <Link href="/students" aria-label="Retour">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-4">
            {loading ? (
              <Skeleton className="h-16 w-16 rounded-full" />
            ) : (
              <Avatar className="h-16 w-16 border border-border/60">
                <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">{initials}</AvatarFallback>
              </Avatar>
            )}
            <div>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-56 rounded-lg" />
                  <Skeleton className="h-4 w-36 rounded-lg" />
                </div>
              ) : student ? (
                <>
                  <h1 className="page-title">
                    {student.prenom_etudiant} {student.nom_etudiant}
                  </h1>
                  <p className="text-muted-foreground font-mono text-sm">{student.numero_matricule}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge className="rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" variant="secondary">
                      {student.statut === 'Actif' ? 'Actif' : student.statut}
                    </Badge>
                    {student.niveau?.nom ? (
                      <Badge variant="outline" className="rounded-lg">
                        {student.niveau.nom}
                      </Badge>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-xl" disabled={loading || !student} onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Modifier le profil
          </Button>
          <Button variant="outline" className="rounded-xl" asChild>
            <Link href="/reports">Rapports</Link>
          </Button>
        </div>
      </div>

      {student ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription>Moyenne générale</CardDescription>
                  <CardTitle className="text-3xl tabular-nums">
                    {avgStat != null ? `${avgStat.toFixed(2)} / 20` : '—'}
                  </CardTitle>
                </CardHeader>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription>Modules validés (meilleure note ≥ 10)</CardDescription>
                  <CardTitle className="text-3xl tabular-nums">
                    {validatedModulesCount} / {distinctModulesCount}
                  </CardTitle>
                </CardHeader>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription>Crédits ECTS (modules validés)</CardDescription>
                  <CardTitle className="text-3xl tabular-nums">{creditsEarned}</CardTitle>
                </CardHeader>
              </Card>
            </motion.div>
          </div>

          <Tabs defaultValue="infos" className="space-y-4">
            <TabsList className="grid w-full max-w-lg grid-cols-3 rounded-xl bg-muted/60">
              <TabsTrigger value="infos" className="rounded-lg">
                Infos
              </TabsTrigger>
              <TabsTrigger value="notes" className="rounded-lg">
                Notes
              </TabsTrigger>
              <TabsTrigger value="modules" className="rounded-lg">
                Modules
              </TabsTrigger>
            </TabsList>

            <TabsContent value="infos" className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <School className="h-4 w-4" />
                      Informations personnelles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex gap-3">
                      <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>{student.email_etudiant || '—'}</span>
                    </div>
                    <div className="flex gap-3">
                      <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>{student.contact_etudiant || '—'}</span>
                    </div>
                    <div className="text-muted-foreground">
                      Né(e) le <span className="text-foreground">{formatDateFr(student.date_naissance)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <GraduationCap className="h-4 w-4" />
                      Parcours académique
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Parcours : </span>
                      {student.parcours?.nom ?? student.filiere}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Niveau : </span>
                      {student.niveau?.nom ?? '—'}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Année universitaire : </span>
                      {student.annee_academique}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Inscription enregistrée : </span>
                      {formatDateFr(student.created_at)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-border/60 border-dashed">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <LineChart className="h-4 w-4" />
                    Historique & absences
                  </CardTitle>
                  <CardDescription>
                    Données étendues (historique détaillé, absences) à brancher lorsque les endpoints métier seront disponibles.
                  </CardDescription>
                </CardHeader>
              </Card>
            </TabsContent>

            <TabsContent value="notes">
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle>Notes par module</CardTitle>
                  <CardDescription>Données issues de <code className="text-xs">/api/grades?studentId=…</code></CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  {grades.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">Aucune note pour cet étudiant.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Module</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Note</TableHead>
                          <TableHead>Semestre</TableHead>
                          <TableHead>Date saisie</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {grades.map((g) => (
                          <TableRow key={g.id_note}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{g.nom_module}</p>
                                <p className="text-xs text-muted-foreground">{g.code_module}</p>
                              </div>
                            </TableCell>
                            <TableCell>{g.type_evaluation}</TableCell>
                            <TableCell className="tabular-nums font-medium">{g.note_obtenue.toFixed(2)}</TableCell>
                            <TableCell>{g.semestre}</TableCell>
                            <TableCell className="text-muted-foreground">{formatDateFr(g.date_saisie)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="modules">
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BookOpen className="h-4 w-4" />
                    Modules avec notes saisies
                  </CardTitle>
                  <CardDescription>
                    Déduits des enregistrements de notes (pas d’inscription dédiée dans ce schéma).
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  {modulesFollowed.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">Aucun module associé aux notes.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Module</TableHead>
                          <TableHead>Crédits</TableHead>
                          <TableHead>Semestre</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {modulesFollowed.map((g) => {
                          const m = moduleMap.get(g.id_module);
                          return (
                            <TableRow key={g.id_module}>
                              <TableCell className="font-mono text-xs">{g.code_module}</TableCell>
                              <TableCell>{g.nom_module}</TableCell>
                              <TableCell>{m?.credits_ects ?? '—'}</TableCell>
                              <TableCell>{g.semestre}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <StudentFormDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            mode="edit"
            initial={student}
            onSaved={async () => {
              toast({ title: 'Profil mis à jour' });
              await load();
              setEditOpen(false);
            }}
          />
        </>
      ) : null}
    </div>
  );
}
