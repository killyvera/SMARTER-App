'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import type { GoalResponse } from '@smarter-app/shared';
import { CheckCircle2, Clock, FileText } from 'lucide-react';
import { GoalProgressBar } from './GoalProgressBar';
import { calculateGoalProgress } from '../utils/calculateGoalProgress';

interface GoalCardProps {
  goal: GoalResponse & {
    miniTasks?: Array<{ id: string; status: string }>;
  };
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Borrador',
  ACTIVE: 'Activa',
  COMPLETED: 'Completada',
  ARCHIVED: 'Archivada',
};

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  ARCHIVED: 'bg-gray-100 text-gray-600',
};

export function GoalCard({ goal }: GoalCardProps) {
  // Debug: verificar que las minitasks estén llegando
  if (process.env.NODE_ENV === 'development') {
    console.log('[GoalCard]', {
      goalId: goal.id,
      goalTitle: goal.title,
      miniTasksCount: goal.miniTasks?.length || 0,
      miniTasks: goal.miniTasks,
    });
  }
  
  // Calcular progreso desde las minitasks
  const progress = calculateGoalProgress(goal.miniTasks || []);
  
  // El progreso se calcula siempre basado en las minitasks completadas
  // No forzamos 100% solo porque la goal esté en estado COMPLETED
  const finalProgress = progress;

  return (
    <Link href={`/goals/${goal.id}`}>
      <div className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg flex-1">{goal.title}</h3>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${statusColors[goal.status]}`}
          >
            {statusLabels[goal.status]}
          </span>
        </div>

        {goal.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {goal.description}
          </p>
        )}

        {/* Barra de progreso - Solo mostrar si hay minitasks o si la goal está activa/completada */}
        {(goal.status === 'ACTIVE' || goal.status === 'COMPLETED' || finalProgress.total > 0) && (
          <div className="mb-3">
            <GoalProgressBar
              completed={finalProgress.completed}
              total={finalProgress.total}
              percentage={finalProgress.percentage}
              size="sm"
            />
          </div>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {goal.deadline && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                {format(new Date(goal.deadline), 'dd MMM yyyy', { locale: es })}
              </span>
            </div>
          )}

          {goal.smarterScore && (
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>Score: {goal.smarterScore.average.toFixed(0)}</span>
            </div>
          )}

          {goal.status === 'ACTIVE' && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>Activa</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}


