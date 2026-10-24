'use client';

import { useEffect, useState } from 'react';
import { Gavel } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api, type ApiDecisionJury } from '@/lib/api';

export default function DecisionsPage() {
  const [rows, setRows] = useState<ApiDecisionJury[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { api.listDecisionsJury().then(setRows).catch((e) => setError(e instanceof Error ? e.message : 'Impossible de charger les décisions.')).finally(() => setLoading(false)); }, []);
  const count = (decision: string) => rows.filter((r) => r.decision === decision).length;

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold tracking-tight">Décisions du jury</h1><p className="text-sm text-muted-foreground">Décisions persistées liées aux délibérations de chaque module.</p></div>
    <div className="grid gap-4 md:grid-cols-4">
      <StatCard title="Décisions" value={loading ? '—' : String(rows.length)} icon={Gavel} />
      <StatCard title="Admis" value={loading ? '—' : String(count('Admis'))} icon={Gavel} delay={0.05} />
      <StatCard title="Ajournés" value={loading ? '—' : String(count('Ajourne'))} icon={Gavel} delay={0.1} />
      <StatCard title="Redoublements" value={loading ? '—' : String(count('Redoublement'))} icon={Gavel} delay={0.15} />
    </div>
    {error && <p role="alert" className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive">{error}</p>}
    <Card><CardContent className="overflow-x-auto p-0"><Table>
      <TableHeader><TableRow><TableHead>Étudiant</TableHead><TableHead>Module</TableHead><TableHead>Moyenne</TableHead><TableHead>Décision</TableHead><TableHead>Prononcée le</TableHead></TableRow></TableHeader>
      <TableBody>
        {loading && <TableRow><TableCell colSpan={5}>Chargement…</TableCell></TableRow>}
        {!loading && rows.map((row) => <TableRow key={row.id}><TableCell>{row.deliberation.etudiant.nom_etudiant} {row.deliberation.etudiant.prenom_etudiant}</TableCell><TableCell>{row.deliberation.note.module.code_module} · {row.deliberation.note.module.nom_module}</TableCell><TableCell>{row.deliberation.moyenne_generale.toFixed(2)} / 20</TableCell><TableCell><Badge variant={row.decision === 'Admis' ? 'default' : 'secondary'}>{row.decision}</Badge></TableCell><TableCell>{new Date(row.date_decision).toLocaleDateString('fr-FR')}</TableCell></TableRow>)}
        {!loading && !rows.length && <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Aucune décision enregistrée. Lancez d’abord le calcul des délibérations.</TableCell></TableRow>}
      </TableBody>
    </Table></CardContent></Card>
  </div>;
}
