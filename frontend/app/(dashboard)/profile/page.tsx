'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Camera, Mail, Phone, MapPin, Calendar, Shield, Save } from 'lucide-react';

export default function ProfilePage() {
  const user = {
    name: 'Administrateur Système',
    email: 'admin@univ-dakar.edu',
    phone: '+221 77 123 45 67',
    role: 'Administrateur',
    department: 'Direction des Études',
    joinDate: '2020-01-15',
    lastLogin: '2024-01-15T10:30:00Z',
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mon Profil</h1>
        <p className="text-muted-foreground">Gérez vos informations personnelles</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <div className="relative mx-auto">
              <Avatar className="h-24 w-24">
                <AvatarImage src="/icon.svg" alt={user.name} />
                <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
                  AD
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <CardTitle className="mt-4">{user.name}</CardTitle>
            <Badge variant="secondary" className="mx-auto mt-2 w-fit bg-primary/10 text-primary">
              <Shield className="mr-1 h-3 w-3" />
              {user.role}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{user.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{user.department}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Membre depuis {new Date(user.joinDate).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">
                Dernière connexion: {new Date(user.lastLogin).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Modifier le profil</CardTitle>
            <CardDescription>Mettez à jour vos informations personnelles</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input id="firstName" defaultValue="Admin" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input id="lastName" defaultValue="Système" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user.email} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" defaultValue={user.phone} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Département</Label>
                <Input id="department" defaultValue={user.department} disabled />
              </div>
              <div className="flex justify-end">
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer les modifications
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Activity Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Statistiques d&apos;activité</CardTitle>
          <CardDescription>Votre activité sur la plateforme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-border p-4 text-center">
              <p className="text-3xl font-bold text-chart-1">156</p>
              <p className="text-sm text-muted-foreground">Étudiants ajoutés</p>
            </div>
            <div className="rounded-lg border border-border p-4 text-center">
              <p className="text-3xl font-bold text-chart-2">1,248</p>
              <p className="text-sm text-muted-foreground">Notes saisies</p>
            </div>
            <div className="rounded-lg border border-border p-4 text-center">
              <p className="text-3xl font-bold text-chart-3">45</p>
              <p className="text-sm text-muted-foreground">Rapports générés</p>
            </div>
            <div className="rounded-lg border border-border p-4 text-center">
              <p className="text-3xl font-bold text-chart-4">89</p>
              <p className="text-sm text-muted-foreground">Jours actifs</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
