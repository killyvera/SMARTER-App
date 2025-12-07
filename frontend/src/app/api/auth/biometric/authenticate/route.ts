import { NextRequest, NextResponse } from 'next/server';
import { findUserById, findUserByEmail } from '@/repositories/userRepository';
import {
  findBiometricCredentialsByUserId,
  findBiometricCredentialByCredentialId,
  updateBiometricCredentialCounter,
} from '@/repositories/biometricCredentialRepository';
import {
  generateAuthenticationOptionsForUser,
  verifyAuthenticationResponse,
} from '@/services/biometricAuthService';
import { logApiRequest, logApiError } from '@/lib/api-logger';
import { generateToken } from '@/lib/auth/jwt';

// Almacenar challenges temporalmente (en producción usar Redis o similar)
const authenticationChallenges = new Map<string, { challenge: string; userId: string; expiresAt: number }>();

// Limpiar challenges expirados cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of authenticationChallenges.entries()) {
    if (value.expiresAt < now) {
      authenticationChallenges.delete(key);
    }
  }
}, 5 * 60 * 1000);

// POST: Iniciar autenticación biométrica
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

    // Buscar usuario por email
    const user = await findUserByEmail(email);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    if (!user.biometricEnabled) {
      return NextResponse.json(
        { error: 'Autenticación biométrica no habilitada para este usuario' },
        { status: 400 }
      );
    }

    // Verificar que tenga credenciales habilitadas registradas
    // Usar onlyEnabled=true para verificar solo credenciales activas
    const enabledCredentials = await findBiometricCredentialsByUserId(user.id, true);
    if (enabledCredentials.length === 0) {
      return NextResponse.json(
        { error: 'No hay credenciales biométricas habilitadas registradas' },
        { status: 400 }
      );
    }

    // Obtener origen desde el header
    const origin = request.headers.get('origin') || request.headers.get('referer') || 'http://localhost:3000';
    
    // Generar opciones de autenticación
    // Esta función también valida y limpia credenciales inválidas
    let options;
    try {
      options = await generateAuthenticationOptionsForUser(
        user.id,
        origin
      );
    } catch (error) {
      // Si generateAuthenticationOptionsForUser falla, puede ser porque no hay credenciales válidas
      if (error instanceof Error && error.message.includes('No hay credenciales')) {
        return NextResponse.json(
          { error: 'No hay credenciales biométricas válidas registradas' },
          { status: 400 }
        );
      }
      throw error;
    }

    // Almacenar challenge temporalmente (expira en 5 minutos)
    const challengeKey = `${user.id}-${Date.now()}`;
    authenticationChallenges.set(challengeKey, {
      challenge: options.challenge,
      userId: user.id,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutos
    });

    // Validar que las opciones sean válidas antes de enviarlas
    if (!options || !options.challenge) {
      return NextResponse.json(
        { error: 'Error al generar opciones de autenticación válidas' },
        { status: 500 }
      );
    }

    const duration = Date.now() - startTime;
    logApiRequest('POST', '/api/auth/biometric/authenticate', 200, duration);

    // SimpleWebAuthn ya devuelve challenge como string base64url válido
    // Solo necesitamos asegurarnos de que sea string
    let challenge: string;
    if (typeof options.challenge === 'string') {
      challenge = options.challenge;
    } else if ((options.challenge as any) instanceof Buffer) {
      challenge = (options.challenge as Buffer).toString('base64url');
    } else {
      // Intentar convertir si es ArrayBuffer/Uint8Array
      try {
        const challengeAny = options.challenge as any;
        const arr = challengeAny instanceof Uint8Array 
          ? challengeAny 
          : new Uint8Array(challengeAny as ArrayBuffer);
        challenge = Buffer.from(arr).toString('base64url');
      } catch (err) {
        console.error('Challenge no convertible:', err, typeof options.challenge);
        return NextResponse.json(
          { error: 'Error al generar opciones de autenticación: challenge inválido' },
          { status: 500 }
        );
      }
    }

    // Validar que el challenge sea base64url válido
    if (!challenge || !/^[A-Za-z0-9_-]+$/.test(challenge)) {
      console.error('Challenge no es base64url válido:', challenge?.substring(0, 50));
      return NextResponse.json(
        { error: 'Error al generar opciones de autenticación: challenge con formato inválido' },
        { status: 500 }
      );
    }

    // SimpleWebAuthn ya devuelve allowCredentials con IDs como strings base64url
    // Solo necesitamos asegurarnos de que sean strings válidos
    let allowCredentials = options.allowCredentials;
    if (allowCredentials && Array.isArray(allowCredentials)) {
      allowCredentials = allowCredentials.map((cred) => {
        let id: string;
        if (typeof cred.id === 'string') {
          id = cred.id;
        } else if ((cred.id as any) instanceof Buffer) {
          id = (cred.id as Buffer).toString('base64url');
        } else {
          try {
            const credIdAny = cred.id as any;
            const arr = credIdAny instanceof Uint8Array 
              ? credIdAny 
              : new Uint8Array(credIdAny as ArrayBuffer);
            id = Buffer.from(arr).toString('base64url');
          } catch (err) {
            console.warn('allowCredential ID no convertible, se omite:', err);
            return null;
          }
        }

        // Validar que el ID sea base64url válido
        if (!/^[A-Za-z0-9_-]+$/.test(id)) {
          console.warn('allowCredential ID no es base64url válido, se omite:', id?.substring(0, 20));
          return null;
        }

        return {
          id,
          type: (cred.type || 'public-key') as 'public-key',
          transports: (cred.transports || []) as any[],
        };
      }).filter((c): c is { id: string; type: 'public-key'; transports: any[] } => c !== null);
    }

    return NextResponse.json({
      publicKey: {
        ...options,
        challenge,
        allowCredentials,
      },
      challengeKey,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('POST', '/api/auth/biometric/authenticate', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al generar opciones de autenticación' },
      { status: 500 }
    );
  }
}

