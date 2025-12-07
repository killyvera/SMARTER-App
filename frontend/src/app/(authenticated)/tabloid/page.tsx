'use client';

import { useMiniTasks } from '@/features/minitasks/hooks/useMiniTasks';
import { NotesWall } from '@/features/tabloid/components/NotesWall';

export default function TabloidPage() {
  const { data: miniTasks, isLoading, error } = useMiniTasks();

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando notas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-12">
          <p className="text-destructive">Error al cargar las notas</p>
        </div>
      </div>
    );
  }

  if (!miniTasks || miniTasks.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-4">Tabloid</h1>
          <p className="text-muted-foreground">
            No hay minitasks aún. Crea algunas minitasks para verlas aquí.
          </p>
        </div>
      </div>
    );
  }

  // Asegurar que todas las minitasks tengan información del goal con color
  const tasksWithGoal = miniTasks.map((task: any) => {
    // Si la minitask no tiene goal incluido, necesitamos obtenerlo
    // Por ahora asumimos que viene del repositorio con goal incluido
    if (!task.goal) {
      console.warn('MiniTask sin goal:', task.id);
    }
    return task;
  }).filter((task: any) => task.goal); // Filtrar las que no tienen goal

  return (
    <div className="w-full h-screen overflow-hidden max-w-full">
      <div className="p-4 border-b bg-background">
        <h1 className="text-2xl font-bold">Tabloid</h1>
        <p className="text-sm text-muted-foreground">
          Muro de notas - Arrastra las notas para reorganizarlas
        </p>
      </div>
      <div className="w-full h-[calc(100vh-5rem)] overflow-auto overflow-x-hidden">
        <NotesWall miniTasks={tasksWithGoal} />
      </div>
    </div>
  );
}

