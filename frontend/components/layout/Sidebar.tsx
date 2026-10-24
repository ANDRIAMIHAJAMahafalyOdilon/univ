'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  UserCog,
  UserRound,
  School,
  CalendarRange,
  Route,
  BookOpen,
  BookCopy,
  ClipboardList,
  History,
  Trophy,
  Gavel,
  Award,
  BarChart3,
  FileText,
  Database,
  Trash2,
  ChevronDown,
  Shield,
  Building2,
  Compass,
  LayoutGrid,
  PieChart,
  Activity,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const navigation = [
  { name: 'Tableau de bord', href: '/', icon: LayoutDashboard },
  { name: 'Universités', href: '/universites', icon: Building2 },
  { name: 'Corbeille', href: '/recycle-bin', icon: Trash2 },
];

const tableGroups: Array<{
  key: string;
  label: string;
  icon: any;
  children: Array<{ label: string; href: string; icon: any }>;
}> = [
  {
    key: 'utilisateurs',
    label: 'Utilisateurs',
    icon: Users,
    children: [
      { label: 'Comptes système', href: '/users', icon: Shield },
      { label: 'Enseignants', href: '/teachers', icon: GraduationCap },
      { label: 'Étudiants', href: '/students', icon: UserRound },
    ],
  },
  {
    key: 'cursus',
    label: 'Cursus',
    icon: School,
    children: [
      { label: 'Vue d’ensemble Cursus', href: '/cursus', icon: Compass },
      { label: 'Années Universitaires', href: '/cursus/annees', icon: CalendarRange },
      { label: 'Niveaux', href: '/cursus/niveaux', icon: LayoutGrid },
      { label: 'Parcours', href: '/parcours', icon: Route },
      { label: 'Modules', href: '/modules', icon: BookOpen },
      { label: 'Matières', href: '/matieres', icon: BookCopy },
      { label: 'Attributions Enseignant', href: '/attributions', icon: UserCog },
    ],
  },
  {
    key: 'notes',
    label: 'Notes',
    icon: ClipboardList,
    children: [
      { label: 'Vue d’ensemble Notes', href: '/notes', icon: LayoutGrid },
      { label: 'Sessions d\'Examen', href: '/notes/sessions', icon: CalendarRange },
      { label: 'Saisie des Notes', href: '/grades', icon: ClipboardList },
      { label: 'Historique des Notes', href: '/notes/history', icon: History },
    ],
  },
  {
    key: 'resultats',
    label: 'Résultats',
    icon: Trophy,
    children: [
      { label: 'Vue d\'ensemble Résultats', href: '/resultats', icon: Trophy },
      { label: 'Délibérations', href: '/resultats/deliberations', icon: FileText },
      { label: 'Décisions du Jury', href: '/resultats/decisions', icon: Gavel },
      { label: 'Mentions', href: '/resultats/mentions', icon: Award },
    ],
  },
  {
    key: 'rapports',
    label: 'Rapports',
    icon: BarChart3,
    children: [
      { label: 'Tableau de bord Rapports', href: '/reports', icon: PieChart },
      { label: 'Générer Relevé Notes', href: '/reports/releves', icon: FileText },
      { label: 'Statistiques Générales', href: '/reports/statistiques', icon: BarChart3 },
    ],
  },
  {
    key: 'suivi-systeme',
    label: 'Suivi Système',
    icon: Database,
    children: [
      { label: 'Vue d’ensemble Suivi', href: '/suivi-systeme', icon: Activity },
      { label: 'Audit Log', href: '/suivi-systeme/audit-log', icon: History },
      { label: 'Notifications', href: '/suivi-systeme/notifications', icon: ClipboardList },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    utilisateurs: false,
    cursus: false,
    notes: false,
    resultats: false,
    rapports: false,
    'suivi-systeme': false,
  });

  const activeGroups = useMemo(() => {
    const active: Record<string, boolean> = {};
    tableGroups.forEach((group) => {
      active[group.key] = group.children.some((child) => pathname === child.href);
    });
    return active;
  }, [pathname]);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-sidebar-border/60 bg-sidebar/95 backdrop-blur transition-all duration-300 md:flex',
        collapsed ? 'w-20' : 'w-72'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border/60 px-4">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-sidebar-foreground">UniNotes</span>
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex min-h-0 flex-1 flex-col space-y-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const itemEl = (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'border-l-2 border-primary bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
            if (!collapsed) return itemEl;
            return (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>{itemEl}</TooltipTrigger>
                <TooltipContent side="right">{item.name}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        <div className="mt-3 space-y-2">
            {tableGroups.map((group) => (
              <div key={group.key} className="p-1">
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    activeGroups[group.key]
                      ? 'border-l-2 border-primary bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  )}
                  onClick={() =>
                    setOpenGroups((prev) => ({ ...prev, [group.key]: !prev[group.key] }))
                  }
                >
                  <div className="flex items-center gap-3">
                    <group.icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{group.label}</span>}
                  </div>
                  {!collapsed && (
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform',
                        openGroups[group.key] ? 'rotate-180' : 'rotate-0'
                      )}
                    />
                  )}
                </button>
                {!collapsed && openGroups[group.key] && (
                  <div className="mt-1 space-y-1 pl-6">
                    {group.children.map((child) => {
                      const isActive = pathname === child.href;
                      return (
                        <Link
                          key={child.label}
                          href={child.href}
                          className={cn(
                            'block rounded-md px-3 py-1.5 text-sm transition-colors',
                            isActive
                              ? 'border-l-2 border-primary bg-sidebar-accent text-sidebar-accent-foreground'
                              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                          )}
                        >
                          <span>{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
      </nav>
    </aside>
  );
}