// PUT: Completar autenticación biométrica
export async function PUT(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { challengeKey, response } = body;

    if (!challengeKey || !response) {
      return NextResponse.json(
        { error: 'challengeKey y response son requeridos' },
        { status: 400 }
      );
    }

    // Obtener challenge almacenado
    const storedChallenge = authenticationChallenges.get(challengeKey);
    if (!storedChallenge) {
      return NextResponse.json(
        { error: 'Challenge inválido o expirado' },
        { status: 400 }
      );
    }

    // Verificar que no haya expirado
    if (storedChallenge.expiresAt < Date.now()) {
      authenticationChallenges.delete(challengeKey);
      return NextResponse.json(
        { error: 'Challenge expirado' },
        { status: 400 }
      );
    }

    const { userId, challenge } = storedChallenge;

    // Obtener credencial desde la respuesta
    const credentialId = response.id;
    if (!credentialId || typeof credentialId !== 'string') {
      return NextResponse.json(
        { error: 'Credencial ID no encontrado en la respuesta' },
        { status: 400 }
      );
    }

    // Validar que el credentialId sea base64url válido
    try {
      // Intentar decodificar para validar formato
      Buffer.from(credentialId, 'base64url');
    } catch (error) {
      return NextResponse.json(
        { error: 'Formato de credencial ID inválido' },
        { status: 400 }
      );
    }

    // Buscar credencial en base de datos
    const credential = await findBiometricCredentialByCredentialId(credentialId);
    if (!credential) {
      return NextResponse.json(
        { error: 'Credencial no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que la credencial pertenezca al usuario
    if (credential.userId !== userId) {
      return NextResponse.json(
        { error: 'Credencial no pertenece al usuario' },
        { status: 403 }
      );
    }

    // Convertir publicKey de string JSON a Buffer
    let publicKey: Buffer;
    try {
      const publicKeyArray = JSON.parse(credential.publicKey);
      if (!Array.isArray(publicKeyArray)) {
        throw new Error('Public key no es un array válido');
      }
      publicKey = Buffer.from(publicKeyArray);
    } catch (error) {
      return NextResponse.json(
        { error: 'Error al procesar clave pública: ' + (error instanceof Error ? error.message : 'formato inválido') },
        { status: 500 }
      );
    }

    // Obtener origen desde el header
    const origin = request.headers.get('origin') || request.headers.get('referer') || 'http://localhost:3000';

    // Verificar respuesta de autenticación
    const verification = await verifyAuthenticationResponse(
      userId,
      credentialId,
      response,
      challenge,
      credential.counter,
      publicKey,
      origin
    );

    // Actualizar contador y última fecha de uso
    await updateBiometricCredentialCounter(
      credentialId,
      verification.newCounter,
      new Date()
    );

    // Obtener usuario
    const user = await findUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar challenge usado
    authenticationChallenges.delete(challengeKey);

    // Generar token JWT
    const token = await generateToken(user.id, user.email);

    const duration = Date.now() - startTime;
    logApiRequest('PUT', '/api/auth/biometric/authenticate', 200, duration);

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('PUT', '/api/auth/biometric/authenticate', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al autenticar con biometría' },
      { status: 500 }
    );
  }
}

