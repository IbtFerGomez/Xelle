# 🧹 Reporte de Limpieza del Proyecto Xelle

**Fecha:** 13 de Febrero, 2026  
**Estado:** Migración estructural completada, archivos antiguos pendientes de eliminación

---

## 📊 Resumen Ejecutivo

Después de la reorganización profesional del proyecto, existen **archivos duplicados y obsoletos** que pueden eliminarse de forma segura. Este documento lista todos los archivos innecesarios organizados por categoría.

### Estado Actual
- ✅ Nueva estructura `src/` creada y funcional
- ✅ Backend migrado a `src/backend/`
- ✅ Frontend principal migrado a `src/frontend/`
- ⚠️ **Archivos de formatos HTML NO migrados aún** (ejecutar `scripts/migrate-formats.ps1`)
- ⚠️ Archivos antiguos conservados como backup

---

## 🗑️ ARCHIVOS INNECESARIOS (Pueden Eliminarse)

### 📁 Categoría 1: BACKEND DUPLICADO (Prioridad ALTA)

**Carpeta completa DUPLICADA:**
```
❌ backend/
   ├── __init__.py                    # Duplicado de src/backend/
   ├── colores.py                     # Script obsoleto
   ├── app/
   │   ├── __init__.py               # Duplicado
   │   └── main.py                   # OBSOLETO - Ahora en src/backend/main.py
   └── legacy/
       └── backend_old.py            # Versión antigua

🎯 ACCIÓN: Eliminar toda la carpeta backend/ (6 archivos)
```

**Archivos Python en raíz:**
```
❌ backend.py                          # Obsoleto - Migrado a src/backend/main.py
❌ colores.py                          # Script de prueba/utilidad obsoleto

🎯 ACCIÓN: Eliminar ambos archivos (2 archivos)
```

---

### 📁 Categoría 2: FRONTEND HTML DUPLICADO (Prioridad ALTA)

```
❌ index.html                          # OBSOLETO - Ahora en src/frontend/index.html
❌ dashboard.html                      # OBSOLETO - Ahora en src/frontend/dashboard.html

🎯 ACCIÓN: Eliminar ambos archivos después de verificar que src/frontend/ funciona (2 archivos)
```

---

### 📁 Categoría 3: JAVASCRIPT DUPLICADO (Prioridad ALTA)

**Archivos en raíz:**
```
❌ config-users.js                     # OBSOLETO - Ahora en src/frontend/assets/js/config/users.js
❌ jquery-3.7.1.min.js                # OBSOLETO - Debe estar en src/frontend/assets/js/vendor/
❌ jszip.min.js                        # OBSOLETO - Debe estar en src/frontend/assets/js/vendor/

🎯 ACCIÓN: Eliminar estos 3 archivos (3 archivos)
```

**Carpeta assets/ antigua:**
```
❌ assets/
   ├── js/
   │   ├── config-users.js           # OBSOLETO - Migrado a src/frontend/assets/js/config/
   │   ├── jquery-3.7.1.min.js       # Duplicado
   │   └── jszip.min.js              # Duplicado
   ├── css/                           # Carpeta vacía o con archivos obsoletos
   └── img/                           # ⚠️ REVISAR - Puede tener imágenes útiles

🎯 ACCIÓN: 
   1. Copiar assets/img/* a src/frontend/assets/img/ (si existen imágenes)
   2. Eliminar toda la carpeta assets/ (6+ archivos)
```

---

### 📁 Categoría 4: FORMATOS HTML (Prioridad MEDIA)

**⚠️ IMPORTANTE: NO eliminar aún - Migración pendiente**

```
⏳ formats/                            # Carpeta con ~30 archivos HTML de formatos
   ├── FO-LC-16.html a FO-LC-45.html # Archivos de formatos principales
   ├── FO-OP-15.html a FO-OP-20.html # Formatos adicionales
   ├── format-app.js                 # Script principal de formatos
   ├── format-app-comercial.js       # Script comercial
   └── formats-offLine/
       ├── FO-LC-*-OffLine.html      # Versiones offline (~25 archivos)
       ├── format-app-OffLine.js     # Script offline
       └── format-styles-OffLine.css # Estilos offline

🎯 ACCIÓN REQUERIDA:
   1. ✅ PRIMERO: Ejecutar scripts/migrate-formats.ps1
   2. ✅ Verificar que todos los formatos funcionan en src/frontend/formats/
   3. ✅ Probar conexión con backend de cada formato
   4. ❌ SOLO ENTONCES: Eliminar toda la carpeta formats/ (~60 archivos)
```

---

### 📁 Categoría 5: CARPETA FRONTEND DUPLICADA (Prioridad MEDIA)

