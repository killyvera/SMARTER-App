import {
  createMiniTask,
  findMiniTaskById,
  findMiniTasksByGoal,
  findMiniTasksByStatus,
  updateMiniTask,
  createMiniTaskPlugin,
} from '@/repositories/miniTaskRepository';
import { createMiniTaskScore } from '@/repositories/miniTaskScoreRepository';
import { validateMiniTaskSmart, unlockMiniTask } from '@/clients/aiClient';
import { checkAndUpdateGoalCompletion } from '@/services/goalService';
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
    plannedHours: input.plannedHours,
    isSingleDayTask: input.isSingleDayTask ?? false,
  });
}

export async function validateMiniTaskService(miniTaskId: string, userId: string) {
  console.log('=== VALIDATE MINITASK SERVICE - INICIO ===');
  console.log('Parámetros:', { miniTaskId, userId });
  
  try {
    console.log('🔍 [VALIDATE MINITASK] Buscando minitask:', { miniTaskId });
    const miniTask = await findMiniTaskById(miniTaskId) as any;
    
    if (!miniTask) {
      console.error('❌ [VALIDATE MINITASK] Minitask no encontrada:', { miniTaskId });
      throw new Error('MiniTask no encontrada');
    }
    
    console.log('✅ [VALIDATE MINITASK] Minitask encontrada:', {
      id: miniTask.id,
      title: miniTask.title,
      status: miniTask.status,
      hasGoal: !!miniTask.goal,
      goalUserId: miniTask.goal?.userId,
      requestUserId: userId,
    });
    
    // Verificar que el goal pertenece al usuario
    if (miniTask.goal?.userId !== userId) {
      console.error('❌ [VALIDATE MINITASK] No autorizado:', {
        goalUserId: miniTask.goal?.userId,
        requestUserId: userId,
      });
      throw new Error('No autorizado');
    }
    
    if (miniTask.status !== 'DRAFT') {
      console.error('❌ [VALIDATE MINITASK] Estado inválido:', {
        status: miniTask.status,
        expected: 'DRAFT',
      });
      throw new Error('Solo se pueden validar minitasks en estado DRAFT');
    }
    
    console.log('🤖 [VALIDATE MINITASK] Llamando a IA para validar:', {
      title: miniTask.title,
      description: miniTask.description,
      deadline: miniTask.deadline,
      goalTitle: miniTask.goal?.title,
    });
    
    // Validar con IA
    const validation = await validateMiniTaskSmart({
      title: miniTask.title,
      description: miniTask.description || undefined,
      deadline: miniTask.deadline ? format(miniTask.deadline, 'yyyy-MM-dd') : undefined,
      goalContext: {
        title: miniTask.goal?.title || '',
        description: miniTask.goal?.description || undefined,
      },
    });
    
    console.log('✅ [VALIDATE MINITASK] Validación de IA recibida:', {
      isAction: validation.isAction,
      passed: validation.passed,
      average: validation.average,
      scores: validation.scores,
    });
    
    // Verificar que sea una acción concreta
    if (!validation.isAction) {
      console.error('❌ [VALIDATE MINITASK] No es una acción concreta');
      throw new Error('La minitask debe ser una acción concreta, no un resultado abstracto');
    }
    
    console.log('💾 [VALIDATE MINITASK] Guardando score...');
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
    
    console.log('✅ [VALIDATE MINITASK] Score guardado:', { scoreId: score.id });
    
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
      
      console.log('📊 [VALIDATE MINITASK] Verificando criterios:', {
        allPass,
        averagePass,
        allScores,
        average: validation.average,
        threshold: SMARTER_THRESHOLD,
        averageThreshold: SMARTER_AVERAGE_THRESHOLD,
      });
      
      if (allPass && averagePass) {
        console.log('🔄 [VALIDATE MINITASK] Actualizando estado a PENDING');
        await updateMiniTask(miniTaskId, { status: 'PENDING' });
      } else {
        console.log('⚠️ [VALIDATE MINITASK] No cumple criterios para cambiar a PENDING');
      }
    }
    
    console.log('=== VALIDATE MINITASK SERVICE - ÉXITO ===');
    return {
      score,
      feedback: validation.feedback,
      isAction: validation.isAction,
      passed: validation.passed,
    };
  } catch (error) {
    console.error('=== VALIDATE MINITASK SERVICE - ERROR ===');
    console.error('Error completo:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      errorObject: error,
    });
    throw error;
  }
}

