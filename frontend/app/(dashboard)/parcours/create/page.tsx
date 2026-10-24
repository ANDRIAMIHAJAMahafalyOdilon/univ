'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { api, type ApiTeacher, type ParcoursEtatMetier } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const SEL_NONE = '__none__';

const ETAT_OPTIONS: { value: ParcoursEtatMetier; label: string }[] = [
  { value: 'Actif', label: 'Actif' },
  { value: 'En_Developpement', label: 'En développement' },
  { value: 'Archive', label: 'Archivé' },
  { value: 'Obsolete', label: 'Obsolète' },
];

export default function CreateParcoursPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [teachers, setTeachers] = useState<ApiTeacher[]>([]);
  const [code, setCode] = useState('');
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [responsableId, setResponsableId] = useState<string | null>(null);
  const [etatMetier, setEtatMetier] = useState<ParcoursEtatMetier>('Actif');

  useEffect(() => {
    api.listTeachers().then(setTeachers);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.createCursusParcours({
        code,
        nom,
        description: description.trim() || null,
        etat_metier: etatMetier,
        responsable_id: responsableId,
      });
      router.push('/parcours');
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Création impossible',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/parcours">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Nouveau Parcours
          </h1>
          <p className="text-muted-foreground">
            Créez un nouveau parcours académique
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du Parcours</CardTitle>
          <CardDescription>
            Remplissez les informations nécessaires pour créer le parcours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="L-INFO"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nom du parcours</Label>
                <Input
                  id="name"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Licence Informatique"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description détaillée du parcours..."
                rows={4}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="responsable">Responsable pédagogique</Label>
                <Select
                  value={responsableId ?? SEL_NONE}
                  onValueChange={(v) => setResponsableId(v === SEL_NONE ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Non assigné" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SEL_NONE}>Non assigné</SelectItem>
                    {teachers.map((t) => (
                      <SelectItem key={t.id_enseignant} value={t.id_enseignant}>
                        {t.prenom_enseignant} {t.nom_enseignant}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="etat">Statut métier</Label>
                <Select value={etatMetier} onValueChange={(v) => setEtatMetier(v as ParcoursEtatMetier)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ETAT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/parcours">
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </Link>
              <Button type="submit" disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}