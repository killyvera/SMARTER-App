'use client';

import { useState, useEffect } from 'react';

interface VersionInfo {
  version: string;
  buildTime: string;
  timestamp: number;
}

const VERSION_STORAGE_KEY = 'app_version';
const VERSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos

export function useAppVersion() {
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const checkVersion = async () => {
    if (typeof window === 'undefined') return;
    
    setIsChecking(true);
    try {
      // Usar timestamp para evitar caché del navegador
      const response = await fetch(`/api/version?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      
      if (!response.ok) {
        throw new Error('Error al verificar versión');
      }
      
      const versionInfo: VersionInfo = await response.json();
      const storedVersion = localStorage.getItem(VERSION_STORAGE_KEY);
      
      setCurrentVersion(versionInfo.version);
      
      // Si hay una versión almacenada y es diferente, hay actualización disponible
      if (storedVersion && storedVersion !== versionInfo.version) {
        console.log('Nueva versión detectada:', {
          stored: storedVersion,
          current: versionInfo.version,
        });
        setIsUpdateAvailable(true);
      } else if (!storedVersion) {
        // Primera vez, guardar versión actual
        localStorage.setItem(VERSION_STORAGE_KEY, versionInfo.version);
        console.log('Versión inicial guardada:', versionInfo.version);
        setIsUpdateAvailable(false);
      } else {
        // Versión coincide, no hay actualización disponible
        setIsUpdateAvailable(false);
      }
    } catch (error) {
      console.error('Error verificando versión:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const updateApp = async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      // Si no hay service worker, recargar la página
      window.location.reload();
      return;
    }

    try {
      // Limpiar caché
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }

      // Actualizar service worker
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        // Esperar a que el nuevo service worker esté listo
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }

      // Actualizar versión almacenada
      if (currentVersion) {
        localStorage.setItem(VERSION_STORAGE_KEY, currentVersion);
      }

      // Recargar la página
      window.location.reload();
    } catch (error) {
      console.error('Error actualizando aplicación:', error);
      // Si falla, al menos recargar
      window.location.reload();
    }
  };

  useEffect(() => {
    // Verificar versión al montar
    checkVersion();

    // Verificar periódicamente
    const interval = setInterval(checkVersion, VERSION_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return {
    currentVersion,
    isUpdateAvailable,
    isChecking,
    checkVersion,
    updateApp,
  };
}

