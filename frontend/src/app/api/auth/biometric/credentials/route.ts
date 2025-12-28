import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth/getUserId';
import { findBiometricCredentialsByUserId } from '@/repositories/biometricCredentialRepository';
import { logApiRequest, logApiError } from '@/lib/api-logger';

// Forzar renderizado dinámico (usa headers())
export const dynamic = 'force-dynamic';

// GET: Listar todas las credenciales del usuario
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const userId = await getUserId(request);
    
    const credentials = await findBiometricCredentialsByUserId(userId, false);
    
    const duration = Date.now() - startTime;
    logApiRequest('GET', '/api/auth/biometric/credentials', 200, duration);

    return NextResponse.json({
      credentials: credentials.map(cred => ({
        id: cred.id,
        credentialId: cred.credentialId,
        deviceName: cred.deviceName || 'Dispositivo sin nombre',
        authenticatorType: cred.authenticatorType || 'unknown',
        enabled: cred.enabled,
        createdAt: cred.createdAt,
        lastUsedAt: cred.lastUsedAt,
      })),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('GET', '/api/auth/biometric/credentials', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al listar credenciales' },
      { status: 500 }
    );
  }
}