export async function getMiniTasksByGoalService(goalId: string, userId: string) {
  // Verificar que el goal pertenece al usuario
  const { findGoalById } = await import('@/repositories/goalRepository');
  const goal = await findGoalById(goalId, userId);
  
  if (!goal) {
    throw new Error('Goal no encontrado');
  }
  
  const tasks = await findMiniTasksByGoal(goalId);
  
  // Asegurar que todas las minitasks tengan unlocked con valor por defecto
  return tasks.map(task => ({
    ...task,
    unlocked: task.unlocked ?? false,
  }));
}

export async function getMiniTasksByStatusService(userId: string, status: string) {
  return findMiniTasksByStatus(userId, status as any);
}

export async function getAllMiniTasksByUserService(userId: string) {
  const { findMiniTasksByUser } = await import('@/repositories/miniTaskRepository');
  return findMiniTasksByUser(userId);
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
  const goalId = miniTask.goalId;
  
  const updatedMiniTask = await updateMiniTask(miniTaskId, {
    title: input.title,
    description: input.description,
    deadline,
    status: input.status,
    plannedHours: input.plannedHours,
    isSingleDayTask: input.isSingleDayTask,
    color: input.color,
    positionX: input.positionX,
    positionY: input.positionY,
  });
  
  // Si se actualizó el status a COMPLETED, verificar si la goal debe marcarse como completada
  if (input.status === 'COMPLETED' && goalId) {
    try {
      await checkAndUpdateGoalCompletion(goalId, userId);
    } catch (error) {
      // No fallar la actualización de la minitask si hay error al verificar la goal
      console.error('Error al verificar completitud de goal:', error);
    }
  }
  
  return updatedMiniTask;
}

/**
 * Verifica si una minitask puede desbloquearse basado en sus dependencias
 */
export async function checkDependencies(miniTaskId: string): Promise<{
  canUnlock: boolean;
  blockingTask?: { id: string; title: string };
}> {
  const miniTask = await findMiniTaskById(miniTaskId) as any;
  
  if (!miniTask || !miniTask.dependsOn) {
    return { canUnlock: true };
  }
  
  // Verificar que la minitask dependiente esté completada
  const dependencyTask = await findMiniTaskById(miniTask.dependsOn) as any;
  
  if (!dependencyTask) {
    // Si la dependencia no existe, permitir desbloquear (dependencia inválida)
    console.warn(`⚠️ Dependencia ${miniTask.dependsOn} no encontrada para minitask ${miniTaskId}`);
    return { canUnlock: true };
  }
  
  if (dependencyTask.status !== 'COMPLETED') {
    return {
      canUnlock: false,
      blockingTask: {
        id: dependencyTask.id,
        title: dependencyTask.title,
      },
    };
  }
  
  return { canUnlock: true };
}

