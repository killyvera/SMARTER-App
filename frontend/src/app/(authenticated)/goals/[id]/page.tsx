'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGoal, useValidateGoal, useConfirmGoalValidation, useActivateGoal } from '@/features/goals/hooks/useGoals';
import { SmarterScoreDisplay } from '@/features/goals/components/SmarterScoreDisplay';
import { ValidationReview } from '@/features/goals/components/ValidationReview';
import { useMiniTasks, useUnlockMiniTask } from '@/features/minitasks/hooks/useMiniTasks';
import { MiniTaskCard } from '@/features/minitasks/components/MiniTaskCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Zap, Plus, Sparkles } from 'lucide-react';

type ValidationState = 'idle' | 'validating' | 'reviewing' | 'confirming';

export default function GoalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: goal, isLoading } = useGoal(id);
  const validateGoal = useValidateGoal();
  const confirmValidation = useConfirmGoalValidation();
  const activateGoal = useActivateGoal();
  const { data: miniTasks, refetch: refetchMiniTasks } = useMiniTasks({ goalId: id });
  const unlockMiniTask = useUnlockMiniTask();

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
      
      console.log('🔍 [GOAL VALIDATION] Resultado de validación:', {
        hasScore: !!result.score,
        hasSuggestedTitle: !!result.suggestedTitle,
        hasSuggestedDescription: !!result.suggestedDescription,
        suggestedMiniTasksLength: result.suggestedMiniTasks?.length || 0,
        hasPreviewScores: !!result.previewScores,
        hasFeedback: !!result.feedback,
        result: result,
      });
      
      // Si hay score, ya fue validado previamente
      if (result.score) {
        console.log('✅ [GOAL VALIDATION] Goal ya validado previamente, no hay sugerencias');
        setValidationState('idle');
        return;
      }
      
      // SIEMPRE mostrar pantalla de revisión si hay previewScores (primera validación)
      // Esto permite al usuario ver el feedback y las sugerencias (si las hay)
      if (result.previewScores) {
        console.log('📋 [GOAL VALIDATION] Mostrando pantalla de revisión con sugerencias');
        setValidationData({
          suggestedTitle: result.suggestedTitle || null,
          suggestedDescription: result.suggestedDescription || null,
          suggestedMiniTasks: result.suggestedMiniTasks || [],
          previewScores: result.previewScores,
          previewAverage: result.previewAverage!,
          previewPassed: result.previewPassed!,
          feedback: result.feedback,
        });
        setValidationState('reviewing');
      } else {
        // No hay previewScores, algo salió mal
        console.warn('⚠️ [GOAL VALIDATION] No hay previewScores en el resultado');
        setValidationState('idle');
      }
    } catch (error) {
      console.error('❌ [GOAL VALIDATION] Error al validar goal:', error);
      setValidationState('idle');
    }
  };

  const handleConfirmValidation = async (data: {
    title: string;
    description?: string;
    miniTasks: Array<{ title: string; description?: string; priority: number }>;
  }) => {
    try {
      console.log('✅ [GOAL VALIDATION] Confirmando validación con minitasks:', {
        goalId: id,
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
      
      console.log('✅ [GOAL VALIDATION] Validación confirmada exitosamente:', {
        goalId: id,
        hasScore: !!result.score,
        suggestedMiniTasksCount: result.suggestedMiniTasks?.length || 0,
      });
      
      // Las queries se invalidan automáticamente en el hook, pero forzamos un refetch
      // para asegurar que las minitasks aparezcan inmediatamente
      console.log('🔄 [GOAL VALIDATION] Esperando actualización de minitasks...');
      
      setValidationState('idle');
      setValidationData(null);
      
      // Forzar refetch de minitasks después de un pequeño delay para asegurar que el servidor haya guardado
      setTimeout(async () => {
        console.log('🔄 [GOAL VALIDATION] Forzando refetch de minitasks...');
        try {
          await refetchMiniTasks();
          console.log('✅ [GOAL VALIDATION] Minitasks actualizadas:', {
            count: miniTasks?.length || 0,
          });
        } catch (error) {
          console.error('❌ [GOAL VALIDATION] Error al refetch minitasks:', error);
        }
      }, 800);
    } catch (error) {
      console.error('❌ [GOAL VALIDATION] Error al confirmar validación:', {
        goalId: id,
        error: error instanceof Error ? error.message : String(error),
      });
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
    <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-4xl">
      <Button asChild variant="ghost" className="mb-3 sm:mb-4">
        <Link href="/goals">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Link>
      </Button>

      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{goal.title}</h1>
          {goal.description && (
            <p className="text-sm sm:text-base text-muted-foreground">{goal.description}</p>
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
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            {!goal.smarterScore && (
              <Button 
                onClick={handleValidate} 
                disabled={validateGoal.isPending || validationState === 'confirming'}
                className="w-full sm:w-auto"
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
                className="w-full sm:w-auto"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {activateGoal.isPending ? 'Activando...' : 'Activar Meta'}
              </Button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-semibold">MiniTasks</h2>
              <Button asChild size="sm" className="w-full sm:w-auto">
                <Link href={`/goals/${id}/minitasks/new`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva
                </Link>
              </Button>
            </div>
            <div className="space-y-2">
              {miniTasks && miniTasks.length > 0 ? (
                miniTasks.map((task) => (
                  <MiniTaskCard
                    key={task.id}
                    miniTask={task}
                    onUnlock={async (id) => {
                      await unlockMiniTask.mutateAsync(id);
                    }}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay minitasks aún
                </p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

