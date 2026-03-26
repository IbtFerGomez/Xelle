@echo off
set "PROJ=C:\Users\WINDOWS\Desktop\DriveProgra\Xelle"

echo [1/4] Verificando Docker Desktop...
tasklist | findstr /I "Docker Desktop.exe" >nul || start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"

echo [2/4] Esperando motor Docker...
:waitdocker
docker info >nul 2>&1
if errorlevel 1 (
  timeout /t 3 >nul
  goto waitdocker
)

cd /d "%PROJ%"
echo [3/5] Deteniendo contenedores previos...
docker compose down --remove-orphans >nul 2>&1
docker rm -f xelle_postgres xelle_backend xelle_nginx >nul 2>&1

echo [4/5] Levantando Xelle...
docker compose up -d --build

echo [5/5] Abriendo aplicacion...
start "" "http://localhost"
exit /b 0