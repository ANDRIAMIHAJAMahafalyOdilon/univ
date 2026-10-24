'use client';

import { useEffect, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api, downloadFile, type ApiModule, type ApiStudent } from '@/lib/api';

export default function ReportsRelevesPage() {
  const [students, setStudents] = useState<ApiStudent[]>([]);
  const [modules, setModules] = useState<ApiModule[]>([]);
  const [studentId, setStudentId] = useState('');
  const [moduleId, setModuleId] = useState('');

  useEffect(() => {
    Promise.all([api.listStudents(), api.listModules()]).then(([s, m]) => {
      setStudents(s);
      setModules(m);
      setStudentId(s[0]?.id_etudiant ?? '');
      setModuleId(m[0]?.id_module ?? '');
    });
  }, []);

  const openStudentPdf = () => {
    const student = students.find((s) => s.id_etudiant === studentId);
    downloadFile(
      `/api/reports/student/${encodeURIComponent(studentId)}/pdf`,
      `releve-${student?.numero_matricule ?? studentId}.pdf`
    );
  };

  const openModulePdf = () => {
    const module = modules.find((m) => m.id_module === moduleId);
    downloadFile(
      `/api/reports/module/${encodeURIComponent(moduleId)}/pdf`,
      `module-${module?.code_module ?? moduleId}.pdf`
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Génération de Relevés de Notes</h1>
        <p className="text-muted-foreground">Générer les PDF officiels étudiant/module depuis les endpoints backend.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Étudiants disponibles" value={String(students.length)} icon={FileText} />
        <StatCard title="Modules disponibles" value={String(modules.length)} icon={FileText} delay={0.05} />
        <StatCard title="Formats" value="PDF" icon={FileText} delay={0.1} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardContent className="space-y-4 p-6">
            <Label>Étudiant</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Choisir un étudiant" /></SelectTrigger>
              <SelectContent>
                {students.map((s) => <SelectItem key={s.id_etudiant} value={s.id_etudiant}>{s.numero_matricule} - {s.nom_etudiant} {s.prenom_etudiant}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button className="rounded-xl w-full" disabled={!studentId} onClick={openStudentPdf}>
              <Download className="mr-2 h-4 w-4" /> Télécharger relevé étudiant
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="space-y-4 p-6">
            <Label>Module</Label>
            <Select value={moduleId} onValueChange={setModuleId}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Choisir un module" /></SelectTrigger>
              <SelectContent>
                {modules.map((m) => <SelectItem key={m.id_module} value={m.id_module}>{m.code_module} - {m.nom_module}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="secondary" className="rounded-xl w-full" disabled={!moduleId} onClick={openModulePdf}>
              <Download className="mr-2 h-4 w-4" /> Télécharger relevé module
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