```
❌ frontend/                           # Estructura antigua/experimental
   ├── formats/                       # Vacía o con archivos de prueba
   └── public/
       ├── css/
       │   ├── theme.css             # OBSOLETO - Ahora en src/frontend/assets/css/
       │   └── formats/
       │       ├── styles.css        # Duplicado
       │       └── commercial.css    # Posible archivo adicional
       └── js/
           └── core.js               # OBSOLETO - Ahora en src/frontend/assets/js/core/

🎯 ACCIÓN: Eliminar toda la carpeta frontend/ después de verificar (5-10 archivos)
```

---

### 📁 Categoría 6: ARCHIVOS DE DOCUMENTACIÓN/IMÁGENES (Prioridad BAJA)

**En raíz del proyecto:**
```
⚠️ Logo.svg                           # Logotipo - CONSERVAR o mover a src/frontend/assets/img/
⚠️ icono.svg                          # Ícono - CONSERVAR o mover a src/frontend/assets/img/
⚠️ Xelle Icono.ico                    # Favicon - CONSERVAR o mover a src/frontend/assets/img/
⚠️ XelleScientific.png                # Logo - CONSERVAR o mover a src/frontend/assets/img/
⚠️ Figure_1.png                       # Imagen - CONSERVAR o mover a docs/ o src/frontend/assets/img/
⚠️ DIagrama.png                       # Diagrama - CONSERVAR o mover a docs/

❌ Dirección IP Config.docx           # Documento temporal - MOVER a docs/ o ELIMINAR

🎯 ACCIÓN:
   1. Mover todos los archivos de imagen/logo a src/frontend/assets/img/
   2. Mover documentos a docs/
   3. Eliminar documentos temporales (1 archivo)
```

---

### 📁 Categoría 7: CARPETAS ESPECIALES (Revisar Manualmente)

```
⚠️ Formatos completados/              # Archivos completados - REVISAR contenido
⚠️ Iconos/                            # Recursos de iconos - MOVER a src/frontend/assets/img/icons/
⚠️ sgc-integration/                   # Integración SGC - REVISAR si se usa
⚠️ docs/                              # Documentación - CONSERVAR
⚠️ archive/                           # Archivos archivados - CONSERVAR (es el backup)
⚠️ tests/                             # Tests - CONSERVAR (si existen)
⚠️ .git/                              # Control de versiones - CONSERVAR

🎯 ACCIÓN: Revisar manualmente cada carpeta antes de eliminar
```

---

## 📋 PLAN DE LIMPIEZA PASO A PASO

### ✅ Fase 1: MIGRACIÓN DE FORMATOS (PENDIENTE)

```powershell
# Ejecutar el script de migración
cd "scripts"
.\migrate-formats.ps1

# Verificar que se creó MIGRATION-SUMMARY.txt
cat ..\MIGRATION-SUMMARY.txt
```

**Luego probar:**
1. Iniciar Docker: `docker compose up -d`
2. Abrir http://localhost/dashboard.html
3. Hacer clic en cada tarjeta de formato
4. Verificar que los formatos se cargan correctamente
5. Probar funcionalidad de guardar/imprimir

---

### ✅ Fase 2: BACKUP DE SEGURIDAD

```powershell
# Crear backup completo antes de eliminar
mkdir "archive/pre-cleanup-backup-$(Get-Date -Format 'yyyyMMdd')"

# Copiar archivos importantes a eliminar
cp -r backend "archive/pre-cleanup-backup-$(Get-Date -Format 'yyyyMMdd')/"
cp -r formats "archive/pre-cleanup-backup-$(Get-Date -Format 'yyyyMMdd')/"
cp -r frontend "archive/pre-cleanup-backup-$(Get-Date -Format 'yyyyMMdd')/"
cp -r assets "archive/pre-cleanup-backup-$(Get-Date -Format 'yyyyMMdd')/"
cp backend.py, colores.py, index.html, dashboard.html, config-users.js "archive/pre-cleanup-backup-$(Get-Date -Format 'yyyyMMdd')/"
```

---

### ✅ Fase 3: MOVER RECURSOS ÚTILES

```powershell
# Mover imágenes/logos a ubicación correcta
mkdir -p src/frontend/assets/img

# Copiar logos e iconos
cp Logo.svg, icono.svg, "Xelle Icono.ico", XelleScientific.png src/frontend/assets/img/
cp Figure_1.png, DIagrama.png docs/ # O a src/frontend/assets/img/

# Mover carpeta Iconos si tiene contenido útil
cp -r Iconos/* src/frontend/assets/img/icons/
```

---

### ✅ Fase 4: ELIMINAR ARCHIVOS OBSOLETOS (CUIDADO)

