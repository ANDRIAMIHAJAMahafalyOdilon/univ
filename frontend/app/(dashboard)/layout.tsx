'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Toaster } from '@/components/ui/toaster';
import { getAuthToken } from '@/lib/api';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (!getAuthToken()) {
      router.replace('/login');
      return;
    }
    setAuthed(true);
  }, [router]);

  if (!authed) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
      />
      <Sidebar collapsed={sidebarCollapsed} />
      <div className={sidebarCollapsed ? 'pt-16 transition-all duration-300 md:pl-20' : 'pt-16 transition-all duration-300 md:pl-72'}>
        <main className="mx-auto w-full p-4 md:p-6 xl:p-8">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
