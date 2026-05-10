import { sanitizeAgentApiErrorForClient } from '@/lib/agentErrorMessage';

const API_URL = '/api';

// Función para limpiar autenticación cuando el token es inválido
function clearAuthAndRedirect() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirigir al login solo si no estamos ya en la página de login
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  console.log('🌐 [API REQUEST] Iniciando petición:', {
    endpoint,
    method: options?.method || 'GET',
    hasToken: !!token,
    hasBody: !!options?.body,
  });
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options?.headers,
      },
    });

    console.log('📡 [API REQUEST] Respuesta recibida:', {
      endpoint,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
      let errorMessage = error.error || `Error ${response.status}`;
      if (endpoint.includes('/assistant/') && typeof errorMessage === 'string') {
        errorMessage = sanitizeAgentApiErrorForClient(errorMessage);
      }

      console.error('❌ [API REQUEST] Error en respuesta:', {
        endpoint,
        status: response.status,
        error,
      });

      const isAssistant = endpoint.includes('/assistant/');
      const msgLower = String(errorMessage).toLowerCase();
      const looksLikeAiProvider =
        isAssistant &&
        (msgLower.includes('openai') ||
          msgLower.includes('api key') ||
          msgLower.includes('azure') ||
          msgLower.includes('modelo de ia'));

      // No cerrar sesión de la app por fallos del proveedor de IA (401/403 del upstream)
      const isTokenError =
        !looksLikeAiProvider &&
        (response.status === 401 ||
          (typeof errorMessage === 'string' &&
            (msgLower.includes('jwt') ||
              msgLower.includes('sesión') ||
              msgLower.includes('autenticación') ||
              msgLower.includes('authentication') ||
              msgLower.includes('signature verification') ||
              msgLower.includes('no autorizado'))));

      if (isTokenError) {
        console.warn('🔒 [API REQUEST] Token inválido detectado, limpiando autenticación');
        clearAuthAndRedirect();
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('✅ [API REQUEST] Petición exitosa:', {
      endpoint,
      hasData: !!data,
    });
    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Detectar errores de token inválido en el mensaje de error
    const isTokenError = typeof errorMessage === 'string' && (
      errorMessage.toLowerCase().includes('token') ||
      errorMessage.toLowerCase().includes('autenticación') ||
      errorMessage.toLowerCase().includes('authentication') ||
      errorMessage.toLowerCase().includes('signature verification')
    );
    
    if (isTokenError && typeof window !== 'undefined') {
      console.warn('🔒 [API REQUEST] Token inválido detectado en error, limpiando autenticación');
      clearAuthAndRedirect();
    }
    
    console.error('❌ [API REQUEST] Error en petición:', {
      endpoint,
      error: errorMessage,
      errorObject: error,
    });
    throw error;
  }
}


