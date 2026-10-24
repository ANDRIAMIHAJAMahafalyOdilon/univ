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
import { ArrowLeft, Award, BookOpen, Clock, User } from 'lucide-react';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

type ModuleDetailPayload = {
  id_module: string;
  code_module: string;
  nom_module: string;
  credits_ects: number;
  coefficient_module: number;
  semestre: string;
  statut: 'Actif' | 'Supprime';
  enseignant: {
    id_enseignant: string;
    nom_enseignant: string;
    prenom_enseignant: string;
  } | null;
  notes: Array<{
    id_note: string;
    note_obtenue: number;
    type_evaluation: string;
    etudiant: {
      id_etudiant: string;
      numero_matricule: string;
      nom_etudiant: string;
      prenom_etudiant: string;
    };
  }>;
};

export default function ModuleDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  const [module, setModule] = useState<ModuleDetailPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!id) return;
    (async () => {
      try {
        const data = (await api.getModuleDetail(id)) as ModuleDetailPayload;
        if (!cancelled) setModule(data);
      } catch {
        if (!cancelled) setModule(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const averageGrade = useMemo(() => {
    if (!module || module.notes.length === 0) return 0;
    return module.notes.reduce((acc, g) => acc + g.note_obtenue, 0) / module.notes.length;
  }, [module]);

  const passRate = useMemo(() => {
    if (!module || module.notes.length === 0) return 0;
    return (module.notes.filter((g) => g.note_obtenue >= 10).length / module.notes.length) * 100;
  }, [module]);

  if (!loading && !module) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold">Module non trouvé</h2>
        <Link href="/modules">
          <Button variant="link">Retour à la liste</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/modules">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            {loading ? (
              <Skeleton className="h-8 w-56" />
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground">{module?.nom_module}</h1>
                  <Badge variant="outline" className="font-mono">
                    {module?.code_module}
                  </Badge>
                </div>
                <p className="text-muted-foreground">Détail du module</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-3/20">
                <BookOpen className="h-6 w-6 text-chart-3" />
              </div>
              <div>
                <CardTitle className="text-lg">{module?.code_module}</CardTitle>
                <Badge variant="secondary">
                  {module?.statut === 'Actif' ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>
                  {module?.enseignant
                    ? `${module.enseignant.prenom_enseignant} ${module.enseignant.nom_enseignant}`
                    : 'Non assigné'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Award className="h-4 w-4 text-muted-foreground" />
                <span>{module?.credits_ects || 0} crédits ECTS</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Semestre {module?.semestre}</span>
              </div>
            </div>
            <div className="border-t border-border pt-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{module?.credits_ects || 0}</p>
                  <p className="text-xs text-muted-foreground">Crédits</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{module?.coefficient_module || 0}</p>
                  <p className="text-xs text-muted-foreground">Coefficient</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Moyenne du module</CardDescription>
                <CardTitle className={`text-3xl ${averageGrade >= 10 ? 'text-green-500' : 'text-red-500'}`}>
                  {averageGrade.toFixed(2)}/20
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Taux de réussite</CardDescription>
                <CardTitle className="text-3xl text-chart-1">{passRate.toFixed(1)}%</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Étudiants évalués</CardDescription>
                <CardTitle className="text-3xl">{module?.notes.length || 0}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Notes du module</CardTitle>
              <CardDescription>Liste des notes des étudiants pour ce module</CardDescription>
            </CardHeader>
            <CardContent>
              {(module?.notes.length || 0) === 0 ? (
                <p className="py-8 text-center text-muted-foreground">Aucune note enregistrée pour ce module.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Étudiant</TableHead>
                      <TableHead>Matricule</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {module?.notes.map((grade) => (
                      <TableRow key={grade.id_note}>
                        <TableCell>
                          {grade.etudiant.prenom_etudiant} {grade.etudiant.nom_etudiant}
                        </TableCell>
                        <TableCell className="font-mono">{grade.etudiant.numero_matricule}</TableCell>
                        <TableCell>{grade.type_evaluation}</TableCell>
                        <TableCell className={`font-bold ${grade.note_obtenue >= 10 ? 'text-green-500' : 'text-red-500'}`}>
                          {grade.note_obtenue.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={grade.note_obtenue >= 10 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}>
                            {grade.note_obtenue >= 10 ? 'Validé' : 'Non validé'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
