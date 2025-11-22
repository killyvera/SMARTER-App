import { NextRequest, NextResponse } from 'next/server';
import { getCheckInsByGoalService } from '@/services/checkInService';

export async function GET(
  request: NextRequest,
  { params }: { params: { goalId: string } }
) {
  try {
    const userId = 'temp-user-id'; // TODO: Obtener del token
    const checkIns = await getCheckInsByGoalService(params.goalId, userId);
    return NextResponse.json(checkIns);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener check-ins' },
      { status: 404 }
    );
  }
}

