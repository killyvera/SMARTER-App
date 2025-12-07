import { NextRequest, NextResponse } from 'next/server';
import { registerSchema } from '@smarter-app/shared';
import { registerUser } from '@/services/authService';
import { generateToken } from '@/lib/auth/jwt';
import { logApiRequest, logApiError } from '@/lib/api-logger';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);
    
    const user = await registerUser(data);
    
    // Generar token JWT
    const token = await generateToken(user.id, user.email);
    
    const duration = Date.now() - startTime;
    logApiRequest('POST', '/api/auth/register', 200, duration);
    
    return NextResponse.json({
      token,
      user,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('POST', '/api/auth/register', error);
    
    // Manejar errores de validación de Zod
    if (error && typeof error === 'object' && 'issues' in error) {
      const zodError = error as { issues: Array<{ message: string; path: string[] }> };
      const errorMessage = zodError.issues.map(issue => issue.message).join(', ');
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al registrar usuario' },
      { status: 400 }
    );
  }
}

