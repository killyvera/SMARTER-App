import {
  generateRegistrationOptions,
  verifyRegistrationResponse as verifyRegistrationResponseLib,
  generateAuthenticationOptions,
  verifyAuthenticationResponse as verifyAuthenticationResponseLib,
  type GenerateRegistrationOptionsOpts,
  type GenerateAuthenticationOptionsOpts,
  type VerifyRegistrationResponseOpts,
  type VerifyAuthenticationResponseOpts,
} from '@simplewebauthn/server';
import type { AuthenticatorTransportFuture } from '@simplewebauthn/types';
import {
  findBiometricCredentialsByUserId,
  deleteBiometricCredential,
} from '@/repositories/biometricCredentialRepository';
import type { BiometricCredential } from '@prisma/client';

// Obtener el origen desde la URL
function getOrigin(requestOrigin?: string): string {
  if (requestOrigin) {
    return requestOrigin;
  }
  
  // En desarrollo, usar localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  
  // En producción, usar la variable de entorno o inferir desde la URL
  return process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000';
}

// Obtener el Relying Party ID (dominio)
function getRPID(origin: string): string {
  try {
    const url = new URL(origin);
    return url.hostname;
  } catch {
    return 'localhost';
  }
}

type ValidCredential = {
  idBuffer: Buffer;
  transports: AuthenticatorTransportFuture[];
  raw: import('@prisma/client').BiometricCredential;
};

async function loadAndCleanValidCredentials(userId: string, onlyEnabled: boolean = true): Promise<ValidCredential[]> {
  const credentials = await findBiometricCredentialsByUserId(userId, onlyEnabled);
  const valid: ValidCredential[] = [];

  for (const cred of credentials) {
    let isValid = true;
    let idBuffer: Buffer | null = null;

    try {
      if (!cred.credentialId || typeof cred.credentialId !== 'string') throw new Error('credentialId inválido');
      idBuffer = Buffer.from(cred.credentialId, 'base64url');
      if (idBuffer.length === 0) throw new Error('credentialId vacío tras decodificar');
    } catch (error) {
      isValid = false;
      console.warn('Eliminando credencial inválida (ID):', cred.id, error);
    }

    // Validar publicKey
    if (isValid) {
      try {
        const pk = JSON.parse(cred.publicKey);
        if (!Array.isArray(pk) || pk.length === 0) throw new Error('publicKey inválida');
      } catch (error) {
        isValid = false;
        console.warn('Eliminando credencial inválida (publicKey):', cred.id, error);
      }
    }

    if (isValid && idBuffer) {
      valid.push({
        idBuffer,
        transports: ['internal'],
        raw: cred,
      });
    } else {
      // Limpiar credencial corrupta
      try {
        await deleteBiometricCredential(cred.credentialId);
      } catch (err) {
        console.error('No se pudo eliminar credencial inválida:', cred.id, err);
      }
    }
  }

  return valid;
}

export async function generateRegistrationOptionsForUser(
  userId: string,
  userName: string,
  userDisplayName: string,
  requestOrigin?: string
) {
  const origin = getOrigin(requestOrigin);
  const rpID = getRPID(origin);
  
  // Obtener credenciales válidas y limpiar las corruptas automáticamente
  const validExistingCredentials = await loadAndCleanValidCredentials(userId);
  
  const opts: GenerateRegistrationOptionsOpts = {
    rpName: 'Smarter App',
    rpID,
    userID: userId,
    userName,
    timeout: 120000, // 2 minutos para dar más tiempo al usuario
    attestationType: 'none',
    excludeCredentials: validExistingCredentials.length > 0
      ? validExistingCredentials.map((cred) => ({
          id: cred.idBuffer,
          type: 'public-key' as const,
          transports: cred.transports,
        }))
      : undefined,
    authenticatorSelection: {
      // Permitir tanto autenticadores de plataforma como cross-platform
      // En PC puede usar Windows Hello (PIN, huella, reconocimiento facial, cámara)
      // En móvil puede usar huella digital, Face ID, etc.
      // No especificar authenticatorAttachment permite ambos tipos
      userVerification: 'preferred', // Preferir verificación del usuario (PIN, huella, etc.), pero no requerirla estrictamente
      residentKey: 'preferred', // Preferir claves residentes para mejor UX
    },
    supportedAlgorithmIDs: [-7, -257], // ES256 y RS256
  };

  return generateRegistrationOptions(opts);
}

export async function verifyRegistrationResponseForUser(
  userId: string,
  response: any,
  expectedChallenge: string,
  requestOrigin?: string
) {
  const origin = getOrigin(requestOrigin);
  const rpID = getRPID(origin);
  
  // Obtener credenciales existentes para verificar que no se duplique
  const existingCredentials = await findBiometricCredentialsByUserId(userId);
  
  const opts: VerifyRegistrationResponseOpts = {
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
  };

  const verification = await verifyRegistrationResponseLib(opts);

  if (!verification.verified) {
    throw new Error('Verificación de registro fallida');
  }

  return {
    credentialID: verification.registrationInfo?.credentialID,
    credentialPublicKey: verification.registrationInfo?.credentialPublicKey,
    counter: verification.registrationInfo?.counter ?? 0,
  };
}

export async function generateAuthenticationOptionsForUser(
  userId: string,
  requestOrigin?: string
) {
  const origin = getOrigin(requestOrigin);
  const rpID = getRPID(origin);
  
  // Obtener credenciales válidas y limpiar las corruptas automáticamente
  const validCredentials = await loadAndCleanValidCredentials(userId);
  
  if (validCredentials.length === 0) {
    throw new Error('No hay credenciales biométricas válidas registradas');
  }

  const opts: GenerateAuthenticationOptionsOpts = {
    timeout: 120000, // 2 minutos para dar más tiempo al usuario
    allowCredentials: validCredentials.map((cred) => ({
      id: cred.idBuffer,
      type: 'public-key' as const,
      transports: cred.transports,
    })),
    userVerification: 'required',
    rpID,
  };

  return generateAuthenticationOptions(opts);
}

export async function verifyAuthenticationResponse(
  userId: string,
  credentialId: string,
  response: any,
  expectedChallenge: string,
  storedCounter: number,
  storedPublicKey: Buffer,
  requestOrigin?: string
) {
  const origin = getOrigin(requestOrigin);
  const rpID = getRPID(origin);

  // Validar credentialId antes de usarlo
  if (!credentialId || typeof credentialId !== 'string' || credentialId.length === 0) {
    throw new Error('Credential ID inválido');
  }

  let credentialIDBuffer: Buffer;
  try {
    credentialIDBuffer = Buffer.from(credentialId, 'base64url');
  } catch (error) {
    throw new Error('Error al decodificar credential ID: formato base64url inválido');
  }

  const opts: VerifyAuthenticationResponseOpts = {
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    authenticator: {
      credentialID: credentialIDBuffer,
      credentialPublicKey: storedPublicKey,
      counter: storedCounter,
    },
    requireUserVerification: true,
  };

  const verification = await verifyAuthenticationResponseLib(opts);

  if (!verification.verified) {
    throw new Error('Verificación de autenticación fallida');
  }

  return {
    newCounter: verification.authenticationInfo.newCounter,
  };
}

