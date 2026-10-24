'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Bell, Shield, Database, Palette, Globe, Save } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
        <p className="text-muted-foreground">Configurez les paramètres de l&apos;application</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" />
            Général
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            Apparence
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Informations de l&apos;établissement
              </CardTitle>
              <CardDescription>
                Configurez les informations de base de l&apos;université
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="universityName">Nom de l&apos;université</Label>
                  <Input id="universityName" defaultValue="Université de Dakar" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="academicYear">Année universitaire</Label>
                  <Select defaultValue="2023-2024">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2023-2024">2023-2024</SelectItem>
                      <SelectItem value="2024-2025">2024-2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input id="address" defaultValue="BP 5005, Dakar-Fann, Sénégal" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email de contact</Label>
                  <Input id="email" type="email" defaultValue="contact@univ-dakar.edu" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input id="phone" defaultValue="+221 33 825 00 00" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Paramètres académiques
              </CardTitle>
              <CardDescription>
                Configurez les paramètres de calcul des notes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="passGrade">Note de passage</Label>
                  <Input id="passGrade" type="number" defaultValue="10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="controlWeight">Poids contrôle continu (%)</Label>
                  <Input id="controlWeight" type="number" defaultValue="40" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="examWeight">Poids examen (%)</Label>
                  <Input id="examWeight" type="number" defaultValue="60" />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium">Validation automatique des notes</p>
                  <p className="text-sm text-muted-foreground">
                    Valider automatiquement les notes après saisie
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Enregistrer les modifications
            </Button>
          </div>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Préférences de notification</CardTitle>
              <CardDescription>
                Choisissez comment vous souhaitez être notifié
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  title: 'Nouvelles inscriptions',
                  description: 'Recevoir une notification lors de nouvelles inscriptions',
                  defaultChecked: true,
                },
                {
                  title: 'Notes ajoutées',
                  description: 'Recevoir une notification lors de la saisie de nouvelles notes',
                  defaultChecked: true,
                },
                {
                  title: 'Rapports générés',
                  description: 'Recevoir une notification lors de la génération de rapports',
                  defaultChecked: false,
                },
                {
                  title: 'Alertes système',
                  description: 'Recevoir les alertes importantes du système',
                  defaultChecked: true,
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch defaultChecked={item.defaultChecked} />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Enregistrer les préférences
            </Button>
          </div>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Changer le mot de passe</CardTitle>
              <CardDescription>
                Mettez à jour votre mot de passe de connexion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                <Input id="currentPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input id="newPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input id="confirmPassword" type="password" />
              </div>
              <Button>Mettre à jour le mot de passe</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sessions actives</CardTitle>
              <CardDescription>Gérez vos sessions de connexion</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium">Session actuelle</p>
                  <p className="text-sm text-muted-foreground">
                    Chrome sur Windows • Dakar, Sénégal • Maintenant
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Session actuelle
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium">Autre session</p>
                  <p className="text-sm text-muted-foreground">
                    Safari sur iPhone • Il y a 2 heures
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Déconnecter
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thème</CardTitle>
              <CardDescription>Personnalisez l&apos;apparence de l&apos;application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Thème de l&apos;application</Label>
                <Select
                  value="light"
                  disabled
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Clair</SelectItem>
                    <SelectItem value="dark">Sombre</SelectItem>
                    <SelectItem value="system">Système</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Langue</Label>
                <Select defaultValue="fr">
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Enregistrer les préférences
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