**⚠️ SOLO después de verificar que todo funciona:**

```powershell
# Eliminar carpetas completas
Remove-Item -Recurse -Force backend/
Remove-Item -Recurse -Force formats/
Remove-Item -Recurse -Force frontend/
Remove-Item -Recurse -Force assets/

# Eliminar archivos individuales en raíz
Remove-Item backend.py, colores.py
Remove-Item index.html, dashboard.html
Remove-Item config-users.js
Remove-Item jquery-3.7.1.min.js, jszip.min.js

# Eliminar documentos temporales
Remove-Item "Dirección IP Config.docx"

# Limpiar imágenes de raíz (si ya se movieron)
Remove-Item Logo.svg, icono.svg, "Xelle Icono.ico", XelleScientific.png
Remove-Item Figure_1.png, DIagrama.png

# Eliminar carpeta Iconos (si se movió)
Remove-Item -Recurse -Force Iconos/
```

---

## 📊 RESUMEN DE ARCHIVOS A ELIMINAR

| Categoría | Archivos | Tamaño Estimado |
|-----------|----------|-----------------|
| Backend duplicado | ~8 archivos | ~500 KB |
| HTML duplicados | 2 archivos | ~50 KB |
| JavaScript duplicado | ~6 archivos | ~300 KB |
| Formatos HTML (después migración) | ~60 archivos | ~2 MB |
| Carpeta frontend/ duplicada | ~10 archivos | ~100 KB |
| Documentos/imágenes temporales | ~7 archivos | ~5 MB |
| **TOTAL** | **~93 archivos** | **~8 MB** |

---

## ✅ ESTRUCTURA FINAL ESPERADA

Después de la limpieza, deberías tener:

```
Xelle/
├── src/                              # ✅ ÚNICA fuente de código
│   ├── backend/
│   │   ├── main.py
│   │   └── requirements.txt
│   └── frontend/
│       ├── index.html
│       ├── dashboard.html
│       ├── formats/                  # Formatos HTML migrados
│       │   ├── FO-*.html
│       │   └── offline/
│       └── assets/
│           ├── css/
│           ├── js/
│           └── img/                  # Todos los recursos visuales
│
├── scripts/                          # Scripts de utilidad
├── docs/                             # Documentación y diagramas
├── archive/                          # Backups históricos
├── docker-compose.yml
├── Dockerfile
├── nginx.conf
├── .env.example
├── .gitignore
├── README.md
├── MIGRATION-GUIDE.md
└── CLEANUP-REPORT.md (este archivo)
```

---

## ⚠️ ADVERTENCIAS IMPORTANTES

1. **NO elimines nada hasta después de ejecutar `migrate-formats.ps1`**
2. **SIEMPRE haz backup antes de eliminar**
3. **Verifica que Docker funciona correctamente con la nueva estructura**
4. **Prueba todos los formatos HTML antes de eliminar la carpeta `formats/`**
5. **Revisa manualmente las carpetas especiales** (sgc-integration/, Formatos completados/)
6. **Conserva la carpeta `.git/`** (control de versiones)
7. **Conserva la carpeta `archive/`** (backups históricos)

---

## 🎯 CHECKLIST DE LIMPIEZA

- [ ] **Paso 1:** Ejecutar `scripts/migrate-formats.ps1`
- [ ] **Paso 2:** Iniciar Docker y probar aplicación completa
- [ ] **Paso 3:** Probar TODOS los formatos HTML (click en cada tarjeta)
- [ ] **Paso 4:** Crear backup en `archive/pre-cleanup-backup-YYYYMMDD/`
- [ ] **Paso 5:** Mover recursos útiles (logos, imágenes) a `src/frontend/assets/img/`
- [ ] **Paso 6:** Revisar carpetas especiales manualmente
- [ ] **Paso 7:** Eliminar carpetas duplicadas (backend/, formats/, frontend/, assets/)
- [ ] **Paso 8:** Eliminar archivos individuales obsoletos
- [ ] **Paso 9:** Verificar que la aplicación sigue funcionando
- [ ] **Paso 10:** Commit de cambios en Git

---

## 📞 Soporte

Si encuentras problemas durante la limpieza:
1. **NO entres en pánico** - Tienes backups
2. Revisa `archive/pre-cleanup-backup-YYYYMMDD/`
3. Consulta `MIGRATION-GUIDE.md` para troubleshooting
4. Revisa logs de Docker: `docker compose logs -f`

---

**Última actualización:** 13 de Febrero, 2026  
**Estado del proyecto:** Estructura migrada, limpieza pendiente  
**Próximo paso:** Ejecutar `scripts/migrate-formats.ps1`
