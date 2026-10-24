'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, ExternalLink, Search, Trash2 } from 'lucide-react';
import { api, type ApiMatiere, type ApiTeacher } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const tableLoaders: Record<string, () => Promise<unknown[]>> = {
  institution: () => api.listInstitutions(),
  users: () => api.listUsers(),
  enseignant: () => api.listTeachers(),
  etudiant: () => api.listStudents(),
  annee_universitaire: () => api.listCursusAnnees(true),
  parcours: () => api.listCursusParcours(true),
  niveau: () => api.listCursusNiveaux({ all: true }),
  module: () => api.listModules(),
  matiere: () => api.listMatieres(),
  enseignant_matiere: () => api.listEnseignantMatieres(),
  session_examen: () => api.listSessionsExamen(),
  note: () => api.listGrades(),
  note_history: () => api.listNoteHistory({ limit: 1000 }),
  deliberation: () => api.listDeliberations(),
  decision_jury: () => api.listDecisionsJury(),
  mention: () => api.listMentions(),
  audit_log: () => api.listAuditLogs({ limit: 1000 }),
  notification: () => api.listNotifications({ limit: 1000 }),
};

const manageLinks: Record<string, { href: string; label: string }> = {
  institution: { href: '/universites', label: 'Gérer les établissements' },
  users: { href: '/users', label: 'Gérer les comptes' },
  enseignant: { href: '/teachers', label: 'Gérer les enseignants' },
  etudiant: { href: '/students', label: 'Gérer les étudiants' },
  annee_universitaire: { href: '/cursus/annees', label: 'Gérer les années' },
  parcours: { href: '/parcours', label: 'Gérer les parcours' },
  niveau: { href: '/cursus/niveaux', label: 'Gérer les niveaux' },
  module: { href: '/modules', label: 'Gérer les modules' },
  matiere: { href: '/matieres', label: 'Gérer les matières' },
  enseignant_matiere: { href: '/matieres', label: 'Gérer les matières attribuées' },
  session_examen: { href: '/notes/sessions', label: 'Gérer les sessions' },
  note: { href: '/grades', label: 'Gérer les notes' },
  note_history: { href: '/notes/history', label: 'Consulter l’historique' },
  deliberation: { href: '/resultats/deliberations', label: 'Gérer les délibérations' },
  decision_jury: { href: '/resultats/decisions', label: 'Consulter les décisions' },
  mention: { href: '/resultats/mentions', label: 'Consulter les mentions' },
  audit_log: { href: '/suivi-systeme/audit-log', label: 'Consulter le journal' },
  notification: { href: '/suivi-systeme/notifications', label: 'Gérer les notifications' },
};

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (typeof value === 'object') {
    if (Array.isArray(value)) return value.map(displayValue).join(', ');
    return Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !key.startsWith('_'))
      .map(([key, item]) => `${key}: ${displayValue(item)}`)
      .join(' · ');
  }
  return String(value);
}

