'use client';

import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useState } from 'react';

export function InstallBanner() {
  const { isInstallable, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  if (!isInstallable || dismissed) {
    return null;
  }

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      setDismissed(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('installBannerDismissed', 'true');
  };

  // Verificar si ya fue descartado
  if (typeof window !== 'undefined' && localStorage.getItem('installBannerDismissed')) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground p-4 shadow-lg z-50 md:bottom-4 md:left-4 md:right-auto md:rounded-lg md:max-w-sm">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Instalar Smarter App</h3>
          <p className="text-sm opacity-90">
            Agrega la app a tu pantalla de inicio para un acceso rápido
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-primary-foreground opacity-70 hover:opacity-100"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <Button
          onClick={handleInstall}
          variant="secondary"
          size="sm"
          className="flex-1"
        >
          Instalar
        </Button>
        <Button
          onClick={handleDismiss}
          variant="ghost"
          size="sm"
          className="text-primary-foreground"
        >
          Ahora no
        </Button>
      </div>
    </div>
  );
}


