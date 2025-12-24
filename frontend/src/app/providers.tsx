'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useCyberpunkGlitch } from '@/hooks/useCyberpunkGlitch';

function CyberpunkGlitchEffect() {
  useCyberpunkGlitch();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minuto
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // Inicializar tema al cargar
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'cyberpunk', 'banana-cream');
    root.classList.add(savedTheme);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <CyberpunkGlitchEffect />
      {children}
    </QueryClientProvider>
  );
}


