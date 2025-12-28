/**
 * Script de build simplificado para Netlify
 * Solo genera Prisma Client y construye el frontend
 * Las tablas se manejan directamente con SQL en Supabase
 */

const { execSync } = require('child_process');

function exec(command) {
  execSync(command, { 
    stdio: 'inherit', 
    encoding: 'utf-8'
  });
}

console.log('📦 Instalando dependencias...\n');
exec('npm install');

console.log('\n🔨 Generando Prisma Client...\n');
exec('npx prisma generate');

console.log('\n🏗️  Construyendo aplicación...\n');
exec('npm run build');

console.log('\n✅ Build completado exitosamente\n');

