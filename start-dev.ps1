# Script para iniciar backend y frontend
Write-Host "🚀 Iniciando Smarter App..." -ForegroundColor Green

# Configurar variables de entorno
$env:DATABASE_URL = "file:./prisma/dev.db"
$env:JWT_SECRET = "your-secret-key-change-in-production-min-32-chars-long-12345"
$env:AZURE_OPENAI_ENDPOINT = "https://your-resource.openai.azure.com/"
$env:AZURE_OPENAI_API_KEY = "your-api-key"
$env:AZURE_OPENAI_DEPLOYMENT_NAME = "gpt-4"
$env:AZURE_OPENAI_API_VERSION = "2024-02-15-preview"
$env:PORT = "3001"
$env:NODE_ENV = "development"

# Iniciar backend en background
Write-Host "📦 Iniciando backend en puerto 3001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; `$env:DATABASE_URL='file:./prisma/dev.db'; `$env:JWT_SECRET='your-secret-key-change-in-production-min-32-chars-long-12345'; `$env:AZURE_OPENAI_ENDPOINT='https://your-resource.openai.azure.com/'; `$env:AZURE_OPENAI_API_KEY='your-api-key'; `$env:AZURE_OPENAI_DEPLOYMENT_NAME='gpt-4'; `$env:AZURE_OPENAI_API_VERSION='2024-02-15-preview'; `$env:PORT='3001'; `$env:NODE_ENV='development'; npm run dev"

# Esperar un poco antes de iniciar frontend
Start-Sleep -Seconds 3

# Iniciar frontend
Write-Host "📦 Iniciando frontend en puerto 3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev"

Write-Host "✅ Servidores iniciados:" -ForegroundColor Green
Write-Host "   Backend:  http://localhost:3001" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Cyan


