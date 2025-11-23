@echo off
echo Regenerando Prisma Client...
cd frontend
npx prisma generate
if %ERRORLEVEL% EQU 0 (
    echo Prisma Client regenerado exitosamente
) else (
    echo Error al regenerar Prisma Client
    echo Asegurate de que el servidor de desarrollo este detenido
    pause
)

