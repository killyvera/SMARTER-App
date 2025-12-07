'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Fingerprint, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useBiometric } from '@/hooks/useBiometric';

interface BiometricSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BiometricSetupDialog({
  open,
  onOpenChange,
  onSuccess,
}: BiometricSetupDialogProps) {
  const { registerBiometric } = useBiometric();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await registerBiometric();
      setSuccess(true);
      
      // Cerrar después de 2 segundos
      setTimeout(() => {
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar autenticación biométrica');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Configurar Autenticación Biométrica
          </DialogTitle>
          <DialogDescription>
            Registra tu método de autenticación biométrica (PIN, huella digital, reconocimiento facial, etc.) para iniciar sesión de forma rápida y segura en futuras visitas.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {success ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <p className="text-center text-sm font-medium">
                ¡Autenticación biométrica registrada exitosamente!
              </p>
              <p className="text-center text-xs text-muted-foreground">
                Ahora podrás iniciar sesión con tu método de autenticación (PIN, huella, reconocimiento facial, etc.).
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4 py-4">
                <Fingerprint className="h-16 w-16 text-muted-foreground" />
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium">
                    ¿Deseas configurar la autenticación biométrica?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Podrás usar tu método de autenticación (PIN, huella digital, reconocimiento facial, etc.) para iniciar sesión de forma rápida y segura.
                  </p>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Error al registrar</p>
                    <p className="text-xs">{error}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          {!success && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                disabled={isLoading}
              >
                Omitir
              </Button>
              <Button
                type="button"
                onClick={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Fingerprint className="mr-2 h-4 w-4 animate-pulse" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <Fingerprint className="mr-2 h-4 w-4" />
                    Registrar Autenticación Biométrica
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

