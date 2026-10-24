'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { api, type ApiAcademicParcours, type ApiTeacher } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const SEL_NONE = '__none__';

const NIVEAU_OPTIONS = ['Licence 1', 'Licence 2', 'Licence 3', 'Maîtrise 1', 'Maîtrise 2'] as const;

const SEMESTRES = Array.from({ length: 10 }, (_, i) => ({
  value: `S${i + 1}`,
  label: `Semestre ${i + 1}`,
}));

export default function CreateModulePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<ApiTeacher[]>([]);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [credits, setCredits] = useState('6');
  const [coefficient, setCoefficient] = useState('2');
  const [semester, setSemester] = useState('S1');
  const [teacherId, setTeacherId] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');

  const [parcoursId, setParcoursId] = useState<string | null>(null);
  const [niveauLibelle, setNiveauLibelle] = useState<string | null>(null);
  const [parcours, setParcours] = useState<ApiAcademicParcours[]>([]);

  useEffect(() => {
    Promise.all([api.listTeachers(), api.listAcademicParcours()]).then(([t, p]) => {
      setTeachers(t);
      setParcours(p);
    });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get('edit');
    if (!editId) return;
    api.listModules().then((mods) => {
      const m = mods.find((x) => x.id_module === editId);
      if (!m) return;
      setEditingId(m.id_module);
      setCode(m.code_module);
      setName(m.nom_module);
      setCredits(String(m.credits_ects));
      setCoefficient(String(m.coefficient_module));
      setSemester(m.semestre);
      setTeacherId(m.id_enseignant_responsable);
      setAcademicYear(m.annee_academique);
      setParcoursId(m.parcours_id ?? null);
      setNiveauLibelle(m.niveau_libelle ?? null);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      toast({ variant: 'destructive', title: 'Champs requis', description: 'Code et nom du module sont obligatoires.' });
      return;
    }
    if (!teacherId) {
      toast({ variant: 'destructive', title: 'Enseignant requis', description: 'Sélectionnez un enseignant responsable.' });
      return;
    }
    const creditsNum = Number(credits);
    const coeffNum = Number(coefficient);
    if (!Number.isInteger(creditsNum) || creditsNum <= 0) {
      toast({ variant: 'destructive', title: 'Crédits invalides', description: 'Les crédits ECTS doivent être un entier positif.' });
      return;
    }
    if (!Number.isInteger(coeffNum) || coeffNum <= 0) {
      toast({ variant: 'destructive', title: 'Coefficient invalide', description: 'Le coefficient doit être un entier positif.' });
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        code_module: code.trim(),
        nom_module: name.trim(),
        credits_ects: creditsNum,
        coefficient_module: coeffNum,
        semestre: semester,
        annee_academique: academicYear,
        id_enseignant_responsable: teacherId,
        parcours_id: parcoursId,
        niveau_id: null,
        niveau_libelle: niveauLibelle,
      } as const;
      if (editingId) {
        await api.updateModule(editingId, payload);
      } else {
        await api.createModule(payload);
      }
      router.push('/modules');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/modules">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{editingId ? 'Modifier le module' : 'Nouveau module'}</h1>
          <p className="text-muted-foreground">
            {editingId ? "Mettre à jour le module d'enseignement" : "Créer un nouveau module d'enseignement"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Module Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informations du module</CardTitle>
              <CardDescription>Données de base du module</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code du module</Label>
                <Input id="code" placeholder="INF301" required value={code} onChange={(e) => setCode(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nom du module</Label>
                <Input id="name" placeholder="Programmation Avancée" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="credits">Crédits ECTS</Label>
                  <Input id="credits" type="number" min="1" max="30" placeholder="6" required value={credits} onChange={(e) => setCredits(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coefficient">Coefficient</Label>
                  <Input id="coefficient" type="number" min="1" max="10" step="1" placeholder="3" required value={coefficient} onChange={(e) => setCoefficient(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester">Semestre</Label>
                <Select required value={semester} onValueChange={setSemester}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEMESTRES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Academic Details */}
          <Card>
            <CardHeader>
              <CardTitle>Détails académiques</CardTitle>
              <CardDescription>Affectation et année</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="teacher">Enseignant responsable</Label>
                <Select required value={teacherId} onValueChange={setTeacherId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un enseignant" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id_enseignant} value={teacher.id_enseignant}>
                        {teacher.prenom_enseignant} {teacher.nom_enseignant} - {teacher.departement}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="parcours">Parcours</Label>
                <Select value={parcoursId ?? SEL_NONE} onValueChange={(v) => setParcoursId(v === SEL_NONE ? null : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un parcours" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SEL_NONE}>— Aucun —</SelectItem>
                    {parcours.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="niveau">Niveau</Label>
                <Select
                  value={niveauLibelle ?? SEL_NONE}
                  onValueChange={(v) => setNiveauLibelle(v === SEL_NONE ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SEL_NONE}>— Aucun —</SelectItem>
                    {NIVEAU_OPTIONS.map((n) => (
                      <SelectItem key={n} value={n}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Année universitaire</Label>
                <Select value={academicYear} onValueChange={setAcademicYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024-2025">2024-2025</SelectItem>
                    <SelectItem value="2025-2026">2025-2026</SelectItem>
                    <SelectItem value="2026-2027">2026-2027</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-4">
          <Link href="/modules">
            <Button variant="outline" type="button">Annuler</Button>
          </Link>
          <Button type="submit" disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </div>
  );
}