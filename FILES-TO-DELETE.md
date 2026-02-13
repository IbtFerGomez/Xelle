# 🗑️ Lista Rápida de Archivos Innecesarios - Xelle

## ❌ ARCHIVOS PARA ELIMINAR (Duplicados/Obsoletos)

### 📂 Carpetas Completas (Eliminar TODO su contenido)

```
❌ backend/                    # ~8 archivos - Ahora en src/backend/
❌ frontend/                   # ~10 archivos - Ahora en src/frontend/
❌ assets/                     # ~6 archivos - Ahora en src/frontend/assets/
❌ formats/                    # ~60 archivos - Solo después de migrar con migrate-formats.ps1
```

**Total:** ~84 archivos en 4 carpetas

---

### 📄 Archivos Individuales en Raíz

#### Backend Python:
```
❌ backend.py                  # Obsoleto → src/backend/main.py
❌ colores.py                  # Script de prueba obsoleto
```

#### Frontend HTML:
```
❌ index.html                  # Obsoleto → src/frontend/index.html
❌ dashboard.html              # Obsoleto → src/frontend/dashboard.html
```

#### JavaScript:
```
❌ config-users.js             # Obsoleto → src/frontend/assets/js/config/users.js
❌ jquery-3.7.1.min.js         # Obsoleto → src/frontend/assets/js/vendor/
❌ jszip.min.js                # Obsoleto → src/frontend/assets/js/vendor/
```

**Total:** 7 archivos individuales

---

## ⚠️ REVISAR ANTES DE ELIMINAR

### Imágenes/Logos (Mover primero a src/frontend/assets/img/)
```
⚠️ Logo.svg
⚠️ icono.svg
⚠️ Xelle Icono.ico
⚠️ XelleScientific.png
⚠️ Figure_1.png
⚠️ DIagrama.png
```

### Carpetas Especiales (Revisar contenido manualmente)
```
⚠️ Iconos/                    # Puede tener recursos útiles
⚠️ Formatos completados/      # Revisar si tiene archivos importantes
⚠️ sgc-integration/           # Verificar si se está usando
```

---

## ✅ CONSERVAR SIEMPRE

```
✅ src/                        # Nueva estructura principal
✅ scripts/                    # Scripts de utilidad
✅ docs/                       # Documentación
✅ archive/                    # Backups históricos
✅ .git/                       # Control de versiones
✅ .env.example
✅ docker-compose.yml
✅ Dockerfile
✅ nginx.conf
✅ README.md
✅ MIGRATION-GUIDE.md
✅ CLEANUP-REPORT.md
✅ .gitignore
```

---

## 🚀 COMANDO RÁPIDO DE LIMPIEZA

### Opción 1: Script Automatizado (RECOMENDADO)
```powershell
# Limpieza segura con backup automático
cd scripts
.\cleanup-project.ps1
```

### Opción 2: Manual (Si prefieres control total)
```powershell
# 1. Primero: Crear backup
mkdir "archive\pre-cleanup-backup-$(Get-Date -Format 'yyyyMMdd')"
cp -r backend,frontend,assets,formats,*.py,*.html,*.js "archive\pre-cleanup-backup-$(Get-Date -Format 'yyyyMMdd')\"

# 2. Mover recursos útiles
cp Logo.svg,icono.svg,"Xelle Icono.ico",XelleScientific.png src\frontend\assets\img\

# 3. Eliminar carpetas duplicadas
Remove-Item -Recurse -Force backend,frontend,assets

# 4. Eliminar archivos individuales
Remove-Item backend.py,colores.py,index.html,dashboard.html,config-users.js,jquery-3.7.1.min.js,jszip.min.js

# 5. Eliminar formats/ solo DESPUÉS de ejecutar migrate-formats.ps1
Remove-Item -Recurse -Force formats
```

---

## 📊 TOTAL DE ARCHIVOS INNECESARIOS

| Tipo | Cantidad | Acción |
|------|----------|--------|
| Carpetas backend/frontend/assets | ~24 archivos | ❌ Eliminar |
| Carpeta formats/ | ~60 archivos | ❌ Eliminar después de migrar |
| Archivos individuales | 7 archivos | ❌ Eliminar |
| Imágenes/logos en raíz | 6 archivos | ⚠️ Mover primero |
| **TOTAL A LIMPIAR** | **~97 archivos** | **~8 MB liberados** |

---

## ⚡ LISTA DE VERIFICACIÓN RÁPIDA

- [ ] ✅ Nueva estructura en `src/` está completa
- [ ] ✅ Ejecutado `scripts/migrate-formats.ps1`
- [ ] ✅ Probado Docker: `docker compose up -d`
- [ ] ✅ Verificado que todos los formatos funcionan
- [ ] ✅ Creado backup de seguridad
- [ ] ✅ Movidas imágenes/logos a `src/frontend/assets/img/`
- [ ] ❌ Listo para eliminar archivos obsoletos

---

## 💡 REGLA DE ORO

**NO elimines NADA hasta que:**
1. ✅ `src/` esté completo y funcional
2. ✅ Hayas ejecutado `migrate-formats.ps1`
3. ✅ Hayas probado la aplicación con Docker
4. ✅ Tengas un backup de seguridad

---

**Última actualización:** 13 Feb 2026  
**Estado:** Migración estructural completa, limpieza pendiente  
**Ver detalle completo:** CLEANUP-REPORT.md
