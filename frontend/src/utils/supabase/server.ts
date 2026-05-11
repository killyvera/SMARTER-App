import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function getSupabaseKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error(
      'Falta NEXT_PUBLIC_SUPABASE_ANON_KEY o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en el entorno'
    );
  }
  return key;
}

/**
 * Cliente Supabase en servidor (Server Components, route handlers, server actions).
 * Usa las cookies de la petición actual.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('Falta NEXT_PUBLIC_SUPABASE_URL en el entorno');
  }

  const cookieStore = cookies();

  return createServerClient(url, getSupabaseKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Llamada desde Server Component sin mutar cookies; el middleware mantiene la sesión.
        }
      },
    },
  });
}
