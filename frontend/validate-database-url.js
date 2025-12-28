#!/usr/bin/env node

/**
 * Script para validar y codificar la URL de conexión de PostgreSQL
 * Uso: node validate-database-url.js [DATABASE_URL]
 */

const url = require('url');
const querystring = require('querystring');

function validateDatabaseUrl(databaseUrl) {
  console.log('🔍 Validando URL de base de datos...\n');
  
  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL no proporcionada');
    console.log('\nUso: node validate-database-url.js "postgresql://..."');
    process.exit(1);
  }

  try {
    // Parsear la URL
    const parsed = new URL(databaseUrl);
    
    console.log('✅ URL parseada correctamente\n');
    console.log('📋 Componentes:');
    console.log(`   Protocolo: ${parsed.protocol}`);
    console.log(`   Usuario: ${parsed.username || '(no especificado)'}`);
    console.log(`   Host: ${parsed.hostname}`);
    console.log(`   Puerto: ${parsed.port || '(default)'}`);
    console.log(`   Base de datos: ${parsed.pathname.substring(1) || '(no especificada)'}`);
    
    if (parsed.search) {
      const params = querystring.parse(parsed.search.substring(1));
      console.log(`   Parámetros: ${JSON.stringify(params, null, 2)}`);
    }
    
    // Verificar que sea PostgreSQL
    if (parsed.protocol !== 'postgresql:') {
      console.warn('\n⚠️  Advertencia: El protocolo no es "postgresql:"');
    }
    
    // Verificar parámetros recomendados para Supabase
    if (parsed.search) {
      const params = querystring.parse(parsed.search.substring(1));
      if (!params.pgbouncer) {
        console.warn('\n⚠️  Advertencia: Falta el parámetro "pgbouncer=true" (recomendado para Supabase)');
      }
      if (!params.connection_limit) {
        console.warn('⚠️  Advertencia: Falta el parámetro "connection_limit=1" (requerido para pooler)');
      }
    }
    
    // Verificar si la contraseña tiene caracteres especiales sin codificar
    const password = parsed.password || '';
    const specialChars = /[@:?#\[\]%&]/;
    if (specialChars.test(password)) {
      console.warn('\n⚠️  ADVERTENCIA: La contraseña contiene caracteres especiales que podrían necesitar codificación');
      console.log('   Caracteres especiales encontrados:', password.match(/[@:?#\[\]%&]/g)?.join(', ') || 'ninguno');
      console.log('\n   Si tienes problemas de conexión, codifica la contraseña usando URL encoding:');
      console.log('   Ejemplo: @ → %40, : → %3A, etc.');
    }
    
    console.log('\n✅ La URL parece estar bien formateada');
    console.log('\n💡 Para usar en Netlify:');
    console.log('   1. Copia la URL completa (sin comillas)');
    console.log('   2. Ve a Netlify Dashboard → Site settings → Environment variables');
    console.log('   3. Agrega o actualiza DATABASE_URL con el valor');
    console.log('   4. Asegúrate de NO usar comillas en Netlify\n');
    
    return true;
  } catch (error) {
    console.error('\n❌ Error al parsear la URL:');
    console.error(`   ${error.message}\n`);
    
    console.log('💡 Posibles problemas:');
    console.log('   - La URL tiene caracteres especiales sin codificar');
    console.log('   - La URL tiene espacios o caracteres invisibles');
    console.log('   - El formato de la URL es incorrecto\n');
    
    console.log('📖 Formato esperado:');
    console.log('   postgresql://usuario:contraseña@host:puerto/base_de_datos?parametros\n');
    
    return false;
  }
}

// Obtener la URL del argumento de línea de comandos o de la variable de entorno
const databaseUrl = process.argv[2] || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL no proporcionada');
  console.log('\nUso:');
  console.log('   node validate-database-url.js "postgresql://..."');
  console.log('   O establece la variable de entorno: DATABASE_URL="..." node validate-database-url.js\n');
  process.exit(1);
}

const isValid = validateDatabaseUrl(databaseUrl);
process.exit(isValid ? 0 : 1);

