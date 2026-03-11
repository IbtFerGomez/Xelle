<div align="center">

# 🧬 XELLE SCIENTIFIC LIMS

### Sistema de Gestión de Información de Laboratorio Clínico

[![Version](https://img.shields.io/badge/version-10.0-2fa785.svg)]()
[![Java](https://img.shields.io/badge/Java-21-orange.svg)]()
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.2-brightgreen.svg)]()
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)]()
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)]()

*Sistema robusto de gestión de formatos clínicos con persistencia basada en códigos de barras únicos*

</div>

---

## 📋 Descripción General

**XELLE LIMS** es un Sistema de Información de Gestión de Laboratorio (Laboratory Information Management System) desarrollado por **Xelle Scientific, S.A.P.I. de C.V.**, diseñado específicamente para la gestión integral de documentos y formatos clínicos en laboratorios.

### Características Principales

- 🏥 **89+ Formatos Clínicos Digitales**: Gestión completa de formatos FO-LC (Laboratorio Clínico), FO-OP (Operaciones), FO-QA (Control de Calidad) y FO-SGC (Sistema de Gestión de Calidad)
- 🔖 **Persistencia por Código de Barras**: Cada documento es identificado de forma única e irrepetible mediante código de barras
- 💾 **Sistema de Persistencia Robusto**: Base de datos PostgreSQL con auditoría completa de cambios
- 👥 **Control de Usuarios Multi-Rol**: Sistema de autenticación con roles diferenciados (superadmin, quality_manager, sales, etc.)
- 📊 **Dashboard Interactivo**: Interfaz moderna con TailwindCSS para gestión visual de formatos
- 🖨️ **Impresión Optimizada**: CSS específico para impresión de documentos clínicos
- 📝 **Historial de Auditoría**: Registro completo de todas las operaciones (creación, actualización, eliminación)
- 🔄 **Actualización Inteligente**: Sobrescritura de campos manteniendo integridad del código único

---

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Frontend** | HTML5 + CSS3 + JavaScript (Vanilla) | ES6+ |
| **Servidor Web** | Nginx | Alpine |
| **Backend** | Java + Spring Boot | 21 / 3.3.2 |
| **Framework Web** | Spring MVC + Spring Security | 3.3.2 |
| **ORM** | Spring Data JPA + Hibernate | 3.3.2 |
| **Base de Datos** | PostgreSQL | 15 |
| **Infraestructura** | Docker + Docker Compose | Latest |
| **Build Tool** | Maven + Maven Wrapper | Latest |

### Estructura del Proyecto

```
Xelle/
├── 📁 src/
│   ├── 📁 backend/
│   │   ├── 📄 pom.xml                          # Configuración Maven
│   │   ├── 🔧 mvnw, mvnw.cmd                   # Maven Wrapper
│   │   └── 📁 src/main/
│   │       ├── 📁 java/com/xelle/
│   │       │   ├── 📁 entity/                  # Entidades JPA
│   │       │   │   ├── UserEntity.java
│   │       │   │   ├── FormatEntity.java
│   │       │   │   ├── FormatInstanceEntity.java  # ⭐ Persistencia de documentos
│   │       │   │   └── AuditLogEntity.java
│   │       │   ├── 📁 repository/               # Repositorios JPA
│   │       │   ├── 📁 controller/               # REST Controllers
│   │       │   ├── 📁 config/                   # Configuración Spring Security
│   │       │   └── 📁 init/                     # Inicialización de datos seed
│   │       └── 📁 resources/
│   │           └── application.yml              # Configuración del backend
│   └── 📁 frontend/
│       ├── 📄 index.html                        # Login
│       ├── 📄 dashboard.html                    # Dashboard principal
│       ├── 📁 formats/                          # 89+ formatos HTML
│       │   ├── FO-LC-12.html                    # Dictamen de Concesión
│       │   ├── FO-LC-14.html                    # Histórico Placentas
│       │   ├── FO-OP-15.html                    # Formatos de Operaciones
│       │   ├── 📄 format-app.js                 # ⭐ JavaScript principal (persistencia)
│       │   ├── 📄 format-styles.css             # Estilos de formatos
│       │   └── 📁 Etiquetas.Control/            # Etiquetas (ET-LC-*)
│       └── 📁 assets/
│           ├── 📁 css/                          # TailwindCSS + theme.css
│           ├── 📁 js/                           # Scripts frontend
│           └── 📁 icons/                        # Iconografía
├── 🐳 docker-compose.yml                        # Orquestación servicios
├── 🐳 Dockerfile                                # Build backend
├── 🌐 nginx.conf                                # Configuración Nginx
├── 🚀 Arrancar-Xelle-Rapido.bat                # Inicio rápido (sin rebuild)
├── 🚀 Xelle-Iniciar.bat                        # Inicio con rebuild
├── 🛑 Xelle-Detener.bat                        # Detener servicios
├── 📖 SISTEMA_PERSISTENCIA.md                  # Documentación técnica completa
├── 📖 GUIA_RAPIDA_PERSISTENCIA.md              # Guía rápida de usuario
└── 📖 README.md                                 # Este archivo
```

