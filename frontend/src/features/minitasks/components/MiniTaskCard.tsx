'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { MiniTaskResponse } from '@smarter-app/shared';
import { Clock, CheckCircle2, Circle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MiniTaskCardProps {
  miniTask: MiniTaskResponse;
  onStatusChange?: (id: string, status: string) => void;
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

export function MiniTaskCard({ miniTask, onStatusChange }: MiniTaskCardProps) {
  const Icon = statusIcons[miniTask.status] || Circle;

  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2 flex-1">
          <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium">{miniTask.title}</h4>
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
  );
}


