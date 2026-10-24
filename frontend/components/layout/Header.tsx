'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Search, Menu, Settings, User, Building2, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { api, clearSession, getSessionUser } from '@/lib/api';
import { useEffect, useState } from 'react';

type SearchResult = { id: string; label: string; detail: string; href: string; kind: string };

interface HeaderProps {
  title?: string;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrateur',
  it_support: 'Support IT',
  gestionnaire_notes: 'Gestionnaire de notes',
  enseignant: 'Enseignant',
  etudiant: 'Étudiant',
};

export function Header({ title, sidebarCollapsed, onToggleSidebar }: HeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState(() => getSessionUser());
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);

  useEffect(() => {
    setUser(getSessionUser());
  }, []);

  useEffect(() => {
    const query = searchTerm.trim();
    if (query.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      setSearchError(false);
      try {
        const [students, teachers, modules] = await Promise.all([
          api.searchStudents(query),
          api.searchTeachers(query),
          api.searchModules(query),
        ]);
        if (cancelled) return;
        const results: SearchResult[] = [
          ...students.map((row) => ({ id: row.id_etudiant, label: `${row.nom_etudiant} ${row.prenom_etudiant}`, detail: `Étudiant · ${row.numero_matricule}`, href: `/students/${row.id_etudiant}`, kind: 'Étudiant' })),
          ...teachers.map((row) => ({ id: row.id_enseignant, label: `${row.nom_enseignant} ${row.prenom_enseignant}`, detail: `Enseignant · ${row.departement}`, href: `/teachers/${row.id_enseignant}`, kind: 'Enseignant' })),
          ...modules.map((row) => ({ id: row.id_module, label: row.nom_module, detail: `Module · ${row.code_module}`, href: `/modules/${row.id_module}`, kind: 'Module' })),
        ];
        setSearchResults(results.slice(0, 10));
      } catch {
        if (!cancelled) { setSearchResults([]); setSearchError(true); }
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 250);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [searchTerm]);

  const handleLogout = () => {
    clearSession();
    router.push('/login');
    router.refresh();
  };

  const displayName = user?.email?.split('@')[0] ?? 'Utilisateur';
  const initials = (user?.email?.[0] ?? 'U').toUpperCase();
  const roleLabel = (user && ROLE_LABELS[user.role]) || user?.role || 'Utilisateur';

  return (
    <header
      className={cn(
        'fixed top-0 z-50 flex h-16 items-center justify-between border-b border-border/50 bg-background/70 px-6 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60',
        'left-0 right-0',
        sidebarCollapsed ? 'md:left-20 md:right-0' : 'md:left-72 md:right-0'
      )}
    >
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="rounded-xl"
          aria-label={sidebarCollapsed ? 'Étendre la sidebar' : 'Réduire la sidebar'}
        >
          <Menu className="h-5 w-5" />
        </Button>
        {title && <h1 className="text-xl font-semibold text-foreground">{title}</h1>}
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div
          className="relative hidden md:block"
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setSearchOpen(false);
          }}
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Étudiant, enseignant, module…"
            className="w-72 rounded-xl border-border/60 bg-background/80 pl-9"
            value={searchTerm}
            role="combobox"
            aria-expanded={searchOpen && searchTerm.trim().length >= 2}
            aria-controls="global-search-results"
            onFocus={() => setSearchOpen(true)}
            onChange={(event) => { setSearchTerm(event.target.value); setSearchOpen(true); }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setSearchOpen(false);
              if (event.key === 'Enter' && searchResults[0]) {
                router.push(searchResults[0].href);
                setSearchOpen(false);
              }
            }}
          />
          {searchOpen && searchTerm.trim().length >= 2 && <div id="global-search-results" role="listbox" className="absolute right-0 top-full z-[60] mt-2 max-h-96 w-[min(24rem,90vw)] overflow-y-auto rounded-xl border bg-popover p-2 text-popover-foreground shadow-lg">
            {searchLoading ? <p className="px-3 py-4 text-sm text-muted-foreground">Recherche…</p> : searchError ? <p className="px-3 py-4 text-sm text-destructive">La recherche a échoué. Réessayez.</p> : searchResults.length ? searchResults.map((result) => <Link key={`${result.kind}-${result.id}`} href={result.href} role="option" aria-selected="false" onClick={() => setSearchOpen(false)} className="block rounded-lg px-3 py-2.5 hover:bg-accent focus-visible:bg-accent focus-visible:outline-none">
              <span className="block text-sm font-medium">{result.label}</span><span className="block text-xs text-muted-foreground">{result.detail}</span>
            </Link>) : <p className="px-3 py-4 text-sm text-muted-foreground">Aucun résultat.</p>}
          </div>}
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                3
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
              <span className="font-medium">Nouvelles notes ajoutées</span>
              <span className="text-xs text-muted-foreground">Module INF301 - Il y a 2 heures</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
              <span className="font-medium">Étudiant inscrit</span>
              <span className="text-xs text-muted-foreground">Nouvelle fiche étudiant — Il y a 5 heures</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
              <span className="font-medium">Rapport généré</span>
              <span className="text-xs text-muted-foreground">Relevé de notes S1 - Hier</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 rounded-xl px-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
                </Avatar>
                <div className="hidden text-left md:block">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{roleLabel}</p>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email ?? ''}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/universites">
                <Building2 className="mr-2 h-4 w-4" />
                Mon université
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                Profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Paramètres
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
