'use client';

import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/button';
import { Menu, LogOut, User } from 'lucide-react';
import { AlarmBadge } from '@/components/alarms/AlarmBadge';
import { useUserProfile } from '@/features/user/hooks/useUserProfile';
import Image from 'next/image';
import Link from 'next/link';

export function Header() {
  const { user, logout } = useAuth();
  const { toggleSidebar } = useUIStore();
  const { data: profile } = useUserProfile();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full max-w-full flex h-14 items-center px-3 sm:px-4">
        {/* Sección izquierda: Logo + Hamburger (mobile) */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden flex-shrink-0"
            onClick={toggleSidebar}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-base sm:text-lg font-semibold truncate">Smarter App</h1>
        </div>

        {/* Sección derecha: Alarmas + User info + Logout */}
        <div className="ml-auto flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <AlarmBadge />
          {user && (
            <Link href="/profile" className="hidden md:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-w-0">
              {profile?.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt={profile.name || user.email}
                  width={32}
                  height={32}
                  className="rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4" />
                </div>
              )}
              <span className="max-w-[120px] sm:max-w-[150px] truncate">{profile?.name || user.email}</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="gap-2 flex-shrink-0"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </div>
      </div>
    </header>
  );
}


