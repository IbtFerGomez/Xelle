# XELLE LIMS - Sistema de Gestión de Laboratorio Clínico v6.0

## 📋 Descripción

XELLE LIMS es un Sistema de Información de Laboratorio (Laboratory Information Management System) profesional y completo, diseñado específicamente para laboratorios clínicos y centros de investigación. Implementa estándares FDA 21 CFR Parte 11 para cumplimiento regulatorio, con:

- **Gestión de Formatos/Tarjetas**: Control centralizado de todos los documentos de laboratorio
- **Persistencia en Base de Datos**: PostgreSQL con auditoría completa
- **Control de Acceso**: Roles y permisos granulares
- **Historial de Cambios**: Trazabilidad completa de todas las operaciones
- **Generación de Códigos Únicos**: Para identificación de muestras y lotes
- **Interfaz Moderna**: Dashboard intuitivo con Tailwind CSS

## 📁 Estructura del Proyecto

```
XelleDocumentos/
├── src/
│   ├── backend/
│   │   ├── main.py              # Aplicación FastAPI principal
│   │   ├── requirements.txt      # Dependencias Python
│   │   ├── config.py             # Configuración
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   └── frontend/
│       ├── index.html            # Página de login
│       ├── dashboard.html        # Panel principal
│       ├── assets/
│       │   ├── css/theme.css
│       │   ├── js/
│       │   │   ├── config/users.js
│       │   │   ├── core/core.js
│       │   │   ├── vendor/
│       │   │   └── formats/
│       │   └── img/
│       └── formats/
│           ├── FO-LC-*.html      # Tarjetas de laboratorio
│           ├── offline/          # Versiones offline
│           ├── css/
│           └── js/
├── docs/                         # Documentación
├── scripts/                      # Scripts de utilidad
├── tests/                        # Tests automáticos
├── Dockerfile                    # Contenedor Docker
├── docker-compose.yml            # Orquestación
├── nginx.conf                    # Configuración Nginx
└── .env.example                  # Variables de entorno
```

## 🚀 Instalación Rápida

### Opción 1: Con Docker (Recomendado)

```bash
# Clonar el repositorio
git clone <repo>
cd XelleDocumentos

# Crear archivo .env
cp .env.example .env

# Iniciar servicios
docker-compose up -d

# Acceder a la aplicación
# Frontend: http://localhost
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Opción 2: Local (Desarrollo)

#### Prerrequisitos
- Python 3.11+
- PostgreSQL 15+
- Node.js 18+ (opcional, para herramientas frontend)

#### Setup Backend

```bash
# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Instalar dependencias
cd src/backend
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Ejecutar migraciones (si aplica)
# python migrate_db.py

# Iniciar servidor
uvicorn main:app --reload

# El servidor estará en http://localhost:8000
# Documentación: http://localhost:8000/docs
```

#### Setup Frontend

```bash
# Los archivos HTML/JS se sirven directamente
# sin necesidad de build process

# Para desarrollo local, puedes servir la carpeta frontend:
cd src/frontend

# Opción 1: Python 
python -m http.server 3000

# Opción 2: Node (si tienes http-server instalado)
npx http-server -p 3000

# Acceder a http://localhost:3000
```

## 🔐 Usuarios Iniciales

El sistema viene preconfigurado con usuarios de prueba:

| Usuario | Contraseña | Rol | Acceso |
|---------|-----------|-----|--------|
| Xelle_Fer | 123 | Super Admin | Todos los módulos |
| calidad | 123 | Gerente Calidad | Banco + Lab Calidad |
| ventas | 123 | Ventas | Área Comercial |

⚠️ **IMPORTANTE**: Cambiar contraseñas en producción

## 📦 API Endpoints Principales

### Autenticación
- `POST /api/login` - Iniciar sesión

### Usuarios
- `GET /api/users` - Listar usuarios
- `POST /api/users` - Crear usuario
- `PUT /api/users/{id}` - Actualizar usuario
- `DELETE /api/users/{id}` - Eliminar usuario

### Formatos
- `GET /api/formats` - Formatos disponibles
- `POST /api/format-instances` - Crear instancia de formato
- `GET /api/format-instances/{code}` - Obtener instancia
- `PUT /api/format-instances/{code}` - Actualizar instancia
- `DELETE /api/format-instances/{code}` - Archivar instancia

### Codificación
- `POST /api/formats/generate-unique-code` - Generar código único

### Estadísticas
- `GET /api/format-instances/stats/overview` - Estadísticas

## 🛠 Configuración Avanzada

### Variables de Entorno

```bash
# Base de datos
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=xelle_db

