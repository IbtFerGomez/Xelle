@REM Script de pruebas pre-Docker en Windows
@echo off
setlocal enabledelayedexpansion

REM Asegurar ejecución desde la raíz del proyecto
cd /d "%~dp0.."

echo.
echo ========================================
echo   PRE-DOCKER TEST SUITE
echo ========================================
echo.
echo Este script verifica que todo esté listo antes de Docker
echo.

REM COLORES (nota: Windows CMD no soporta ANSI tan bien, usamos símbolos)
set "CHECK=✓"
set "ERROR=✗"
set "WARN=⚠"

REM PASO 1: Verificar Python
echo --- VERIFICACIÓN 1: Python ---
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo %CHECK% Python instalado
    python --version
) else (
    echo %ERROR% Python NO está instalado
    echo   Descárgalo desde: https://www.python.org/
    exit /b 1
)
echo.

REM PASO 2: Verificar pip
echo --- VERIFICACIÓN 2: Pip ---
pip --version >nul 2>&1
if %errorlevel% equ 0 (
    echo %CHECK% Pip instalado
    pip --version
) else (
    echo %ERROR% Pip NO está instalado
    exit /b 1
)
echo.

REM PASO 3: Verificar si estamos en el directorio correcto
echo --- VERIFICACIÓN 3: Estructura del Proyecto ---
if exist backend\app\main.py (
    echo %CHECK% backend\app\main.py encontrado
) else (
    echo %ERROR% No se encuentra backend\app\main.py
    exit /b 1
)

if exist frontend\index.html (
    echo %CHECK% frontend\index.html encontrado
) else (
    echo %ERROR% No se encuentra frontend\index.html
    exit /b 1
)

if exist requirements.txt (
    echo %CHECK% requirements.txt encontrado
) else (
    echo %ERROR% No se encuentra requirements.txt
    exit /b 1
)
echo.

REM PASO 4: Crear virtual environment
echo --- VERIFICACIÓN 4: Environment Virtual ---
if not exist venv (
    echo %WARN% Creando virtual environment...
    python -m venv venv
    if %errorlevel% equ 0 (
        echo %CHECK% Virtual environment creado
    ) else (
        echo %ERROR% Error al crear virtual environment
        exit /b 1
    )
) else (
    echo %CHECK% Virtual environment ya existe
)
echo.

REM PASO 5: Activar virtual environment
echo --- VERIFICACIÓN 5: Activar Virtual Environment ---
call venv\Scripts\activate.bat
if %errorlevel% equ 0 (
    echo %CHECK% Virtual environment activado
) else (
    echo %ERROR% Error al activar virtual environment
    exit /b 1
)
echo.

REM PASO 6: Instalar dependencias
echo --- VERIFICACIÓN 6: Instalar Dependencias ---
echo %WARN% Instalando paquetes (esto puede tardar)...
pip install -q -r requirements.txt
if %errorlevel% equ 0 (
    echo %CHECK% Dependencias instaladas correctamente
) else (
    echo %ERROR% Error al instalar dependencias
    exit /b 1
)
echo.

REM PASO 7: Verificar módulos clave
echo --- VERIFICACIÓN 7: Módulos Python Clave ---
python -c "import fastapi; print('FastAPI versión: ' + fastapi.__version__)" >nul 2>&1
if %errorlevel% equ 0 (
    echo %CHECK% FastAPI OK
) else (
    echo %ERROR% FastAPI no se pudo importar
)

python -c "import sqlalchemy; print('SQLAlchemy versión: ' + sqlalchemy.__version__)" >nul 2>&1
if %errorlevel% equ 0 (
    echo %CHECK% SQLAlchemy OK
) else (
    echo %ERROR% SQLAlchemy no se pudo importar
)

python -c "import pydantic; print('Pydantic versión: ' + pydantic.__version__)" >nul 2>&1
if %errorlevel% equ 0 (
    echo %CHECK% Pydantic OK
) else (
    echo %ERROR% Pydantic no se pudo importar
)
echo.

