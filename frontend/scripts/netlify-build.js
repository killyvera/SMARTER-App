/**
 * Script de build para Netlify que maneja el baseline automáticamente
 */

const { execSync } = require('child_process');

function exec(command, options = {}) {
  try {
    execSync(command, { 
      stdio: 'inherit', 
      encoding: 'utf-8',
      ...options 
    });
  } catch (error) {
    throw error;
  }
}

async function main() {
  console.log('📦 Instalando dependencias...\n');
  exec('npm install');

  console.log('\n🔧 Ejecutando migraciones...\n');
  
  // Intentar hacer migrate deploy
  let migrateOutput = '';
  try {
    migrateOutput = execSync('npx prisma migrate deploy', { 
      encoding: 'utf-8',
      stdio: 'pipe'
    }).toString();
    console.log(migrateOutput);
    console.log('\n✅ Migraciones aplicadas correctamente\n');
  } catch (error) {
    const errorOutput = error.stdout?.toString() || error.stderr?.toString() || error.message || '';
    console.log(errorOutput);
    
    if (errorOutput.includes('P3005') || errorOutput.includes('database schema is not empty') || errorOutput.includes('The database schema is not empty')) {
      console.log('\n⚠️  Error P3005 detectado. Ejecutando baseline automáticamente...\n');
      
      // Ejecutar baseline
      try {
        exec('npx tsx prisma/baseline.ts');
        console.log('\n✅ Baseline completado. Reintentando migrate deploy...\n');
        
        // Reintentar migrate deploy
        exec('npx prisma migrate deploy');
        console.log('\n✅ Migraciones aplicadas después del baseline\n');
      } catch (baselineError) {
        console.error('\n❌ Error durante el baseline:', baselineError.message);
        throw baselineError;
      }
    } else {
      // Otro error, lanzarlo
      throw error;
    }
  }

  console.log('🔨 Generando Prisma Client...\n');
  exec('npx prisma generate');

  console.log('\n🏗️  Construyendo aplicación...\n');
  exec('npm run build');

  console.log('\n✅ Build completado exitosamente\n');
}

main().catch((error) => {
  console.error('\n❌ Error en el build:', error.message);
  process.exit(1);
});

