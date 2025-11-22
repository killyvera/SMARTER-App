@echo off
echo ========================================
echo   Smarter App - Iniciar con Túnel
echo ========================================
echo.
echo Este script iniciara el servidor y un tunel
echo para exponer la aplicacion en internet.
echo.

REM Verificar que el servidor no este corriendo
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [ADVERTENCIA] Hay procesos Node.js corriendo
    echo Se detendran antes de continuar...
    taskkill /F /IM node.exe >nul 2>&1
    timeout /t 2 /nobreak >nul
)

REM Verificar cloudflared
where cloudflared >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Cloudflare Tunnel detectado
    set TUNNEL_CMD=cloudflared tunnel --url http://localhost:3000
    set TUNNEL_NAME=Cloudflare
    goto start_server
)

REM Si no está en PATH, buscar en ubicación común
if exist "C:\Program Files (x86)\cloudflared\cloudflared.exe" (
    echo [OK] Cloudflare Tunnel detectado en ubicacion alternativa
    set TUNNEL_CMD="C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:3000
    set TUNNEL_NAME=Cloudflare
    goto start_server
)

if exist "C:\Program Files\Cloudflare\cloudflared\cloudflared.exe" (
    echo [OK] Cloudflare Tunnel detectado en ubicacion alternativa
    set TUNNEL_CMD="C:\Program Files\Cloudflare\cloudflared\cloudflared.exe" tunnel --url http://localhost:3000
    set TUNNEL_NAME=Cloudflare
    goto start_server
)

REM Verificar ngrok
where ngrok >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] ngrok detectado
    set TUNNEL_CMD=start ngrok http 3000
    set TUNNEL_NAME=ngrok
    goto start_server
)

echo [ERROR] No se encontro ningun tunel instalado
echo.
echo Opciones:
echo   1. Instala Cloudflare Tunnel: https://github.com/cloudflare/cloudflared/releases
echo   2. O instala ngrok: https://ngrok.com/download
echo.
echo Luego ejecuta este script nuevamente
pause
exit /b 1

:start_server
echo.
echo [1/2] Iniciando servidor de desarrollo...
echo.

REM Iniciar servidor en segundo plano
cd frontend
start "Smarter App Server" cmd /c "npm run dev"
cd ..

REM Esperar a que el servidor inicie
echo Esperando a que el servidor inicie...
timeout /t 5 /nobreak >nul

echo.
echo [2/2] Iniciando tunel %TUNNEL_NAME%...
echo.
echo ========================================
echo   Tu aplicacion estara disponible en:
echo   - Local:    http://localhost:3000
echo   - Publica:  (se mostrara a continuacion)
echo ========================================
echo.
echo Presiona Ctrl+C para detener todo
echo.

REM Iniciar tunel
if "%TUNNEL_NAME%"=="Cloudflare" (
    REM Usar ruta completa si no está en PATH
    if "%TUNNEL_CMD%"=="" (
        if exist "C:\Program Files (x86)\cloudflared\cloudflared.exe" (
            "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:3000
        ) else if exist "C:\Program Files\Cloudflare\cloudflared\cloudflared.exe" (
            "C:\Program Files\Cloudflare\cloudflared\cloudflared.exe" tunnel --url http://localhost:3000
        ) else (
            echo [ERROR] cloudflared no encontrado
            pause
            exit /b 1
        )
    ) else (
        %TUNNEL_CMD%
    )
) else (
    REM Para ngrok, abrir en navegador automaticamente
    start http://localhost:4040
    ngrok http 3000
)

pause

