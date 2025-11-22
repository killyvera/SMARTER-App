import { NextRequest, NextResponse } from 'next/server';
import { validateGoalService } from '@/services/goalService';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = 'temp-user-id'; // TODO: Obtener del token
    const result = await validateGoalService(params.id, userId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al validar goal' },
      { status: 400 }
    );
  }
}

