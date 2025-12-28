#!/bin/bash
set -e

echo "📦 Instalando dependencias..."
npm install

echo "🔧 Ejecutando migraciones..."
# Intentar hacer migrate deploy
if npx prisma migrate deploy 2>&1 | grep -q "P3005"; then
  echo "⚠️  Error P3005 detectado. Ejecutando baseline..."
  echo "🔧 Haciendo baseline de migraciones existentes..."
  npx tsx prisma/baseline.ts
  echo "✅ Baseline completado. Reintentando migrate deploy..."
  npx prisma migrate deploy
else
  # Si no hay error P3005, el comando anterior ya se ejecutó
  echo "✅ Migraciones aplicadas correctamente"
fi

echo "🔨 Generando Prisma Client..."
npx prisma generate

echo "🏗️  Construyendo aplicación..."
npm run build

echo "✅ Build completado exitosamente"

