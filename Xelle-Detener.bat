@echo off
setlocal

set "PROJ=C:\Users\WINDOWS\Desktop\DriveProgra\Xelle"

if not exist "%PROJ%\docker-compose.yml" (
  echo No se encontro docker-compose.yml en: %PROJ%
  echo Edita la variable PROJ dentro de este archivo.
  pause
  exit /b 1
)

cd /d "%PROJ%"

echo Deteniendo servicios Xelle...
docker compose down

if errorlevel 1 (
  echo Ocurrio un error al detener los servicios.
  pause
  exit /b 1
)

echo Servicios detenidos correctamente.
endlocal
exit /b 0
