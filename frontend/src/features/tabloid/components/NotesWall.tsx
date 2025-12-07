'use client';

import { useMemo } from 'react';
import { StickyNote } from './StickyNote';
import type { MiniTask } from '@prisma/client';

interface NotesWallProps {
  miniTasks: Array<MiniTask & {
    goal: {
      id: string;
      title: string;
      color: string | null;
    };
  }>;
}

/**
 * Calcula el porcentaje de cumplimiento de una minitask
 */
function calculateCompletionPercentage(status: string): number {
  switch (status) {
    case 'COMPLETED':
      return 100;
    case 'IN_PROGRESS':
      return 50;
    case 'PENDING':
      return 25;
    case 'DRAFT':
      return 0;
    case 'CANCELLED':
      return 0;
    default:
      return 0;
  }
}

/**
 * Ordena minitasks: primero por porcentaje de cumplimiento (100% primero),
 * luego por fecha (deadline o createdAt)
 */
function sortMiniTasks(
  tasks: Array<MiniTask & { goal: { id: string; title: string; color: string | null } }>
) {
  return [...tasks].sort((a, b) => {
    // Prioridad 1: Por porcentaje de cumplimiento (100% primero)
    const percentageA = calculateCompletionPercentage(a.status);
    const percentageB = calculateCompletionPercentage(b.status);
    
    if (percentageB !== percentageA) {
      return percentageB - percentageA; // Mayor primero (100% arriba)
    }
    
    // Prioridad 2: Por fecha (deadline o createdAt)
    const dateA = a.deadline || a.createdAt;
    const dateB = b.deadline || b.createdAt;
    
    if (dateA && dateB) {
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    }
    if (dateA) return -1;
    if (dateB) return 1;
    return 0;
  });
}

/**
 * Genera un ángulo de rotación aleatorio pero consistente basado en el ID de la task
 * Rango: -2 a +2 grados
 */
function getRandomRotation(taskId: string): number {
  // Usar el ID como semilla para generar un número pseudoaleatorio
  let hash = 0;
  for (let i = 0; i < taskId.length; i++) {
    hash = ((hash << 5) - hash) + taskId.charCodeAt(i);
    hash = hash & hash; // Convertir a entero de 32 bits
  }
  // Generar un número entre -2 y +2
  return ((hash % 400) / 100) - 2; // -2 a +2 grados
}

export function NotesWall({ miniTasks }: NotesWallProps) {
  // Ordenar minitasks según las reglas especificadas (100% primero)
  const sortedTasks = useMemo(() => {
    return sortMiniTasks(miniTasks);
  }, [miniTasks]);

  return (
    <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-1 sm:gap-2 p-1 sm:p-1 md:p-2 auto-rows-fr">
      {sortedTasks.map((task) => {
        const rotation = getRandomRotation(task.id);
        return (
          <div 
            key={task.id} 
            className="w-full aspect-square overflow-visible flex items-center justify-center p-0.5 sm:p-1"
            style={{
              transform: `rotate(${rotation}deg)`,
            }}
          >
            <StickyNote miniTask={task} />
          </div>
        );
      })}
    </div>
  );
}
