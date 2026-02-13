@REM Script de inicialización para migración a Docker (Windows)
@echo off
setlocal enabledelayedexpansion

REM Asegurar ejecución desde la raíz del proyecto
cd /d "%~dp0.."

echo.
echo 🚀 Iniciando preparación para migración a Docker...
echo.

REM PASO 1: Verificar si Docker está instalado
echo 📋 PASO 1: Verificar Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker no está instalado
    echo Descárgalo desde: https://www.docker.com/products/docker-desktop
    exit /b 1
)
echo ✓ Docker encontrado
docker --version
echo.

REM PASO 2: Verificar Docker Compose
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose no está instalado
    exit /b 1
)
echo ✓ Docker Compose encontrado
docker-compose --version
echo.

REM PASO 3: Crear archivo .env si no existe
echo 📋 PASO 2: Configurar variables de entorno...
if not exist .env (
    echo ⚠ Archivo .env no encontrado, creando desde .env.example...
    copy .env.example .env >nul
    echo ✓ Archivo .env creado
) else (
    echo ✓ Archivo .env ya existe
)
echo.

REM PASO 4: Construir imagen Docker
echo 📋 PASO 3: Construir imagen Docker...
echo ⚠ Esto puede tomar unos minutos...
docker-compose build
if %errorlevel% neq 0 (
    echo ❌ Error al construir imagen
    exit /b 1
)
echo.

REM PASO 5: Iniciar servicios
echo 📋 PASO 4: Iniciar servicios Docker...
docker-compose up -d
if %errorlevel% neq 0 (
    echo ❌ Error al iniciar servicios
    exit /b 1
)
echo.

REM PASO 6: Esperar a que postgres esté listo
echo 📋 PASO 5: Esperando a que PostgreSQL esté listo...
timeout /t 10 /nobreak >nul
echo.

REM PASO 7: Verificar health checks
echo 📋 PASO 6: Verificando salud de servicios...
setlocal enabledelayedexpansion
set "max_attempts=10"
set "attempt=1"

:healthcheck_loop
if !attempt! leq !max_attempts! (
    powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8000/health' -TimeoutSec 2 -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
    if !errorlevel! equ 0 (
        echo ✓ Backend está listo
        goto healthcheck_done
    ) else (
        echo ⚠ Intento !attempt!/!max_attempts!... esperando...
        timeout /t 2 /nobreak >nul
        set /a "attempt+=1"
        goto healthcheck_loop
    )
) else (
    echo ❌ Backend no respondió después de !max_attempts! intentos
    echo Revisa los logs con: docker-compose logs backend
    exit /b 1
)

:healthcheck_done
echo.
echo =========================================
echo ✅ ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!
echo =========================================
echo.
echo 📍 Servicios disponibles:
echo   • Frontend: http://localhost
echo   • Backend API: http://localhost:8000
echo   • API Docs: http://localhost:8000/docs
echo   • Health Check: http://localhost:8000/health
echo.
echo 📊 Container Status:
docker-compose ps
echo.
echo 📋 Comandos útiles:
echo   Ver logs:        docker-compose logs -f backend
echo   Parar servicios: docker-compose down
echo   Reiniciar:       docker-compose restart
echo.
echo 🔍 Próximos pasos:
echo   1. Abre http://localhost en tu navegador
echo   2. Accede a http://localhost:8000/docs para documentación API
echo   3. Verifica que todo funciona correctamente
echo.
pause
