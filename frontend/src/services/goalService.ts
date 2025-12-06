import {
  createGoal,
  findGoalById,
  findGoalsByUser,
  updateGoal,
  getGoalSnapshot,
} from '@/repositories/goalRepository';
import { createSmarterScore, findSmarterScoreByGoalId } from '@/repositories/smarterScoreRepository';
import { createSuggestedMiniTask } from '@/repositories/suggestedMiniTaskRepository';
import { createMiniTask } from '@/repositories/miniTaskRepository';
import { createReadjustment } from '@/repositories/readjustmentRepository';
import { validateGoalSmart, type GoalValidationResponse } from '@/clients/aiClient';
import type { CreateGoalInput, UpdateGoalInput } from '@smarter-app/shared';
import { format } from 'date-fns';

const SMARTER_THRESHOLD = 60;
const SMARTER_AVERAGE_THRESHOLD = 70;

export async function createGoalService(userId: string, input: CreateGoalInput) {
  const deadline = input.deadline ? new Date(input.deadline) : undefined;
  
  return createGoal(userId, {
    title: input.title,
    description: input.description,
    deadline,
    plannedHours: input.plannedHours,
    isSingleDayGoal: input.isSingleDayGoal ?? false,
  });
}

export async function validateGoalService(
  goalId: string,
  userId: string,
  options?: {
    acceptedTitle?: string;
    acceptedDescription?: string;
    acceptedMiniTasks?: Array<{ title: string; description?: string; priority: number }>;
  }
) {
  const goal = await findGoalById(goalId, userId);
  
  if (!goal) {
    throw new Error('Goal no encontrado');
  }
  
  if (goal.status !== 'DRAFT') {
    throw new Error('Solo se pueden validar goals en estado DRAFT');
  }
  
  // Si se proporcionan opciones de confirmación, es la validación final
  const hasConfirmationOptions = !!(options?.acceptedTitle || options?.acceptedDescription || (options?.acceptedMiniTasks && Array.isArray(options.acceptedMiniTasks) && options.acceptedMiniTasks.length > 0));
  
  console.log('validateGoalService - Verificando opciones:', {
    hasOptions: !!options,
    hasAcceptedTitle: !!options?.acceptedTitle,
    hasAcceptedDescription: !!options?.acceptedDescription,
    hasAcceptedMiniTasks: !!(options?.acceptedMiniTasks),
    acceptedMiniTasksIsArray: Array.isArray(options?.acceptedMiniTasks),
    acceptedMiniTasksLength: options?.acceptedMiniTasks?.length,
    hasConfirmationOptions,
  });
  
  if (hasConfirmationOptions) {
    // Actualizar título y descripción si se proporcionaron
    if (options.acceptedTitle || options.acceptedDescription) {
      await updateGoal(goalId, userId, {
        title: options.acceptedTitle,
        description: options.acceptedDescription,
      });
    }
    
    // Obtener el goal actualizado para validar
    const updatedGoal = await findGoalById(goalId, userId);
    if (!updatedGoal) {
      throw new Error('Goal no encontrado después de actualizar');
    }
    
    // Validar con IA usando los valores finales
    const validation = await validateGoalSmart({
      title: updatedGoal.title,
      description: updatedGoal.description || undefined,
      deadline: updatedGoal.deadline ? format(updatedGoal.deadline, 'yyyy-MM-dd') : undefined,
    });
    
    // Actualizar isSingleDayGoal y plannedHours si el agente IA los detectó
    if (validation.isSingleDayGoal !== undefined || validation.plannedHours !== undefined) {
      await updateGoal(goalId, userId, {
        isSingleDayGoal: validation.isSingleDayGoal ?? false,
        plannedHours: validation.plannedHours,
      });
    }
    
    // Guardar SmarterScore
    const score = await createSmarterScore(goalId, {
      specific: validation.scores.specific,
      measurable: validation.scores.measurable,
      achievable: validation.scores.achievable,
      relevant: validation.scores.relevant,
      timebound: validation.scores.timebound,
      evaluate: validation.scores.evaluate,
      readjust: validation.scores.readjust,
      average: validation.average,
      passed: validation.passed,
    });
    
    // Guardar las minitasks aceptadas como MiniTask reales (no solo como sugerencias)
    // Esto permite que el usuario las vea inmediatamente en la lista de minitasks
    if (options.acceptedMiniTasks && options.acceptedMiniTasks.length > 0) {
      console.log('Guardando minitasks aceptadas como MiniTasks reales:', {
        count: options.acceptedMiniTasks.length,
        tasks: options.acceptedMiniTasks,
      });
      
      for (const suggested of options.acceptedMiniTasks) {
        try {
          // Crear como MiniTask real (no solo como SuggestedMiniTask)
          const saved = await createMiniTask(goalId, {
            title: suggested.title,
            description: suggested.description,
            // No hay deadline en las sugerencias, se puede agregar después
          });
          console.log('MiniTask creada exitosamente:', {
            id: saved.id,
            title: saved.title,
            status: saved.status,
          });
          
          // También guardar como SuggestedMiniTask para referencia/historial
          await createSuggestedMiniTask(goalId, {
            title: suggested.title,
            description: suggested.description,
            priority: suggested.priority,
          });
        } catch (error) {
          console.error('Error al guardar minitask:', {
            error: error instanceof Error ? error.message : String(error),
            task: suggested,
          });
          throw error;
        }
      }
      console.log(`Total de ${options.acceptedMiniTasks.length} minitasks creadas`);
    } else {
      console.log('No hay minitasks aceptadas para guardar (array vacío o undefined)');
    }
    
    return {
      score,
      feedback: validation.feedback,
      suggestedMiniTasks: [],
    };
  }
  
  // Primera validación: solo obtener sugerencias sin guardar
  const validation = await validateGoalSmart({
    title: goal.title,
    description: goal.description || undefined,
    deadline: goal.deadline ? format(goal.deadline, 'yyyy-MM-dd') : undefined,
  });
  
  // NO guardar nada aún, solo retornar sugerencias
  return {
    score: null, // No hay score aún, se guardará en la confirmación
    feedback: validation.feedback,
    suggestedTitle: validation.suggestedTitle,
    suggestedDescription: validation.suggestedDescription,
    suggestedMiniTasks: validation.suggestedMiniTasks || [],
    // Incluir scores para preview
    previewScores: validation.scores,
    previewAverage: validation.average,
    previewPassed: validation.passed,
  };
}

