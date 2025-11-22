import { NextRequest, NextResponse } from 'next/server';
import { createGoalSchema } from '@smarter-app/shared';
import {
  createGoalService,
  getGoalsService,
} from '@/services/goalService';

// GET /api/goals - Listar goals
export async function GET(request: NextRequest) {
  try {
    // TODO: Obtener userId del token/sesión
    const userId = 'temp-user-id'; // Temporal
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    const goals = await getGoalsService(userId, status ? { status } : undefined);
    return NextResponse.json(goals);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener goals' },
      { status: 500 }
    );
  }
}

// POST /api/goals - Crear goal
export async function POST(request: NextRequest) {
  try {
    // TODO: Obtener userId del token/sesión
    const userId = 'temp-user-id'; // Temporal
    const body = await request.json();
    const data = createGoalSchema.parse(body);
    
    const goal = await createGoalService(userId, data);
    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear goal' },
      { status: 400 }
    );
  }
}

