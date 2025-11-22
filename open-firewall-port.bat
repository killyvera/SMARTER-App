@echo off
echo ========================================
echo   Abriendo puerto 3000 en el Firewall
echo ========================================
echo.
echo Esto permitira que otros dispositivos en tu red
echo puedan acceder al servidor de desarrollo.
echo.
echo Se requiere ejecutar como Administrador.
echo.

REM Crear regla de firewall para permitir el puerto 3000
netsh advfirewall firewall add rule name="Next.js Dev Server" dir=in action=allow protocol=TCP localport=3000

if %errorlevel% equ 0 (
    echo.
    echo [OK] Puerto 3000 abierto en el firewall
    echo.
    echo Ahora puedes acceder desde tu celular usando:
    echo http://TU_IP_LOCAL:3000
    echo.
) else (
    echo.
    echo [ERROR] No se pudo abrir el puerto
    echo Asegurate de ejecutar este script como Administrador
    echo.
)

pause

