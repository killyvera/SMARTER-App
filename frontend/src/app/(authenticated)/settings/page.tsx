'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/api';
import { AlertTriangle, Trash2, Fingerprint, Smartphone, Monitor, Power, PowerOff } from 'lucide-react';
import { useBiometric } from '@/hooks/useBiometric';
import { BiometricSetupDialog } from '@/components/biometric/BiometricSetupDialog';
import { ThemeSelector } from '@/components/theme/ThemeSelector';

export default function SettingsPage() {
  const { logout, user } = useAuth();
  const router = useRouter();
  const { isAvailable, registerBiometric, secureContextError } = useBiometric();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [credentials, setCredentials] = useState<Array<{
    id: string;
    credentialId: string;
    deviceName: string;
    authenticatorType: string;
    enabled: boolean;
    createdAt: string;
    lastUsedAt: string | null;
  }>>([]);
  const [loadingCredentials, setLoadingCredentials] = useState(false);

  // Cargar estado de biometría y credenciales
  useEffect(() => {
    const loadBiometricStatus = async () => {
      if (!user?.email) return;

      try {
        const status = await apiRequest<{
          biometricEnabled: boolean;
          hasCredentials: boolean;
          hasEnabledCredentials: boolean;
          totalCredentials: number;
          enabledCredentials: number;
          credentials: Array<{
            id: string;
            deviceName: string;
            authenticatorType: string;
            enabled: boolean;
          }>;
        }>('/auth/biometric/status', {
          method: 'POST',
          body: JSON.stringify({ email: user.email }),
        });
        setBiometricEnabled(status.biometricEnabled);
        setHasCredentials(status.hasCredentials);
        
        // Cargar detalles completos de credenciales
        if (status.hasCredentials) {
          await loadCredentials();
        }
      } catch (error) {
        console.error('Error al cargar estado de biometría:', error);
      }
    };

    loadBiometricStatus();
  }, [user]);

  const loadCredentials = async () => {
    setLoadingCredentials(true);
    try {
      const response = await apiRequest<{
        credentials: Array<{
          id: string;
          credentialId: string;
          deviceName: string;
          authenticatorType: string;
          enabled: boolean;
          createdAt: string;
          lastUsedAt: string | null;
        }>;
      }>('/auth/biometric/credentials', {
        method: 'GET',
      });
      setCredentials(response.credentials);
    } catch (error) {
      console.error('Error al cargar credenciales:', error);
    } finally {
      setLoadingCredentials(false);
    }
  };

  const handleToggleCredential = async (credentialId: string, enabled: boolean) => {
    try {
      await apiRequest('/auth/biometric/credentials/toggle', {
        method: 'POST',
        body: JSON.stringify({ credentialId, enabled }),
      });
      await loadCredentials();
    } catch (error) {
      console.error('Error al actualizar credencial:', error);
      alert('Error al actualizar la credencial');
    }
  };

  const handleDeleteCredential = async (credentialId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta credencial?')) {
      return;
    }
    try {
      await apiRequest(`/auth/biometric/credentials/delete?credentialId=${credentialId}`, {
        method: 'DELETE',
      });
      await loadCredentials();
      // Recargar estado para actualizar hasCredentials
      const status = await apiRequest<{
        hasCredentials: boolean;
        hasEnabledCredentials: boolean;
      }>('/auth/biometric/status', {
        method: 'POST',
        body: JSON.stringify({ email: user?.email }),
      });
      setHasCredentials(status.hasCredentials);
      
      // Si no hay credenciales habilitadas, limpiar la bandera
      if (typeof window !== 'undefined' && !status.hasEnabledCredentials) {
        localStorage.removeItem('biometricConfigured');
        localStorage.removeItem('lastBiometricEmail');
      }
    } catch (error) {
      console.error('Error al eliminar credencial:', error);
      alert('Error al eliminar la credencial');
    }
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    setIsBiometricLoading(true);
    try {
      await apiRequest('/auth/biometric/toggle', {
        method: 'POST',
        body: JSON.stringify({ enabled }),
      });
      setBiometricEnabled(enabled);
      
      // Actualizar localStorage
      if (typeof window !== 'undefined') {
        if (enabled) {
          localStorage.setItem('biometricConfigured', 'true');
          if (user?.email) {
            localStorage.setItem('lastBiometricEmail', user.email);
          }
        } else {
          // Si se desactiva, limpiar la bandera
          localStorage.removeItem('biometricConfigured');
          localStorage.removeItem('lastBiometricEmail');
        }
      }
      
      // Si se activa pero no hay credenciales, mostrar diálogo de registro
      if (enabled && !hasCredentials && isAvailable) {
        setShowSetupDialog(true);
      } else {
        setHasCredentials(enabled);
      }
    } catch (error) {
      console.error('Error al actualizar biometría:', error);
      alert('Error al actualizar la configuración de biometría');
    } finally {
      setIsBiometricLoading(false);
    }
  };

  const handleSetupSuccess = async () => {
    setHasCredentials(true);
    setShowSetupDialog(false);
    await loadCredentials();
  };

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    try {
      await apiRequest('/user/delete-all', { method: 'DELETE' });
      // Cerrar sesión y redirigir a login
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Error al eliminar datos:', error);
      alert('Error al eliminar los datos. Por favor, intenta nuevamente.');
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold">Configuración</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Gestiona tu cuenta y configuración
        </p>
      </div>

      {/* Mensaje de advertencia si hay problemas de contexto seguro */}
      {secureContextError && (
        <Card className="border-yellow-500/20 bg-yellow-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              ⚠️ Autenticación biométrica no disponible
            </CardTitle>
            <CardDescription className="text-yellow-600 dark:text-yellow-500">
              {secureContextError}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Selector de Tema */}
      <ThemeSelector />

      {/* Sección de Autenticación Biométrica - Solo mostrar si WebAuthn está soportado */}
      {isAvailable && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5" />
              Autenticación Biométrica
            </CardTitle>
            <CardDescription>
              Configura el uso de autenticación biométrica (PIN, huella digital, reconocimiento facial, etc.) para iniciar sesión
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="space-y-0.5 flex-1 min-w-0">
                <Label htmlFor="biometric-toggle" className="text-sm sm:text-base">
                  Activar autenticación biométrica
                </Label>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {biometricEnabled && hasCredentials
                    ? 'Puedes iniciar sesión con PIN, huella digital, reconocimiento facial u otro método biométrico'
                    : biometricEnabled && !hasCredentials
                    ? 'Registra tu método de autenticación (PIN, huella, etc.) para activar'
                    : 'Permite iniciar sesión con métodos biométricos (PIN, huella, reconocimiento facial, etc.)'}
                </p>
              </div>
              <Switch
                id="biometric-toggle"
                checked={biometricEnabled}
                onCheckedChange={handleBiometricToggle}
                disabled={isBiometricLoading}
              />
            </div>

            {biometricEnabled && !hasCredentials && (
              <Button
                variant="outline"
                onClick={() => setShowSetupDialog(true)}
                className="w-full"
              >
                <Fingerprint className="mr-2 h-4 w-4" />
                Registrar Autenticación Biométrica
              </Button>
            )}

            {biometricEnabled && hasCredentials && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Métodos de autenticación registrados</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSetupDialog(true)}
                  >
                    <Fingerprint className="mr-2 h-4 w-4" />
                    Agregar nuevo
                  </Button>
                </div>

                {loadingCredentials ? (
                  <p className="text-sm text-muted-foreground">Cargando credenciales...</p>
                ) : credentials.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay credenciales registradas</p>
                ) : (
                  <div className="space-y-2">
                    {credentials.map((cred) => {
                      const isPlatform = cred.authenticatorType === 'platform';
                      const Icon = isPlatform ? Monitor : Smartphone;
                      const typeLabel = isPlatform 
                        ? 'Plataforma (PC/Windows Hello)' 
                        : cred.authenticatorType === 'cross-platform'
                        ? 'Passkey (Cross-platform)'
                        : 'Otro método';

                      return (
                        <div
                          key={cred.id}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 rounded-lg border p-3"
                        >
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 w-full sm:w-auto">
                            <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium truncate">
                                {cred.deviceName}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {typeLabel}
                              </p>
                              {cred.lastUsedAt && (
                                <p className="text-xs text-muted-foreground truncate">
                                  Último uso: {new Date(cred.lastUsedAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end sm:justify-start">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleCredential(cred.credentialId, !cred.enabled)}
                              title={cred.enabled ? 'Desactivar' : 'Activar'}
                            >
                              {cred.enabled ? (
                                <Power className="h-4 w-4 text-green-600" />
                              ) : (
                                <PowerOff className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCredential(cred.credentialId)}
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Datos del Usuario</CardTitle>
          <CardDescription>
            Gestiona tus datos personales y contenido
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-destructive">
                  Zona de Peligro
                </h3>
                <p className="text-sm text-muted-foreground">
                  Al borrar todos tus datos, se eliminarán permanentemente:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Todas tus metas (Goals)</li>
                  <li>Todas tus MiniTasks</li>
                  <li>Todos tus ajustes (Readjustments)</li>
                  <li>Todos los scores y validaciones</li>
                </ul>
                <p className="text-sm font-medium text-destructive mt-2">
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
          </div>

          {!showConfirm ? (
            <Button
              variant="destructive"
              onClick={() => setShowConfirm(true)}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Borrar Todos los Datos
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
                <p className="text-sm font-medium mb-2">
                  ¿Estás seguro de que deseas eliminar todos tus datos?
                </p>
                <p className="text-xs text-muted-foreground">
                  Esta acción cerrará tu sesión y te redirigirá al login.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleDeleteAll}
                  disabled={isDeleting}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeleting ? 'Eliminando...' : 'Sí, Eliminar Todo'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowConfirm(false)}
                  disabled={isDeleting}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <BiometricSetupDialog
        open={showSetupDialog}
        onOpenChange={setShowSetupDialog}
        onSuccess={handleSetupSuccess}
      />
    </div>
  );
}

