#!/bin/bash
# Script de inicialización para migración a Docker

set -e

echo "🚀 Iniciando preparación para migración a Docker..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir con estilo
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# PASO 1: Verificar si Docker está instalado
echo ""
echo "📋 PASO 1: Verificar Docker..."
if command -v docker &> /dev/null; then
    print_status "Docker encontrado"
    docker --version
else
    print_error "Docker no está instalado"
    echo "Descárgalo desde: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# PASO 2: Verificar Docker Compose
if command -v docker-compose &> /dev/null; then
    print_status "Docker Compose encontrado"
    docker-compose --version
else
    print_error "Docker Compose no está instalado"
    exit 1
fi

# PASO 3: Crear archivo .env si no existe
echo ""
echo "📋 PASO 2: Configurar variables de entorno..."
if [ ! -f .env ]; then
    print_warning "Archivo .env no encontrado, creando desde .env.example..."
    cp .env.example .env
    print_status "Archivo .env creado"
else
    print_status "Archivo .env ya existe"
fi

# PASO 4: Construir imagen Docker
echo ""
echo "📋 PASO 3: Construir imagen Docker..."
print_warning "Esto puede tomar unos minutos..."
docker-compose build

# PASO 5: Iniciar servicios
echo ""
echo "📋 PASO 4: Iniciar servicios Docker..."
docker-compose up -d

# PASO 6: Esperar a que postgres esté listo
echo ""
echo "📋 PASO 5: Esperando a que PostgreSQL esté listo..."
sleep 10

# PASO 7: Verificar health checks
echo ""
echo "📋 PASO 6: Verificando salud de servicios..."

# Intentar conexión a health check
max_attempts=10
attempt=1
while [ $attempt -le $max_attempts ]; do
    if curl -s http://localhost:8000/health > /dev/null; then
        print_status "Backend está listo ✓"
        break
    else
        print_warning "Intento $attempt/$max_attempts... esperando..."
        sleep 2
        attempt=$((attempt + 1))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    print_error "Backend no respondió después de ${max_attempts} intentos"
    echo "Revisa los logs con: docker-compose logs backend"
    exit 1
fi

# PASO 8: Mostrar información final
echo ""
echo "========================================="
echo "✅ ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!"
echo "========================================="
echo ""
echo "📍 Servicios disponibles:"
echo "  • Frontend: http://localhost"
echo "  • Backend API: http://localhost:8000"
echo "  • API Docs: http://localhost:8000/docs"
echo "  • Health Check: http://localhost:8000/health"
echo ""
echo "📊 Container Status:"
docker-compose ps
echo ""
echo "📋 Comandos útiles:"
echo "  Ver logs:        docker-compose logs -f backend"
echo "  Parar servicios: docker-compose down"
echo "  Reiniciar:       docker-compose restart"
echo ""
echo "🔍 Próximos pasos:"
echo "  1. Abre http://localhost en tu navegador"
echo "  2. Accede a http://localhost:8000/docs para documentación API"
echo "  3. Verifica que todo funciona correctamente"
echo ""
