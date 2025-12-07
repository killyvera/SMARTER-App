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
        <main className="flex-1 md:ml-64 transition-all duration-300 w-full max-w-full overflow-x-hidden">
          <div className="container mx-auto p-3 sm:p-4 md:p-6 w-full max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}


