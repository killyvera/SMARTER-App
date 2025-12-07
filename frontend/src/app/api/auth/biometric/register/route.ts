import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth/getUserId';
import { findUserById } from '@/repositories/userRepository';
import {
  generateRegistrationOptionsForUser,
  verifyRegistrationResponseForUser,
} from '@/services/biometricAuthService';
import {
  createBiometricCredential,
} from '@/repositories/biometricCredentialRepository';
import { updateUserBiometricEnabled } from '@/repositories/userRepository';
import { logApiRequest, logApiError } from '@/lib/api-logger';

// Almacenar challenges temporalmente (en producción usar Redis o similar)
const registrationChallenges = new Map<string, { challenge: string; userId: string; expiresAt: number }>();

// Limpiar challenges expirados cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of registrationChallenges.entries()) {
    if (value.expiresAt < now) {
      registrationChallenges.delete(key);
    }
  }
}, 5 * 60 * 1000);

// POST: Iniciar registro biométrico
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Obtener userId del usuario autenticado
    const userId = await getUserId(request);
    const user = await findUserById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Obtener origen desde el header
    const origin = request.headers.get('origin') || request.headers.get('referer') || 'http://localhost:3000';
    
    // Generar opciones de registro
    const options = await generateRegistrationOptionsForUser(
      userId,
      user.email,
      user.email, // Usar email como display name
      origin
    );

    // Almacenar challenge temporalmente (expira en 5 minutos)
    const challengeKey = `${userId}-${Date.now()}`;
    registrationChallenges.set(challengeKey, {
      challenge: options.challenge,
      userId,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutos
    });

    // Validar que las opciones sean válidas antes de enviarlas
    if (!options || !options.challenge) {
      return NextResponse.json(
        { error: 'Error al generar opciones de registro válidas' },
        { status: 500 }
      );
    }

    const duration = Date.now() - startTime;
    logApiRequest('POST', '/api/auth/biometric/register', 200, duration);

    // SimpleWebAuthn ya devuelve challenge como string base64url válido
    // Solo necesitamos asegurarnos de que sea string
    let challenge: string;
    if (typeof options.challenge === 'string') {
      challenge = options.challenge;
    } else if (options.challenge instanceof Buffer) {
      challenge = options.challenge.toString('base64url');
    } else {
      // Intentar convertir si es ArrayBuffer/Uint8Array
      try {
        const arr = options.challenge instanceof Uint8Array 
          ? options.challenge 
          : new Uint8Array(options.challenge as ArrayBuffer);
        challenge = Buffer.from(arr).toString('base64url');
      } catch (err) {
        console.error('Challenge no convertible:', err, typeof options.challenge);
        return NextResponse.json(
          { error: 'Error al generar opciones de registro: challenge inválido' },
          { status: 500 }
        );
      }
    }

    // Validar que el challenge sea base64url válido
    if (!challenge || !/^[A-Za-z0-9_-]+$/.test(challenge)) {
      console.error('Challenge no es base64url válido:', challenge?.substring(0, 50));
      return NextResponse.json(
        { error: 'Error al generar opciones de registro: challenge con formato inválido' },
        { status: 500 }
      );
    }

    // SimpleWebAuthn ya devuelve excludeCredentials con IDs como strings base64url
    // Solo necesitamos asegurarnos de que sean strings válidos
    let excludeCredentials = options.excludeCredentials;
    if (excludeCredentials && Array.isArray(excludeCredentials)) {
      excludeCredentials = excludeCredentials.map((cred) => {
        let id: string;
        if (typeof cred.id === 'string') {
          id = cred.id;
        } else if (cred.id instanceof Buffer) {
          id = cred.id.toString('base64url');
        } else {
          try {
            const arr = cred.id instanceof Uint8Array 
              ? cred.id 
              : new Uint8Array(cred.id as ArrayBuffer);
            id = Buffer.from(arr).toString('base64url');
          } catch (err) {
            console.warn('excludeCredential ID no convertible, se omite:', err);
            return null;
          }
        }

        // Validar que el ID sea base64url válido
        if (!/^[A-Za-z0-9_-]+$/.test(id)) {
          console.warn('excludeCredential ID no es base64url válido, se omite:', id?.substring(0, 20));
          return null;
        }

        return {
          id,
          type: cred.type || 'public-key',
          transports: cred.transports || [],
        };
      }).filter((c): c is { id: string; type: string; transports: string[] } => c !== null);
    }

    return NextResponse.json({
      publicKey: {
        ...options,
        challenge,
        excludeCredentials,
      },
      challengeKey,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('POST', '/api/auth/biometric/register', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al generar opciones de registro' },
      { status: 500 }
    );
  }
}

