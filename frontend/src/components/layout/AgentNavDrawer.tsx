'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { Home, HelpCircle, BookOpen, Target, CheckSquare, User, Settings } from 'lucide-react';

const navItems = [
  { name: 'Inicio', href: '/', icon: Home, description: 'Chat con el agente' },
  { name: 'FAQ SMARTER', href: '/faq', icon: HelpCircle, description: 'Preguntas por letra SMARTER' },
  { name: 'Guía SMARTER', href: '/smarter', icon: BookOpen, description: 'Metodología completa' },
  { name: 'Metas', href: '/goals', icon: Target, description: 'Tus goals' },
  { name: 'MiniTasks', href: '/minitasks', icon: CheckSquare, description: 'Lista de tareas' },
  { name: 'Perfil', href: '/profile', icon: User, description: 'Cuenta' },
  { name: 'Ajustes', href: '/settings', icon: Settings, description: 'Preferencias' },
];

export function AgentNavDrawer() {
  const pathname = usePathname();
  const { sidebarOpen, closeSidebar } = useUIStore();

  const closeOnNavigate = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      closeSidebar();
    }
  };

  return (
    <>
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 top-12 z-[44] bg-black/50 md:hidden"
          aria-label="Cerrar menú"
          onClick={closeSidebar}
        />
      ) : null}

      <aside
        id="agent-nav-drawer"
        className={cn(
          'flex w-[min(18rem,calc(100vw-1.5rem))] shrink-0 flex-col border-r bg-background md:w-56',
          'max-md:fixed max-md:left-0 max-md:top-12 max-md:z-[46] max-md:h-[calc(100dvh-3rem)] max-md:shadow-xl max-md:transition-transform max-md:duration-300',
          sidebarOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full max-md:pointer-events-none',
          'md:relative md:top-auto md:h-auto md:min-h-0 md:translate-x-0 md:pointer-events-auto'
        )}
        aria-hidden={false}
      >
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Navegación principal">
          <p className="px-2 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Documentación y app
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeOnNavigate}
                className={cn(
                  'flex flex-col gap-0.5 rounded-lg px-3 py-2.5 text-sm transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  active ? 'bg-accent text-accent-foreground' : 'text-foreground'
                )}
              >
                <span className="flex items-center gap-2 font-medium">
                  <Icon className="h-4 w-4 shrink-0 opacity-80" />
                  {item.name}
                </span>
                <span className="pl-6 text-xs text-muted-foreground">{item.description}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
