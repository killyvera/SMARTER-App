import { NextRequest, NextResponse } from 'next/server';
import { updateGoalSchema } from '@smarter-app/shared';
import {
  getGoalService,
  updateGoalService,
} from '@/services/goalService';

// GET /api/goals/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = 'temp-user-id'; // TODO: Obtener del token
    const goal = await getGoalService(params.id, userId);
    return NextResponse.json(goal);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Goal no encontrado' },
      { status: 404 }
    );
  }
}

// PATCH /api/goals/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = 'temp-user-id'; // TODO: Obtener del token
    const body = await request.json();
    const data = updateGoalSchema.parse(body);
    
    const goal = await updateGoalService(params.id, userId, data);
    return NextResponse.json(goal);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al actualizar goal' },
      { status: 400 }
    );
  }
}

