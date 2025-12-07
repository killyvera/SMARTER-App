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
 * Ordena minitasks: primero las que están en progreso (IN_PROGRESS),
 * luego las demás distribuidas de manera random
 */
function sortMiniTasks(
  tasks: Array<MiniTask & { goal: { id: string; title: string; color: string | null } }>
) {
  // Separar en dos grupos: en progreso y demás
  const inProgress: typeof tasks = [];
  const others: typeof tasks = [];
  
  tasks.forEach(task => {
    if (task.status === 'IN_PROGRESS') {
      inProgress.push(task);
    } else {
      others.push(task);
    }
  });
  
  // Función para mezclar array de manera random usando el ID como semilla
  function shuffleArray<T extends { id: string }>(array: T[]): T[] {
    const shuffled = [...array];
    // Usar el ID como semilla para generar un orden pseudoaleatorio pero consistente
    shuffled.sort((a, b) => {
      let hashA = 0;
      let hashB = 0;
      for (let i = 0; i < a.id.length; i++) {
        hashA = ((hashA << 5) - hashA) + a.id.charCodeAt(i);
        hashA = hashA & hashA;
      }
      for (let i = 0; i < b.id.length; i++) {
        hashB = ((hashB << 5) - hashB) + b.id.charCodeAt(i);
        hashB = hashB & hashB;
      }
      // Combinar ambos hashes para crear un orden más aleatorio
      const combinedHash = (hashA + hashB) % 1000;
      return combinedHash - 500; // Retornar valor entre -500 y 500
    });
    return shuffled;
  }
  
  // Mezclar las demás de manera random
  const shuffledOthers = shuffleArray(others);
  
  // Retornar: primero las en progreso, luego las demás mezcladas
  return [...inProgress, ...shuffledOthers];
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
