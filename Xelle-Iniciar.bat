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
echo [3/4] Levantando Xelle...
docker compose up -d --build

echo [4/4] Abriendo aplicacion...
start "" "http://localhost"
exit /b 0