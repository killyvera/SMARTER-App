import { NextRequest, NextResponse } from 'next/server';
import { createCheckInSchema } from '@smarter-app/shared';
import { createCheckInService } from '@/services/checkInService';
import { getUserId } from '@/lib/auth/getUserId';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();
    const data = createCheckInSchema.parse(body);
    
    const checkIn = await createCheckInService(userId, data);
    return NextResponse.json(checkIn, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear check-in' },
      { status: 400 }
    );
  }
}

