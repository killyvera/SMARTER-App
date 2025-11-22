@echo off
echo ========================================
echo   Smarter App - Configurar Túnel
echo ========================================
echo.
echo Este script configurara un tunel gratuito
echo para exponer tu aplicacion en internet.
echo.
echo Opciones disponibles:
echo   1. Cloudflare Tunnel (cloudflared) - Recomendado, gratuito sin limites
echo   2. ngrok - Popular, requiere registro gratuito
echo.
set /p choice="Selecciona una opcion (1 o 2): "

if "%choice%"=="1" goto cloudflare
if "%choice%"=="2" goto ngrok
echo Opcion invalida
pause
exit /b 1

:cloudflare
echo.
echo ========================================
echo   Instalando Cloudflare Tunnel
echo ========================================
echo.

REM Verificar si cloudflared ya esta instalado
where cloudflared >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] cloudflared ya esta instalado
    goto start_cloudflare
)

echo Descargando cloudflared...
echo Por favor descarga manualmente desde:
echo https://github.com/cloudflare/cloudflared/releases/latest
echo.
echo O instala con winget:
echo winget install --id Cloudflare.cloudflared
echo.
set /p installed="¿Ya descargaste cloudflared? (S/N): "
if /i not "%installed%"=="S" (
    echo Por favor instala cloudflared primero
    pause
    exit /b 1
)

:start_cloudflare
echo.
echo ========================================
echo   Iniciando Cloudflare Tunnel
echo ========================================
echo.
echo El tunel se iniciara en segundo plano
echo La URL publica aparecera a continuacion
echo.
echo Presiona Ctrl+C para detener el tunel
echo.
cloudflared tunnel --url http://localhost:3000
goto end

:ngrok
echo.
echo ========================================
echo   Configurando ngrok
echo ========================================
echo.

REM Verificar si ngrok ya esta instalado
where ngrok >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] ngrok ya esta instalado
    goto check_ngrok_auth
)

echo Descargando ngrok...
echo Por favor descarga desde: https://ngrok.com/download
echo O instala con winget: winget install ngrok
echo.
set /p installed="¿Ya descargaste ngrok? (S/N): "
if /i not "%installed%"=="S" (
    echo Por favor instala ngrok primero
    pause
    exit /b 1
)

:check_ngrok_auth
echo.
echo IMPORTANTE: Para usar ngrok necesitas:
echo 1. Crear cuenta gratuita en https://ngrok.com
echo 2. Obtener tu authtoken
echo 3. Ejecutar: ngrok config add-authtoken TU_TOKEN
echo.
set /p configured="¿Ya configuraste ngrok con tu authtoken? (S/N): "
if /i not "%configured%"=="S" (
    echo Por favor configura ngrok primero
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Iniciando ngrok Tunnel
echo ========================================
echo.
echo El tunel se iniciara y mostrara la URL publica
echo.
echo Presiona Ctrl+C para detener el tunel
echo.
ngrok http 3000
goto end

:end
pause

