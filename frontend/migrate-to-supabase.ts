/**
 * Script de migración de SQLite a Supabase (PostgreSQL)
 * 
 * Este script ayuda a migrar datos de SQLite local a Supabase.
 * 
 * USO:
 * 1. Asegúrate de tener DATABASE_URL configurado para Supabase en .env.local
 * 2. Ejecuta: npx tsx migrate-to-supabase.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const sqliteDbPath = path.join(__dirname, 'prisma', 'dev.db');
const sqliteDbExists = fs.existsSync(sqliteDbPath);

async function migrateToSupabase() {
  console.log('🔄 Iniciando migración a Supabase...\n');

  // Verificar que DATABASE_URL esté configurado para Supabase
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL no está configurado');
    console.log('   Configura DATABASE_URL en .env.local con tu connection string de Supabase');
    process.exit(1);
  }

  if (!databaseUrl.includes('supabase')) {
    console.warn('⚠️  Advertencia: DATABASE_URL no parece ser de Supabase');
    console.log('   Asegúrate de estar usando la connection string correcta\n');
  }

  const prisma = new PrismaClient();

  try {
    // Verificar conexión
    console.log('📡 Verificando conexión a Supabase...');
    await prisma.$connect();
    console.log('✅ Conexión exitosa\n');

    // Verificar si ya hay datos
    const userCount = await prisma.user.count();
    const goalCount = await prisma.goal.count();
    
    if (userCount > 0 || goalCount > 0) {
      console.log(`⚠️  Advertencia: Ya existen datos en la base de datos:`);
      console.log(`   - ${userCount} usuarios`);
      console.log(`   - ${goalCount} goals`);
      console.log('\n   Si continúas, los datos existentes se mantendrán.');
      console.log('   Para empezar desde cero, ejecuta el seed después de las migraciones.\n');
    }

    // Verificar schema
    console.log('📋 Verificando schema...');
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;
    
    if (tables.length === 0) {
      console.log('⚠️  No se encontraron tablas. Ejecuta las migraciones primero:');
      console.log('   npx prisma migrate deploy\n');
    } else {
      console.log(`✅ Se encontraron ${tables.length} tablas en la base de datos\n`);
    }

    console.log('✅ Verificación completada\n');
    console.log('📝 Próximos pasos:');
    console.log('   1. Ejecuta las migraciones: npx prisma migrate deploy');
    console.log('   2. (Opcional) Ejecuta el seed: npm run db:seed');
    console.log('   3. Verifica con Prisma Studio: npx prisma studio\n');

  } catch (error: any) {
    console.error('❌ Error durante la migración:', error.message);
    if (error.code === 'P1001') {
      console.error('\n   No se pudo conectar a la base de datos.');
      console.error('   Verifica que:');
      console.error('   - DATABASE_URL sea correcto');
      console.error('   - La base de datos esté accesible');
      console.error('   - Tu IP no esté bloqueada en Supabase\n');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  migrateToSupabase();
}

export { migrateToSupabase };

