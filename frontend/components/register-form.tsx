'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, GraduationCap, User, Mail, Lock, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api, setSession } from '@/lib/api'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const ROLE_OPTIONS = [
  { value: 'etudiant', label: 'Étudiant' },
  { value: 'enseignant', label: 'Enseignant' },
  { value: 'gestionnaire_notes', label: 'Gestionnaire de notes' },
]

const stagger = (delay: number) =>
  ({
    animationDelay: `${delay}ms`,
  }) as React.CSSProperties

export function RegisterForm({ onLogin }: { onLogin?: () => void }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    role: 'etudiant',
  })

  const update =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const result = await api.register(form)
      setSession(result.token, result.user)
      router.push('/')
      router.refresh()
    } catch (err) {
      const raw = err instanceof Error ? err.message : ''
      setError(raw === 'Failed to fetch' ? 'Impossible de joindre le serveur' : raw || "Erreur lors de l'inscription")
    } finally {
      setIsLoading(false)
    }
  }

  const inputCls =
    'h-12 w-full rounded-full border border-border bg-secondary/60 px-5 pr-12 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:bg-secondary focus:ring-2 focus:ring-primary/25'

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
            <span className="text-base font-bold tracking-tight text-foreground">UniNotes</span>
            <span className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
              Espace administrateur
            </span>
          </div>
        </div>
        <div className="mb-8 text-center [animation:fade-in-up_0.6s_ease_both]" style={stagger(60)}>
          <h1 className="text-pretty text-[1.75rem] font-bold leading-tight tracking-tight text-foreground">
            Créer un compte
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Renseignez vos informations pour rejoindre UniNotes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div
              className="flex flex-col gap-2 [animation:fade-in-up_0.6s_ease_both]"
              style={stagger(110)}
            >
              <Label
                htmlFor="prenom"
                className="font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground"
              >
                Prénom
              </Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="prenom"
                  value={form.prenom}
                  onChange={update('prenom')}
                  placeholder="Marie"
                  required
                  className="h-12 w-full rounded-full border border-border bg-secondary/60 pl-11 pr-5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:bg-secondary focus:ring-2 focus:ring-primary/25"
                />
              </div>
            </div>
            <div
              className="flex flex-col gap-2 [animation:fade-in-up_0.6s_ease_both]"
              style={stagger(160)}
            >
              <Label
                htmlFor="nom"
                className="font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground"
              >
                Nom
              </Label>
              <div className="relative">
                <UserRound className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="nom"
                  value={form.nom}
                  onChange={update('nom')}
                  placeholder="Dupont"
                  required
                  className="h-12 w-full rounded-full border border-border bg-secondary/60 pl-11 pr-5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:bg-secondary focus:ring-2 focus:ring-primary/25"
                />
              </div>
            </div>
          </div>

          <div
            className="flex flex-col gap-2 [animation:fade-in-up_0.6s_ease_both]"
            style={stagger(210)}
          >
            <Label
              htmlFor="email"
              className="font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground"
            >
              Adresse email
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={update('email')}
                placeholder="marie.dupont@univ.local"
                required
                className="h-12 w-full rounded-full border border-border bg-secondary/60 pl-11 pr-5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:bg-secondary focus:ring-2 focus:ring-primary/25"
              />
            </div>
          </div>

          <div
            className="flex flex-col gap-2 [animation:fade-in-up_0.6s_ease_both]"
            style={stagger(260)}
          >
            <Label
              htmlFor="password"
              className="font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground"
            >
              Mot de passe
            </Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.password}
                onChange={update('password')}
                placeholder="••••••••"
                minLength={6}
                required
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div
            className="flex flex-col gap-2 [animation:fade-in-up_0.6s_ease_both]"
            style={stagger(310)}
          >
            <Label
              htmlFor="role"
              className="font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground"
            >
              Je suis
            </Label>
            <Select
              value={form.role}
              onValueChange={(role) => setForm((f) => ({ ...f, role }))}
            >
              <SelectTrigger
                id="role"
                className="h-12 w-full rounded-full border-border bg-secondary/60 px-5 text-sm focus:ring-2 focus:ring-primary/25"
              >
                <SelectValue placeholder="Choisir un profil" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p
              className="text-center text-sm text-destructive [animation:fade-in-up_0.6s_ease_both]"
              style={stagger(340)}
            >
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              'group mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-all',
              'shadow-[0_8px_24px_-8px] shadow-primary/70 hover:brightness-105',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
              'disabled:cursor-not-allowed disabled:opacity-60',
              '[animation:fade-in-up_0.6s_ease_both]',
            )}
            style={stagger(370)}
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Inscription…
              </>
            ) : (
              'Créer mon compte'
            )}
          </button>
        </form>

        <p
          className="mt-6 text-center text-sm text-muted-foreground [animation:fade-in-up_0.6s_ease_both]"
          style={stagger(420)}
        >
          Déjà un compte ?{' '}
          {onLogin ? (
            <button
              type="button"
              onClick={onLogin}
              className="font-semibold text-foreground underline underline-offset-4 transition-opacity hover:opacity-70"
            >
              Se connecter
            </button>
          ) : (
            <Link
              href="/login"
              className="font-semibold text-foreground underline underline-offset-4 transition-opacity hover:opacity-70"
            >
              Se connecter
            </Link>
          )}
        </p>
      </div>
    </div>
  )
}