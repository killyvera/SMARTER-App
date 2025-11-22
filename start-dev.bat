@echo off
echo ========================================
echo   Smarter App - Iniciando Servidor
echo ========================================
echo.

REM Detener procesos Node.js existentes
echo [1/4] Deteniendo procesos Node.js existentes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM Verificar que estamos en el directorio correcto
if not exist "package.json" (
    echo Error: No se encuentra package.json
    echo Asegurate de ejecutar este script desde la raiz del proyecto
    pause
    exit /b 1
)

REM Verificar que existe frontend/.env.local
REM Usar dir en lugar de if exist para archivos que empiezan con punto
dir /b "frontend\.env.local" >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ADVERTENCIA] No se encuentra frontend\.env.local
    echo Buscando archivos .env en frontend\...
    dir /b frontend\.env* 2>nul
    if errorlevel 1 (
        echo No se encontraron archivos .env
        echo Por favor crea el archivo frontend\.env.local con las variables de entorno necesarias
        echo Ver SETUP.md para mas detalles
    ) else (
        echo.
        echo Se encontraron archivos .env pero no .env.local
        echo Por favor renombra o crea frontend\.env.local
    )
    echo.
    pause
) else (
    echo [OK] Archivo frontend\.env.local encontrado
)

REM Verificar dependencias
echo [2/4] Verificando dependencias...
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install --workspaces=false
    if errorlevel 1 (
        echo Error al instalar dependencias
        pause
        exit /b 1
    )
)

REM Generar cliente Prisma si es necesario
echo [3/4] Verificando cliente Prisma...
cd frontend
if not exist "node_modules\.prisma" (
    echo Generando cliente Prisma...
    call npx dotenv-cli -e .env.local -- npx prisma generate
    if errorlevel 1 (
        echo Error al generar cliente Prisma
        cd ..
        pause
        exit /b 1
    )
)
cd ..

REM Iniciar servidor de desarrollo
echo [4/4] Iniciando servidor de desarrollo...
echo.
echo ========================================
echo   Servidor iniciando en http://localhost:3000
echo   Presiona Ctrl+C para detener
echo ========================================
echo.

REM Ejecutar desde frontend para evitar problemas con workspaces
cd frontend
call npm run dev
cd ..

pause

