@echo off
echo ========================================
echo   Smarter App - Reiniciando Servidor
echo ========================================
echo.

REM Detener procesos Node.js
echo [1/4] Deteniendo procesos Node.js...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM Limpiar cache de Next.js
echo [2/5] Limpiando cache de Next.js...
if exist "frontend\.next" (
    rmdir /s /q "frontend\.next" >nul 2>&1
    echo Cache limpiado
) else (
    echo No hay cache para limpiar
)

REM Sincronizar base de datos con schema
echo [3/6] Sincronizando base de datos con schema...
cd frontend
call npx dotenv-cli -e .env.local -- npx prisma db push --skip-generate
if errorlevel 1 (
    echo [ERROR] Fallo al sincronizar base de datos
    cd ..
    pause
    exit /b 1
)
cd ..
echo [OK] Base de datos sincronizada

REM Regenerar Prisma Client
echo [4/6] Regenerando Prisma Client...
cd frontend
call npx prisma generate
if errorlevel 1 (
    echo [ADVERTENCIA] Error al regenerar Prisma Client, continuando...
)
cd ..

REM Ejecutar seed
echo [5/6] Ejecutando seed de base de datos...
cd frontend
call npx dotenv-cli -e .env.local -- npm run db:seed
if errorlevel 1 (
    echo [ERROR] Fallo al ejecutar seed
    cd ..
    pause
    exit /b 1
)
cd ..
echo [OK] Seed completado

REM Iniciar servidor
echo [6/6] Iniciando servidor...
echo.
call start-dev.bat
