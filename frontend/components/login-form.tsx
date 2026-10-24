'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, GraduationCap, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api, setSession } from '@/lib/api'

export function LoginForm({ onRegister }: { onRegister?: () => void }) {
  const router = useRouter()
  const [email, setEmail] = useState('admin@univ.local')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stagger = (delay: number) =>
    ({
      animationDelay: `${delay}ms`,
    }) as React.CSSProperties

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const result = await api.login(email, password)
      setSession(result.token, result.user)
      router.push('/')
      router.refresh()
    } catch (err) {
      const raw = err instanceof Error ? err.message : ''
      setError(raw === 'Failed to fetch' ? 'Impossible de joindre le serveur' : raw || 'Identifiants invalides')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-[0_2px_4px_rgba(0,0,0,0.06),0_24px_60px_-28px_rgba(0,0,0,0.18)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2),0_24px_60px_-20px_rgba(0,0,0,0.6)]">
      {/* Bande d'accent signature */}
      <div className="h-1.5 w-full bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
      <div className="p-8 sm:p-10">
        {/* Marque */}
        <div
          className="mb-9 flex items-center justify-center gap-3 [animation:fade-in-up_0.6s_ease_both]"
          style={stagger(0)}
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_6px_16px_-6px] shadow-primary/60">
            <GraduationCap className="size-5" strokeWidth={2.25} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-tight text-foreground">
              UniNotes
            </span>
            <span className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
              Espace administrateur
            </span>
          </div>
        </div>
        <div
          className="mb-8 text-center [animation:fade-in-up_0.6s_ease_both]"
          style={stagger(60)}
        >
          <h1 className="text-pretty text-[1.75rem] font-bold leading-tight tracking-tight text-foreground">
            Bon retour parmi nous
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Connectez-vous pour gérer les étudiants, modules et notes.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div
            className="flex flex-col gap-2 [animation:fade-in-up_0.6s_ease_both]"
            style={stagger(110)}
          >
            <label
              htmlFor="email"
              className="font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground"
            >
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@univ.local"
              className="h-12 w-full rounded-full border border-border bg-secondary/60 px-5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:bg-secondary focus:ring-2 focus:ring-primary/25"
            />
          </div>
          <div
            className="flex flex-col gap-2 [animation:fade-in-up_0.6s_ease_both]"
            style={stagger(160)}
          >
            <div className="flex items-baseline justify-between">
              <label
                htmlFor="password"
                className="font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground"
              >
                Mot de passe
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary underline-offset-4 transition-opacity hover:underline hover:opacity-80"
              >
                Oublié ?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 w-full rounded-full border border-border bg-secondary/60 px-5 pr-12 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:bg-secondary focus:ring-2 focus:ring-primary/25"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={
                  showPassword
                    ? 'Masquer le mot de passe'
                    : 'Afficher le mot de passe'
                }
                className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>
          {error && (
            <p
              className="text-center text-sm text-destructive [animation:fade-in-up_0.6s_ease_both]"
              style={stagger(200)}
            >
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className={cn(
              'group mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-all',
              'shadow-[0_8px_24px_-8px] shadow-primary/70 hover:brightness-105',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
              'disabled:cursor-not-allowed disabled:opacity-60',
              '[animation:fade-in-up_0.6s_ease_both]',
            )}
            style={stagger(240)}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Connexion…
              </>
            ) : (
              <>
                Se connecter
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>
        <div
          className="mt-7 flex items-center gap-4 [animation:fade-in-up_0.6s_ease_both]"
          style={stagger(280)}
        >
          <span className="h-px flex-1 bg-border" />
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
            ou
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <p
          className="mt-6 text-center text-sm text-muted-foreground [animation:fade-in-up_0.6s_ease_both]"
          style={stagger(320)}
        >
          Pas encore de compte ?{' '}
          {onRegister ? (
            <button
              type="button"
              onClick={onRegister}
              className="font-semibold text-foreground underline underline-offset-4 transition-opacity hover:opacity-70"
            >
              Créer un compte
            </button>
          ) : (
            <Link
              href="/register"
              className="font-semibold text-foreground underline underline-offset-4 transition-opacity hover:opacity-70"
            >
              Créer un compte
            </Link>
          )}
        </p>
      </div>
    </div>
  )
}