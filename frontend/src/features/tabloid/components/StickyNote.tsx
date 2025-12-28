'use client';

import { useMemo } from 'react';
import { darkenColor } from '@/utils/colorUtils';
import type { MiniTask } from '@/types/miniTask';

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
  // Obtener color del goal (heredado por la minitask) - mismo color para todos los temas
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
      className="relative w-full h-full flex flex-col shadow-lg overflow-hidden"
      style={{
        backgroundColor: baseColor,
        aspectRatio: '1 / 1',
        minHeight: 0,
        ...style,
      }}
    >
      {/* Título - Ocupa casi todo el espacio, texto grande con fuente estilo post-it */}
      <div className="flex-1 flex items-center justify-center p-3 pb-2 min-h-0 overflow-hidden">
        <h3 
          className="text-center break-words sticky-note-title"
          style={{
            fontFamily: 'var(--font-marker), "Permanent Marker", cursive',
            fontSize: 'clamp(0.875rem, 2.5vw, 2.5rem)',
            lineHeight: '1.2',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxHeight: '100%',
            color: '#000000',
            fontWeight: 'normal',
            textTransform: 'none',
            textShadow: 'none',
          }}
        >
          {miniTask.title}
        </h3>
      </div>

      {/* Fila inferior: Estado (medalla) y Barra de progreso */}
      <div className="px-3 pb-3 flex items-center gap-2">
        {/* Estado como medalla - 70% del tamaño con sombra oscura y texto blanco */}
        <span 
          className="rounded-full font-semibold uppercase shrink-0"
          style={{
            padding: 'clamp(0.175rem, 0.5vw, 0.5rem) clamp(0.35rem, 1vw, 0.75rem)',
            fontSize: 'clamp(0.525rem, 1.2vw, 0.875rem)',
            lineHeight: '1',
            color: 'rgba(255, 255, 255, 0.85)', // Texto blanco con opacidad reducida
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.4), 0 0 4px rgba(0, 0, 0, 0.3)',
            boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.2), 0 1px 3px rgba(0, 0, 0, 0.3)',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
          }}
        >
          {miniTask.status}
        </span>
        
        {/* Barra de progreso - Delgada, centrada y redondeada */}
        <div className="flex-1 bg-gray-300 rounded-full relative overflow-hidden" style={{ height: 'clamp(0.5rem, 1.2vw, 0.75rem)' }}>
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

