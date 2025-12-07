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
echo   - Publica:  (obteniendo URL...)
echo ========================================
echo.

REM Iniciar tunel
if "%TUNNEL_NAME%"=="Cloudflare" (
    REM Determinar ejecutable de cloudflared
    set CLOUDFLARED_EXE=
    if "%TUNNEL_CMD%"=="" (
        if exist "C:\Program Files (x86)\cloudflared\cloudflared.exe" (
            set CLOUDFLARED_EXE="C:\Program Files (x86)\cloudflared\cloudflared.exe"
        ) else if exist "C:\Program Files\Cloudflare\cloudflared\cloudflared.exe" (
            set CLOUDFLARED_EXE="C:\Program Files\Cloudflare\cloudflared\cloudflared.exe"
        ) else (
            echo [ERROR] cloudflared no encontrado
            pause
            exit /b 1
        )
    ) else (
        REM Extraer solo el ejecutable del comando (primera palabra)
        for /f "tokens=1*" %%a in ("%TUNNEL_CMD%") do set CLOUDFLARED_EXE=%%a
        REM Remover comillas si las tiene
        set CLOUDFLARED_EXE=%CLOUDFLARED_EXE:"=%
    )
    
    REM Crear archivo temporal para capturar salida
    set TEMP_OUTPUT=%TEMP%\cloudflared_output_%RANDOM%.txt
    del "%TEMP_OUTPUT%" 2>nul
    
    REM Iniciar cloudflared en segundo plano capturando salida
    start /B "Cloudflare Tunnel" %CLOUDFLARED_EXE% tunnel --url http://localhost:3000 > "%TEMP_OUTPUT%" 2>&1
    
    REM Usar PowerShell para monitorear el archivo y mostrar la URL cuando aparezca
    echo Esperando a que el tunel se establezca...
    echo.
    
    powershell -NoProfile -Command "$outputFile = '%TEMP_OUTPUT%'; $urlFound = $false; $lastSize = 0; Write-Host '========================================' -ForegroundColor Cyan; Write-Host '  Tu aplicacion estara disponible en:' -ForegroundColor Cyan; Write-Host '  - Local:    http://localhost:3000' -ForegroundColor Green; Write-Host '  - Publica:  (obteniendo URL...)' -ForegroundColor Yellow; Write-Host '========================================' -ForegroundColor Cyan; Write-Host ''; Write-Host 'Salida del tunel:' -ForegroundColor Cyan; Write-Host '----------------------------------------' -ForegroundColor Gray; while ($true) { Start-Sleep -Milliseconds 500; if (Test-Path $outputFile) { $currentSize = (Get-Item $outputFile).Length; if ($currentSize -gt $lastSize) { $newContent = Get-Content $outputFile -Tail 50 -ErrorAction SilentlyContinue; $lastSize = $currentSize; if (-not $urlFound) { if ($newContent -match 'https://[a-zA-Z0-9-]+\.trycloudflare\.com') { $url = $matches[0]; $urlFound = $true; Clear-Host; Write-Host '========================================' -ForegroundColor Cyan; Write-Host '  Tu aplicacion estara disponible en:' -ForegroundColor Cyan; Write-Host '  - Local:    http://localhost:3000' -ForegroundColor Green; Write-Host ('  - Publica:  ' + $url) -ForegroundColor Green; Write-Host '========================================' -ForegroundColor Cyan; Write-Host ''; Write-Host 'Presiona Ctrl+C para detener todo' -ForegroundColor Yellow; Write-Host ''; Write-Host 'Salida del tunel:' -ForegroundColor Cyan; Write-Host '----------------------------------------' -ForegroundColor Gray } } $newContent | ForEach-Object { Write-Host $_ } } $process = Get-Process cloudflared -ErrorAction SilentlyContinue; if (-not $process) { break } }"
    
    REM Si PowerShell falla, usar método simple de respaldo
    if errorlevel 1 (
        echo [INFO] Usando metodo simple de monitoreo...
        timeout /t 5 /nobreak >nul
        
        REM Buscar URL
        set TUNNEL_URL=
        for /L %%i in (1,1,10) do (
            timeout /t 1 /nobreak >nul
            if exist "%TEMP_OUTPUT%" (
                for /f "tokens=*" %%a in ('powershell -NoProfile -Command "$content = Get-Content '%TEMP_OUTPUT%' -Raw -ErrorAction SilentlyContinue; if ($content -match 'https://[a-zA-Z0-9-]+\.trycloudflare\.com') { $matches[0] }"') do (
                    if not "%%a"=="" set TUNNEL_URL=%%a
                )
            )
            if defined TUNNEL_URL goto simple_url_found
        )
        
        :simple_url_found
        echo.
        echo ========================================
        echo   Tu aplicacion estara disponible en:
        echo   - Local:    http://localhost:3000
        if defined TUNNEL_URL (
            echo   - Publica:  %TUNNEL_URL%
        ) else (
            echo   - Publica:  (revisa la salida a continuacion)
        )
        echo ========================================
        echo.
        echo Presiona Ctrl+C para detener todo
        echo.
        echo Salida del tunel:
        echo ----------------------------------------
        
        REM Mostrar salida
        :simple_loop
        timeout /t 2 /nobreak >nul
        if exist "%TEMP_OUTPUT%" (
            type "%TEMP_OUTPUT%" 2>nul
        )
        tasklist /FI "IMAGENAME eq cloudflared.exe" 2>NUL | find /I /N "cloudflared.exe">NUL
        if "%ERRORLEVEL%"=="0" goto simple_loop
    )
    
    del "%TEMP_OUTPUT%" 2>nul
    
) else (
    REM Para ngrok, iniciar en segundo plano y obtener URL de la API
    start /B "ngrok Tunnel" ngrok http 3000
    echo Esperando a que ngrok se inicie...
    timeout /t 4 /nobreak >nul
    
    REM Obtener URL de la API de ngrok usando PowerShell
    set TUNNEL_URL=
    for /f "tokens=*" %%a in ('powershell -NoProfile -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:4040/api/tunnels' -TimeoutSec 5 -ErrorAction Stop; if ($response.tunnels -and $response.tunnels.Count -gt 0) { $response.tunnels[0].public_url } } catch { '' }"') do set TUNNEL_URL=%%a
    
    REM Si no se obtuvo en el primer intento, esperar un poco más
    if not defined TUNNEL_URL (
        timeout /t 2 /nobreak >nul
        for /f "tokens=*" %%a in ('powershell -NoProfile -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:4040/api/tunnels' -TimeoutSec 5 -ErrorAction Stop; if ($response.tunnels -and $response.tunnels.Count -gt 0) { $response.tunnels[0].public_url } } catch { '' }"') do set TUNNEL_URL=%%a
    )
    
    if defined TUNNEL_URL (
        echo.
        echo ========================================
        echo   URL PUBLICA DEL TUNEL:
        echo   %TUNNEL_URL%
        echo ========================================
        echo.
    ) else (
        echo.
        echo [INFO] Abriendo panel de ngrok en el navegador...
        echo La URL publica estara disponible en http://localhost:4040
        echo.
    )
    
    start http://localhost:4040
    echo Presiona Ctrl+C para detener todo
    echo.
    
    REM Mantener el proceso corriendo
    :ngrok_loop
    timeout /t 5 /nobreak >nul
    tasklist /FI "IMAGENAME eq ngrok.exe" 2>NUL | find /I /N "ngrok.exe">NUL
    if "%ERRORLEVEL%"=="0" goto ngrok_loop
)

pause

