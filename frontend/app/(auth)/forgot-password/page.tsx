'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setIsLoading(false);
    setIsSubmitted(true);
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
          <CardTitle className="text-2xl">Mot de passe oublié</CardTitle>
          <CardDescription>
            {isSubmitted
              ? 'Vérifiez votre boîte de réception'
              : 'Entrez votre email pour réinitialiser votre mot de passe'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSubmitted ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-sm text-muted-foreground">
                Si un compte existe avec cette adresse email, vous recevrez un lien pour réinitialiser votre mot de passe.
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour à la connexion
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@univ.edu"
                    className="pl-9"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Envoi en cours...' : 'Envoyer le lien'}
              </Button>
              <Link href="/login">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
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
