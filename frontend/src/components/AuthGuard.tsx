'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAppVersion } from '@/hooks/useAppVersion';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { checkVersion } = useAppVersion();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    } else if (isAuthenticated) {
      // Verificar versión cuando el usuario está autenticado
      checkVersion();
    }
  }, [isAuthenticated, isLoading, router, checkVersion]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Smarter App</h1>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}