export async function unlockMiniTaskService(miniTaskId: string, userId: string) {
  console.log('=== UNLOCK MINITASK SERVICE - INICIO ===');
  console.log('Desbloqueando minitask (validar + mejorar + configurar):', { miniTaskId, userId });
  
  const miniTask = await findMiniTaskById(miniTaskId) as any;
  
  if (!miniTask) {
    throw new Error('MiniTask no encontrada');
  }
  
  if (miniTask.goal?.userId !== userId) {
    throw new Error('No autorizado');
  }
  
  if (miniTask.unlocked) {
    throw new Error('La minitask ya está desbloqueada');
  }
  
  // Verificar dependencias antes de desbloquear
  const dependencyCheck = await checkDependencies(miniTaskId);
  if (!dependencyCheck.canUnlock) {
    throw new Error(
      `No se puede desbloquear esta minitask. Debes completar primero: "${dependencyCheck.blockingTask?.title}"`
    );
  }
  
  console.log('🤖 [UNLOCK] Llamando a IA para mejorar y configurar minitask...');
  
  // Llamar a IA para generar configuración completa (mejora título/descripción + genera plugins + valida SMARTER)
  const unlockResult = await unlockMiniTask({
    title: miniTask.title,
    description: miniTask.description || undefined,
    deadline: miniTask.deadline ? format(miniTask.deadline, 'yyyy-MM-dd') : undefined,
    goalContext: {
      title: miniTask.goal?.title || '',
      description: miniTask.goal?.description || undefined,
    },
  });
  
  console.log('✅ [UNLOCK] Resultado de IA recibido:', {
    hasImprovedTitle: !!unlockResult.improvedTitle,
    hasImprovedDescription: !!unlockResult.improvedDescription,
    metricsCount: unlockResult.metrics.length,
    pluginsCount: unlockResult.plugins.length,
    smarterPassed: unlockResult.smarterAnalysis.passed,
  });
  
  // Actualizar minitask con título y descripción mejorados
  console.log('💾 [UNLOCK] Actualizando minitask con mejoras...');
  await updateMiniTask(miniTaskId, {
    title: unlockResult.improvedTitle,
    description: unlockResult.improvedDescription,
    unlocked: true,
    isSingleDayTask: unlockResult.isSingleDayTask ?? false,
    plannedHours: unlockResult.plannedHours,
    metricsConfig: JSON.stringify({
      unlocked: true,
      unlockedAt: new Date().toISOString(),
      plugins: unlockResult.plugins.map(p => ({
        id: p.id,
        config: p.config,
        enabled: true,
      })),
      metrics: unlockResult.metrics,
    }),
  });
  
  // Crear registros de plugins en la base de datos
  console.log('🔌 [UNLOCK] Creando plugins en base de datos...');
  for (const plugin of unlockResult.plugins) {
    await createMiniTaskPlugin(miniTaskId, plugin.id, plugin.config);
    
    // Si es plugin calendar con checklistItems, crear los items del checklist
    if (plugin.id === 'calendar' && plugin.config?.checklistEnabled && plugin.config?.checklistItems) {
      const { createChecklistItem } = await import('@/repositories/miniTaskChecklistRepository');
      console.log('📝 [UNLOCK] Creando items del checklist:', plugin.config.checklistItems);
      
      for (let i = 0; i < plugin.config.checklistItems.length; i++) {
        await createChecklistItem(miniTaskId, {
          label: plugin.config.checklistItems[i],
          order: i,
        });
      }
      console.log(`✅ [UNLOCK] ${plugin.config.checklistItems.length} items del checklist creados`);
    }
    
    // Si es plugin calendar con checklistType 'single' y checklistLabel, crear un solo item
    if (plugin.id === 'calendar' && plugin.config?.checklistEnabled && plugin.config?.checklistType === 'single' && plugin.config?.checklistLabel) {
      const { createChecklistItem } = await import('@/repositories/miniTaskChecklistRepository');
      console.log('📝 [UNLOCK] Creando checklist single:', plugin.config.checklistLabel);
      
      await createChecklistItem(miniTaskId, {
        label: plugin.config.checklistLabel,
        order: 0,
      });
      console.log('✅ [UNLOCK] Checklist single creado');
    }
  }
  
  // Guardar score SMARTER (siempre, porque unlock también valida)
  console.log('📊 [UNLOCK] Guardando score SMARTER...');
  const existingScore = miniTask.score;
  if (!existingScore) {
    await createMiniTaskScore(miniTaskId, {
      specific: unlockResult.smarterAnalysis.specific,
      measurable: unlockResult.smarterAnalysis.measurable,
      achievable: unlockResult.smarterAnalysis.achievable,
      relevant: unlockResult.smarterAnalysis.relevant,
      timebound: unlockResult.smarterAnalysis.timebound,
      average: unlockResult.smarterAnalysis.average,
      passed: unlockResult.smarterAnalysis.passed,
    });
    console.log('✅ [UNLOCK] Score SMARTER guardado');
  } else {
    console.log('ℹ️ [UNLOCK] Score SMARTER ya existía, no se actualiza');
  }
  
  // Si pasa la validación SMARTER, cambiar estado a PENDING
  if (unlockResult.smarterAnalysis.passed) {
    const allScores = [
      unlockResult.smarterAnalysis.specific,
      unlockResult.smarterAnalysis.measurable,
      unlockResult.smarterAnalysis.achievable,
      unlockResult.smarterAnalysis.relevant,
      unlockResult.smarterAnalysis.timebound,
    ];
    
    const allPass = allScores.every((s) => s >= SMARTER_THRESHOLD);
    const averagePass = unlockResult.smarterAnalysis.average >= SMARTER_AVERAGE_THRESHOLD;
    
    if (allPass && averagePass && miniTask.status === 'DRAFT') {
      console.log('🔄 [UNLOCK] Actualizando estado a PENDING (pasó validación SMARTER)');
      await updateMiniTask(miniTaskId, { status: 'PENDING' });
    }
  }
  
  console.log('=== UNLOCK MINITASK SERVICE - ÉXITO ===');
  return {
    improvedTitle: unlockResult.improvedTitle,
    improvedDescription: unlockResult.improvedDescription,
    metrics: unlockResult.metrics,
    plugins: unlockResult.plugins,
    smarterAnalysis: unlockResult.smarterAnalysis,
  };
}

