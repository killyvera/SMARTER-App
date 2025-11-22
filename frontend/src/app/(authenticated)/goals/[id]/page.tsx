'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGoal, useValidateGoal, useConfirmGoalValidation, useActivateGoal } from '@/features/goals/hooks/useGoals';
import { SmarterScoreDisplay } from '@/features/goals/components/SmarterScoreDisplay';
import { ValidationReview } from '@/features/goals/components/ValidationReview';
import { CheckInHistory } from '@/features/checkins/components/CheckInHistory';
import { useMiniTasks } from '@/features/minitasks/hooks/useMiniTasks';
import { MiniTaskCard } from '@/features/minitasks/components/MiniTaskCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Zap, Plus, Calendar, Sparkles } from 'lucide-react';

type ValidationState = 'idle' | 'validating' | 'reviewing' | 'confirming';

export default function GoalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: goal, isLoading } = useGoal(id);
  const validateGoal = useValidateGoal();
  const confirmValidation = useConfirmGoalValidation();
  const activateGoal = useActivateGoal();
  const { data: miniTasks } = useMiniTasks({ goalId: id });

  const [validationState, setValidationState] = useState<ValidationState>('idle');
  const [validationData, setValidationData] = useState<{
    suggestedTitle?: string | null;
    suggestedDescription?: string | null;
    suggestedMiniTasks: any[];
    previewScores: any;
    previewAverage: number;
    previewPassed: boolean;
    feedback: string;
  } | null>(null);

  const handleValidate = async () => {
    try {
      setValidationState('validating');
      const result = await validateGoal.mutateAsync(id);
      
      // Si hay score, ya fue validado previamente
      if (result.score) {
        setValidationState('idle');
        return;
      }
      
      // Si hay sugerencias, mostrar pantalla de revisión
      if (result.suggestedTitle || result.suggestedDescription || (result.suggestedMiniTasks && result.suggestedMiniTasks.length > 0)) {
        setValidationData({
          suggestedTitle: result.suggestedTitle,
          suggestedDescription: result.suggestedDescription,
          suggestedMiniTasks: result.suggestedMiniTasks || [],
          previewScores: result.previewScores!,
          previewAverage: result.previewAverage!,
          previewPassed: result.previewPassed!,
          feedback: result.feedback,
        });
        setValidationState('reviewing');
      } else {
        // No hay sugerencias, validar directamente
        setValidationState('idle');
      }
    } catch (error) {
      console.error('Error al validar goal:', error);
      setValidationState('idle');
    }
  };

  const handleConfirmValidation = async (data: {
    title: string;
    description?: string;
    miniTasks: Array<{ title: string; description?: string; priority: number }>;
  }) => {
    try {
      console.log('handleConfirmValidation - Datos recibidos:', {
        title: data.title,
        description: data.description,
        miniTasksCount: data.miniTasks.length,
        miniTasks: data.miniTasks,
      });

      setValidationState('confirming');
      const result = await confirmValidation.mutateAsync({
        goalId: id,
        acceptedTitle: data.title,
        acceptedDescription: data.description,
        acceptedMiniTasks: data.miniTasks,
      });
      
      console.log('handleConfirmValidation - Resultado:', result);
      
      setValidationState('idle');
      setValidationData(null);
    } catch (error) {
      console.error('Error al confirmar validación:', error);
      setValidationState('reviewing');
    }
  };

  const handleCancelValidation = () => {
    setValidationState('idle');
    setValidationData(null);
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

        {/* Pantalla de revisión de validación */}
        {validationState === 'reviewing' && validationData && (
          <ValidationReview
            goalId={id}
            currentTitle={goal.title}
            currentDescription={goal.description}
            score={{
              specific: validationData.previewScores.specific,
              measurable: validationData.previewScores.measurable,
              achievable: validationData.previewScores.achievable,
              relevant: validationData.previewScores.relevant,
              timebound: validationData.previewScores.timebound,
              evaluate: validationData.previewScores.evaluate,
              readjust: validationData.previewScores.readjust,
              average: validationData.previewAverage,
              passed: validationData.previewPassed,
              id: '',
              goalId: id,
              createdAt: new Date(),
            }}
            feedback={validationData.feedback}
            suggestedTitle={validationData.suggestedTitle}
            suggestedDescription={validationData.suggestedDescription}
            suggestedMiniTasks={validationData.suggestedMiniTasks}
            onConfirm={handleConfirmValidation}
            onCancel={handleCancelValidation}
            isLoading={confirmValidation.isPending}
          />
        )}

        {/* Score final después de validar */}
        {goal.smarterScore && validationState !== 'reviewing' && (
          <div className="bg-card border rounded-lg p-6">
            <SmarterScoreDisplay score={goal.smarterScore} />
          </div>
        )}

        {goal.status === 'DRAFT' && validationState !== 'reviewing' && (
          <div className="flex gap-4">
            {!goal.smarterScore && (
              <Button 
                onClick={handleValidate} 
                disabled={validateGoal.isPending || validationState === 'confirming'}
              >
                <Sparkles className="h-4 w-4 mr-2" />
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

