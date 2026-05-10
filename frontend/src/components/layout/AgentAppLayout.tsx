'use client';

import { AgentHeader } from './AgentHeader';
import { AgentNavDrawer } from './AgentNavDrawer';

interface AgentAppLayoutProps {
  children: React.ReactNode;
}

/**
 * Shell mobile-first: header + drawer (icono app) con FAQ / SMARTER / rutas útiles.
 * En md+ el menú queda fijo a la izquierda; en móvil se abre encima del contenido.
 */
export function AgentAppLayout({ children }: AgentAppLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background w-full overflow-x-hidden">
      <AgentHeader />
      <div className="flex flex-1 min-h-0 min-w-0 flex-col md:flex-row">
        <AgentNavDrawer />
        <main className="flex flex-1 min-h-0 min-w-0 flex-col max-w-lg mx-auto w-full md:max-w-none md:mx-0 md:px-4 md:py-2">
          {children}
        </main>
      </div>
    </div>
  );
}
