'use client';

import { useMiniTasks } from '../hooks/useMiniTasks';
import { MiniTaskCard } from './MiniTaskCard';
import { useUpdateMiniTask } from '../hooks/useMiniTasks';

const columns = [
  { key: 'DRAFT', label: 'Borrador' },
  { key: 'PENDING', label: 'Pendiente' },
  { key: 'IN_PROGRESS', label: 'En Progreso' },
  { key: 'COMPLETED', label: 'Completada' },
];

export function MiniTaskBoard() {
  const updateMiniTask = useUpdateMiniTask();

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateMiniTask.mutateAsync({ id, data: { status: status as any } });
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((column) => {
        const { data: miniTasks } = useMiniTasks({ status: column.key });

        return (
          <div key={column.key} className="space-y-3">
            <h3 className="font-semibold text-lg mb-3">{column.label}</h3>
            <div className="space-y-2">
              {miniTasks?.map((task) => (
                <MiniTaskCard
                  key={task.id}
                  miniTask={task}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}


