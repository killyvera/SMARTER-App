'use client';

import { useEffect } from 'react';
import { useGoals } from '@/features/goals/hooks/useGoals';
import { GoalCard } from '@/features/goals/components/GoalCard';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function GoalsPage() {
  const { data: goals, isLoading } = useGoals();
  const queryClient = useQueryClient();

  // Revisar y actualizar el estado de las goals al cargar la página
  useEffect(() => {
    const checkGoalsCompletion = async () => {
      try {
        await apiRequest('/goals/check-completion', {
          method: 'POST',
        });
        // Invalidar queries para refrescar los datos
        queryClient.invalidateQueries({ queryKey: ['goals'] });
        queryClient.invalidateQueries({ queryKey: ['stats'] });
      } catch (error) {
        // Silenciar errores, no es crítico si falla
        console.error('Error al revisar completitud de goals:', error);
      }
    };

    // Ejecutar la revisión solo una vez al montar el componente
    checkGoalsCompletion();
  }, [queryClient]);

  return (
    <div className="w-full max-w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Mis Metas</h1>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/goals/new" className="flex items-center justify-center">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Meta
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : goals && goals.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No tienes metas aún. Crea tu primera meta para comenzar.
          </p>
          <Button asChild>
            <Link href="/goals/new">Crear Primera Meta</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

