'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, MoreHorizontal, Eye, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { api, type ApiGrade, type ApiModule, type ApiStudent } from '@/lib/api';

const statusColors = {
  Valide: 'bg-green-500/10 text-green-500',
  Supprimee: 'bg-red-500/10 text-red-500',
};

export default function GradesPage() {
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [grades, setGrades] = useState<ApiGrade[]>([]);
  const [students, setStudents] = useState<ApiStudent[]>([]);
  const [modules, setModules] = useState<ApiModule[]>([]);

  const loadData = async () => {
    const [gradesData, studentsData, modulesData] = await Promise.all([
      api.listGrades(),
      api.listStudents(),
      api.listModules(),
    ]);
    setGrades(gradesData);
    setStudents(studentsData);
    setModules(modulesData);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredGrades = useMemo(() => grades.filter((grade) => {
    const student = students.find((s) => s.id_etudiant === grade.id_etudiant);
    const module = modules.find((m) => m.id_module === grade.id_module);
    
    const matchesSearch =
      student?.prenom_etudiant.toLowerCase().includes(search.toLowerCase()) ||
      student?.nom_etudiant.toLowerCase().includes(search.toLowerCase()) ||
      student?.numero_matricule.toLowerCase().includes(search.toLowerCase()) ||
      module?.nom_module.toLowerCase().includes(search.toLowerCase());
    
    const matchesModule = moduleFilter === 'all' || grade.id_module === moduleFilter;
    
    return matchesSearch && matchesModule;
  }), [grades, moduleFilter, modules, search, students]);

  const averageGrade = grades.length > 0
    ? grades.reduce((acc, g) => acc + g.note_obtenue, 0) / grades.length
    : 0;

  const passRate = grades.length > 0
    ? (grades.filter((g) => g.note_obtenue >= 10).length / grades.length) * 100
    : 0;

  const onDelete = async (id: string) => {
    await api.deleteGrade(id);
    await loadData();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notes</h1>
        </div>
        <Link href="/grades/create">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Saisir des notes
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Notes</CardDescription>
            <CardTitle className="text-3xl">{grades.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Moyenne Générale</CardDescription>
            <CardTitle className={`text-3xl ${averageGrade >= 10 ? 'text-green-500' : 'text-red-500'}`}>
              {averageGrade.toFixed(2)}/20
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Taux de Réussite</CardDescription>
            <CardTitle className="text-3xl text-chart-1">
              {passRate.toFixed(1)}%
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>En Attente</CardDescription>
            <CardTitle className="text-3xl text-yellow-500">
              0
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Liste des notes</CardTitle>
              <CardDescription>
                {filteredGrades.length} note(s) trouvée(s)
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 md:flex-row">
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrer par module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les modules</SelectItem>
                  {modules.map((module) => (
                    <SelectItem key={module.id_module} value={module.id_module}>
                      {module.code_module} - {module.nom_module}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Étudiant</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Résultat</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGrades.map((grade) => {
                const student = students.find((s) => s.id_etudiant === grade.id_etudiant);
                const module = modules.find((m) => m.id_module === grade.id_module);
                return (
                  <TableRow key={grade.id_note}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                          {student?.prenom_etudiant?.[0]}{student?.nom_etudiant?.[0]}
                        </div>
                        <div>
                          <p className="font-medium">
                            {student?.prenom_etudiant} {student?.nom_etudiant}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {student?.numero_matricule}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{module?.nom_module}</p>
                        <p className="text-xs text-muted-foreground">{module?.code_module}</p>
                      </div>
                    </TableCell>
                    <TableCell>{grade.type_evaluation}</TableCell>
                    <TableCell>{grade.date_saisie}</TableCell>
                    <TableCell className={`font-bold ${grade.note_obtenue >= 10 ? 'text-green-500' : 'text-red-500'}`}>
                      {grade.note_obtenue.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {grade.note_obtenue >= 10 ? (
                        <div className="flex items-center gap-1 text-green-500">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">Admis</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-500">
                          <XCircle className="h-4 w-4" />
                          <span className="text-sm">Ajourné</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[grade.statut]} variant="secondary">
                        {grade.statut}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/grades/${grade.id_note}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Voir détails
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Pencil className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => onDelete(grade.id_note)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