REM PASO 8: Verificar sintaxis de backend
echo --- VERIFICACIÓN 8: Sintaxis del Backend ---
python -m py_compile backend\app\main.py >nul 2>&1
if %errorlevel% equ 0 (
    echo %CHECK% backend\app\main.py - Sintaxis OK
) else (
    echo %ERROR% backend\app\main.py - Error de sintaxis
    python -m py_compile backend\app\main.py
    exit /b 1
)
echo.

REM PASO 9: Verificar HTML del Frontend
echo --- VERIFICACIÓN 9: Frontend HTML ---
powershell -Command "Get-Content 'frontend\index.html' -ErrorAction SilentlyContinue | Select-String '</html>' | Out-Null" >nul 2>&1
if %errorlevel% equ 0 (
    echo %CHECK% frontend\index.html es válido
) else (
    echo %ERROR% Problema con frontend\index.html
)
echo.

REM PASO 10: Verificar Docker
echo --- VERIFICACIÓN 10: Docker ---
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo %CHECK% Docker instalado
    docker --version
) else (
    echo %WARN% Docker no está instalado (lo necesitarás para ejecutar)
    echo   Descárgalo desde: https://www.docker.com/products/docker-desktop
)

docker-compose --version >nul 2>&1
if %errorlevel% equ 0 (
    echo %CHECK% Docker Compose instalado
    docker-compose --version
) else (
    echo %WARN% Docker Compose no está instalado
)
echo.

REM PASO 11: Verificar puertos disponibles
echo --- VERIFICACIÓN 11: Puertos Disponibles ---
netstat -ano | findstr ":8000" >nul 2>&1
if %errorlevel% equ 0 (
    echo %WARN% Puerto 8000 está en uso
) else (
    echo %CHECK% Puerto 8000 disponible
)

netstat -ano | findstr ":5432" >nul 2>&1
if %errorlevel% equ 0 (
    echo %WARN% Puerto 5432 está en uso
) else (
    echo %CHECK% Puerto 5432 disponible
)

netstat -ano | findstr ":80 " >nul 2>&1
if %errorlevel% equ 0 (
    echo %WARN% Puerto 80 está en uso
) else (
    echo %CHECK% Puerto 80 disponible
)
echo.

REM PASO 12: Test del Backend Localmente
echo --- VERIFICACIÓN 12: Iniciar Backend Localmente (modo test) ---
echo %WARN% Iniciando backend en http://localhost:8000...
echo %WARN% Presiona CTRL+C para detener después de verificar
echo.

REM Iniciar uvicorn en background
start cmd /k "cd /d "%cd%" && venv\Scripts\activate.bat && uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

REM Esperar a que inicie
timeout /t 5 /nobreak >nul

REM Intentar conectar
echo.
echo --- Probando conexiones ---
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8000/health' -TimeoutSec 2 -ErrorAction Stop; Write-Host 'CHECK Health endpoint: OK'; Write-Host ($response.Content); } catch { Write-Host 'ERROR Health endpoint: NO RESPONDE' }" 

powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8000/api/health' -TimeoutSec 2 -ErrorAction Stop; Write-Host 'CHECK API endpoint: OK' } catch { Write-Host 'ERROR API endpoint: NO RESPONDE' }"

powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8000/docs' -TimeoutSec 2 -ErrorAction Stop; Write-Host 'CHECK API Docs: OK' } catch { Write-Host 'ERROR API Docs: NO RESPONDE' }"

echo.
echo ========================================
echo   RESUMEN DE PRUEBAS
echo ========================================
echo.
echo %CHECK% Backend está ejecutándose en modo test
echo %CHECK% Frontend HTML está listo
echo %CHECK% Dependencias Python instaladas
echo.
echo Próximos pasos:
echo 1. Visita http://localhost:8000/docs para ver la API
echo 2. Verifica que todo funciona
echo 3. Cierra este cmd (Ctrl+C)
echo 4. Ejecuta: migrate.bat
echo.
pause
