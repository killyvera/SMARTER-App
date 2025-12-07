import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { 
  findBiometricCredentialByCredentialId,
  updateBiometricCredentialEnabled 
} from '@/repositories/biometricCredentialRepository';
import { logApiRequest, logApiError } from '@/lib/api-logger';

// POST: Activar/desactivar una credencial específica
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const userId = await getUserId(request);
    const body = await request.json();
    const { credentialId, enabled } = body;

    if (!credentialId || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'credentialId y enabled (boolean) son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que la credencial pertenece al usuario
    const credential = await findBiometricCredentialByCredentialId(credentialId);
    if (!credential) {
      return NextResponse.json(
        { error: 'Credencial no encontrada' },
        { status: 404 }
      );
    }

    if (credential.userId !== userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Actualizar estado
    const updated = await updateBiometricCredentialEnabled(credentialId, enabled);

    const duration = Date.now() - startTime;
    logApiRequest('POST', '/api/auth/biometric/credentials/toggle', 200, duration);

    return NextResponse.json({
      success: true,
      credential: {
        id: updated.id,
        credentialId: updated.credentialId,
        deviceName: updated.deviceName || 'Dispositivo sin nombre',
        authenticatorType: updated.authenticatorType || 'unknown',
        enabled: updated.enabled,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('POST', '/api/auth/biometric/credentials/toggle', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al actualizar credencial' },
      { status: 500 }
    );
  }
}

