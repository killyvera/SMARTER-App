import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@smarter-app/shared';
import { loginUser } from '@/services/authService';
import { logApiRequest, logApiError } from '@/lib/api-logger';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const data = loginSchema.parse(body);
    
    const user = await loginUser(data);
    
    // TODO: Implementar JWT
    const token = 'temp-token'; // Por ahora token temporal
    
    const duration = Date.now() - startTime;
    logApiRequest('POST', '/api/auth/login', 200, duration);
    
    return NextResponse.json({
      token,
      user,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('POST', '/api/auth/login', error);
    
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
      { error: error instanceof Error ? error.message : 'Credenciales inválidas' },
      { status: 401 }
    );
  }
}

