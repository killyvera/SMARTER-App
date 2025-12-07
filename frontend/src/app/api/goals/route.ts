import { NextRequest, NextResponse } from 'next/server';
import { createGoalSchema } from '@smarter-app/shared';
import {
  createGoalService,
  getGoalsService,
} from '@/services/goalService';
import { logApiRequest, logApiError } from '@/lib/api-logger';
import { getUserId } from '@/lib/auth/getUserId';

// GET /api/goals - Listar goals
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  
  try {
    const userId = await getUserId(request);
    
    const goals = await getGoalsService(userId, status ? { status } : undefined);
    
    // Debug: verificar que las minitasks estén incluidas
    if (process.env.NODE_ENV === 'development') {
      goals.forEach(goal => {
        console.log('[GET /api/goals]', {
          goalId: goal.id,
          goalTitle: goal.title,
          miniTasksCount: (goal as any).miniTasks?.length || 0,
          miniTasks: (goal as any).miniTasks,
        });
      });
    }
    
    const duration = Date.now() - startTime;
    logApiRequest('GET', `/api/goals${status ? `?status=${status}` : ''}`, 200, duration);
    
    return NextResponse.json(goals);
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('GET', '/api/goals', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener goals' },
      { status: 500 }
    );
  }
}

// POST /api/goals - Crear goal
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const userId = await getUserId(request);
    const body = await request.json();
    const data = createGoalSchema.parse(body);
    
    const goal = await createGoalService(userId, data);
    const duration = Date.now() - startTime;
    logApiRequest('POST', '/api/goals', 201, duration);
    
    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('POST', '/api/goals', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear goal' },
      { status: 400 }
    );
  }
}