### Arquitectura de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                      Cliente (Navegador)                     │
│  index.html → dashboard.html → formats/FO-*.html            │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP (Port 80)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Nginx (Alpine)                            │
│  • Servir archivos estáticos (HTML/CSS/JS)                  │
│  • Proxy reverso a backend /api                             │
└────────────────────┬────────────────────────────────────────┘
                     │ Proxy to :8080
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Spring Boot Backend (Java 21)                   │
│  • REST API (/api/*)                                         │
│  • Spring Security (Autenticación/Autorización)             │
│  • Spring Data JPA (Persistencia)                           │
│  • Lógica de negocio + Validaciones                         │
└────────────────────┬────────────────────────────────────────┘
                     │ JDBC (Port 5432)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL 15                             │
│  • format_instances (Documentos guardados)                  │
│  • users, formats, audit_logs                               │
│  • Persistencia de datos con transacciones ACID             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Inicio Rápido

### Requisitos Previos

- ✅ **Windows** (recomendado, scripts `.bat` incluidos)
- ✅ **Docker Desktop** instalado y en ejecución ([Descargar aquí](https://www.docker.com/products/docker-desktop/))
- ✅ **Git** (opcional, para clonar el proyecto)

### Instalación y Ejecución

#### Opción 1: Inicio Rápido (⚡ Recomendado)

Sin reconstruir imágenes Docker, usa las existentes:

```batch
Arrancar-Xelle-Rapido.bat
```

#### Opción 2: Inicio Completo (con Rebuild)

Reconstruye el backend antes de iniciar (útil después de cambios en código Java):

```batch
Xelle-Iniciar.bat
```

#### Detener Servicios

Para detener todos los contenedores:

```batch
Xelle-Detener.bat
```

#### Reinicio Rápido

Para reiniciar sin reconstruir:

```batch
Reiniciar-Xelle-Rapido.bat
```

### URLs de Acceso

Una vez iniciado, accede a:

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Interfaz Web** | http://localhost | Login + Dashboard + Formatos |
| **Backend API** | http://localhost:8000 | Endpoints REST |
| **Health Check** | http://localhost:8000/health | Verificación de salud del backend |
| **PostgreSQL** | `localhost:5432` | Acceso directo a BD (con cliente SQL) |

### Credenciales Iniciales (Seed)

El sistema crea automáticamente estos usuarios al iniciar (si no existen):

| Usuario | Contraseña | Rol | Descripción |
|---------|-----------|-----|-------------|
| `Xelle_Fer` | `123` | `superadmin` | Administrador total del sistema |
| `calidad` | `123` | `quality_manager` | Gestor de calidad |
| `ventas` | `123` | `sales` | Usuario de ventas |

> ⚠️ **IMPORTANTE**: Cambiar estas credenciales en entornos de producción.

---

## 💾 Sistema de Persistencia

### Características del Sistema de Persistencia V10.0

El sistema implementa persistencia robusta basada en códigos de barras únicos e irrepetibles:

#### ✨ Conceptos Clave

- **Código de Barcode Único**: Cada documento tiene un identificador único (ej: `FO-LC-12-001234`)
- **Sin Duplicados**: El sistema rechaza códigos duplicados automáticamente
- **Código Inmutable**: Una vez guardado, el código no puede cambiar
- **Persistencia Flexible**: Estructura JSON schema-less en `data_payload`
- **Auditoría Completa**: Todos los cambios se registran en `audit_logs`

#### 📊 Estructura de Base de Datos

##### Tabla: `format_instances`

```sql
CREATE TABLE format_instances (
    id                BIGSERIAL PRIMARY KEY,
    unique_code       VARCHAR(255) UNIQUE NOT NULL,   -- ⭐ Código de barcode único
    format_type       VARCHAR(255) NOT NULL,           -- Tipo: FO-LC-12, FO-OP-15, etc.
    status            VARCHAR(50) NOT NULL,            -- DRAFT, COMPLETED, etc.
    data_payload      TEXT,                            -- JSON con todos los campos
    created_by        BIGINT,                          -- ID del usuario creador
    updated_by        BIGINT,                          -- ID del último modificador
    notes             TEXT,                            -- Notas adicionales
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at        TIMESTAMP WITH TIME ZONE NOT NULL
);
```

##### Ejemplo de `data_payload` (JSON)

```json
{
  "id:reg-12": "001234",
  "id:registry-date": "2026-03-11",
  "fo_lc_12_nombre_paciente_5": "Juan Pérez López",
  "fo_lc_12_select_6": "Producción",
  "fo_lc_12_textarea_7": "Se evaluó que el material cumple con los requisitos...",
  "fo_lc_12_checkbox_8": "NO",
  "fo_lc_12_diagnostico_9": "Aprobado para uso clínico"
}
```

### 🔄 Flujo de Trabajo con Documentos

#### 1️⃣ Crear Documento Nuevo

```
Dashboard → Click en tarjeta de formato → Documento en blanco
```

1. El formulario se carga vacío (parámetro `?new=1` en URL)
2. Usuario ingresa código de folio único (manual)
3. Completa los campos del formulario
4. Presiona **"Guardar"**
   - ✅ **Si el código NO existe** → Se crea nuevo documento
   - ❌ **Si NO hay código** → Error: *"Debe ingresar un código de folio único"*

#### 2️⃣ Modificar Documento Existente

```
Dashboard → Lista de documentos → Click en documento → Formato con datos cargados
```

1. El sistema carga el documento por su `unique_code`
2. Usuario modifica los campos necesarios
3. Presiona **"Guardar"**
   - ✅ **Si el código YA existe** → Se sobrescriben TODOS los campos (excepto el código)
   - ℹ️ El código de barcode **NO se puede cambiar**

#### 3️⃣ Imprimir Documento

1. Presiona **"Imprimir"**
2. Se abre el diálogo de impresión del navegador
3. Aplica estilos CSS optimizados para impresión
4. **No requiere guardado previo**

### 🔌 Endpoints REST API

#### Instancias de Formatos

| Método | Endpoint | Descripción | Body/Params |
|--------|----------|-------------|-------------|
| `POST` | `/api/format-instances` | Crear nueva instancia | `{uniqueCode, formatType, dataPayload, status}` |
| `GET` | `/api/format-instances/{uniqueCode}` | Obtener por código único | - |
| `PUT` | `/api/format-instances/{uniqueCode}` | Actualizar existente | `{dataPayload, status, updatedBy}` |
| `GET` | `/api/format-instances` | Listar todas las instancias | Query params: `formatType`, `status` |
| `DELETE` | `/api/format-instances/{uniqueCode}` | Eliminar (solo admin) | - |

#### Otros Endpoints

##### Autenticación
- `POST /api/login` - Login de usuario

##### Usuarios
- `GET /api/users` - Listar usuarios
- `POST /api/users` - Crear usuario
- `PUT /api/users/{id}` - Actualizar usuario
- `DELETE /api/users/{id}` - Toggle activo/inactivo
- `DELETE /api/users/{id}/permanent` - Eliminación permanente

##### Formatos (Plantillas)
- `GET /api/formats` - Listar formatos disponibles
- `GET /api/formats_admin` - Vista admin de formatos
- `POST /api/formats` - Crear formato
- `PUT /api/formats/{id}` - Actualizar formato
- `DELETE /api/formats/{id}` - Toggle activo/inactivo

##### Auditoría
- `GET /api/history` - Historial de cambios (audit logs)

---

## 🎨 Frontend - Interfaz de Usuario

### Páginas Principales

1. **`index.html`** - Página de login con diseño glassmorphism
2. **`dashboard.html`** - Dashboard principal con tarjetas de formatos organizadas por categorías
3. **`formats/*.html`** - 89+ formatos clínicos individuales

### JavaScript Principal: `format-app.js`

Funciones clave:

```javascript
// Asigna IDs únicos automáticamente a campos sin ID
function ensureFieldIds() { ... }

// Guarda el formulario actual (crea o actualiza)
function saveForm() { ... }

// Carga datos de una instancia existente
function loadFormData(uniqueCode) { ... }

// Persiste en backend vía REST API
async function persistInstance(payload) { ... }

// Recolecta todos los campos del formulario
function collectFields() { ... }
```

### Botones de Control

Cada formato incluye estos botones (clase `no-print`):

```html
<div class="global-controls no-print">
    <button class="btn btn-success" onclick="saveForm()">Guardar</button>
    <button class="btn btn-primary" onclick="window.print()">Imprimir</button>
</div>
```

> 🗑️ **Nota**: El botón "Limpiar" fue removido en la versión 10.0 (89 archivos actualizados)

### IDs Únicos Automáticos

El sistema asigna automáticamente IDs únicos a campos que no los tienen:

**Patrón de generación**:
- `{formato}_{name}` si tiene atributo `name`
- `{formato}_{placeholder}_{index}` si tiene `placeholder`
- `{formato}_{tipo}_{index}` en caso contrario

**Ejemplo**:

```html
<!-- Antes (sin ID) -->
<input class="cedit" placeholder="Nombre del paciente">

<!-- Después (ID asignado automáticamente) -->
<input id="fo_lc_12_nombre_del_paciente_5" class="cedit" placeholder="Nombre del paciente">
```

---

## 🐳 Configuración Docker

### docker-compose.yml

Define 3 servicios:

1. **`postgres`**: Base de datos PostgreSQL 15
2. **`backend`**: Spring Boot API (Java 21)
3. **`nginx`**: Servidor web para frontend

#### Volúmenes de Datos

```yaml
volumes:
  postgres_data:          # Persistencia de base de datos
    driver: local
```

#### Red Interna

```yaml
networks:
  xelle_network:
    driver: bridge
```

### Variables de Entorno

Sobrescribe con archivo `.env` o entorno del sistema:

| Variable | Default | Descripción |
|----------|---------|-------------|
| `DB_USER` | `postgres` | Usuario de PostgreSQL |
| `DB_PASSWORD` | `123` | Contraseña de PostgreSQL |
| `DB_NAME` | `xelle_db` | Nombre de la base de datos |
| `DB_PORT` | `5432` | Puerto de PostgreSQL |
| `BACKEND_PORT` | `8000` | Puerto expuesto del backend |

**Ejemplo de archivo `.env`**:

```env
DB_USER=xelle_admin
DB_PASSWORD=SecurePassword2026!
DB_NAME=xelle_production
DB_PORT=5432
BACKEND_PORT=8000
```

---

## 🧪 Pruebas y Verificación

### Prueba 1: Crear Documento Nuevo

```
1. Abrir: http://localhost/formats/FO-LC-12.html?new=1
2. ✅ Verificar: Formulario en blanco
3. Ingresar código: 001234
4. Completar campos requeridos
5. Click en "Guardar"
6. ✅ Verificar: Mensaje "Guardado Exitoso"
7. ✅ Verificar: URL actualizada con ?instance=FO-LC-12-001234
```

### Prueba 2: Modificar Documento Existente

```
1. Abrir: http://localhost/formats/FO-LC-12.html?instance=FO-LC-12-001234
2. ✅ Verificar: Campos cargados con datos guardados
3. Modificar algún campo (ej: cambiar nombre de paciente)
4. Click en "Guardar"
5. ✅ Verificar: Mensaje "Guardado Exitoso"
6. Recargar página (F5)
7. ✅ Verificar: Cambios persistidos correctamente
```

### Prueba 3: Validación de Código Obligatorio

```
1. Abrir nuevo documento: http://localhost/formats/FO-LC-12.html?new=1
2. NO ingresar código de folio
3. Completar otros campos
4. Click en "Guardar"
5. ✅ Verificar: Error "Debe ingresar un código de folio único"
```

### Prueba 4: Impresión

```
1. Abrir cualquier documento (nuevo o existente)
2. Completar campos
3. Click en "Imprimir"
4. ✅ Verificar: Diálogo de impresión del navegador
5. ✅ Verificar: Botones y controles ocultos (clase no-print)
6. ✅ Verificar: Formato optimizado para papel
```

### Verificación de Persistencia

Script PowerShell incluido para verificar persistencia:

```powershell
.\verificar-persistencia.ps1
```

Genera reportes JSON y CSV en carpeta `about/`.

---

## 📖 Documentación Complementaria

| Archivo | Descripción |
|---------|-------------|
| [`SISTEMA_PERSISTENCIA.md`](SISTEMA_PERSISTENCIA.md) | 📘 Documentación técnica completa del sistema de persistencia |
| [`GUIA_RAPIDA_PERSISTENCIA.md`](GUIA_RAPIDA_PERSISTENCIA.md) | 📗 Guía rápida de usuario para el sistema de persistencia |
| `IMPLEMENTATION_SUMMARY.txt` | 📄 Resumen técnico del estado actual del sistema |
| `GUIA_RAPIDA_FLUJOGRAMA_FORMATOS.md` | 📊 Guía de flujo de formatos |
| `FLUJOGRAMA_FORMATOS_MERMAID.md` | 🔀 Diagrama de flujo en formato Mermaid |
| `SYSTEM_INVENTORY.json` | 🗂️ Inventario completo del sistema |

---

## 🔒 Seguridad

### ⚠️ Estado Actual (Desarrollo)

- ❌ **Contraseñas en texto plano**: El sistema NO usa hashing de contraseñas
- ❌ **Credenciales por defecto**: Usuarios seed con contraseñas simples (`123`)
- ⚠️ **Puertos expuestos**: Backend expuesto en `:8000` sin autenticación robusta

### ✅ Recomendaciones para Producción

1. **Migrar a hashing seguro**:
   ```java
   // Usar BCrypt o Argon2
   import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
   
   BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
   String hashedPassword = encoder.encode(plainPassword);
   ```

2. **Forzar cambio de contraseñas**:
   - Implementar flag `force_password_change` en tabla `users`
   - Solicitar cambio en primer login

3. **Restringir exposición de puertos**:
   ```yaml
   # docker-compose.yml
   backend:
     ports:
       - "127.0.0.1:8000:8080"  # Solo accesible desde localhost
   ```

4. **Implementar HTTPS**:
   - Usar certificados SSL/TLS en Nginx
   - Redireccionar HTTP → HTTPS

5. **Auditoría mejorada**:
   - Registrar intentos de login fallidos
   - Implementar bloqueo por intentos múltiples
   - Logs detallados de acciones críticas

6. **Variables de entorno seguras**:
   - Usar secretos de Docker Swarm/Kubernetes
   - No versionar archivos `.env` con credenciales reales

---

## 🛠️ Mantenimiento

### Backup de Base de Datos

**Recomendación**: Backup automático diario vía cron job o Task Scheduler (Windows)

```bash
# Linux/Mac
pg_dump -U postgres -h localhost -p 5432 xelle_db > backup_$(date +%Y%m%d).sql

# Windows (PowerShell)
docker exec xelle_postgres pg_dump -U postgres xelle_db > backup_$(Get-Date -Format "yyyyMMdd").sql
```

### Restaurar Backup

```bash
# Linux/Mac
psql -U postgres -h localhost -p 5432 xelle_db < backup_20260311.sql

# Windows (PowerShell)
Get-Content backup_20260311.sql | docker exec -i xelle_postgres psql -U postgres xelle_db
```

### Limpieza de Datos Antiguos

Considerar implementar políticas de retención:

- **Borradores**: Eliminar sin actualizar en 30+ días
- **Documentos completados**: Archivar después de 1-2 años
- **Logs de auditoría**: Rotar después de 6 meses

```sql
-- Ejemplo: Eliminar borradores antiguos
DELETE FROM format_instances
WHERE status = 'DRAFT'
  AND updated_at < NOW() - INTERVAL '30 days';
```

### Logs del Sistema

```bash
# Ver logs en tiempo real
docker-compose logs -f

# Logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f nginx
```

---

## 🐛 Resolución de Problemas

### Problema: "No se puede conectar al backend"

**Síntomas**: Frontend no carga datos, errores en consola del navegador

**Soluciones**:
1. Verificar que todos los contenedores estén corriendo:
   ```bash
   docker-compose ps
   ```
2. Verificar logs del backend:
   ```bash
   docker-compose logs backend
   ```
3. Verificar health check:
   ```
   http://localhost:8000/health
   ```

### Problema: "Código único ya existe"

**Causa**: Intentando crear documento con código duplicado

**Solución**:
- Si desea **modificar** el documento existente: cargar el documento con ese código y editar
- Si desea **crear nuevo** documento: usar un código diferente

### Problema: "Debe ingresar un código de folio único"

**Causa**: Intentando guardar sin ingresar código de barcode

**Solución**: Ingresar un número válido en el campo de folio antes de presionar "Guardar"

### Problema: "Campos no se cargan correctamente"

**Causas posibles**:
1. IDs de campos han cambiado en el HTML
2. Datos corruptos en base de datos
3. Conflictos en localStorage del navegador

**Soluciones**:
1. Limpiar caché del navegador (Ctrl + Shift + Del)
2. Verificar que el documento existe en BD:
   ```sql
   SELECT * FROM format_instances WHERE unique_code = 'FO-LC-12-001234';
   ```
3. Revisar consola del navegador para errores JavaScript

### Problema: "PostgreSQL no inicia"

**Causas posibles**:
- Puerto 5432 ocupado por otra instancia
- Volumen de datos corrupto

**Soluciones**:
1. Verificar puertos disponibles:
   ```bash
   netstat -ano | findstr :5432
   ```
2. Detener instancia conflictiva o cambiar puerto en `.env`
3. Si volumen está corrupto:
   ```bash
   docker-compose down -v  # ⚠️ Elimina TODOS los datos
   docker-compose up -d
   ```

### Problema: "Backend no se conecta a PostgreSQL"

**Síntomas**: Backend muestra errores JDBC en logs

**Soluciones**:
1. Verificar que PostgreSQL esté healthy:
   ```bash
   docker-compose ps
   # postgres debe mostrar "healthy" en State
   ```
2. Verificar variables de entorno del backend:
   ```bash
   docker-compose exec backend env | grep DB_
   ```
3. Aumentar tiempo de espera en `depends_on` si falla en startup

---

## 📊 Inventario de Formatos

### Formatos de Laboratorio Clínico (FO-LC-*)

- **FO-LC-12**: Dictamen de Concesión
- **FO-LC-14**: Histórico Placentas
- **FO-LC-15**: Histórico Líneas
- **FO-LC-16** a **FO-LC-35**: Diversos formatos clínicos
- **FO-LC-40** a **FO-LC-50**: Formatos avanzados
- Y más... (ver carpeta `src/frontend/formats/`)

### Formatos de Operaciones (FO-OP-*)

- **FO-OP-13** a **FO-OP-54**: Formatos operacionales

### Otros Formatos

- **FO-LG-05**: Formato de logística
- **FO-QA-10**: Control de calidad
- **FO-SGC-01**, **FO-SGC-02**: Sistema de gestión de calidad

### Etiquetas de Control (ET-LC-*)

- **ET-LC-01** a **ET-LC-10+**: Etiquetas de control
- Ubicación: `src/frontend/formats/Etiquetas.Control/`

---

## 🚀 Roadmap / Mejoras Futuras

### Versión 10.1 (Planeada)

- [ ] Generación automática de códigos secuenciales
- [ ] Lista de documentos guardados en dashboard
- [ ] Búsqueda de documentos por código, fecha, tipo
- [ ] Filtros avanzados en vista de instancias

### Versión 11.0 (Planeada)

- [ ] Exportación de datos a Excel
- [ ] Exportación de documentos a PDF con plantillas
- [ ] Historial de versiones de documentos (versionado)
- [ ] Firma digital de documentos
- [ ] Workflow de aprobaciones multi-nivel

### Versión 12.0 (Planeada)

- [ ] Migrar autenticación a JWT
- [ ] Implementar hashing de contraseñas con BCrypt
- [ ] API pública con documentación Swagger/OpenAPI
- [ ] Notificaciones en tiempo real (WebSocket)
- [ ] Panel de estadísticas y reportes

---

## 👥 Contribución

Este es un proyecto propietario de **Xelle Scientific, S.A.P.I. de C.V.**

Para reportar problemas o sugerir mejoras:
- Contactar al equipo de desarrollo interno
- Revisar documentación técnica antes de modificar código
- Respetar convenciones de código existentes

---

## 📜 Licencia

© 2026 **Xelle Scientific, S.A.P.I. de C.V.** - Todos los derechos reservados.

Este software y su documentación están protegidos por derechos de autor. Queda prohibida su reproducción total o parcial sin autorización expresa.

---

## 📧 Soporte

**Xelle Scientific, S.A.P.I. de C.V.**  
Equipo de Desarrollo LIMS

Para soporte técnico:
- Revisar documentación: `SISTEMA_PERSISTENCIA.md`, `GUIA_RAPIDA_PERSISTENCIA.md`
- Consultar sección de resolución de problemas
- Contactar al administrador del sistema

---

<div align="center">

**XELLE SCIENTIFIC LIMS v10.0**  
*Sistema de Gestión de Laboratorio Clínico de Nueva Generación*

🧬 Innovación | 💾 Persistencia | 🔒 Seguridad | 📊 Eficiencia

</div>
