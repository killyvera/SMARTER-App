@echo off
echo ========================================
echo   Agregar cloudflared al PATH
echo ========================================
echo.
echo Este script agregara cloudflared al PATH del sistema
echo para que funcione desde cualquier terminal.
echo.
echo REQUIERE PERMISOS DE ADMINISTRADOR
echo.

REM Verificar si cloudflared existe
set CLOUDFLARED_PATH=
if exist "C:\Program Files (x86)\cloudflared\cloudflared.exe" (
    set CLOUDFLARED_PATH=C:\Program Files (x86)\cloudflared
    echo [OK] cloudflared encontrado en: %CLOUDFLARED_PATH%
) else if exist "C:\Program Files\Cloudflare\cloudflared\cloudflared.exe" (
    set CLOUDFLARED_PATH=C:\Program Files\Cloudflare\cloudflared
    echo [OK] cloudflared encontrado en: %CLOUDFLARED_PATH%
) else (
    echo [ERROR] cloudflared no encontrado
    echo Por favor instala cloudflared primero:
    echo   winget install --id Cloudflare.cloudflared
    pause
    exit /b 1
)

echo.
echo Agregando al PATH del sistema...
echo.

REM Agregar al PATH del sistema
setx PATH "%PATH%;%CLOUDFLARED_PATH%" /M

if %errorlevel% equ 0 (
    echo.
    echo [OK] cloudflared agregado al PATH del sistema
    echo.
    echo IMPORTANTE: Cierra y vuelve a abrir la terminal
    echo para que los cambios surtan efecto.
    echo.
    echo Luego puedes ejecutar: cloudflared --version
) else (
    echo.
    echo [ERROR] No se pudo agregar al PATH
    echo Asegurate de ejecutar este script como Administrador
    echo.
)

pause

