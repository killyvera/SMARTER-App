import { createBrowserClient } from '@supabase/ssr';

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

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('Falta NEXT_PUBLIC_SUPABASE_URL en el entorno');
  }
  return createBrowserClient(url, getSupabaseKey());
}
