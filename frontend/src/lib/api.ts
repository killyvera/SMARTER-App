const API_URL = '/api';

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
      console.error('❌ [API REQUEST] Error en respuesta:', {
        endpoint,
        status: response.status,
        error,
      });
      throw new Error(error.error || `Error ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ [API REQUEST] Petición exitosa:', {
      endpoint,
      hasData: !!data,
    });
    return data;
  } catch (error) {
    console.error('❌ [API REQUEST] Error en petición:', {
      endpoint,
      error: error instanceof Error ? error.message : String(error),
      errorObject: error,
    });
    throw error;
  }
}


