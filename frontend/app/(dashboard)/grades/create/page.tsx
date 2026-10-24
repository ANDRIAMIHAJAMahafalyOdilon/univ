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
import { ArrowLeft, Save, Calculator } from 'lucide-react';
import { api, type ApiModule, type ApiStudent } from '@/lib/api';

export default function CreateGradePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<ApiStudent[]>([]);
  const [modules, setModules] = useState<ApiModule[]>([]);
  const [studentId, setStudentId] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [evaluationType, setEvaluationType] = useState<'Examen' | 'TP' | 'Projet' | 'Rattrapage' | 'Controle Continu'>('Examen');
  const [controlNote, setControlNote] = useState<string>('');
  const [examNote, setExamNote] = useState<string>('');

  useEffect(() => {
    Promise.all([api.listStudents(), api.listModules()]).then(([studentsData, modulesData]) => {
      setStudents(studentsData);
      setModules(modulesData);
    });
  }, []);

  const calculateFinalNote = () => {
    const control = parseFloat(controlNote) || 0;
    const exam = parseFloat(examNote) || 0;
    return ((control * 0.4) + (exam * 0.6)).toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.createGrade({
        id_etudiant: studentId,
        id_module: moduleId,
        note_obtenue: Number(calculateFinalNote()),
        type_evaluation: evaluationType,
        date_saisie: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
      router.push('/grades');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/grades">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Saisie de notes</h1>
          <p className="text-muted-foreground">Enregistrer une nouvelle note</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Student & Module Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Sélection</CardTitle>
              <CardDescription>Choisir l&apos;étudiant et le module</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="student">Étudiant</Label>
                <Select required value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un étudiant" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id_etudiant} value={student.id_etudiant}>
                        {student.numero_matricule} - {student.prenom_etudiant} {student.nom_etudiant}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="module">Module</Label>
                <Select required value={moduleId} onValueChange={setModuleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un module" />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map((module) => (
                      <SelectItem key={module.id_module} value={module.id_module}>
                        {module.code_module} - {module.nom_module}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="semester">Type d&apos;évaluation</Label>
                  <Select value={evaluationType} onValueChange={(v) => setEvaluationType(v as typeof evaluationType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Examen">Examen</SelectItem>
                      <SelectItem value="TP">TP</SelectItem>
                      <SelectItem value="Projet">Projet</SelectItem>
                      <SelectItem value="Rattrapage">Rattrapage</SelectItem>
                      <SelectItem value="Controle Continu">Controle Continu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="academicYear">Date de saisie</Label>
                  <Input id="academicYear" disabled value={new Date().toLocaleDateString('fr-FR')} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes Input */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Saisir les notes de l&apos;étudiant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="controlNote">Note de contrôle continu (40%)</Label>
                <Input
                  id="controlNote"
                  type="number"
                  min="0"
                  max="20"
                  step="0.25"
                  placeholder="0.00"
                  value={controlNote}
                  onChange={(e) => setControlNote(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="examNote">Note d&apos;examen (60%)</Label>
                <Input
                  id="examNote"
                  type="number"
                  min="0"
                  max="20"
                  step="0.25"
                  placeholder="0.00"
                  value={examNote}
                  onChange={(e) => setExamNote(e.target.value)}
                  required
                />
              </div>

              {/* Calculated Final Note */}
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calculator className="h-4 w-4" />
                  <span>Note finale calculée</span>
                </div>
                <p className={`mt-1 text-3xl font-bold ${parseFloat(calculateFinalNote()) >= 10 ? 'text-green-500' : 'text-red-500'}`}>
                  {calculateFinalNote()}/20
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Formule: (Contrôle × 0.4) + (Examen × 0.6)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select defaultValue="validated" disabled>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="validated">Validée</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  La note est créée au statut « Valide » — visible dans la colonne Statut du tableau.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-4">
          <Link href="/grades">
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
