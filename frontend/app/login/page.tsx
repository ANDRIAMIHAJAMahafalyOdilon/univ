import { AuthSwap } from '@/components/auth-swap'

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-5 py-12">
      {/* Lueur chaude en arrière-plan */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-1/3 left-1/2 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 translate-x-1/3 translate-y-1/3 rounded-full bg-primary/10 blur-[100px]"
      />
      {/* Grille fine décorative */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />
      <div className="relative w-full max-w-[27rem]">
        <AuthSwap />
        <p className="mt-8 text-center font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
          © 2026 UniNotes — Notes universitaires
        </p>
      </div>
    </main>
  )
}