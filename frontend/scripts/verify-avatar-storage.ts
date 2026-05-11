/**
 * Verifica NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY y acceso al bucket avatars.
 * No imprime secretos.
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local'), override: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

void (async () => {
  const { data, error } = await sb.storage.from('avatars').list('', { limit: 5 });

  if (error) {
    console.error('Storage avatars:', error.message);
    process.exit(1);
  }

  console.log('OK: bucket `avatars` accesible con service_role.');
  console.log('   Objetos (muestra hasta 5):', data?.length ?? 0);
})();
