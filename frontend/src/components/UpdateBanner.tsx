'use client';

import { useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppVersion } from '@/hooks/useAppVersion';

const DISMISSED_VERSION_KEY = 'updateBanner_dismissedVersion';

export function UpdateBanner() {
  const { isUpdateAvailable, updateApp, isChecking, currentVersion } = useAppVersion();
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isUpdateAvailable || !currentVersion) {
      setIsVisible(false);
      return;
    }

    // Verificar si el usuario ya descartó esta versión específica
    const dismissedVersion = localStorage.getItem(DISMISSED_VERSION_KEY);
    if (dismissedVersion === currentVersion) {
      // Ya fue descartado para esta versión
      setIsVisible(false);
      return;
    }

    // Mostrar el banner solo si hay actualización disponible y no fue descartado
    setIsVisible(true);
  }, [isUpdateAvailable, currentVersion, mounted]);

  if (!mounted || !isVisible) {
    return null;
  }

  const handleUpdate = async () => {
    setIsVisible(false);
    try {
      await updateApp();
    } catch (error) {
      console.error('Error al actualizar:', error);
      // Si falla, al menos recargar la página
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Guardar la versión descartada en localStorage
    if (currentVersion && typeof window !== 'undefined') {
      localStorage.setItem(DISMISSED_VERSION_KEY, currentVersion);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-primary text-primary-foreground shadow-lg border-t">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <div className="flex-1">
              <p className="font-semibold text-sm sm:text-base">
                Nueva versión disponible
              </p>
              <p className="text-xs sm:text-sm opacity-90">
                Hay una actualización disponible. Actualiza para ver los últimos cambios.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleUpdate}
              disabled={isChecking}
              size="sm"
              variant="secondary"
              className="bg-white text-primary hover:bg-gray-100"
            >
              {isChecking ? 'Actualizando...' : 'Actualizar ahora'}
            </Button>
            <Button
              onClick={handleDismiss}
              size="sm"
              variant="ghost"
              className="text-white hover:bg-primary/80"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

