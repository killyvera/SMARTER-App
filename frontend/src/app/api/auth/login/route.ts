import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@smarter-app/shared';
import { loginUser } from '@/services/authService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = loginSchema.parse(body);
    
    const user = await loginUser(data);
    
    // TODO: Implementar JWT
    const token = 'temp-token'; // Por ahora token temporal
    
    return NextResponse.json({
      token,
      user,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Credenciales inválidas' },
      { status: 401 }
    );
  }
}

