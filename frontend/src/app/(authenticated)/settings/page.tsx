'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/api';
import { AlertTriangle, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const { logout } = useAuth();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">
          Gestiona tu cuenta y configuración
        </p>
      </div>

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
    </div>
  );
}

