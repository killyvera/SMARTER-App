@echo off
echo ========================================
echo   Probar Cloudflare Tunnel
echo ========================================
echo.

REM Verificar que el servidor esté corriendo
echo Verificando que el servidor esté corriendo en localhost:3000...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% neq 0 (
    echo [ADVERTENCIA] El servidor no parece estar corriendo en localhost:3000
    echo Por favor inicia el servidor primero con: start-dev.bat
    echo.
    set /p continue="¿Continuar de todas formas? (S/N): "
    if /i not "%continue%"=="S" exit /b 1
)

echo.
echo Iniciando Cloudflare Tunnel...
echo.
echo La URL publica aparecera a continuacion.
echo Presiona Ctrl+C para detener el tunel.
echo.

REM Intentar con ruta completa
if exist "C:\Program Files (x86)\cloudflared\cloudflared.exe" (
    "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:3000
    goto end
)

if exist "C:\Program Files\Cloudflare\cloudflared\cloudflared.exe" (
    "C:\Program Files\Cloudflare\cloudflared\cloudflared.exe" tunnel --url http://localhost:3000
    goto end
)

REM Intentar con PATH
cloudflared tunnel --url http://localhost:3000 2>nul
if %errorlevel% equ 0 goto end

echo [ERROR] cloudflared no encontrado
echo.
echo Por favor:
echo 1. Cierra y vuelve a abrir esta terminal, O
echo 2. Ejecuta fix-cloudflared-path.bat como Administrador
pause
exit /b 1

:end
pause

