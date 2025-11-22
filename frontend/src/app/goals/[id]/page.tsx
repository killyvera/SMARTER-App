'use client';

import { useParams, useRouter } from 'next/navigation';
import { useGoal, useValidateGoal, useActivateGoal } from '@/features/goals/hooks/useGoals';
import { SmarterScoreDisplay } from '@/features/goals/components/SmarterScoreDisplay';
import { CheckInHistory } from '@/features/checkins/components/CheckInHistory';
import { useMiniTasks } from '@/features/minitasks/hooks/useMiniTasks';
import { MiniTaskCard } from '@/features/minitasks/components/MiniTaskCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Zap, Plus, Calendar } from 'lucide-react';

export default function GoalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: goal, isLoading } = useGoal(id);
  const validateGoal = useValidateGoal();
  const activateGoal = useActivateGoal();
  const { data: miniTasks } = useMiniTasks({ goalId: id });

  const handleValidate = async () => {
    try {
      await validateGoal.mutateAsync(id);
    } catch (error) {
      console.error('Error al validar goal:', error);
    }
  };

  const handleActivate = async () => {
    try {
      await activateGoal.mutateAsync(id);
    } catch (error) {
      console.error('Error al activar goal:', error);
    }
  };

  if (isLoading) {
    return <div className="container mx-auto p-4">Cargando...</div>;
  }

  if (!goal) {
    return <div className="container mx-auto p-4">Goal no encontrado</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Button asChild variant="ghost" className="mb-4">
        <Link href="/goals">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Link>
      </Button>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{goal.title}</h1>
          {goal.description && (
            <p className="text-muted-foreground">{goal.description}</p>
          )}
        </div>

        {goal.smarterScore && (
          <div className="bg-card border rounded-lg p-6">
            <SmarterScoreDisplay score={goal.smarterScore} />
          </div>
        )}

        {goal.status === 'DRAFT' && (
          <div className="flex gap-4">
            {!goal.smarterScore && (
              <Button onClick={handleValidate} disabled={validateGoal.isPending}>
                <Zap className="h-4 w-4 mr-2" />
                {validateGoal.isPending ? 'Validando...' : 'Validar con SMARTER'}
              </Button>
            )}

            {goal.smarterScore?.passed && (
              <Button
                onClick={handleActivate}
                disabled={activateGoal.isPending}
                variant="default"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {activateGoal.isPending ? 'Activando...' : 'Activar Meta'}
              </Button>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">MiniTasks</h2>
              <Button asChild size="sm">
                <Link href={`/goals/${id}/minitasks/new`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva
                </Link>
              </Button>
            </div>
            <div className="space-y-2">
              {miniTasks && miniTasks.length > 0 ? (
                miniTasks.map((task) => (
                  <MiniTaskCard key={task.id} miniTask={task} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay minitasks aún
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Check-ins</h2>
              <Button asChild size="sm">
                <Link href={`/goals/${id}/checkins/new`}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Nuevo
                </Link>
              </Button>
            </div>
            <CheckInHistory goalId={id} />
          </div>
        </div>
      </div>
    </div>
  );
}

