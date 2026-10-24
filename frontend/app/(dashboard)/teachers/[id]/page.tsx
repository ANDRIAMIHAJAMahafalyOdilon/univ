'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Layers, Mail, Pencil, Phone } from 'lucide-react';

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
import { api, type ApiModule, type ApiTeacher } from '@/lib/api';

type TeacherDetail = ApiTeacher & {
  modules?: ApiModule[];
  matieres?: Array<{ matiere: { id: string; code: string; nom: string } }>;
};

export default function TeacherDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  const [data, setData] = useState<TeacherDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const row = (await api.getTeacher(id)) as TeacherDetail;
      setData(row);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!id) return null;

  if (!loading && !data) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-lg font-medium">Enseignant introuvable</p>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/teachers">Retour</Link>
        </Button>
      </div>
    );
  }

  const initials = data
    ? `${data.prenom_enseignant?.[0] ?? ''}${data.nom_enseignant?.[0] ?? ''}`.toUpperCase()
    : '';

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" className="rounded-xl" asChild>
            <Link href="/teachers" aria-label="Retour">
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
                <Skeleton className="h-8 w-48 rounded-lg" />
              ) : data ? (
                <>
                  <h1 className="page-title">
                    {data.prenom_enseignant} {data.nom_enseignant}
                  </h1>
                  <p className="text-muted-foreground text-sm">{data.departement}</p>
                  <div className="mt-2">
                    <Badge variant="secondary" className="rounded-lg">
                      {data.statut === 'Actif' ? 'Actif' : data.statut}
                    </Badge>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
        <Button variant="outline" className="rounded-xl" asChild>
          <Link href={`/teachers/create?edit=${encodeURIComponent(id)}`}>
            <Pencil className="mr-2 h-4 w-4" />
            Modifier
          </Link>
        </Button>
      </div>

      {data ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-border/60">
                <CardHeader className="pb-2">
                  <CardDescription>Modules en responsabilité</CardDescription>
                  <CardTitle className="text-3xl tabular-nums">{data.modules?.length ?? 0}</CardTitle>
                </CardHeader>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Card className="border-border/60">
                <CardHeader className="pb-2">
                  <CardDescription>Matières liées</CardDescription>
                  <CardTitle className="text-3xl tabular-nums">{data.matieres?.length ?? 0}</CardTitle>
                </CardHeader>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-border/60">
                <CardHeader className="pb-2">
                  <CardDescription>Contact</CardDescription>
                  <CardTitle className="text-sm font-normal leading-relaxed">
                    {data.email_enseignant || '—'}
                  </CardTitle>
                </CardHeader>
              </Card>
            </motion.div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Coordonnées</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>{data.email_enseignant || '—'}</span>
                </div>
                <div className="flex gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>{data.contact_enseignant || '—'}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="h-4 w-4" />
                  Modules attribués
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {!data.modules?.length ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">Aucun module listé.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Nom</TableHead>
                        <TableHead>Semestre</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.modules.map((m) => (
                        <TableRow key={m.id_module}>
                          <TableCell className="font-mono text-xs">{m.code_module}</TableCell>
                          <TableCell>
                            <Link className="text-primary hover:underline" href={`/modules/${m.id_module}`}>
                              {m.nom_module}
                            </Link>
                          </TableCell>
                          <TableCell>{m.semestre}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-dashed border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="h-4 w-4" />
                Matières (liaisons)
              </CardTitle>
              <CardDescription>Rôle complémentaire via la table enseignant_matiere.</CardDescription>
            </CardHeader>
            <CardContent>
              {!data.matieres?.length ? (
                <p className="text-sm text-muted-foreground">Aucune matière liée.</p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {data.matieres.map((em) => (
                    <li key={em.matiere.id}>
                      <Badge variant="outline" className="rounded-lg font-normal">
                        {em.matiere.code} — {em.matiere.nom}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
