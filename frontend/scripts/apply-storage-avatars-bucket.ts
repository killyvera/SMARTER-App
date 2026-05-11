import { execSync } from 'child_process';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local'), override: true });

const file = 'supabase/sql/storage-avatars-bucket.sql';
const schema = 'prisma/schema.prisma';

execSync(`npx prisma db execute --file "${file}" --schema "${schema}"`, {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: process.env,
});
