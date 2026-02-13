# 🔄 Cambio de Repositorio Git - Xelle LIMS

## Pasos para cambiar al nuevo repositorio "Xelle"

### 1️⃣ Crear el nuevo repositorio en GitHub

Ve a GitHub y crea un nuevo repositorio llamado **"Xelle"**:
- URL sugerida: `https://github.com/XelleFerGomez/Xelle` o `https://github.com/[tu-usuario]/Xelle`
- Descripción: "Xelle LIMS - Sistema de Gestión de Laboratorio Clínico"
- No inicialices con README (ya tienes uno)

### 2️⃣ Ejecutar los comandos de cambio de repositorio

```powershell
# Ver el repositorio actual
git remote -v

# Eliminar el repositorio remoto actual
git remote remove origin

# Agregar el nuevo repositorio (reemplaza con tu URL real)
git remote add origin https://github.com/XelleFerGomez/Xelle.git

# O si usas SSH:
git remote add origin git@github.com:XelleFerGomez/Xelle.git

# Verificar que se agregó correctamente
git remote -v

# Hacer push al nuevo repositorio (primera vez con -u)
git push -u origin main

# O si tu rama principal se llama master:
git push -u origin master
```

### 3️⃣ Alternativa: Mantener historial del repositorio anterior

Si quieres conservar el historial del repositorio anterior como referencia:

```powershell
# Renombrar el remoto actual a "old-origin"
git remote rename origin old-origin

# Agregar el nuevo repositorio
git remote add origin https://github.com/XelleFerGomez/Xelle.git

# Hacer push al nuevo repositorio
git push -u origin main

# Ahora tienes dos remotos:
# - origin: nuevo repositorio (Xelle)
# - old-origin: repositorio anterior (XelleModular)
```

### 4️⃣ Verificar el cambio

```powershell
# Ver todos los remotos configurados
git remote -v

# Debería mostrar algo como:
# origin  https://github.com/XelleFerGomez/Xelle.git (fetch)
# origin  https://github.com/XelleFerGomez/Xelle.git (push)
```

### 5️⃣ Actualizar archivos de documentación

Ya se actualizaron todas las referencias de "SGCE" a "Xelle" en:
- ✅ README.md
- ✅ MIGRATION-GUIDE.md
- ✅ CLEANUP-REPORT.md
- ✅ FILES-TO-DELETE.md
- ✅ Scripts de PowerShell

---

## 📝 Comandos Listos para Ejecutar

```powershell
# OPCIÓN 1: Cambio simple (elimina referencia al repositorio anterior)
git remote remove origin
git remote add origin https://github.com/XelleFerGomez/Xelle.git
git push -u origin main

# OPCIÓN 2: Si tu rama principal es "master"
git remote remove origin
git remote add origin https://github.com/XelleFerGomez/Xelle.git
git push -u origin master

# OPCIÓN 3: Con SSH (si tienes configurada la clave SSH)
git remote remove origin
git remote add origin git@github.com:XelleFerGomez/Xelle.git
git push -u origin main
```

---

## ⚠️ Notas Importantes

1. **Antes de hacer push**, asegúrate de que todos tus cambios están committeados:
   ```powershell
   git status
   git add .
   git commit -m "Cambio de nombre del proyecto a Xelle"
   ```

2. **Si el push falla** porque el repositorio no está vacío en GitHub:
   ```powershell
   git push -u origin main --force
   ```
   ⚠️ Usar `--force` solo si estás seguro de que quieres sobrescribir el repositorio remoto

3. **Actualizar la rama principal** si GitHub usa "main" en lugar de "master":
   ```powershell
   git branch -M main
   git push -u origin main
   ```

---

## ✅ Checklist

- [ ] Crear repositorio "Xelle" en GitHub
- [ ] Copiar la URL del nuevo repositorio
- [ ] Hacer backup del trabajo actual (opcional)
- [ ] Ejecutar `git remote remove origin`
- [ ] Ejecutar `git remote add origin [URL-NUEVA]`
- [ ] Verificar con `git remote -v`
- [ ] Hacer commit de cambios pendientes
- [ ] Ejecutar `git push -u origin main`
- [ ] Verificar en GitHub que el código se subió correctamente

---

**Última actualización:** 13 de Febrero, 2026  
**Estado:** Listo para cambio de repositorio
