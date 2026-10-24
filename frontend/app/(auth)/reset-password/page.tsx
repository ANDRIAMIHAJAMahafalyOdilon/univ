'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setIsLoading(false);
    setIsSuccess(true);
    
    // Redirect after success
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  };

  return (
    <>
      {/* Mobile Logo */}
      <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <GraduationCap className="h-6 w-6 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold">UniNotes</span>
      </div>

      <Card className="border-0 shadow-none lg:border lg:shadow-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">
            {isSuccess ? 'Mot de passe réinitialisé' : 'Réinitialiser le mot de passe'}
          </CardTitle>
          <CardDescription>
            {isSuccess
              ? 'Votre mot de passe a été réinitialisé avec succès'
              : 'Créez un nouveau mot de passe sécurisé'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-sm text-muted-foreground">
                Vous allez être redirigé vers la page de connexion...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-9 pr-9"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-9 pr-9"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">
                  Le mot de passe doit contenir au moins:
                </p>
                <ul className="mt-1 list-inside list-disc text-xs text-muted-foreground">
                  <li>8 caractères</li>
                  <li>Une lettre majuscule</li>
                  <li>Un chiffre</li>
                </ul>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
              </Button>
              <Link href="/login">
                <Button variant="ghost" className="w-full">
                  Retour à la connexion
                </Button>
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </>
  );
}
