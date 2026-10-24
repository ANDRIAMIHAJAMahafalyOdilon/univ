'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { API_BASE_URL, getAuthToken } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type SchemaPayload = {
  existing_tables: string[];
};

const expectedGroups: Record<string, string[]> = {
  etablissements: ['institution'],
  utilisateurs: ['users', 'enseignant', 'etudiant'],
  cursus: ['annee_universitaire', 'parcours', 'niveau', 'module', 'matiere', 'enseignant_matiere'],
  notes: ['session_examen', 'note', 'note_history'],
  resultats: ['deliberation', 'decision_jury', 'mention'],
  suivi_systeme: ['audit_log', 'notification'],
};

const expectedDropdownOptions: Record<string, Record<string, string[]>> = {
  users: { role: ['super_admin', 'admin', 'it_support', 'gestionnaire_notes', 'enseignant', 'etudiant'], statut: ['Actif', 'Supprime'] },
  enseignant: { statut: ['Actif', 'Supprime'] },
  etudiant: { statut: ['Actif', 'Suspendu', 'Redoublant', 'Diplome', 'Abandon', 'Exclu', 'Transfere', 'Supprime'] },
  annee_universitaire: { statut: ['Actif', 'Supprime'] },
  parcours: { statut: ['Actif', 'Supprime'] },
  niveau: { statut: ['Actif', 'Supprime'] },
  module: { statut: ['Actif', 'Supprime'] },
  matiere: { statut: ['Actif', 'Supprime'] },
  session_examen: { type_session: ['Normale', 'Rattrapage', 'Speciale'], statut: ['Actif', 'Supprime'] },
  note: {
    type_evaluation: ['Examen', 'TP', 'Projet', 'Rattrapage', 'Controle_Continu'],
    statut: ['Valide', 'Supprimee'],
  },
  deliberation: { est_valide: ['true', 'false'] },
  decision_jury: { decision: ['Admis', 'Ajourne', 'Redoublement', 'Exclusion'] },
  mention: { mention: ['Passable', 'Assez_Bien', 'Bien', 'Tres_Bien', 'Excellence'] },
  notification: { type: ['Info', 'Alerte', 'Systeme'], lu: ['true', 'false'] },
};

export default function SchemaPage() {
  const [data, setData] = useState<SchemaPayload | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>('utilisateurs');
  const [selectedTable, setSelectedTable] = useState<string>('users');
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/system/schema`, {
      cache: 'no-store',
      headers: getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {},
    })
      .then((res) => res.json())
      .then(setData);
  }, []);

  const existingTables = data?.existing_tables || [];
  const expectedTables = Object.values(expectedGroups).flat();
  const missingTables = expectedTables.filter((t) => !existingTables.includes(t));
  const extraTables = existingTables.filter((t) => !expectedTables.includes(t));

  const groups: Array<{ key: string; title: string; tables: string[] }> = [
    { key: 'etablissements', title: 'Établissements', tables: expectedGroups.etablissements },
    { key: 'utilisateurs', title: 'Utilisateurs', tables: expectedGroups.utilisateurs },
    { key: 'cursus', title: 'Cursus', tables: expectedGroups.cursus },
    { key: 'notes', title: 'Notes', tables: expectedGroups.notes },
    { key: 'resultats', title: 'Résultats', tables: expectedGroups.resultats },
    { key: 'suivi_systeme', title: 'Suivi Système', tables: expectedGroups.suivi_systeme },
  ];
  const focusTables = expectedGroups[selectedGroup] || [];
  const focusDropdowns = expectedDropdownOptions[selectedTable] || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Structure des tables</h1>
        <p className="text-muted-foreground">
          Forme demandée: Utilisateurs, Cursus, Notes, Résultats, Suivi Système.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contrôle global</CardTitle>
          <CardDescription>Validation exacte de la forme demandée</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="mb-1 text-sm text-muted-foreground">Dropdown Groupe</p>
              <Select
                value={selectedGroup}
                onValueChange={(v) => {
                  setSelectedGroup(v);
                  setSelectedTable(expectedGroups[v][0]);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="etablissements">Établissements</SelectItem>
                  <SelectItem value="utilisateurs">Utilisateurs</SelectItem>
                  <SelectItem value="cursus">Cursus</SelectItem>
                  <SelectItem value="notes">Notes</SelectItem>
                  <SelectItem value="resultats">Résultats</SelectItem>
                  <SelectItem value="suivi_systeme">Suivi Système</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="mb-1 text-sm text-muted-foreground">Dropdown Table</p>
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {focusTables.map((table) => (
                    <SelectItem key={table} value={table}>
                      {table}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border p-3">
            <p className="mb-2 text-sm text-muted-foreground">Dropdowns de la table sélectionnée ({selectedTable})</p>
            <div className="space-y-2">
              {Object.entries(focusDropdowns).map(([field, options]) => {
                const key = `${selectedTable}.${field}`;
                const value = selectedOptions[key] || options[0] || '';
                return (
                  <div key={key} className="flex items-center gap-2">
                    <Badge variant="secondary">{field}</Badge>
                    <Select value={value} onValueChange={(v) => setSelectedOptions((prev) => ({ ...prev, [key]: v }))}>
                      <SelectTrigger className="w-[220px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
              {!Object.keys(focusDropdowns).length && (
                <span className="text-sm text-muted-foreground">Aucun dropdown requis</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant={missingTables.length ? 'destructive' : 'default'}>
              Tables manquantes: {missingTables.length}
            </Badge>
            <Badge variant={extraTables.length ? 'destructive' : 'default'}>
              Tables en trop: {extraTables.length}
            </Badge>
          </div>
          {Boolean(missingTables.length) && (
            <p className="text-sm text-destructive">Manquantes: {missingTables.join(', ')}</p>
          )}
          {Boolean(extraTables.length) && (
            <p className="text-sm text-destructive">En trop: {extraTables.join(', ')}</p>
          )}
        </CardContent>
      </Card>

      {groups.map((group) => (
        <Card key={group.key}>
          <CardHeader>
            <CardTitle>{group.title}</CardTitle>
            <CardDescription>
              {group.tables.join(', ')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Table</TableHead>
                  <TableHead>État</TableHead>
                  <TableHead>Dropdowns</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.tables.map((table) => {
                  const exists = existingTables.includes(table);
                  const dropdowns = expectedDropdownOptions[table] || {};
                  return (
                    <TableRow key={table}>
                      <TableCell className="font-mono text-sm"><Link href={`/tables/${table}`} className="underline-offset-4 hover:underline">{table}</Link></TableCell>
                      <TableCell>
                        <Badge variant={exists ? 'default' : 'destructive'}>
                          {exists ? 'EXISTE' : 'MANQUANTE'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          {Object.entries(dropdowns).map(([field, options]) => {
                            const key = `${table}.${field}`;
                            const value = selectedOptions[key] || options[0] || '';
                            return (
                              <div key={key} className="flex items-center gap-2">
                                <Badge variant="secondary">{field}</Badge>
                                <Select
                                  value={value}
                                  onValueChange={(v) =>
                                    setSelectedOptions((prev) => ({ ...prev, [key]: v }))
                                  }
                                >
                                  <SelectTrigger className="w-[220px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {options.map((option) => (
                                      <SelectItem key={option} value={option}>
                                        {option}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          })}
                          {!Object.keys(dropdowns).length && (
                            <span className="text-sm text-muted-foreground">Aucun dropdown requis</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