// PUT: Completar registro biométrico
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
    const storedChallenge = registrationChallenges.get(challengeKey);
    if (!storedChallenge) {
      return NextResponse.json(
        { error: 'Challenge inválido o expirado' },
        { status: 400 }
      );
    }

    // Verificar que no haya expirado
    if (storedChallenge.expiresAt < Date.now()) {
      registrationChallenges.delete(challengeKey);
      return NextResponse.json(
        { error: 'Challenge expirado' },
        { status: 400 }
      );
    }

    const { userId, challenge } = storedChallenge;

    // Obtener origen desde el header
    const origin = request.headers.get('origin') || request.headers.get('referer') || 'http://localhost:3000';

    // Verificar respuesta de registro
    const verification = await verifyRegistrationResponseForUser(
      userId,
      response,
      challenge,
      origin
    );

    if (!verification.credentialID || !verification.credentialPublicKey) {
      return NextResponse.json(
        { error: 'Credencial inválida: falta credentialId o publicKey' },
        { status: 400 }
      );
    }

    // Asegurar Buffers válidos
    const toBuffer = (val: unknown, label: string): Buffer | null => {
      if (Buffer.isBuffer(val)) return val;
      try {
        // Puede venir como ArrayBuffer o Uint8Array
        // @ts-ignore
        const arr = val?.buffer ? new Uint8Array(val.buffer) : new Uint8Array(val);
        return Buffer.from(arr);
      } catch (err) {
        console.error(`Error convirtiendo ${label} a Buffer`, err);
        return null;
      }
    };

    const credentialIdBuf = toBuffer(verification.credentialID, 'credentialID');
    const publicKeyBuf = toBuffer(verification.credentialPublicKey, 'credentialPublicKey');

    if (!credentialIdBuf) {
      return NextResponse.json(
        { error: 'Formato de credential ID inválido' },
        { status: 400 }
      );
    }
    if (!publicKeyBuf) {
      return NextResponse.json(
        { error: 'Formato de clave pública inválido o faltante' },
        { status: 400 }
      );
    }

    // Convertir credentialID a base64url
    let credentialId: string;
    try {
      credentialId = credentialIdBuf.toString('base64url');
    } catch (error) {
      return NextResponse.json(
        { error: 'Error al convertir credential ID: ' + (error instanceof Error ? error.message : 'error desconocido') },
        { status: 500 }
      );
    }
    
    // Convertir publicKey a string JSON
    let publicKey: string;
    try {
      publicKey = JSON.stringify(Array.from(publicKeyBuf));
    } catch (error) {
      return NextResponse.json(
        { error: 'Error al procesar clave pública: ' + (error instanceof Error ? error.message : 'error desconocido') },
        { status: 500 }
      );
    }

    // Detectar tipo de autenticador y nombre del dispositivo desde la respuesta
    const attestationResponse = response.response as any;
    const authenticatorData = attestationResponse?.attestationObject 
      ? Buffer.from(attestationResponse.attestationObject, 'base64url')
      : null;
    
    // Detectar tipo de autenticador (platform vs cross-platform)
    // Si tiene authenticatorAttachment en la respuesta, usarlo
    let authenticatorType: string | undefined;
    if (response.authenticatorAttachment) {
      authenticatorType = response.authenticatorAttachment;
    } else {
      // Intentar detectar desde el user agent
      const userAgent = request.headers.get('user-agent') || '';
      if (userAgent.includes('Windows') || userAgent.includes('Mac') || userAgent.includes('Linux')) {
        authenticatorType = 'platform'; // Probablemente Windows Hello, Touch ID, etc.
      } else {
        authenticatorType = 'cross-platform'; // Passkey o USB key
      }
    }

    // Obtener nombre del dispositivo desde headers o user agent
    const deviceNameHeader = request.headers.get('x-device-name');
    const userAgent = request.headers.get('user-agent') || '';
    
    let deviceName = deviceNameHeader;
    if (!deviceName) {
      // Intentar detectar desde user agent
      if (userAgent.includes('Windows')) {
        deviceName = 'PC Windows';
      } else if (userAgent.includes('Mac')) {
        deviceName = 'Mac';
      } else if (userAgent.includes('Linux')) {
        deviceName = 'PC Linux';
      } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
        deviceName = 'iPhone/iPad';
      } else if (userAgent.includes('Android')) {
        deviceName = 'Android';
      } else {
        deviceName = 'Dispositivo desconocido';
      }
    }

    // Almacenar credencial en base de datos
    await createBiometricCredential(
      userId,
      credentialId,
      publicKey,
      deviceName,
      authenticatorType
    );

    // Activar biometría para el usuario
    await updateUserBiometricEnabled(userId, true);

    // Eliminar challenge usado
    registrationChallenges.delete(challengeKey);

    const duration = Date.now() - startTime;
    logApiRequest('PUT', '/api/auth/biometric/register', 200, duration);

    return NextResponse.json({
      success: true,
      message: 'Credencial biométrica registrada exitosamente',
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('PUT', '/api/auth/biometric/register', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al registrar credencial biométrica' },
      { status: 500 }
    );
  }
}

