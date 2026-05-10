'use client';

import { AgentHeader } from './AgentHeader';

interface AgentAppLayoutProps {
  children: React.ReactNode;
}

/**
 * Shell mobile-first: sin sidebar legacy; solo header compacto + contenido.
 */
export function AgentAppLayout({ children }: AgentAppLayoutProps) {
  return (
    <div className="min-h-dvh bg-background flex flex-col w-full overflow-x-hidden">
      <AgentHeader />
      <main className="flex-1 flex flex-col min-h-0 w-full max-w-lg mx-auto md:max-w-xl">{children}</main>
    </div>
  );
}
