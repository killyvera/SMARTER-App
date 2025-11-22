@echo off
echo ========================================
echo   Deploy a Netlify - Smarter App
echo ========================================
echo.

REM Verificar que Netlify CLI esté instalado
where netlify >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Netlify CLI no esta instalado
    echo.
    echo Ejecuta primero: setup-netlify.bat
    pause
    exit /b 1
)

REM Verificar que estemos enlazados a un sitio
if not exist ".netlify\state.json" (
    echo [ADVERTENCIA] No se encontro configuracion de Netlify
    echo.
    echo Ejecuta primero: setup-netlify.bat
    echo O ejecuta: netlify init
    pause
    exit /b 1
)

echo Opciones de deploy:
echo   1. Deploy de prueba (draft)
echo   2. Deploy a produccion
echo.
set /p choice="Selecciona opcion (1 o 2): "

if "%choice%"=="1" goto draft
if "%choice%"=="2" goto production

echo Opcion invalida
pause
exit /b 1

:draft
echo.
echo [DEPLOY DRAFT] Desplegando version de prueba...
echo.
netlify deploy

if %errorlevel% equ 0 (
    echo.
    echo [OK] Deploy de prueba completado
    echo Se mostrara la URL del draft
) else (
    echo.
    echo [ERROR] Fallo el deploy
)

pause
exit /b 0

:production
echo.
echo [DEPLOY PRODUCCION] Desplegando a produccion...
echo.
echo ADVERTENCIA: Esto desplegara a la URL publica
echo.
set /p confirm="¿Continuar? (S/N): "
if /i not "%confirm%"=="S" (
    echo Deploy cancelado
    pause
    exit /b 0
)

netlify deploy --prod

if %errorlevel% equ 0 (
    echo.
    echo [OK] Deploy a produccion completado!
    echo.
    echo Tu aplicacion esta disponible en la URL de Netlify
) else (
    echo.
    echo [ERROR] Fallo el deploy a produccion
)

pause

