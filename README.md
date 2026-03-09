# XELLE LIMS

Sistema LIMS con frontend estático (HTML/CSS/JS), backend Java Spring Boot y base de datos PostgreSQL, orquestado con Docker Compose.

## Stack

- Frontend: HTML + CSS + JavaScript (servido con Nginx)
- Backend: Java 21 + Spring Boot
- Base de datos: PostgreSQL 15
- Infraestructura local: Docker + Docker Compose

## Estructura del proyecto

- `src/frontend/`: interfaz web y formatos FO-*.
- `src/backend/`: API REST, entidades, repositorios e inicialización de datos.
- `docker-compose.yml`: levanta `postgres`, `backend`, `nginx`.
- `Dockerfile`: build y runtime del backend.
- Scripts `.bat`: arranque/reinicio/parada rápida en Windows.

## Requisitos

- Windows (recomendado por scripts incluidos)
- Docker Desktop instalado y en ejecución

## Inicio rápido

### Opción 1 (rápida, sin rebuild)

Ejecuta:

- `Arrancar-Xelle-Rapido.bat`

### Opción 2 (con rebuild del backend)

Ejecuta:

- `Xelle-Iniciar.bat`

### Detener servicios

Ejecuta:

- `Xelle-Detener.bat`

## URLs por defecto

- Aplicación web: `http://localhost`
- Backend API (host): `http://localhost:8000`
- Health check: `http://localhost:8000/health`
- PostgreSQL: `localhost:5432`

## Credenciales iniciales (seed)

Se crean automáticamente al arrancar si no existen usuarios en BD:

- Usuario: `Xelle_Fer` / Contraseña: `123` / Rol: `superadmin`
- Usuario: `calidad` / Contraseña: `123` / Rol: `quality_manager`
- Usuario: `ventas` / Contraseña: `123` / Rol: `sales`

## Endpoints principales

### Autenticación

- `POST /api/login`

### Usuarios

- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/{id}`
- `DELETE /api/users/{id}` (toggle activo/inactivo)
- `DELETE /api/users/{id}/permanent`

### Formatos

- `GET /api/formats`
- `GET /api/formats_admin`
- `POST /api/formats`
- `PUT /api/formats/{id}`
- `DELETE /api/formats/{id}` (toggle activo/inactivo)
- `DELETE /api/formats/{id}/permanent`

### Auditoría/Historial

- `GET /api/history`

## Variables de entorno (compose)

Puedes sobreescribir en `.env` o entorno del sistema:

- `DB_USER` (default: `postgres`)
- `DB_PASSWORD` (default: `123`)
- `DB_NAME` (default: `xelle_db`)
- `DB_PORT` (default: `5432`)
- `BACKEND_PORT` (default: `8000`)

## Seguridad (importante)

Estado actual del backend:

- El login compara contraseña en texto plano.
- Recomendado para endurecimiento:
  - Migrar a hash seguro (`bcrypt`/`argon2`).
  - Forzar cambio de credenciales por defecto.
  - Restringir exposición de puertos en ambientes no locales.

## Documentación complementaria

- `IMPLEMENTATION_SUMMARY.txt`: resumen técnico actualizado del estado actual del sistema.
- `GUIA_RAPIDA_FLUJOGRAMA_FORMATOS.md`: guía de flujo de formatos.
- `FLUJOGRAMA_FORMATOS_MERMAID.md`: diagrama fuente en Mermaid.
