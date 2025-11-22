'use client';

import { useGoals } from '@/features/goals/hooks/useGoals';
import { GoalCard } from '@/features/goals/components/GoalCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function GoalsPage() {
  const { data: goals, isLoading } = useGoals();

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Mis Metas</h1>
        <Button asChild>
          <Link href="/goals/new">
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

