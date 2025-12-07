import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail } from '@/repositories/userRepository';
import { logApiRequest, logApiError } from '@/lib/api-logger';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      );
    }

    const user = await findUserByEmail(email);
    
    if (!user) {
      return NextResponse.json({
        biometricEnabled: false,
        hasCredentials: false,
      });
    }

    // Verificar si tiene credenciales registradas
    const { findBiometricCredentialsByUserId } = await import('@/repositories/biometricCredentialRepository');
    const allCredentials = await findBiometricCredentialsByUserId(user.id, false);
    const enabledCredentials = allCredentials.filter(c => c.enabled);

    const duration = Date.now() - startTime;
    logApiRequest('POST', '/api/auth/biometric/status', 200, duration);

    return NextResponse.json({
      biometricEnabled: user.biometricEnabled,
      hasCredentials: allCredentials.length > 0,
      hasEnabledCredentials: enabledCredentials.length > 0,
      totalCredentials: allCredentials.length,
      enabledCredentials: enabledCredentials.length,
      credentials: allCredentials.map(cred => ({
        id: cred.id,
        deviceName: cred.deviceName || 'Dispositivo sin nombre',
        authenticatorType: cred.authenticatorType || 'unknown',
        enabled: cred.enabled,
      })),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('POST', '/api/auth/biometric/status', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al verificar estado de biometría' },
      { status: 500 }
    );
  }
}

