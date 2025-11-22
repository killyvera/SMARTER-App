@echo off
echo ========================================
echo   Verificar Estado del Túnel
echo ========================================
echo.

REM Verificar servidor local
echo [1/3] Verificando servidor local...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Servidor respondiendo en localhost:3000
) else (
    echo [ERROR] Servidor NO esta respondiendo
    echo Por favor inicia el servidor con: start-dev.bat
    pause
    exit /b 1
)

echo.
echo [2/3] Verificando procesos del tunel...
tasklist /FI "IMAGENAME eq cloudflared.exe" 2>NUL | find /I /N "cloudflared.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] Proceso cloudflared detectado
) else (
    echo [ADVERTENCIA] No se detecto proceso cloudflared
    echo El tunel puede no estar activo
)

echo.
echo [3/3] Informacion del tunel:
echo.
echo Para verificar el tunel:
echo 1. Abre la terminal donde ejecutaste el tunel
echo 2. Busca la linea que dice:
echo    "Your quick Tunnel has been created! Visit it at:"
echo 3. Copia la URL completa (debe empezar con https://)
echo.
echo Soluciones comunes:
echo - Espera 1-2 minutos para que el DNS se propague
echo - Usa la URL EXACTA que aparece en la terminal
echo - Asegurate de usar https:// (no http://)
echo - Prueba con datos moviles en lugar de Wi-Fi
echo.
echo Para mas ayuda, consulta: SOLUCION-DNS-CELULAR.md
echo.
pause

