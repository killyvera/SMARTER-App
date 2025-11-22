import { NextRequest, NextResponse } from 'next/server';
import { validateMiniTaskService } from '@/services/miniTaskService';
import { getUserId } from '@/lib/auth/getUserId';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId();
    const result = await validateMiniTaskService(params.id, userId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al validar minitask' },
      { status: 400 }
    );
  }
}

