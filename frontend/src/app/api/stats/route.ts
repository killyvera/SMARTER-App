import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth/getUserId';
import { findGoalsByUser } from '@/repositories/goalRepository';
import { findMiniTasksByUser } from '@/repositories/miniTaskRepository';
import { calculateGoalProgress } from '@/features/goals/utils/calculateGoalProgress';
import { logApiRequest, logApiError } from '@/lib/api-logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const userId = await getUserId(request);
    
    // Obtener todas las metas
    const goals = await findGoalsByUser(userId);
    
    // Obtener todas las minitasks
    const miniTasks = await findMiniTasksByUser(userId);
    
    // Calcular estadísticas de metas
    const goalsStats = {
      total: goals.length,
      active: goals.filter(g => g.status === 'ACTIVE').length,
      completed: goals.filter(g => g.status === 'COMPLETED').length,
      draft: goals.filter(g => g.status === 'DRAFT').length,
    };
    
    // Calcular estadísticas de minitasks
    const miniTasksStats = {
      total: miniTasks.length,
      draft: miniTasks.filter(mt => mt.status === 'DRAFT').length,
      pending: miniTasks.filter(mt => mt.status === 'PENDING').length,
      completed: miniTasks.filter(mt => mt.status === 'COMPLETED').length,
    };
    
    // Calcular progreso general basado en minitasks completadas
    // Para cada goal, calcular su progreso basado en minitasks
    let totalProgress = 0;
    let goalsWithProgress = 0;
    
    goals.forEach(goal => {
      // Filtrar minitasks por goalId
      const goalMiniTasks = miniTasks.filter(mt => mt.goalId === goal.id);
      const goalProgress = calculateGoalProgress(goalMiniTasks);
      if (goalProgress.total > 0) {
        totalProgress += goalProgress.percentage;
        goalsWithProgress++;
      }
    });
    
    // Calcular porcentaje promedio de progreso de todas las goals
    const progressPercentage = goalsWithProgress > 0 
      ? Math.round(totalProgress / goalsWithProgress) 
      : 0;
    
    // Contar goals completadas basado en progreso de minitasks (100%) o status COMPLETED
    const completedGoalsByProgress = goals.filter(goal => {
      const goalMiniTasks = miniTasks.filter(mt => mt.goalId === goal.id);
      const goalProgress = calculateGoalProgress(goalMiniTasks);
      return goalProgress.total > 0 && goalProgress.percentage === 100;
    }).length;
    
    // Usar el mayor entre goals con status COMPLETED y goals con 100% de progreso
    const completedGoals = Math.max(goalsStats.completed, completedGoalsByProgress);
    
    const stats = {
      goals: goalsStats,
      miniTasks: miniTasksStats,
      progress: {
        percentage: progressPercentage,
        completed: completedGoals,
        total: goalsStats.total,
      },
    };
    
    const duration = Date.now() - startTime;
    logApiRequest('GET', '/api/stats', 200, duration);
    
    return NextResponse.json(stats);
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('GET', '/api/stats', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}

