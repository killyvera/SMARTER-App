# Script para iniciar backend y frontend en desarrollo
$ErrorActionPreference = "Stop"

Write-Host "🚀 Iniciando Smarter App..." -ForegroundColor Green

# Configurar variables de entorno para el backend
$env:DATABASE_URL = "file:./prisma/dev.db"
$env:JWT_SECRET = "your-secret-key-change-in-production-min-32-chars-long-12345"
$env:AZURE_OPENAI_ENDPOINT = "https://your-resource.openai.azure.com/"
$env:AZURE_OPENAI_API_KEY = "your-api-key"
$env:AZURE_OPENAI_DEPLOYMENT_NAME = "gpt-4"
$env:AZURE_OPENAI_API_VERSION = "2024-02-15-preview"
$env:PORT = "3001"
$env:NODE_ENV = "development"

Write-Host "✅ Variables de entorno configuradas" -ForegroundColor Green
Write-Host "📦 Iniciando backend y frontend..." -ForegroundColor Yellow

# Ejecutar ambos en paralelo
npm run dev


