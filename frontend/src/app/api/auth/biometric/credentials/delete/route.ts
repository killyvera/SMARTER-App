import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { 
  findBiometricCredentialByCredentialId,
  deleteBiometricCredential 
} from '@/repositories/biometricCredentialRepository';
import { logApiRequest, logApiError } from '@/lib/api-logger';

// DELETE: Eliminar una credencial específica
export async function DELETE(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const userId = await getUserId(request);
    const { searchParams } = new URL(request.url);
    const credentialId = searchParams.get('credentialId');

    if (!credentialId) {
      return NextResponse.json(
        { error: 'credentialId es requerido' },
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

    // Eliminar credencial
    await deleteBiometricCredential(credentialId);

    const duration = Date.now() - startTime;
    logApiRequest('DELETE', '/api/auth/biometric/credentials/delete', 200, duration);

    return NextResponse.json({
      success: true,
      message: 'Credencial eliminada exitosamente',
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('DELETE', '/api/auth/biometric/credentials/delete', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al eliminar credencial' },
      { status: 500 }
    );
  }
}

