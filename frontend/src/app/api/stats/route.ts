import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth/getUserId';
import { findGoalsByUser } from '@/repositories/goalRepository';
import { findMiniTasksByUser } from '@/repositories/miniTaskRepository';
import { logApiRequest, logApiError } from '@/lib/api-logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const userId = await getUserId();
    
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
    
    // Calcular progreso general
    const totalGoals = goalsStats.total;
    const completedGoals = goalsStats.completed;
    const progressPercentage = totalGoals > 0 
      ? Math.round((completedGoals / totalGoals) * 100) 
      : 0;
    
    const stats = {
      goals: goalsStats,
      miniTasks: miniTasksStats,
      progress: {
        percentage: progressPercentage,
        completed: completedGoals,
        total: totalGoals,
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