export async function activateGoalService(goalId: string, userId: string) {
  const goal = await findGoalById(goalId, userId);
  
  if (!goal) {
    throw new Error('Goal no encontrado');
  }
  
  if (goal.status !== 'DRAFT') {
    throw new Error('Solo se pueden activar goals en estado DRAFT');
  }
  
  const score = await findSmarterScoreByGoalId(goalId);
  
  if (!score) {
    throw new Error('El goal debe ser validado antes de activarse');
  }
  
  if (!score.passed) {
    throw new Error('El goal no cumple con los criterios SMARTER mínimos para activarse');
  }
  
  // Verificar reglas: S, M, A, R, T >= 60 y promedio >= 70
  const coreScores = [
    score.specific,
    score.measurable,
    score.achievable,
    score.relevant,
    score.timebound,
  ];
  
  const allCorePass = coreScores.every((s) => s >= SMARTER_THRESHOLD);
  const averagePass = score.average >= SMARTER_AVERAGE_THRESHOLD;
  
  if (!allCorePass || !averagePass) {
    throw new Error('El goal no cumple con los criterios SMARTER mínimos para activarse');
  }
  
  return updateGoal(goalId, userId, { status: 'ACTIVE' });
}

export async function getGoalsService(userId: string, filters?: { status?: string }) {
  return findGoalsByUser(userId, filters as { status?: any });
}

export async function getGoalService(goalId: string, userId: string) {
  const goal = await findGoalById(goalId, userId);
  
  if (!goal) {
    throw new Error('Goal no encontrado');
  }
  
  return goal;
}

export async function updateGoalService(
  goalId: string,
  userId: string,
  input: UpdateGoalInput
) {
  const deadline = input.deadline ? new Date(input.deadline) : undefined;
  
  return updateGoal(goalId, userId, {
    title: input.title,
    description: input.description,
    deadline,
    plannedHours: input.plannedHours,
    isSingleDayGoal: input.isSingleDayGoal,
  });
}

export async function createReadjustmentService(
  goalId: string,
  userId: string,
  reason?: string
) {
  const goal = await findGoalById(goalId, userId);
  
  if (!goal) {
    throw new Error('Goal no encontrado');
  }
  
  // Obtener snapshot anterior
  const previousSnapshot = await getGoalSnapshot(goalId);
  
  // Actualizar el goal (ejemplo: cambiar deadline, descripción, etc.)
  // Por ahora solo guardamos el snapshot actual como nuevo
  const updatedGoal = await findGoalById(goalId, userId);
  const newSnapshot = updatedGoal ? JSON.stringify(updatedGoal) : previousSnapshot;
  
  return createReadjustment(goalId, previousSnapshot, newSnapshot, reason);
}

export async function getReadjustmentsByGoalService(goalId: string, userId: string) {
  const goal = await findGoalById(goalId, userId);
  
  if (!goal) {
    throw new Error('Goal no encontrado');
  }
  
  const { findReadjustmentsByGoal } = await import('@/repositories/readjustmentRepository');
  return findReadjustmentsByGoal(goalId);
}

