'use client';

import { useMemo } from 'react';
import { darkenColor } from '@/utils/colorUtils';
import type { MiniTask } from '@prisma/client';

interface StickyNoteProps {
  miniTask: MiniTask & {
    goal: {
      id: string;
      title: string;
      color: string | null;
    };
  };
  style?: React.CSSProperties;
}

/**
 * Calcula el porcentaje de cumplimiento de una minitask basado en su estado
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

export function StickyNote({ miniTask, style }: StickyNoteProps) {
  // Obtener color del goal (heredado por la minitask)
  const baseColor = useMemo(() => {
    return miniTask.color || miniTask.goal.color || '#3b82f6';
  }, [miniTask.color, miniTask.goal.color]);

  // Calcular color oscurecido para la barra de progreso
  const progressBarColor = useMemo(() => {
    return darkenColor(baseColor, 30);
  }, [baseColor]);

  // Calcular porcentaje de cumplimiento
  const completionPercentage = useMemo(() => {
    return calculateCompletionPercentage(miniTask.status);
  }, [miniTask.status]);

  return (
    <div
      className="relative w-48 h-48 cursor-move transition-transform hover:scale-105 flex flex-col shadow-lg"
      style={{
        backgroundColor: baseColor,
        ...style,
      }}
    >
      {/* Título - Ocupa casi todo el espacio, texto grande */}
      <div className="flex-1 flex items-center justify-center p-3 pb-2">
        <h3 
          className="font-bold text-gray-900 text-center break-words"
          style={{
            fontSize: 'clamp(1rem, 4vw, 1.75rem)',
            lineHeight: '1.1',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
          }}
        >
          {miniTask.title}
        </h3>
      </div>

      {/* Fila inferior: Estado (medalla) y Barra de progreso */}
      <div className="px-3 pb-3 flex items-center gap-2">
        {/* Estado como medalla - 70% del tamaño */}
        <span 
          className="rounded-full font-semibold text-gray-800 uppercase bg-white/70 shrink-0"
          style={{
            padding: '0.175rem 0.35rem', // 70% de px-2 py-1 (0.5rem = 8px, 70% = 5.6px ≈ 0.35rem)
            fontSize: '0.525rem', // 70% de text-xs (0.75rem, 70% = 0.525rem)
            lineHeight: '1',
          }}
        >
          {miniTask.status}
        </span>
        
        {/* Barra de progreso - Delgada, centrada y redondeada */}
        <div className="flex-1 h-2 bg-gray-300 rounded-full relative overflow-hidden">
          {/* Parte completada */}
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${completionPercentage}%`,
              backgroundColor: progressBarColor,
            }}
          />
        </div>
      </div>
    </div>
  );
}

