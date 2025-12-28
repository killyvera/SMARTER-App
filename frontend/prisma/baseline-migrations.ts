#!/usr/bin/env tsx

/**
 * Script para hacer baseline de migraciones existentes en una base de datos
 * que ya tiene tablas pero no tiene el historial de migraciones de Prisma.
 * 
 * Uso: npx dotenv-cli -e .env.local -- tsx prisma/baseline-migrations.ts
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function baselineMigrations() {
  console.log('🔍 Verificando estado de la base de datos...\n');

  try {
    // Verificar que la conexión funciona
    await prisma.$connect();
    console.log('✅ Conexión a la base de datos exitosa\n');

    // Obtener todas las migraciones en el directorio
    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
    const migrations = fs.readdirSync(migrationsDir)
      .filter(dir => {
        const dirPath = path.join(migrationsDir, dir);
        return fs.statSync(dirPath).isDirectory() && 
               fs.existsSync(path.join(dirPath, 'migration.sql'));
      })
      .sort();

    if (migrations.length === 0) {
      console.log('❌ No se encontraron migraciones\n');
      process.exit(1);
    }

    console.log(`📋 Se encontraron ${migrations.length} migraciones:\n`);
    migrations.forEach((migration, index) => {
      console.log(`   ${index + 1}. ${migration}`);
    });
    console.log('');

    // Verificar si la tabla _prisma_migrations existe
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '_prisma_migrations'
      );
    ` as Array<{ exists: boolean }>;

    if (!tableExists[0]?.exists) {
      console.log('📝 La tabla _prisma_migrations no existe. Creándola...\n');
      // Crear la tabla _prisma_migrations
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
      console.log('✅ Tabla _prisma_migrations creada\n');
    }

    // Marcar cada migración como aplicada
    console.log('🔄 Marcando migraciones como aplicadas...\n');
    
    for (const migration of migrations) {
      const migrationPath = path.join(migrationsDir, migration, 'migration.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
      
      // Calcular checksum simple (Prisma usa SHA-256, pero para baseline podemos usar un hash simple)
      const crypto = require('crypto');
      const checksum = crypto.createHash('sha256').update(migrationSQL).digest('hex');

      // Verificar si la migración ya está marcada
      const existing = await prisma.$queryRaw`
        SELECT * FROM "_prisma_migrations" 
        WHERE "migration_name" = ${migration}
      ` as Array<any>;

      if (existing.length > 0) {
        console.log(`   ⏭️  ${migration} ya está marcada como aplicada`);
        continue;
      }

      // Insertar la migración como aplicada
      const migrationId = crypto.randomUUID();
      await prisma.$executeRaw`
        INSERT INTO "_prisma_migrations" (
          "id",
          "checksum",
          "finished_at",
          "migration_name",
          "started_at",
          "applied_steps_count"
        ) VALUES (
          ${migrationId},
          ${checksum},
          NOW(),
          ${migration},
          NOW(),
          1
        )
      `;

      console.log(`   ✅ ${migration} marcada como aplicada`);
    }

    console.log('\n✅ Baseline completado exitosamente\n');
    console.log('💡 Ahora puedes ejecutar: npx prisma migrate deploy\n');

  } catch (error: any) {
    console.error('\n❌ Error durante el baseline:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

baselineMigrations();

