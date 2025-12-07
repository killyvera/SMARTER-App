'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useUIStore } from '@/stores/uiStore';
import { Home, Target, CheckSquare, Settings, User, StickyNote, HelpCircle, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Metas', href: '/goals', icon: Target },
  { name: 'MiniTasks', href: '/minitasks', icon: CheckSquare },
  { name: 'Tabloid', href: '/tabloid', icon: StickyNote },
  { name: 'FAQ', href: '/faq', icon: HelpCircle },
  { name: 'SMARTER', href: '/smarter', icon: BookOpen },
  { name: 'Perfil', href: '/profile', icon: User },
  { name: 'Configuración', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, closeSidebar } = useUIStore();

  return (
    <>
      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-64 border-r bg-background transition-transform duration-300 ease-in-out',
          'md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <nav className="flex flex-col h-full p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={`${item.name}-${item.href}`}
                href={item.href}
                onClick={() => {
                  // Cerrar sidebar en mobile al hacer click
                  if (window.innerWidth < 768) {
                    closeSidebar();
                  }
                }}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}


