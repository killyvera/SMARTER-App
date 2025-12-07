import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth/getUserId';
import { updateUserBiometricEnabled } from '@/repositories/userRepository';
import { deleteBiometricCredentialsByUserId } from '@/repositories/biometricCredentialRepository';
import { logApiRequest, logApiError } from '@/lib/api-logger';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'enabled debe ser un booleano' },
        { status: 400 }
      );
    }

    // Obtener userId del usuario autenticado
    const userId = await getUserId();

    // Actualizar estado de biometría
    await updateUserBiometricEnabled(userId, enabled);

    // Si se desactiva, eliminar credenciales almacenadas
    if (!enabled) {
      await deleteBiometricCredentialsByUserId(userId);
    }

    const duration = Date.now() - startTime;
    logApiRequest('POST', '/api/auth/biometric/toggle', 200, duration);

    return NextResponse.json({
      success: true,
      biometricEnabled: enabled,
      message: enabled 
        ? 'Autenticación biométrica activada' 
        : 'Autenticación biométrica desactivada y credenciales eliminadas',
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('POST', '/api/auth/biometric/toggle', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al actualizar estado de biometría' },
      { status: 500 }
    );
  }
}

