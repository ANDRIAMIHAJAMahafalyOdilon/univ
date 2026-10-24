'use client';

import { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api, type ApiMention } from '@/lib/api';

export default function MentionsPage() {
  const [rows, setRows] = useState<ApiMention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { api.listMentions().then(setRows).catch((e) => setError(e instanceof Error ? e.message : 'Impossible de charger les mentions.')).finally(() => setLoading(false)); }, []);
  const levels = ['Passable', 'Assez_Bien', 'Bien', 'Tres_Bien', 'Excellence'];

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold tracking-tight">Mentions attribuées</h1><p className="text-sm text-muted-foreground">La mention est attribuée automatiquement selon la moyenne de la délibération.</p></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{levels.map((level, index) => <StatCard key={level} title={level.replaceAll('_', ' ')} value={loading ? '—' : String(rows.filter((r) => r.mention === level).length)} icon={Award} delay={index * 0.04} />)}</div>
    {error && <p role="alert" className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive">{error}</p>}
    <Card><CardContent className="overflow-x-auto p-0"><Table>
      <TableHeader><TableRow><TableHead>Étudiant</TableHead><TableHead>Module</TableHead><TableHead>Moyenne</TableHead><TableHead>Mention</TableHead><TableHead>Intervalle</TableHead></TableRow></TableHeader>
      <TableBody>
        {loading && <TableRow><TableCell colSpan={5}>Chargement…</TableCell></TableRow>}
        {!loading && rows.map((row) => <TableRow key={row.id}><TableCell>{row.deliberation.etudiant.nom_etudiant} {row.deliberation.etudiant.prenom_etudiant}</TableCell><TableCell>{row.deliberation.note.module.code_module} · {row.deliberation.note.module.nom_module}</TableCell><TableCell>{row.deliberation.moyenne_generale.toFixed(2)} / 20</TableCell><TableCell><Badge variant="secondary">{row.mention.replaceAll('_', ' ')}</Badge></TableCell><TableCell>{row.note_min ?? '—'} – {row.note_max ?? '—'} / 20</TableCell></TableRow>)}
        {!loading && !rows.length && <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Aucune mention attribuée. Les mentions apparaîtront après le calcul des délibérations.</TableCell></TableRow>}
      </TableBody>
    </Table></CardContent></Card>
  </div>;
}
