'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { MiniTaskResponse } from '@smarter-app/shared';
import { Clock, CheckCircle2, Circle, XCircle, Lock, Unlock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { MetricsDisplay } from './MetricsDisplay';
import { MiniTaskJournal } from './MiniTaskJournal';

interface MiniTaskCardProps {
  miniTask: MiniTaskResponse & { unlocked?: boolean };
  onStatusChange?: (id: string, status: string) => void;
  onUnlock?: (id: string) => Promise<void>;
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Borrador',
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

const statusIcons: Record<string, typeof Circle> = {
  DRAFT: Circle,
  PENDING: Clock,
  IN_PROGRESS: Clock,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
};

export function MiniTaskCard({ miniTask, onStatusChange, onUnlock }: MiniTaskCardProps) {
  const Icon = statusIcons[miniTask.status] || Circle;
  const [isUnlocking, setIsUnlocking] = useState(false);
  const isUnlocked = miniTask.unlocked ?? false;

  // Log inicial para debugging
  console.log('📋 [MINITASK CARD] Renderizando minitask:', {
    id: miniTask.id,
    title: miniTask.title,
    status: miniTask.status,
    unlocked: isUnlocked,
    hasScore: !!miniTask.score,
  });

  const handleUnlock = async () => {
    if (!onUnlock) return;
    
    console.log('🔓 [MINITASK CARD] Iniciando unlock (validar + mejorar + configurar):', { 
      miniTaskId: miniTask.id, 
      title: miniTask.title 
    });
    setIsUnlocking(true);
    try {
      await onUnlock(miniTask.id);
      console.log('✅ [MINITASK CARD] Unlock exitoso - Minitask mejorada y configurada:', { 
        miniTaskId: miniTask.id 
      });
    } catch (error) {
      console.error('❌ [MINITASK CARD] Error al desbloquear minitask:', {
        miniTaskId: miniTask.id,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2 flex-1">
          <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{miniTask.title}</h4>
              {!isUnlocked && (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
              {isUnlocked && (
                <Unlock className="h-4 w-4 text-green-600" />
              )}
            </div>
            {miniTask.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {miniTask.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        {miniTask.deadline && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              {format(new Date(miniTask.deadline), 'dd MMM', { locale: es })}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {!isUnlocked && onUnlock && (
            <Button
              size="sm"
              variant="default"
              onClick={handleUnlock}
              disabled={isUnlocking}
            >
              <Sparkles className="h-4 w-4 mr-1" />
              {isUnlocking ? 'Desbloqueando...' : 'Desbloquear y Configurar'}
            </Button>
          )}

          {miniTask.status === 'PENDING' && onStatusChange && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStatusChange(miniTask.id, 'IN_PROGRESS')}
            >
              Iniciar
            </Button>
          )}

          {miniTask.status === 'IN_PROGRESS' && onStatusChange && (
            <Button
              size="sm"
              onClick={() => onStatusChange(miniTask.id, 'COMPLETED')}
            >
              Completar
            </Button>
          )}
        </div>
      </div>

      {/* Mostrar métricas y gráficas si está desbloqueada */}
      {isUnlocked && (
        <>
          <MetricsDisplay miniTask={miniTask} />
          <div className="mt-4 pt-4 border-t">
            <MiniTaskJournal miniTaskId={miniTask.id} />
          </div>
        </>
      )}
    </div>
  );
}


