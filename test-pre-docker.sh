#!/bin/bash
# Script de pruebas pre-Docker en Linux/Mac

set -e

echo ""
echo "========================================"
echo "   PRE-DOCKER TEST SUITE"
echo "========================================"
echo ""
echo "Este script verifica que todo esté listo antes de Docker"
echo ""

# Símbolos
CHECK="✓"
ERROR="✗"
WARN="⚠"

# PASO 1: Verificar Python
echo "--- VERIFICACIÓN 1: Python ---"
if command -v python3 &> /dev/null; then
    echo "$CHECK Python3 instalado"
    python3 --version
else
    echo "$ERROR Python3 NO está instalado"
    exit 1
fi
echo ""

# PASO 2: Verificar pip
echo "--- VERIFICACIÓN 2: Pip ---"
if command -v pip3 &> /dev/null; then
    echo "$CHECK Pip3 instalado"
    pip3 --version
else
    echo "$ERROR Pip3 NO está instalado"
    exit 1
fi
echo ""

# PASO 3: Verificar estructura del proyecto
echo "--- VERIFICACIÓN 3: Estructura del Proyecto ---"
if [ -f "backend/backend_v6.py" ]; then
    echo "$CHECK backend/backend_v6.py encontrado"
else
    echo "$ERROR No se encuentra backend/backend_v6.py"
    exit 1
fi

if [ -f "frontend/index.html" ]; then
    echo "$CHECK frontend/index.html encontrado"
else
    echo "$ERROR No se encuentra frontend/index.html"
    exit 1
fi

if [ -f "requirements.txt" ]; then
    echo "$CHECK requirements.txt encontrado"
else
    echo "$ERROR No se encuentra requirements.txt"
    exit 1
fi
echo ""

# PASO 4: Crear virtual environment
echo "--- VERIFICACIÓN 4: Environment Virtual ---"
if [ ! -d "venv" ]; then
    echo "$WARN Creando virtual environment..."
    python3 -m venv venv
    if [ $? -eq 0 ]; then
        echo "$CHECK Virtual environment creado"
    else
        echo "$ERROR Error al crear virtual environment"
        exit 1
    fi
else
    echo "$CHECK Virtual environment ya existe"
fi
echo ""

# PASO 5: Activar virtual environment
echo "--- VERIFICACIÓN 5: Activar Virtual Environment ---"
source venv/bin/activate
if [ $? -eq 0 ]; then
    echo "$CHECK Virtual environment activado"
else
    echo "$ERROR Error al activar virtual environment"
    exit 1
fi
echo ""

# PASO 6: Instalar dependencias
echo "--- VERIFICACIÓN 6: Instalar Dependencias ---"
echo "$WARN Instalando paquetes (esto puede tardar)..."
pip install -q -r requirements.txt
if [ $? -eq 0 ]; then
    echo "$CHECK Dependencias instaladas correctamente"
else
    echo "$ERROR Error al instalar dependencias"
    exit 1
fi
echo ""

# PASO 7: Verificar módulos clave
echo "--- VERIFICACIÓN 7: Módulos Python Clave ---"
python3 -c "import fastapi; print(f'FastAPI versión: {fastapi.__version__}')" 2>/dev/null && echo "$CHECK FastAPI OK" || echo "$ERROR FastAPI no se pudo importar"
python3 -c "import sqlalchemy; print(f'SQLAlchemy versión: {sqlalchemy.__version__}')" 2>/dev/null && echo "$CHECK SQLAlchemy OK" || echo "$ERROR SQLAlchemy no se pudo importar"
python3 -c "import pydantic; print(f'Pydantic versión: {pydantic.__version__}')" 2>/dev/null && echo "$CHECK Pydantic OK" || echo "$ERROR Pydantic no se pudo importar"
echo ""

# PASO 8: Verificar sintaxis del backend
echo "--- VERIFICACIÓN 8: Sintaxis del Backend ---"
python3 -m py_compile backend/backend_v6.py 2>/dev/null
if [ $? -eq 0 ]; then
    echo "$CHECK backend_v6.py - Sintaxis OK"
else
    echo "$ERROR backend_v6.py - Error de sintaxis"
    python3 -m py_compile backend/backend_v6.py
    exit 1
fi
echo ""

# PASO 9: Verificar HTML del Frontend
echo "--- VERIFICACIÓN 9: Frontend HTML ---"
if grep -q "</html>" frontend/index.html 2>/dev/null; then
    echo "$CHECK frontend/index.html es válido"
else
    echo "$ERROR Problema con frontend/index.html"
fi
echo ""

# PASO 10: Verificar Docker
echo "--- VERIFICACIÓN 10: Docker ---"
if command -v docker &> /dev/null; then
    echo "$CHECK Docker instalado"
    docker --version
else
    echo "$WARN Docker no está instalado (lo necesitarás para ejecutar)"
    echo "   Descárgalo desde: https://www.docker.com/products/docker-desktop"
fi

if command -v docker-compose &> /dev/null; then
    echo "$CHECK Docker Compose instalado"
    docker-compose --version
else
    echo "$WARN Docker Compose no está instalado"
fi
echo ""

# PASO 11: Test del Backend Localmente
echo "--- VERIFICACIÓN 11: Iniciar Backend Localmente (modo test) ---"
echo "$WARN Iniciando backend en http://localhost:8000..."
echo "$WARN Presiona CTRL+C para detener después de verificar"
echo ""

# Iniciar uvicorn
uvicorn backend.backend_v6:app --host 127.0.0.1 --port 8000 --reload
