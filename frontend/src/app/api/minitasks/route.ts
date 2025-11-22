import { NextRequest, NextResponse } from 'next/server';
import { createMiniTaskSchema } from '@smarter-app/shared';
import {
  createMiniTaskService,
  getMiniTasksByGoalService,
  getMiniTasksByStatusService,
} from '@/services/miniTaskService';

// GET /api/minitasks
export async function GET(request: NextRequest) {
  try {
    const userId = 'temp-user-id'; // TODO: Obtener del token
    const { searchParams } = new URL(request.url);
    const goalId = searchParams.get('goalId');
    const status = searchParams.get('status');
    
    if (goalId) {
      const miniTasks = await getMiniTasksByGoalService(goalId, userId);
      return NextResponse.json(miniTasks);
    } else if (status) {
      const miniTasks = await getMiniTasksByStatusService(userId, status);
      return NextResponse.json(miniTasks);
    } else {
      return NextResponse.json(
        { error: 'Debe proporcionar goalId o status' },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener minitasks' },
      { status: 500 }
    );
  }
}

// POST /api/minitasks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createMiniTaskSchema.parse(body);
    
    const miniTask = await createMiniTaskService(data);
    return NextResponse.json(miniTask, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear minitask' },
      { status: 400 }
    );
  }
}

