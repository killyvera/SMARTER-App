'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, Bell } from 'lucide-react';
import { useAlarmStore } from '@/stores/alarmStore';
import { usePendingTasks } from '@/features/alarms/hooks/usePendingTasks';
import { useUIStore } from '@/stores/uiStore';
import { useEffect } from 'react';
import Image from 'next/image';

export function AgentHeader() {
  const { user, logout } = useAuth();
  const { pendingCount } = useAlarmStore();
  const { refetch } = usePendingTasks();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <header className="sticky top-0 z-50 w-full shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-12 items-center gap-2 px-3 w-full max-w-full">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-xl p-0"
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={sidebarOpen}
          aria-controls="agent-nav-drawer"
        >
          <Image
            src="/icon-192x192.png"
            alt=""
            width={32}
            height={32}
            className="rounded-lg"
            priority
          />
        </Button>
        <h1 className="text-sm font-semibold truncate flex-1 text-center md:text-left">Smarter</h1>
        <div className="relative flex items-center justify-center w-9 h-9 text-muted-foreground shrink-0" aria-label="Alarmas hoy">
          <Bell className="h-5 w-5" />
          {pendingCount > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-0.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {pendingCount > 9 ? '9+' : pendingCount}
            </span>
          ) : null}
        </div>
        {user ? (
          <Button variant="ghost" size="sm" onClick={logout} className="h-9 px-2 shrink-0 gap-1" aria-label="Cerrar sesión">
            <LogOut className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only sm:inline text-xs">Salir</span>
          </Button>
        ) : null}
      </div>
    </header>
  );
}
