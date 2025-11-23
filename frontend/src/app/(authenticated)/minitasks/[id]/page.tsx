'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMiniTask, useUnlockMiniTask, useUpdateMiniTask } from '@/features/minitasks/hooks/useMiniTasks';
import { MetricsDisplay } from '@/features/minitasks/components/MetricsDisplay';
import { MiniTaskJournal } from '@/features/minitasks/components/MiniTaskJournal';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, Lock, Unlock } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function MiniTaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: miniTask, isLoading } = useMiniTask(id);
  const unlockMiniTask = useUnlockMiniTask();
  const updateMiniTask = useUpdateMiniTask();
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleUnlock = async () => {
    setIsUnlocking(true);
    try {
      await unlockMiniTask.mutateAsync(id);
    } catch (error) {
      console.error('Error al desbloquear minitask:', error);
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await updateMiniTask.mutateAsync({ id, data: { status: status as any } });
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <p>Cargando...</p>
      </div>
    );
  }

  if (!miniTask) {
    return (
      <div className="container mx-auto p-4">
        <p>MiniTask no encontrada</p>
      </div>
    );
  }

  const isUnlocked = miniTask.unlocked ?? false;

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{miniTask.title}</CardTitle>
              {miniTask.description && (
                <p className="text-muted-foreground">{miniTask.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!isUnlocked && (
                <Lock className="h-5 w-5 text-muted-foreground" />
              )}
              {isUnlocked && (
                <Unlock className="h-5 w-5 text-green-600" />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Estado</p>
              <StatusBadge status={miniTask.status as any} />
            </div>
            {miniTask.deadline && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Fecha límite</p>
                <p className="font-medium">
                  {format(new Date(miniTask.deadline), 'dd MMM yyyy', { locale: es })}
                </p>
              </div>
            )}
          </div>

          {!isUnlocked && (
            <Button
              onClick={handleUnlock}
              disabled={isUnlocking}
              className="w-full"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isUnlocking ? 'Desbloqueando...' : 'Desbloquear y Configurar'}
            </Button>
          )}

          {isUnlocked && (
            <div className="flex gap-2 mt-4">
              {miniTask.status === 'PENDING' && (
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange('IN_PROGRESS')}
                >
                  Iniciar
                </Button>
              )}
              {miniTask.status === 'IN_PROGRESS' && (
                <Button onClick={() => handleStatusChange('COMPLETED')}>
                  Completar
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {isUnlocked && (
        <>
          <MetricsDisplay miniTask={miniTask} />
          <div className="mt-6">
            <MiniTaskJournal miniTaskId={miniTask.id} />
          </div>
        </>
      )}
    </div>
  );
}