# Backend
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
DEBUG=false
APP_ENV=production
```

### Base de Datos

PostgreSQL se provisiona automáticamente vía Docker. Para acceder directamente:

```bash
# Conectar a la BD
psql -U postgres -h localhost -d xelle_db

# Ver tablas
\dt

# Ver usuarios
SELECT id, username, role FROM users;
```

## 📊 Archivos de Formato

Los archivos de formato HTML se encuentran en `/src/frontend/formats/`. Cada archivo:

- Es un formulario independiente
- Se conecta a la API del backend
- Soporta modo offline con localStorage
- Genera códigos únicos e irreperibles

### Crear nuevo Formato

1. Crear archivo HTML en `src/frontend/formats/FO-XX-XX.html`
2. Incluir scripts necesarios:
   ```html
   <link rel="stylesheet" href="../assets/css/formats.css">
   <script src="../assets/js/vendor/jsbarcode.min.js"></script>
   <script src="../assets/js/formats/format-app.js"></script>
   ```
3. Registrar en config-users.js
4. Reiniciar la aplicación

## 🧪 Testing

### Ejecutar tests

```bash
# Backend (pytest)
cd src/backend
pytest

# Frontend (pruebas manuales)
# Abrir navegador a http://localhost/index.html
```

## 🐛 Troubleshooting

### Puerto 8000 ya en uso
```bash
# Cambiar puerto en docker-compose.yml
ports:
  - "8001:8000"  # Usar 8001 en lugar de 8000
```

### Base de datos no conecta
```bash
# Verificar que PostgreSQL esté corriendo
docker ps | grep postgres

# Ver logs
docker logs xelle_postgres

# Resetear volumen (perderá datos)
docker volume rm xelle_postgres_data
```

### Frontend no carga
- Verificar que nginx está corriendo: `docker ps | grep nginx`
- Revisar logs: `docker logs xelle_nginx`
- Verificar que archivos están en `src/frontend/`

## 📝 Estándares de Código

- **Backend**: PEP 8, type hints
- **Frontend**: ES6+, JSDoc
- **Commit messages**: Conventional Commits
- **Versionado**: Semantic Versioning

## 🔄 Ciclo de Desarrollo

```bash
# 1. Crear rama
git checkout -b feature/nueva-funcionalidad

# 2. Hacer cambios y commits
git commit -m "feat: agregar nueva funcionalidad"

# 3. El backend rehash automáticamente con --reload
# El frontend se actualiza al refrescar el navegador

# 4. Hacer push y PR
git push origin feature/nueva-funcionalidad
```

## 📚 Documentación Completa

Para documentación detallada, ver carpeta `/docs`:
- `ARCHITECTURE.md` - Arquitectura del sistema
- `DATABASE.md` - Schema de BD
- `API.md` - Referencia de endpoints
- `FORMATS.md` - Guía de creación de formatos
- `SETUP.md` - Guía de instalación avanzada

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crear rama para tu feature
3. Commit con mensajes descriptivos
4. Push a la rama
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo licencia propietaria XELLE SCIENTIFIC.

## 👥 Soporte

Para soporte técnico, contactar a:
- 📧 Email: support@xelle.com
- 📞 Tel: +57 (1) XXXX-XXXX
- 🌐 Web: https://www.xelle.com

---

**Versión**: 6.0  
**Última actualización**: Febrero 2026  
**Estado**: ✅ Production Ready
