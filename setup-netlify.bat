@echo off
echo ========================================
echo   Configurar Netlify para Smarter App
echo ========================================
echo.

REM Verificar si Netlify CLI está instalado
where netlify >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Netlify CLI ya esta instalado
    netlify --version
    goto login
)

echo [1/3] Instalando Netlify CLI...
echo.
echo Esto instalara Netlify CLI globalmente
echo.

REM Instalar Netlify CLI
npm install -g netlify-cli

if %errorlevel% neq 0 (
    echo [ERROR] No se pudo instalar Netlify CLI
    echo.
    echo Intenta manualmente:
    echo   npm install -g netlify-cli
    pause
    exit /b 1
)

echo.
echo [OK] Netlify CLI instalado correctamente
echo.

:login
echo [2/3] Iniciando sesion en Netlify...
echo.
echo Se abrira el navegador para autenticarte
echo.
netlify login

if %errorlevel% neq 0 (
    echo [ERROR] No se pudo iniciar sesion
    pause
    exit /b 1
)

echo.
echo [3/3] Configurando el sitio...
echo.
echo Si ya tienes un sitio en Netlify, selecciona "Link to an existing site"
echo Si es nuevo, selecciona "Create & configure a new site"
echo.

netlify init

if %errorlevel% neq 0 (
    echo [ERROR] No se pudo configurar el sitio
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Configuracion completada!
echo ========================================
echo.
echo IMPORTANTE: Configura las variables de entorno en Netlify:
echo   1. Ve a: Site settings -^> Environment variables
echo   2. Agrega las siguientes variables:
echo.
echo   - DATABASE_URL (para produccion, usa una base de datos externa)
echo   - JWT_SECRET
echo   - OPENAI_API_KEY (o AZURE_OPENAI_* si usas Azure)
echo   - AI_PROVIDER (openai o azure)
echo.
echo Para hacer deploy:
echo   netlify deploy --prod
echo.
pause

