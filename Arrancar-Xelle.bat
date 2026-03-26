@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem =====================================================
rem  Arrancar-Xelle.bat
rem  Inicia Docker, levanta docker compose y abre la app
rem =====================================================

set "ROOT=%~dp0"
pushd "%ROOT%" >nul

if not exist "docker-compose.yml" (
  echo [ERROR] No se encontro docker-compose.yml en:
  echo         %ROOT%
  pause
  exit /b 1
)

echo [1/5] Verificando Docker CLI...
docker --version >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Docker no esta instalado o no esta en PATH.
  pause
  exit /b 1
)

echo [2/5] Verificando Docker Engine...
docker info >nul 2>&1
if errorlevel 1 (
  echo Docker Engine no disponible. Intentando abrir Docker Desktop...

  if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
  ) else if exist "C:\Program Files (x86)\Docker\Docker\Docker Desktop.exe" (
    start "" "C:\Program Files (x86)\Docker\Docker\Docker Desktop.exe"
  ) else (
    echo [ADVERTENCIA] No se encontro Docker Desktop.exe en rutas comunes.
    echo             Inicia Docker manualmente y vuelve a ejecutar este .bat.
  )
)

echo [3/5] Esperando que Docker responda...
set "MAX_TRIES=90"
set "TRY=0"
:wait_docker
docker info >nul 2>&1
if not errorlevel 1 goto docker_ready
set /a TRY+=1
if !TRY! geq !MAX_TRIES! (
  echo [ERROR] Docker no respondio a tiempo.
  pause
  exit /b 1
)
timeout /t 2 /nobreak >nul
goto wait_docker

:docker_ready
echo [4/6] Deteniendo contenedores previos...
docker compose down --remove-orphans >nul 2>&1
docker rm -f xelle_postgres xelle_backend xelle_nginx >nul 2>&1

echo [5/6] Levantando servicios Xelle (compose up -d --build)...
docker compose up -d --build
if errorlevel 1 (
  echo [ERROR] Fallo al iniciar servicios con docker compose.
  pause
  exit /b 1
)

echo [6/6] Abriendo aplicacion en navegador...
start "" "http://localhost"
echo.
echo Xelle iniciado correctamente.

popd >nul
endlocal
exit /b 0
