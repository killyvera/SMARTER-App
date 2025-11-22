import { NextRequest, NextResponse } from 'next/server';
import { registerSchema } from '@smarter-app/shared';
import { registerUser } from '@/services/authService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);
    
    const user = await registerUser(data);
    
    // TODO: Implementar JWT
    const token = 'temp-token'; // Por ahora token temporal
    
    return NextResponse.json({
      token,
      user,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al registrar usuario' },
      { status: 400 }
    );
  }
}

