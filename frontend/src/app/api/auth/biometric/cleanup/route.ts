import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth/getUserId';
import { findBiometricCredentialsByUserId, deleteBiometricCredential } from '@/repositories/biometricCredentialRepository';
import { logApiRequest, logApiError } from '@/lib/api-logger';

// POST: Limpiar credenciales biométricas inválidas
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Obtener userId del usuario autenticado
    const userId = await getUserId();

    // Obtener todas las credenciales del usuario
    const credentials = await findBiometricCredentialsByUserId(userId);

    const invalidCredentials: string[] = [];

    // Validar cada credencial
    for (const cred of credentials) {
      let isValid = true;

      // Validar credentialId
      if (!cred.credentialId || typeof cred.credentialId !== 'string' || cred.credentialId.length === 0) {
        isValid = false;
      } else {
        // Intentar decodificar para validar formato
        try {
          const buffer = Buffer.from(cred.credentialId, 'base64url');
          if (buffer.length === 0) {
            isValid = false;
          }
        } catch {
          isValid = false;
        }
      }

      // Validar publicKey
      if (isValid) {
        try {
          const publicKeyArray = JSON.parse(cred.publicKey);
          if (!Array.isArray(publicKeyArray) || publicKeyArray.length === 0) {
            isValid = false;
          }
        } catch {
          isValid = false;
        }
      }

      if (!isValid) {
        invalidCredentials.push(cred.id);
      }
    }

    // Eliminar credenciales inválidas
    for (const credId of invalidCredentials) {
      await deleteBiometricCredential(credentials.find(c => c.id === credId)!.credentialId);
    }

    const duration = Date.now() - startTime;
    logApiRequest('POST', '/api/auth/biometric/cleanup', 200, duration);

    return NextResponse.json({
      success: true,
      cleaned: invalidCredentials.length,
      message: `Se eliminaron ${invalidCredentials.length} credencial(es) inválida(s)`,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('POST', '/api/auth/biometric/cleanup', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al limpiar credenciales' },
      { status: 500 }
    );
  }
}

