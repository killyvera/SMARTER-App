'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/api';

// Función para convertir string UTF-8 a ArrayBuffer (para user.id)
function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer;
}

// Funciones helper para convertir entre Base64URL y ArrayBuffer
function base64URLToArrayBuffer(base64url: string): ArrayBuffer {
  if (!base64url || typeof base64url !== 'string') {
    throw new Error('base64url debe ser un string no vacío');
  }

  // Limpiar la cadena: eliminar espacios y caracteres no válidos
  let cleaned = base64url.trim().replace(/\s/g, '');
  
  // Validar que solo contenga caracteres válidos de Base64URL
  if (!/^[A-Za-z0-9_-]*$/.test(cleaned)) {
    throw new Error(`Cadena base64url contiene caracteres inválidos: ${cleaned.substring(0, 20)}...`);
  }

  // Convertir Base64URL a Base64 estándar
  let base64 = cleaned.replace(/-/g, '+').replace(/_/g, '/');
  
  // Añadir padding si es necesario (longitud debe ser múltiplo de 4)
  const padding = base64.length % 4;
  if (padding !== 0) {
    base64 += '='.repeat(4 - padding);
  }
  
  try {
    // Decodificar usando atob (ahora es Base64 válido)
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (error) {
    throw new Error(`Error al decodificar base64url: ${error instanceof Error ? error.message : String(error)}. Cadena: ${cleaned.substring(0, 50)}...`);
  }
}

function arrayBufferToBase64URL(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // Convertir a Base64 y luego a Base64URL
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Convertir opciones JSON del servidor al formato que espera la API nativa
function convertToNativeOptions(
  options: any
): PublicKeyCredentialCreationOptions | PublicKeyCredentialRequestOptions {
  const converted: any = { ...options };
  
  // Convertir challenge de string base64url a ArrayBuffer
  if (options.challenge) {
    try {
      console.log('Convirtiendo challenge:', typeof options.challenge, options.challenge?.substring?.(0, 20));
      converted.challenge = base64URLToArrayBuffer(options.challenge);
    } catch (error) {
      console.error('Error al convertir challenge:', error, options.challenge);
      throw new Error(`Error al convertir challenge: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Convertir user.id si existe
  // user.id es un string normal (CUID), NO base64url, así que lo convertimos con UTF-8
  if (options.user?.id) {
    try {
      // Si ya es ArrayBuffer, usarlo directamente
      if (options.user.id instanceof ArrayBuffer) {
        converted.user = {
          ...options.user,
          id: options.user.id,
        };
      } else if (typeof options.user.id === 'string') {
        // Es un string normal (CUID), convertir a ArrayBuffer con UTF-8
        converted.user = {
          ...options.user,
          id: stringToArrayBuffer(options.user.id),
        };
      } else {
        // Intentar convertir si es Uint8Array
        const arr = options.user.id instanceof Uint8Array 
          ? options.user.id 
          : new Uint8Array(options.user.id as ArrayBuffer);
        converted.user = {
          ...options.user,
          id: arr.buffer,
        };
      }
    } catch (error) {
      console.error('Error al convertir user.id:', error, options.user.id);
      throw new Error(`Error al convertir user.id: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Convertir excludeCredentials si existen
  if (options.excludeCredentials && Array.isArray(options.excludeCredentials)) {
    converted.excludeCredentials = options.excludeCredentials.map((cred: any, index: number) => {
      try {
        return {
          ...cred,
          id: base64URLToArrayBuffer(cred.id),
        };
      } catch (error) {
        console.error(`Error al convertir excludeCredential[${index}]:`, error, cred);
        throw new Error(`Error al convertir excludeCredential[${index}]: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
  
  // Convertir allowCredentials si existen
  if (options.allowCredentials && Array.isArray(options.allowCredentials)) {
    converted.allowCredentials = options.allowCredentials.map((cred: any, index: number) => {
      try {
        return {
          ...cred,
          id: base64URLToArrayBuffer(cred.id),
        };
      } catch (error) {
        console.error(`Error al convertir allowCredential[${index}]:`, error, cred);
        throw new Error(`Error al convertir allowCredential[${index}]: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
  
  return converted;
}

// Convertir respuesta nativa a formato JSON para el servidor
function convertFromNativeResponse(credential: PublicKeyCredential): any {
  const response = credential.response as AuthenticatorAttestationResponse | AuthenticatorAssertionResponse;
  
  return {
    id: credential.id,
    rawId: arrayBufferToBase64URL(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: arrayBufferToBase64URL(response.clientDataJSON),
      ...(response instanceof AuthenticatorAttestationResponse && {
        attestationObject: arrayBufferToBase64URL(response.attestationObject),
      }),
      ...(response instanceof AuthenticatorAssertionResponse && {
        authenticatorData: arrayBufferToBase64URL(response.authenticatorData),
        signature: arrayBufferToBase64URL(response.signature),
        userHandle: response.userHandle ? arrayBufferToBase64URL(response.userHandle) : null,
      }),
    },
  };
}

export interface BiometricAvailability {
  isAvailable: boolean;
  isMobile: boolean;
  isSupported: boolean;
}

export function useBiometric() {
  const [availability, setAvailability] = useState<BiometricAvailability>({
    isAvailable: false,
    isMobile: false,
    isSupported: false,
  });

  // Detectar disponibilidad de WebAuthn y si es móvil
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isSupported = 
      typeof window.PublicKeyCredential !== 'undefined' &&
      typeof navigator.credentials !== 'undefined' &&
      typeof navigator.credentials.create !== 'undefined';

    // Detectar si es dispositivo móvil
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || 
    ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0);

    // WebAuthn está disponible si está soportado, independientemente de si es móvil o PC
    // En PC puede usar Windows Hello (PIN, huella, reconocimiento facial), en móvil puede usar huella digital
    setAvailability({
      isAvailable: isSupported, // Disponible si WebAuthn está soportado (móvil o PC)
      isMobile,
      isSupported,
    });
  }, []);

  // Registrar credencial biométrica
  const registerBiometric = useCallback(async (): Promise<boolean> => {
    try {
      // Paso 1: Obtener opciones de registro del servidor
      const registerResponse = await apiRequest<{
        publicKey: any;
        challengeKey: string;
      }>('/auth/biometric/register', {
        method: 'POST',
      });

      // Paso 2: Convertir opciones JSON a formato nativo
      const nativeOptions = convertToNativeOptions(registerResponse.publicKey) as PublicKeyCredentialCreationOptions;

      // Log para debugging
      console.log('Opciones nativas de registro:', {
        rp: nativeOptions.rp,
        user: { ...nativeOptions.user, id: `ArrayBuffer(${nativeOptions.user?.id?.byteLength} bytes)` },
        challenge: `ArrayBuffer(${nativeOptions.challenge?.byteLength} bytes)`,
        timeout: nativeOptions.timeout,
        authenticatorSelection: nativeOptions.authenticatorSelection,
      });

      // Paso 3: Crear credencial usando API nativa del navegador
      // Asegurarse de que el timeout esté configurado
      if (!nativeOptions.timeout) {
        nativeOptions.timeout = 120000; // 2 minutos
      }
      
      const credential = await navigator.credentials.create({
        publicKey: nativeOptions,
      }) as PublicKeyCredential | null;

      if (!credential) {
        throw new Error('No se pudo crear la credencial');
      }

      // Paso 4: Convertir respuesta nativa a formato JSON
      const attestationResponse = convertFromNativeResponse(credential);

      // Detectar tipo de autenticador desde la credencial
      const authenticatorAttachment = (credential as any).authenticatorAttachment || 
        (attestationResponse as any).authenticatorAttachment;

      // Obtener nombre del dispositivo
      const deviceName = typeof navigator !== 'undefined' 
        ? (navigator.userAgentData?.platform || navigator.platform || 'Dispositivo desconocido')
        : 'Dispositivo desconocido';

      // Paso 5: Enviar respuesta al servidor para verificación
      await apiRequest('/auth/biometric/register', {
        method: 'PUT',
        headers: {
          'x-device-name': deviceName,
        },
        body: JSON.stringify({
          challengeKey: registerResponse.challengeKey,
          response: {
            ...attestationResponse,
            authenticatorAttachment,
          },
        }),
      });

      return true;
    } catch (error) {
      console.error('Error al registrar biometría:', error);
      
      // Proporcionar mensajes de error más claros
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('not allowed')) {
          throw new Error('La operación expiró o fue cancelada. Por favor, asegúrate de tener un autenticador biométrico configurado (Windows Hello, Touch ID, etc.) e inténtalo de nuevo.');
        }
        if (error.message.includes('NotSupportedError') || error.message.includes('NotAllowedError')) {
          throw new Error('Tu navegador o dispositivo no soporta autenticación biométrica, o no tienes un autenticador configurado.');
        }
      }
      
      throw error;
    }
  }, []);

  // Autenticar con biometría
  const authenticateBiometric = useCallback(async (email: string): Promise<{
    token: string;
    user: { id: string; email: string };
  }> => {
    try {
      // Paso 1: Obtener opciones de autenticación del servidor
      const authResponse = await apiRequest<{
        publicKey: any;
        challengeKey: string;
      }>('/auth/biometric/authenticate', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      // Paso 2: Convertir opciones JSON a formato nativo
      const nativeOptions = convertToNativeOptions(authResponse.publicKey) as PublicKeyCredentialRequestOptions;

      // Paso 3: Autenticar usando API nativa del navegador
      const credential = await navigator.credentials.get({
        publicKey: nativeOptions,
      }) as PublicKeyCredential | null;

      if (!credential) {
        throw new Error('No se pudo autenticar con la credencial');
      }

      // Paso 4: Convertir respuesta nativa a formato JSON
      const assertionResponse = convertFromNativeResponse(credential);

      // Paso 5: Enviar respuesta al servidor para verificación
      const result = await apiRequest<{
        success: boolean;
        token: string;
        user: { id: string; email: string };
      }>('/auth/biometric/authenticate', {
        method: 'PUT',
        body: JSON.stringify({
          challengeKey: authResponse.challengeKey,
          response: assertionResponse,
        }),
      });

      return {
        token: result.token,
        user: result.user,
      };
    } catch (error) {
      console.error('Error al autenticar con biometría:', error);
      throw error;
    }
  }, []);

  return {
    ...availability,
    registerBiometric,
    authenticateBiometric,
  };
}

