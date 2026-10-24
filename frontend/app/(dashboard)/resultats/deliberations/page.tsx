'use client';

import { useEffect, useState } from 'react';
import { Gavel, RefreshCw } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api, type ApiDeliberation } from '@/lib/api';

export default function DeliberationsPage() {
  const [rows, setRows] = useState<ApiDeliberation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const refresh = async () => {
    setLoading(true);
    try { setRows(await api.listDeliberations()); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Impossible de charger les délibérations.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void refresh(); }, []);

  const generate = async () => {
    setSaving(true);
    try {
      const result = await api.generateDeliberations();
      setRows(result.deliberations);
      setError(result.generated ? `${result.generated} délibération(s) recalculée(s) depuis les notes valides.` : 'Aucune note valide à délibérer.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Le calcul du jury a échoué.'); }
    finally { setSaving(false); }
  };

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="text-2xl font-bold tracking-tight">Délibérations</h1><p className="text-sm text-muted-foreground">Résultats calculés par étudiant et par module à partir des notes validées.</p></div>
      <Button onClick={generate} disabled={saving}><RefreshCw className={`mr-2 h-4 w-4 ${saving ? 'animate-spin' : ''}`} />{saving ? 'Calcul en cours…' : 'Lancer le calcul du jury'}</Button>
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard title="Délibérations" value={loading ? '—' : String(rows.length)} icon={Gavel} />
      <StatCard title="Admis" value={loading ? '—' : String(rows.filter((r) => r.decision_jury?.decision === 'Admis').length)} icon={Gavel} delay={0.05} />
      <StatCard title="À reprendre" value={loading ? '—' : String(rows.filter((r) => r.decision_jury?.decision !== 'Admis').length)} icon={Gavel} delay={0.1} />
    </div>
    {error && <p role="status" className="rounded-lg border bg-muted px-4 py-3 text-sm">{error}</p>}
    <Card><CardContent className="overflow-x-auto p-0"><Table>
      <TableHeader><TableRow><TableHead>Étudiant</TableHead><TableHead>Module</TableHead><TableHead>Moyenne / 20</TableHead><TableHead>Décision</TableHead><TableHead>Mention</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
      <TableBody>
        {loading ? <TableRow><TableCell colSpan={6}>Chargement…</TableCell></TableRow> : rows.map((row) => <TableRow key={row.id}>
          <TableCell><div className="font-medium">{row.etudiant.nom_etudiant} {row.etudiant.prenom_etudiant}</div><div className="text-xs text-muted-foreground">{row.etudiant.numero_matricule}</div></TableCell>
          <TableCell>{row.note.module.code_module} · {row.note.module.nom_module}</TableCell>
          <TableCell className="font-semibold">{row.moyenne_generale.toFixed(2)}</TableCell>
          <TableCell>{row.decision_jury ? <Badge variant={row.decision_jury.decision === 'Admis' ? 'default' : 'secondary'}>{row.decision_jury.decision}</Badge> : 'En attente'}</TableCell>
          <TableCell>{row.mention?.mention.replaceAll('_', ' ') ?? '—'}</TableCell>
          <TableCell>{new Date(row.date_deliberation).toLocaleDateString('fr-FR')}</TableCell>
        </TableRow>)}
        {!loading && rows.length === 0 && <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Aucune délibération. Lancez le calcul après la saisie des notes.</TableCell></TableRow>}
      </TableBody>
    </Table></CardContent></Card>
  </div>;
}
