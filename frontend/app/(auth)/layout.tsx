import { GraduationCap } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between bg-primary p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold text-primary-foreground">UniNotes</span>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-primary-foreground">
              Système de Gestion des Notes Universitaires
            </h1>
            <p className="text-lg text-primary-foreground/80">
              Gérez efficacement les étudiants, les modules et les notes de votre établissement avec notre plateforme moderne et intuitive.
            </p>
          </div>
          <p className="text-sm text-primary-foreground/60">
            © 2024 UniNotes. Tous droits réservés.
          </p>
        </div>

        {/* Right Side - Form */}
        <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
