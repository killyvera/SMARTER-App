import { NextRequest, NextResponse } from 'next/server';
import { createReadjustmentSchema } from '@smarter-app/shared';
import { createReadjustmentService } from '@/services/goalService';
import { getUserId } from '@/lib/auth/getUserId';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    const body = await request.json();
    const data = createReadjustmentSchema.parse(body);
    
    const readjustment = await createReadjustmentService(data.goalId, userId, data.reason);
    return NextResponse.json(readjustment, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear reajuste' },
      { status: 400 }
    );
  }
}

