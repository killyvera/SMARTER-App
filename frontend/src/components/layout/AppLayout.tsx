'use client';

import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <Header />
      <div className="flex w-full">
        <Sidebar />
        <main className="flex-1 md:ml-64 transition-all duration-300 w-full max-w-full overflow-x-hidden min-w-0">
          <div className="w-full max-w-full p-3 sm:p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}


