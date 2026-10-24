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
import { ArrowLeft, Save } from 'lucide-react';
import { api, type ApiAcademicNiveau, type ApiAcademicParcours } from '@/lib/api';

const SEL_NONE = '__none__';

export default function CreateStudentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [matricule, setMatricule] = useState('');
  const [filiere, setFiliere] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [statut, setStatut] = useState<'Actif' | 'Suspendu' | 'Redoublant' | 'Diplome' | 'Abandon' | 'Exclu' | 'Transfere' | 'Supprime'>('Actif');

  const [parcoursId, setParcoursId] = useState<string | null>(null);
  const [niveauId, setNiveauId] = useState<string | null>(null);
  const [parcours, setParcours] = useState<ApiAcademicParcours[]>([]);
  const [niveaux, setNiveaux] = useState<ApiAcademicNiveau[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingMeta(true);
      try {
        const p = await api.listAcademicParcours();
        if (!cancelled) setParcours(p);
      } finally {
        if (!cancelled) setLoadingMeta(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!parcoursId) {
      setNiveaux([]);
      setNiveauId(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const n = await api.listAcademicNiveaux(parcoursId);
        if (!cancelled) setNiveaux(n);
      } catch {
        if (!cancelled) setNiveaux([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [parcoursId]);

  const onParcoursChange = (id: string | null) => {
    setParcoursId(id);
    setNiveauId(null);
    const p = parcours.find((x) => x.id === id);
    if (p) setFiliere(p.nom);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.createStudent({
        numero_matricule: matricule,
        nom_etudiant: lastName,
        prenom_etudiant: firstName,
        date_naissance: dateOfBirth || null,
        filiere,
        annee_academique: academicYear,
        contact_etudiant: phone || null,
        email_etudiant: email || null,
        parcours_id: parcoursId,
        niveau_id: niveauId,
        statut,
      });
      router.push('/students');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/students">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nouvel étudiant</h1>
          <p className="text-muted-foreground">Créer un nouveau profil étudiant</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>Données d&apos;identité de l&apos;étudiant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input id="firstName" placeholder="Amadou" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input id="lastName" placeholder="Diallo" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="amadou.diallo@univ.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" placeholder="+221 77 123 45 67" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date de naissance</Label>
                <Input id="dateOfBirth" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informations académiques</CardTitle>
              <CardDescription>Données liées à l&apos;inscription</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="matricule">Matricule</Label>
                <Input id="matricule" placeholder="ETU2024007" required value={matricule} onChange={(e) => setMatricule(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parcours">Parcours</Label>
                <Select value={parcoursId ?? SEL_NONE} onValueChange={(v) => onParcoursChange(v === SEL_NONE ? null : v)} disabled={loadingMeta}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un parcours" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SEL_NONE}>— Aucun —</SelectItem>
                    {parcours.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="niveau">Niveau</Label>
                <Select value={niveauId ?? SEL_NONE} onValueChange={(v) => setNiveauId(v === SEL_NONE ? null : v)} disabled={!parcoursId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SEL_NONE}>— Aucun —</SelectItem>
                    {niveaux.map((n) => (
                      <SelectItem key={n.id} value={n.id}>
                        {n.nom} ({n.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filiere">Filière (libellé)</Label>
                <Input id="filiere" placeholder="Informatique" required value={filiere} onChange={(e) => setFiliere(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">Année universitaire</Label>
                <Select required value={academicYear} onValueChange={setAcademicYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024-2025">2024-2025</SelectItem>
                    <SelectItem value="2025-2026">2025-2026</SelectItem>
                    <SelectItem value="2026-2027">2026-2027</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select value={statut} onValueChange={(v) => setStatut(v as typeof statut)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Actif">Actif</SelectItem>
                    <SelectItem value="Suspendu">Suspendu</SelectItem>
                    <SelectItem value="Redoublant">Redoublant</SelectItem>
                    <SelectItem value="Diplome">Diplomé</SelectItem>
                    <SelectItem value="Abandon">Abandon</SelectItem>
                    <SelectItem value="Exclu">Exclu</SelectItem>
                    <SelectItem value="Transfere">Transfere</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-4">
          <Link href="/students">
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