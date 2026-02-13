# Guía de Migración - Xelle LIMS

## 📋 Resumen de Cambios

Esta migración reorganiza completamente la estructura del proyecto Xelle LIMS para seguir las mejores prácticas de desarrollo profesional.

## 🎯 Objetivos Alcanzados

✅ **Separación clara Backend/Frontend**
✅ **Estructura modular y escalable**
✅ **Configuración Docker optimizada**
✅ **Documentación completa**
✅ **Referencias actualizadas automáticamente**

---

## 📁 Nueva Estructura de Carpetas

```
Xelle/
├── src/
│   ├── backend/                    # Backend FastAPI
│   │   ├── main.py                # Aplicación principal
│   │   ├── requirements.txt       # Dependencias Python
│   │   └── __pycache__/
│   │
│   └── frontend/                   # Frontend (HTML/CSS/JS)
│       ├── index.html             # Página de login
│       ├── dashboard.html         # Dashboard principal
│       ├── formats/               # Archivos de formatos
│       │   ├── FO-LC-*.html      # Formatos online
│       │   └── offline/          # Formatos offline
│       │       └── FO-LC-*-OffLine.html
│       │
│       └── assets/                # Recursos estáticos
│           ├── css/
│           │   ├── theme.css     # Tema principal
│           │   └── formats/
│           │       └── styles.css # Estilos de formatos
│           │
│           ├── js/
│           │   ├── config/
│           │   │   └── users.js  # Configuración de usuarios
│           │   ├── core/
│           │   │   └── core.js   # Lógica principal
│           │   ├── vendor/
│           │   │   ├── jquery-3.7.1.min.js
│           │   │   └── jszip.min.js
│           │   └── formats/
│           │       ├── format-app.js
│           │       └── format-app-comercial.js
│           │
│           └── img/              # Imágenes y logos
│
├── scripts/                      # Scripts de utilidad
│   ├── migrate-formats.ps1      # Script de migración
│   └── test-pre-docker.bat
│
├── docs/                         # Documentación
├── docker-compose.yml           # Orquestación de contenedores
├── Dockerfile                   # Imagen del backend
├── nginx.conf                   # Configuración Nginx
├── .env.example                 # Plantilla de variables de entorno
├── .gitignore                   # Archivos ignorados por Git
└── README.md                    # Documentación principal
```

---

## 🚀 Pasos de Migración

### 1️⃣ Ejecutar el Script de Migración

El script `migrate-formats.ps1` automatiza la migración de todos los archivos de formatos:

```powershell
# Desde PowerShell (ejecutar como administrador)
cd scripts
.\migrate-formats.ps1
```

**Este script realiza:**
- ✅ Copia todos los archivos HTML de formatos a `src/frontend/formats/`
- ✅ Actualiza referencias a CSS, JS, jQuery y JSZip automáticamente
- ✅ Copia archivos de estilos y scripts a las nuevas ubicaciones
- ✅ Genera un reporte de migración (`MIGRATION-SUMMARY.txt`)
- ✅ Mantiene los archivos originales como backup

### 2️⃣ Verificar Variables de Entorno

```bash
# Copiar la plantilla
cp .env.example .env

# Editar con tus credenciales
nano .env  # o usa tu editor preferido
```

Configurar:
```env
# Base de datos PostgreSQL
DB_USER=xelle_user
DB_PASSWORD=tu_password_seguro
DB_HOST=postgres
DB_PORT=5432
DB_NAME=xelle_db

# Otros
SECRET_KEY=tu_clave_secreta_muy_segura
```

### 3️⃣ Iniciar con Docker

```bash
# Construir e iniciar todos los contenedores
docker-compose up --build -d

# Ver logs
docker-compose logs -f

# Verificar salud del sistema
docker-compose ps
```

### 4️⃣ Acceder a la Aplicación

- **Frontend:** http://localhost
- **API Backend:** http://localhost/api
- **Health Check:** http://localhost/health
- **Documentación API:** http://localhost/api/docs

### 5️⃣ Probar los Formatos

1. Iniciar sesión en http://localhost
2. Ir al dashboard
3. **Abrir cada tarjeta de formato** para verificar que:
   - ✅ El formato se carga correctamente
   - ✅ Los estilos se aplican bien
   - ✅ Los scripts funcionan (guardar, imprimir, exportar)
   - ✅ La conexión con el backend funciona

---

## 🔄 Cambios Técnicos Realizados

### Backend (`src/backend/main.py`)

**Antes:**
```python
# Estaba en: backend/app/main.py
from backend.config import settings
```

**Después:**
```python
# Ahora en: src/backend/main.py
import os
from dotenv import load_dotenv
```

- Eliminada dependencia de módulo `backend.config`
- Variables de entorno cargadas directamente
- Rutas simplificadas

### Frontend HTML

**Antes (index.html):**
```html
<script src="config-users.js"></script>
<script src="dashboard-app.js"></script>
```

