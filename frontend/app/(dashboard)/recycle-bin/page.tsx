'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, RotateCcw, Users, BookOpen, GraduationCap, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { api, type TrashPayload } from '@/lib/api';

export default function RecycleBinPage() {
  const [deletedItems, setDeletedItems] = useState<TrashPayload>({
    students: [],
    teachers: [],
    modules: [],
    grades: [],
  });

  const loadTrash = async () => {
    setDeletedItems(await api.getTrash());
  };

  useEffect(() => {
    loadTrash();
  }, []);

  const restoreItem = async (entity: 'etudiants' | 'enseignants' | 'modules' | 'notes', id: string) => {
    await api.restoreTrashItem(entity, id);
    await loadTrash();
  };

  const deleteItemForever = async (entity: 'etudiants' | 'enseignants' | 'modules' | 'notes', id: string) => {
    await api.deleteTrashItem(entity, id);
    await loadTrash();
  };

  const emptyTrash = async () => {
    await api.emptyTrash();
    await loadTrash();
  };

  const totalDeleted = Object.values(deletedItems).reduce((acc, items) => acc + items.length, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Corbeille</h1>
          <p className="text-muted-foreground">Éléments supprimés - Restaurer ou supprimer définitivement</p>
        </div>
        {totalDeleted > 0 && (
          <Button variant="destructive" size="sm" onClick={emptyTrash}>
            <Trash2 className="mr-2 h-4 w-4" />
            Vider la corbeille
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <CardDescription>Étudiants</CardDescription>
            </div>
            <CardTitle className="text-2xl">{deletedItems.students.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <CardDescription>Enseignants</CardDescription>
            </div>
            <CardTitle className="text-2xl">{deletedItems.teachers.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <CardDescription>Modules</CardDescription>
            </div>
            <CardTitle className="text-2xl">{deletedItems.modules.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
              <CardDescription>Notes</CardDescription>
            </div>
            <CardTitle className="text-2xl">{deletedItems.grades.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Warning Banner */}
      <div className="flex items-center gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
        <AlertTriangle className="h-5 w-5 text-yellow-500" />
        <div>
          <p className="font-medium text-yellow-500">Attention</p>
          <p className="text-sm text-muted-foreground">
            Les éléments de la corbeille seront automatiquement supprimés après 30 jours.
          </p>
        </div>
      </div>

      {/* Tabs for different item types */}
      <Tabs defaultValue="students" className="space-y-4">
        <TabsList>
          <TabsTrigger value="students" className="gap-2">
            <Users className="h-4 w-4" />
            Étudiants
            {deletedItems.students.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {deletedItems.students.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="teachers" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Enseignants
          </TabsTrigger>
          <TabsTrigger value="modules" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Modules
            {deletedItems.modules.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {deletedItems.modules.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="grades" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Notes
          </TabsTrigger>
        </TabsList>

        {/* Students Tab */}
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Étudiants supprimés</CardTitle>
              <CardDescription>
                {deletedItems.students.length} étudiant(s) dans la corbeille
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deletedItems.students.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Trash2 className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">Aucun étudiant dans la corbeille</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matricule</TableHead>
                      <TableHead>Nom complet</TableHead>
                      <TableHead>Département</TableHead>
                      <TableHead>Supprimé le</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletedItems.students.map((student) => (
                      <TableRow key={student.id_etudiant}>
                        <TableCell className="font-mono text-sm">
                          {student.numero_matricule}
                        </TableCell>
                        <TableCell>
                          {student.prenom_etudiant} {student.nom_etudiant}
                        </TableCell>
                        <TableCell>{student.filiere}</TableCell>
                        <TableCell className="text-muted-foreground">
                          -
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => restoreItem('etudiants', student.id_etudiant)}>
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Restaurer
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => deleteItemForever('etudiants', student.id_etudiant)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teachers Tab */}
        <TabsContent value="teachers">
          <Card>
            <CardHeader>
              <CardTitle>Enseignants supprimés</CardTitle>
              <CardDescription>
                {deletedItems.teachers.length} enseignant(s) dans la corbeille
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Trash2 className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">Aucun enseignant dans la corbeille</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules">
          <Card>
            <CardHeader>
              <CardTitle>Modules supprimés</CardTitle>
              <CardDescription>
                {deletedItems.modules.length} module(s) dans la corbeille
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deletedItems.modules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Trash2 className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">Aucun module dans la corbeille</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Département</TableHead>
                      <TableHead>Supprimé le</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletedItems.modules.map((module) => (
                      <TableRow key={module.id_module}>
                        <TableCell className="font-mono text-sm">
                          {module.code_module}
                        </TableCell>
                        <TableCell>{module.nom_module}</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell className="text-muted-foreground">
                          -
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => restoreItem('modules', module.id_module)}>
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Restaurer
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => deleteItemForever('modules', module.id_module)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grades Tab */}
        <TabsContent value="grades">
          <Card>
            <CardHeader>
              <CardTitle>Notes supprimées</CardTitle>
              <CardDescription>
                {deletedItems.grades.length} note(s) dans la corbeille
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Trash2 className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">Aucune note dans la corbeille</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
