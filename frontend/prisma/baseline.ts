/**
 * Script simple para hacer baseline de migraciones existentes
 * 
 * Uso local: npx dotenv-cli -e .env.local -- tsx prisma/baseline.ts
 * Uso en Netlify: npx tsx prisma/baseline.ts (las variables de entorno ya están disponibles)
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Haciendo baseline de migraciones...\n');

  // Crear tabla _prisma_migrations si no existe
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" VARCHAR(36) PRIMARY KEY,
      "checksum" VARCHAR(64) NOT NULL,
      "finished_at" TIMESTAMP,
      "migration_name" VARCHAR(255) NOT NULL,
      "logs" TEXT,
      "rolled_back_at" TIMESTAMP,
      "started_at" TIMESTAMP NOT NULL DEFAULT now(),
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    );
  `;

  // Obtener migraciones
  const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
  const migrations = fs.readdirSync(migrationsDir)
    .filter(dir => {
      const dirPath = path.join(migrationsDir, dir);
      return fs.statSync(dirPath).isDirectory() && 
             fs.existsSync(path.join(dirPath, 'migration.sql'));
    })
    .sort();

  console.log(`📋 Encontradas ${migrations.length} migraciones\n`);

  for (const migration of migrations) {
    // Verificar si ya existe
    const existing = await prisma.$queryRaw`
      SELECT * FROM "_prisma_migrations" WHERE "migration_name" = ${migration}
    ` as Array<any>;

    if (existing.length > 0) {
      console.log(`   ⏭️  ${migration} ya está marcada`);
      continue;
    }

    // Leer el archivo SQL para calcular checksum
    const migrationPath = path.join(migrationsDir, migration, 'migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    const checksum = crypto.createHash('sha256').update(migrationSQL).digest('hex');

    // Insertar como aplicada
    const id = crypto.randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "_prisma_migrations" (
        "id", "checksum", "finished_at", "migration_name", 
        "started_at", "applied_steps_count"
      ) VALUES (
        ${id}, ${checksum}, NOW(), ${migration}, NOW(), 1
      )
    `;

    console.log(`   ✅ ${migration} marcada como aplicada`);
  }

  console.log('\n✅ Baseline completado!\n');
  console.log('💡 Ahora puedes hacer deploy en Netlify\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

