@echo off
echo 🚀 Iniciando reorganizacion de estructura profesional...

REM --- Crear directorios ---
if not exist "backend\app" mkdir "backend\app"
if not exist "backend\legacy" mkdir "backend\legacy"
if not exist "frontend\public\css\formats" mkdir "frontend\public\css\formats"
if not exist "frontend\public\js" mkdir "frontend\public\js"
if not exist "scripts" mkdir "scripts"

REM --- Mover y Renombrar Backend ---
if exist "backend\backend_v6.py" move "backend\backend_v6.py" "backend\app\main.py"
if exist "backend\backend.py" move "backend\backend.py" "backend\legacy\backend_old.py"

REM --- Crear __init__.py para Python ---
type nul > "backend\__init__.py"
type nul > "backend\app\__init__.py"

REM --- Mover Frontend Assets ---
if exist "lims-core.js" move "lims-core.js" "frontend\public\js\core.js"
if exist "lims-theme.css" move "lims-theme.css" "frontend\public\css\theme.css"
if exist "formats\format-styles.css" move "formats\format-styles.css" "frontend\public\css\formats\styles.css"
if exist "formats\format-styles-comercial.css" move "formats\format-styles-comercial.css" "frontend\public\css\formats\commercial.css"
if exist "formats" rmdir "formats"

REM --- Mover Scripts ---
if exist "migrate.sh" move "migrate.sh" "scripts\migrate.sh"
if exist "migrate.bat" move "migrate.bat" "scripts\migrate.bat"
if exist "test-pre-docker.sh" move "test-pre-docker.sh" "scripts\test-pre-docker.sh"
if exist "test-pre-docker.bat" move "test-pre-docker.bat" "scripts\test-pre-docker.bat"

echo ✅ Reorganizacion completada exitosamente.
pause