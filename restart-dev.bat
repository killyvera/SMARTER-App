@echo off
echo ========================================
echo   Smarter App - Reiniciando Servidor
echo ========================================
echo.

REM Detener procesos Node.js
echo [1/3] Deteniendo procesos Node.js...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM Limpiar cache de Next.js
echo [2/3] Limpiando cache de Next.js...
if exist "frontend\.next" (
    rmdir /s /q "frontend\.next" >nul 2>&1
    echo Cache limpiado
) else (
    echo No hay cache para limpiar
)

REM Iniciar servidor
echo [3/3] Iniciando servidor...
echo.
call start-dev.bat
