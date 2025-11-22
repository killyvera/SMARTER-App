import {
  createGoal,
  findGoalById,
  findGoalsByUser,
  updateGoal,
  getGoalSnapshot,
} from '@/repositories/goalRepository';
import { createSmarterScore, findSmarterScoreByGoalId } from '@/repositories/smarterScoreRepository';
import { createSuggestedMiniTask } from '@/repositories/suggestedMiniTaskRepository';
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
  });
}

export async function validateGoalService(goalId: string, userId: string) {
  const goal = await findGoalById(goalId, userId);
  
  if (!goal) {
    throw new Error('Goal no encontrado');
  }
  
  if (goal.status !== 'DRAFT') {
    throw new Error('Solo se pueden validar goals en estado DRAFT');
  }
  
  // Validar con Azure AI
  const validation = await validateGoalSmart({
    title: goal.title,
    description: goal.description || undefined,
    deadline: goal.deadline ? format(goal.deadline, 'yyyy-MM-dd') : undefined,
  });
  
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
  
  // Guardar SuggestedMiniTasks si existen
  if (validation.suggestedMiniTasks && validation.suggestedMiniTasks.length > 0) {
    for (const suggested of validation.suggestedMiniTasks) {
      await createSuggestedMiniTask(goalId, {
        title: suggested.title,
        description: suggested.description,
        priority: suggested.priority,
      });
    }
  }
  
  return {
    score,
    feedback: validation.feedback,
    suggestedMiniTasks: validation.suggestedMiniTasks || [],
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

