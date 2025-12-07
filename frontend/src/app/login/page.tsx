'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/api';
import { useAppVersion } from '@/hooks/useAppVersion';
import { useBiometric } from '@/hooks/useBiometric';
import { Fingerprint } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { BiometricSetupDialog } from '@/components/biometric/BiometricSetupDialog';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<{
    biometricEnabled: boolean;
    hasCredentials: boolean;
    hasEnabledCredentials: boolean;
  } | null>(null);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<{ id: string; email: string } | null>(null);
  
  const { isAvailable, authenticateBiometric } = useBiometric();

  // Cargar email y estado de biometría desde localStorage al cargar la página
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Verificar si hay una bandera de biometría configurada
    const hasBiometricFlag = localStorage.getItem('biometricConfigured') === 'true';
    const savedEmail = localStorage.getItem('lastBiometricEmail');

    if (hasBiometricFlag && savedEmail && isAvailable) {
      // Si hay biometría configurada, cargar el email y verificar estado
      setEmail(savedEmail);
      
      // Verificar estado de biometría automáticamente
      const checkBiometricStatus = async () => {
        try {
          const status = await apiRequest<{
            biometricEnabled: boolean;
            hasCredentials: boolean;
            hasEnabledCredentials: boolean;
          }>('/auth/biometric/status', {
            method: 'POST',
            body: JSON.stringify({ email: savedEmail }),
          });
          setBiometricStatus(status);
        } catch (error) {
          console.error('Error al verificar estado de biometría:', error);
          setBiometricStatus(null);
          // Si falla, limpiar la bandera
          localStorage.removeItem('biometricConfigured');
          localStorage.removeItem('lastBiometricEmail');
        }
      };

      checkBiometricStatus();
    }
  }, [isAvailable]);

  // Verificar estado de biometría cuando cambia el email
  useEffect(() => {
    const checkBiometricStatus = async () => {
      if (!email || !isAvailable) {
        setBiometricStatus(null);
        return;
      }

      try {
        const status = await apiRequest<{
          biometricEnabled: boolean;
          hasCredentials: boolean;
          hasEnabledCredentials: boolean;
        }>('/auth/biometric/status', {
          method: 'POST',
          body: JSON.stringify({ email }),
        });
        setBiometricStatus(status);
      } catch (error) {
        console.error('Error al verificar estado de biometría:', error);
        setBiometricStatus(null);
      }
    };

    checkBiometricStatus();
  }, [email, isAvailable]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await apiRequest<{ token: string; user: { id: string; email: string } }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        }
      );

      // Guardar token y usuario
      login(response.token, response.user);
      setLoggedInUser(response.user);

      // Guardar email en localStorage para biometría
      if (typeof window !== 'undefined') {
        localStorage.setItem('lastBiometricEmail', response.user.email);
      }

      // Si es móvil y tiene biometría disponible pero no registrada, mostrar diálogo
      if (isAvailable && biometricStatus && !biometricStatus.hasCredentials) {
        setShowSetupDialog(true);
      } else {
        // Si tiene biometría configurada, guardar la bandera
        if (isAvailable && biometricStatus && biometricStatus.hasEnabledCredentials) {
          localStorage.setItem('biometricConfigured', 'true');
        }
        // Redirigir al dashboard (home)
        router.push('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Smarter App</h1>
          <p className="mt-2 text-muted-foreground">
            Inicia sesión para gestionar tus metas
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            ¿No tienes una cuenta?{' '}
            <Link href="/register" className="text-primary hover:underline">
              Regístrate
            </Link>
          </p>
        </div>

        {/* Botón de autenticación biométrica - Solo mostrar si WebAuthn está soportado y hay credenciales habilitadas */}
        {isAvailable && biometricStatus?.biometricEnabled && biometricStatus?.hasEnabledCredentials && (
          <div className="space-y-2">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">O</span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isBiometricLoading || isLoading}
              onClick={async () => {
                setIsBiometricLoading(true);
                setError(null);
                try {
                  const result = await authenticateBiometric(email);
                  login(result.token, result.user);
                  
                  // Guardar email y bandera de biometría en localStorage
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('lastBiometricEmail', result.user.email);
                    localStorage.setItem('biometricConfigured', 'true');
                  }
                  
                  router.push('/');
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Error al autenticar con biometría');
                } finally {
                  setIsBiometricLoading(false);
                }
              }}
            >
              <Fingerprint className="mr-2 h-4 w-4" />
              {isBiometricLoading ? 'Autenticando...' : 'Iniciar con autenticación biométrica'}
            </Button>
          </div>
        )}

      </div>

      <BiometricSetupDialog
        open={showSetupDialog}
        onOpenChange={(open) => {
          setShowSetupDialog(open);
          if (!open && loggedInUser) {
            // Redirigir después de cerrar el diálogo
            router.push('/');
          }
        }}
        onSuccess={() => {
          // Redirigir después de registro exitoso
          router.push('/');
        }}
      />
    </div>
  );
}


