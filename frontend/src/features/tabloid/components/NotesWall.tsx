'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverlay,
} from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { useUpdateNotePosition } from '../hooks/useUpdateNotePosition';
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
 * Ordena minitasks: primero por porcentaje de cumplimiento (mayor primero),
 * luego por fecha (deadline o createdAt)
 */
function sortMiniTasks(
  tasks: Array<MiniTask & { goal: { id: string; title: string; color: string | null } }>
) {
  return [...tasks].sort((a, b) => {
    // Prioridad 1: Por porcentaje de cumplimiento (mayor primero)
    const percentageA = calculateCompletionPercentage(a.status);
    const percentageB = calculateCompletionPercentage(b.status);
    
    if (percentageB !== percentageA) {
      return percentageB - percentageA; // Mayor primero
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

export function NotesWall({ miniTasks }: NotesWallProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [columns, setColumns] = useState(4);
  const updatePosition = useUpdateNotePosition();

  // Detectar número de columnas según el ancho de pantalla
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setColumns(2); // mobile: 2 columnas
      } else if (width < 1024) {
        setColumns(3); // tablet: 3 columnas
      } else {
        setColumns(4); // desktop: 4 columnas
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  // Configurar sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Requiere 8px de movimiento para activar
      },
    })
  );

  // Ordenar minitasks según las reglas especificadas
  const sortedTasks = useMemo(() => {
    return sortMiniTasks(miniTasks);
  }, [miniTasks]);

  // Inicializar posiciones desde las guardadas en DB o usar posiciones calculadas
  const initialPositions = useMemo(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    const noteSize = 192; // 48 * 4 = 192px (w-48 h-48 en Tailwind)
    
    sortedTasks.forEach((task, index) => {
      if (task.positionX !== null && task.positionY !== null) {
        pos[task.id] = { x: task.positionX, y: task.positionY };
      } else {
        // Posición inicial en grid sin espacios (notas juntas)
        const col = index % columns;
        const row = Math.floor(index / columns);
        pos[task.id] = {
          x: col * noteSize, // Sin margen, notas juntas
          y: row * noteSize, // Sin margen, notas juntas
        };
      }
    });
    return pos;
  }, [sortedTasks, columns]);

  // Usar posiciones iniciales o las actualizadas
  const currentPositions = useMemo(() => {
    return { ...initialPositions, ...positions };
  }, [initialPositions, positions]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, delta } = event;
      const taskId = active.id as string;
      
      if (!delta) {
        setActiveId(null);
        return;
      }

      const currentPos = currentPositions[taskId] || { x: 0, y: 0 };
      const newX = currentPos.x + delta.x;
      const newY = currentPos.y + delta.y;

      // Actualizar posición local inmediatamente
      setPositions((prev) => ({
        ...prev,
        [taskId]: { x: newX, y: newY },
      }));

      // Guardar en la base de datos (con debounce implícito por la mutación)
      try {
        await updatePosition.mutateAsync({
          miniTaskId: taskId,
          position: {
            positionX: newX,
            positionY: newY,
          },
        });
      } catch (error) {
        console.error('Error al guardar posición:', error);
        // Revertir posición local si falla
        setPositions((prev) => {
          const updated = { ...prev };
          delete updated[taskId];
          return updated;
        });
      }

      setActiveId(null);
    },
    [currentPositions, updatePosition]
  );

  const activeTask = activeId ? sortedTasks.find((t) => t.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="relative w-full h-full min-h-screen overflow-x-hidden">
        {sortedTasks.map((task) => (
          <DraggableNote
            key={task.id}
            task={task}
            position={currentPositions[task.id] || { x: 0, y: 0 }}
            isDragging={activeId === task.id}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div style={{ opacity: 0.8, transform: 'rotate(2deg)' }}>
            <StickyNote miniTask={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function DraggableNote({
  task,
  position,
  isDragging,
}: {
  task: MiniTask & {
    goal: {
      id: string;
      title: string;
      color: string | null;
    };
  };
  position: { x: number; y: number };
  isDragging: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  const style = {
    left: `${position.x}px`,
    top: `${position.y}px`,
    zIndex: isDragging ? 1000 : 1,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      className="absolute"
      style={style}
      {...listeners}
      {...attributes}
    >
      <StickyNote miniTask={task} />
    </div>
  );
}

