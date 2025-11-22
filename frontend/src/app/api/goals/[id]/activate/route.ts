import { NextRequest, NextResponse } from 'next/server';
import { activateGoalService } from '@/services/goalService';
import { getUserId } from '@/lib/auth/getUserId';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId();
    const goal = await activateGoalService(params.id, userId);
    return NextResponse.json(goal);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al activar goal' },
      { status: 400 }
    );
  }
}

