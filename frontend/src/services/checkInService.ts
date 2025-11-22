import { createCheckIn, findCheckInsByGoal } from '@/repositories/checkInRepository';
import { findGoalById } from '@/repositories/goalRepository';
import type { CreateCheckInInput } from '@smarter-app/shared';

export async function createCheckInService(
  userId: string,
  input: CreateCheckInInput
) {
  // Verificar que el goal pertenece al usuario
  const goal = await findGoalById(input.goalId, userId);
  
  if (!goal) {
    throw new Error('Goal no encontrado');
  }
  
  return createCheckIn(input.goalId, {
    progressPercentage: input.progressPercentage,
    currentValue: input.currentValue,
    notes: input.notes,
    mood: input.mood,
  });
}

export async function getCheckInsByGoalService(goalId: string, userId: string) {
  // Verificar que el goal pertenece al usuario
  const goal = await findGoalById(goalId, userId);
  
  if (!goal) {
    throw new Error('Goal no encontrado');
  }
  
  return findCheckInsByGoal(goalId);
}


