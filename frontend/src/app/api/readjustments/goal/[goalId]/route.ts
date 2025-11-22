import { NextRequest, NextResponse } from 'next/server';
import { getReadjustmentsByGoalService } from '@/services/goalService';
import { getUserId } from '@/lib/auth/getUserId';

export async function GET(
  request: NextRequest,
  { params }: { params: { goalId: string } }
) {
  try {
    const userId = await getUserId();
    const readjustments = await getReadjustmentsByGoalService(params.goalId, userId);
    return NextResponse.json(readjustments);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener reajustes' },
      { status: 500 }
    );
  }
}