export default function TableDetailPage() {
  const { name } = useParams<{ name: string }>();
  const searchParams = useSearchParams();
  const highlight = searchParams.get('highlight');
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teachers, setTeachers] = useState<ApiTeacher[]>([]);
  const [subjects, setSubjects] = useState<ApiMatiere[]>([]);
  const [teacherId, setTeacherId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    const loader = tableLoaders[name];
    if (!loader) { setError(`La table « ${name} » n’est pas prise en charge.`); setLoading(false); return; }
    setLoading(true);
    try {
      const result = await loader();
      setRows(result.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object'));
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de charger les données de cette table.');
    } finally { setLoading(false); }
  }, [name]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (name !== 'enseignant_matiere') return;
    Promise.all([api.listTeachers(), api.listMatieres()]).then(([teacherRows, subjectRows]) => {
      setTeachers(teacherRows);
      setSubjects(subjectRows);
    }).catch((cause) => setError(cause instanceof Error ? cause.message : 'Impossible de charger les options d’attribution.'));
  }, [name]);

  const addAssignment = async () => {
    if (!teacherId || !subjectId) return;
    setSaving(true);
    try {
      await api.createEnseignantMatiere({ enseignant_id: teacherId, matiere_id: subjectId });
      setTeacherId(''); setSubjectId(''); await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Impossible d’enregistrer cette attribution.'); }
    finally { setSaving(false); }
  };

  const removeAssignment = async (id: string) => {
    try { await api.deleteEnseignantMatiere(id); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Impossible de retirer cette attribution.'); }
  };

  const columns = useMemo(() => {
    const keys = new Set<string>();
    rows.slice(0, 30).forEach((row) => Object.keys(row).forEach((key) => keys.add(key)));
    return [...keys].slice(0, 12);
  }, [rows]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query));
  }, [rows, search]);

  const matchId = (row: Record<string, unknown>) => Object.values(row).some((value) => value === highlight);
  const manage = manageLinks[name];

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><Button asChild variant="ghost" size="sm" className="mb-2 -ml-2"><Link href="/schema"><ArrowLeft className="mr-2 h-4 w-4" />Structure des tables</Link></Button><h1 className="text-2xl font-bold tracking-tight">Table : {name}</h1><p className="text-sm text-muted-foreground">{rows.length} enregistrement(s) · Relations affichées depuis la base universitaire.</p></div>
      {manage && name !== 'enseignant_matiere' && <Button asChild><Link href={manage.href}>{manage.label}<ExternalLink className="ml-2 h-4 w-4" /></Link></Button>}
    </div>
    {error && <p role="alert" className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive">{error}</p>}
    {name === 'enseignant_matiere' && <Card><CardContent className="grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto]">
      <Select value={teacherId} onValueChange={setTeacherId}><SelectTrigger><SelectValue placeholder="Choisir un enseignant" /></SelectTrigger><SelectContent>{teachers.map((teacher) => <SelectItem key={teacher.id_enseignant} value={teacher.id_enseignant}>{teacher.nom_enseignant} {teacher.prenom_enseignant} · {teacher.departement}</SelectItem>)}</SelectContent></Select>
      <Select value={subjectId} onValueChange={setSubjectId}><SelectTrigger><SelectValue placeholder="Choisir une matière" /></SelectTrigger><SelectContent>{subjects.map((subject) => <SelectItem key={subject.id} value={subject.id}>{subject.code} · {subject.nom}</SelectItem>)}</SelectContent></Select>
      <Button onClick={addAssignment} disabled={!teacherId || !subjectId || saving}>{saving ? 'Enregistrement…' : 'Attribuer la matière'}</Button>
    </CardContent></Card>}
    <Card><CardContent className="space-y-4 p-4">
      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher dans les enregistrements…" className="pl-9" /></div>
      <div className="overflow-x-auto rounded-lg border"><Table>
        <TableHeader><TableRow>{columns.map((column) => <TableHead key={column}>{column}</TableHead>)}{name === 'enseignant_matiere' && <TableHead>Actions</TableHead>}</TableRow></TableHeader>
        <TableBody>
          {loading && <TableRow><TableCell colSpan={Math.max(columns.length + (name === 'enseignant_matiere' ? 1 : 0), 1)}>Chargement…</TableCell></TableRow>}
          {!loading && filtered.map((row, index) => <TableRow key={String(row.id ?? row.id_note ?? row.id_etudiant ?? index)} data-state={highlight && matchId(row) ? 'selected' : undefined} className={highlight && matchId(row) ? 'bg-accent' : undefined}>{columns.map((column) => <TableCell key={column} className="max-w-[320px] whitespace-normal">{displayValue(row[column])}</TableCell>)}{name === 'enseignant_matiere' && <TableCell><Button variant="ghost" size="icon" aria-label="Retirer cette attribution" onClick={() => void removeAssignment(String(row.id))}><Trash2 className="h-4 w-4" /></Button></TableCell>}</TableRow>)}
          {!loading && !filtered.length && <TableRow><TableCell colSpan={Math.max(columns.length + (name === 'enseignant_matiere' ? 1 : 0), 1)} className="h-24 text-center text-muted-foreground">Aucun enregistrement trouvé.</TableCell></TableRow>}
        </TableBody>
      </Table></div>
    </CardContent></Card>
  </div>;
}