**Después:**
```html
<script src="assets/js/config/users.js"></script>
<script src="assets/js/core/core.js"></script>
```

### Archivos de Formatos

**Antes (FO-LC-16.html):**
```html
<link rel="stylesheet" href="format-styles.css">
<script src="jquery-3.7.1.min.js"></script>
<script src="format-app.js"></script>
```

**Después:**
```html
<link rel="stylesheet" href="../assets/css/formats/styles.css">
<script src="../assets/js/vendor/jquery-3.7.1.min.js"></script>
<script src="../assets/js/formats/format-app.js"></script>
```

### Docker Configuration

**Antes (Dockerfile):**
```dockerfile
COPY backend/requirements.txt .
COPY backend/ ./
CMD ["uvicorn", "backend.backend_v6:app", ...]
```

**Después:**
```dockerfile
COPY src/backend/requirements.txt .
COPY src/backend/ ./
COPY src/frontend/ /app/static/
CMD ["uvicorn", "main:app", ...]
```

**Antes (docker-compose.yml):**
```yaml
volumes:
  - ./backend:/app/backend
  - ./formats:/app/formats
```

**Después:**
```yaml
volumes:
  - ./src/backend:/app
  - ./src/frontend:/app/static
```

---

## ✅ Checklist Post-Migración

### Verificación Básica
- [ ] Docker containers iniciados correctamente
- [ ] Base de datos PostgreSQL corriendo
- [ ] Backend responde en `/api/health`
- [ ] Login funciona correctamente
- [ ] Dashboard carga sin errores de consola

### Verificación de Formatos
- [ ] Tarjetas de formatos se renderizan correctamente
- [ ] Al hacer clic, se abre el formato correcto
- [ ] Estilos CSS se cargan (verificar en DevTools)
- [ ] Scripts JS se cargan sin errores
- [ ] Funcionalidad de guardar funciona
- [ ] Conexión con backend API funciona

### Verificación de Producción
- [ ] Logs de Docker sin errores críticos
- [ ] Nginx proxy funciona correctamente
- [ ] Variables de entorno correctas
- [ ] Backup de archivos originales existe

---

## 🐛 Solución de Problemas

### Error: "Cannot find module 'main'"

**Causa:** Dockerfile antiguo  
**Solución:** Asegúrate de que `Dockerfile` tenga:
```dockerfile
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Error: 404 en recursos CSS/JS

**Causa:** Referencias no actualizadas  
**Solución:** Ejecutar `migrate-formats.ps1` de nuevo

### Error: Formatos no se conectan al backend

**Causa:** API URL incorrecta  
**Solución:** Verificar en console de DevTools:
```javascript
// En format-app.js, debe ser:
const API_URL = window.location.origin + '/api';
```

### Container backend no inicia

**Causa:** Variables de entorno faltantes  
**Solución:**
```bash
# Verificar que .env existe
ls -la .env

# Ver logs detallados
docker-compose logs backend
```

### Base de datos no se conecta

**Causa:** Credenciales incorrectas en `.env`  
**Solución:**
```bash
# Verificar variables
cat .env

# Reiniciar containers
docker-compose down
docker-compose up -d
```

---

## 📦 Limpieza de Archivos Antiguos

**⚠️ SOLO después de verificar que todo funciona:**

```powershell
# Backup de seguridad
mkdir archive/pre-migration-backup
cp -r formats archive/pre-migration-backup/
cp -r backend archive/pre-migration-backup/
cp *.html archive/pre-migration-backup/
cp *.js archive/pre-migration-backup/

# Eliminar archivos antiguos
rm -rf formats/
rm -rf backend/
rm backend.py
rm config-users.js
rm index.html
rm dashboard.html
rm jquery-3.7.1.min.js
rm jszip.min.js
```

---

## 📚 Documentación Adicional

- **README.md:** Documentación principal del proyecto
- **API Docs:** http://localhost/api/docs (cuando corra Docker)
- **Código Backend:** Ver [src/backend/main.py](src/backend/main.py)
- **Lógica Frontend:** Ver [src/frontend/assets/js/core/core.js](src/frontend/assets/js/core/core.js)

---

## 🎉 Resultado Final

Después de esta migración tendrás:

✅ **Estructura profesional y escalable**
✅ **Código más mantenible**
✅ **Separación clara de responsabilidades**
✅ **Docker simplificado**
✅ **Documentación completa**
✅ **Sin pérdida de funcionalidad**

---

## 💡 Próximos Pasos Recomendados

1. **Testing:** Crear tests unitarios para backend
2. **CI/CD:** Configurar pipeline de despliegue
3. **Monitoreo:** Agregar logging estructurado
4. **Seguridad:** Implementar HTTPS y autenticación JWT
5. **Performance:** Agregar caché con Redis
6. **Backup:** Automatizar backups de base de datos

---

**Fecha de migración:** 2026  
**Versión Xelle LIMS:** 6.0  
**Estado:** ✅ Completado

¿Preguntas? Consulta el README.md principal o los comentarios en el código.
