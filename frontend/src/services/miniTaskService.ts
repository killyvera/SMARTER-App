import {
  createMiniTask,
  findMiniTaskById,
  findMiniTasksByGoal,
  findMiniTasksByStatus,
  updateMiniTask,
} from '@/repositories/miniTaskRepository';
import { createMiniTaskScore } from '@/repositories/miniTaskScoreRepository';
import { validateMiniTaskSmart } from '@/clients/aiClient';
import type { CreateMiniTaskInput, UpdateMiniTaskInput } from '@smarter-app/shared';
import { format } from 'date-fns';

const SMARTER_THRESHOLD = 60;
const SMARTER_AVERAGE_THRESHOLD = 70;

export async function createMiniTaskService(input: CreateMiniTaskInput) {
  const deadline = input.deadline ? new Date(input.deadline) : undefined;
  
  return createMiniTask(input.goalId, {
    title: input.title,
    description: input.description,
    deadline,
  });
}

export async function validateMiniTaskService(miniTaskId: string, userId: string) {
  const miniTask = await findMiniTaskById(miniTaskId) as any;
  
  if (!miniTask) {
    throw new Error('MiniTask no encontrada');
  }
  
  // Verificar que el goal pertenece al usuario
  if (miniTask.goal?.userId !== userId) {
    throw new Error('No autorizado');
  }
  
  if (miniTask.status !== 'DRAFT') {
    throw new Error('Solo se pueden validar minitasks en estado DRAFT');
  }
  
  // Validar con Azure AI
  const validation = await validateMiniTaskSmart({
    title: miniTask.title,
    description: miniTask.description || undefined,
    deadline: miniTask.deadline ? format(miniTask.deadline, 'yyyy-MM-dd') : undefined,
    goalContext: {
      title: miniTask.goal?.title || '',
    },
  });
  
  // Verificar que sea una acción concreta
  if (!validation.isAction) {
    throw new Error('La minitask debe ser una acción concreta, no un resultado abstracto');
  }
  
  // Guardar MiniTaskScore
  const score = await createMiniTaskScore(miniTaskId, {
    specific: validation.scores.specific,
    measurable: validation.scores.measurable,
    achievable: validation.scores.achievable,
    relevant: validation.scores.relevant,
    timebound: validation.scores.timebound,
    average: validation.average,
    passed: validation.passed,
  });
  
  // Si pasa la validación, cambiar estado a PENDING
  if (validation.passed) {
    // Verificar reglas: todos los scores >= 60 y promedio >= 70
    const allScores = [
      validation.scores.specific,
      validation.scores.measurable,
      validation.scores.achievable,
      validation.scores.relevant,
      validation.scores.timebound,
    ];
    
    const allPass = allScores.every((s) => s >= SMARTER_THRESHOLD);
    const averagePass = validation.average >= SMARTER_AVERAGE_THRESHOLD;
    
    if (allPass && averagePass) {
      await updateMiniTask(miniTaskId, { status: 'PENDING' });
    }
  }
  
  return {
    score,
    feedback: validation.feedback,
    isAction: validation.isAction,
    passed: validation.passed,
  };
}

export async function getMiniTasksByGoalService(goalId: string, userId: string) {
  // Verificar que el goal pertenece al usuario
  const { findGoalById } = await import('@/repositories/goalRepository');
  const goal = await findGoalById(goalId, userId);
  
  if (!goal) {
    throw new Error('Goal no encontrado');
  }
  
  return findMiniTasksByGoal(goalId);
}

export async function getMiniTasksByStatusService(userId: string, status: string) {
  return findMiniTasksByStatus(userId, status as any);
}

export async function getMiniTaskService(miniTaskId: string, userId: string) {
  const miniTask = await findMiniTaskById(miniTaskId) as any;
  
  if (!miniTask) {
    throw new Error('MiniTask no encontrada');
  }
  
  if (miniTask.goal?.userId !== userId) {
    throw new Error('No autorizado');
  }
  
  return miniTask;
}

export async function updateMiniTaskService(
  miniTaskId: string,
  userId: string,
  input: UpdateMiniTaskInput
) {
  const miniTask = await findMiniTaskById(miniTaskId) as any;
  
  if (!miniTask) {
    throw new Error('MiniTask no encontrada');
  }
  
  if (miniTask.goal?.userId !== userId) {
    throw new Error('No autorizado');
  }
  
  const deadline = input.deadline ? new Date(input.deadline) : undefined;
  
  return updateMiniTask(miniTaskId, {
    title: input.title,
    description: input.description,
    deadline,
    status: input.status,
  });
}

