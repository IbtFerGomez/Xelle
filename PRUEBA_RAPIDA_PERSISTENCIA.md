# 🚀 PRUEBA RÁPIDA - SISTEMA DE PERSISTENCIA

## Objetivo
Verificar que el sistema de persistencia funciona correctamente con códigos secuenciales.

---

## ✅ LISTA DE VERIFICACIÓN RÁPIDA

### 1️⃣ Iniciar el Sistema

```bash
# Opción 1: Arranque Rápido
Arrancar-Xelle-Rapido.bat

# Opción 2: Arranque Normal
Arrancar-Xelle.bat
```

**Verificar:**
- ✅ Backend corriendo en puerto 8080
- ✅ Frontend accesible en http://localhost:80 o el puerto configurado

---

### 2️⃣ Login

1. Abrir navegador → `http://localhost` (o el puerto configurado)
2. Ingresar credenciales
3. Acceder al Dashboard

---

### 3️⃣ PRUEBA 1: Crear Primer Formato (FO-LC-21)

**Pasos:**
1. Dashboard → Seleccionar **FO-LC-21** (Bitácora)
2. El formato se abre en blanco
3. Verificar que el campo de código de barras muestra: `001`
4. Completar algunos campos de prueba:
   - Fecha: (auto-llenada)
   - Nombre analista: "Juan Pérez"
   - Observaciones: "Prueba de persistencia 1"
5. Click botón **"Guardar"**

**Resultado Esperado:**
```
✅ Nuevo documento guardado: FO-LC-21-001
```

**Verificaciones:**
- ✅ URL cambia a: `/formats/FO-LC-21.html?instance=FO-LC-21-001`
- ✅ Mensaje de éxito aparece
- ✅ Los datos permanecen en el formulario

---

### 4️⃣ PRUEBA 2: Crear Segundo Formato (FO-LC-21)

**Pasos:**
1. Dashboard → Seleccionar nuevamente **FO-LC-21**
2. El formato se abre en blanco (nuevo)
3. Verificar que el código de barras muestra: `002` (auto-incrementado)
4. Completar campos diferentes:
   - Nombre analista: "María García"
   - Observaciones: "Prueba de persistencia 2"
5. Click "Guardar"

**Resultado Esperado:**
```
✅ Nuevo documento guardado: FO-LC-21-002
```

**Verificaciones:**
- ✅ Código correcto: FO-LC-21-002 (no 001)
- ✅ URL actualizada
- ✅ Datos guardados correctamente

---

### 5️⃣ PRUEBA 3: Ver en Biblioteca

**Pasos:**
1. Dashboard → Click en tab **"Biblioteca"** (menú lateral)
2. Observar la tabla de formatos guardados

**Resultado Esperado:**

| Código Único | Formato | Estado | Actualizado | Acciones |
|--------------|---------|--------|-------------|----------|
| FO-LC-21-002 | FO-LC-21 | 🟡 DRAFT | [fecha reciente] | 📂 ✅ ✏️ 🗑️ |
| FO-LC-21-001 | FO-LC-21 | 🟡 DRAFT | [fecha reciente] | 📂 ✅ ✏️ 🗑️ |

**Verificaciones:**
- ✅ Ambos formatos aparecen en la lista
- ✅ Ordenados por fecha (más reciente primero)
- ✅ Estado = DRAFT
- ✅ Badges amarillos

---

### 6️⃣ PRUEBA 4: Abrir Formato Guardado

**Pasos:**
1. En la Biblioteca, buscar `FO-LC-21-001`
2. Click en icono 📂 "Abrir y editar"

**Resultado Esperado:**
- ✅ Se abre el formato FO-LC-21
- ✅ URL incluye: `?instance=FO-LC-21-001`
- ✅ **Todos los campos están llenos** con los datos guardados previamente
- ✅ Nombre analista = "Juan Pérez"
- ✅ Observaciones = "Prueba de persistencia 1"

---

### 7️⃣ PRUEBA 5: Editar Formato

**Pasos:**
1. Con FO-LC-21-001 abierto (del paso anterior)
2. Modificar campo "Observaciones" a: "Datos actualizados"
3. Click "Guardar"

**Resultado Esperado:**
```
✅ Formato actualizado: FO-LC-21-001
```

**Verificaciones:**
- ✅ Mensaje dice "actualizado" (no "creado")
- ✅ Los cambios se guardan
- ✅ No se crea un nuevo código (sigue siendo 001)

---

### 8️⃣ PRUEBA 6: Cambiar Estado

**Pasos:**
1. Volver a Dashboard → Biblioteca
2. Buscar FO-LC-21-001
3. Click en icono ✅ "Marcar Completed"

**Resultado Esperado:**
- ✅ El badge cambia de 🟡 DRAFT a 🟢 COMPLETED
- ✅ El estado se actualiza en la tabla
- ✅ El color del badge cambia a verde

**Para revertir:**
4. Click en icono ✏️ "Volver Draft"
5. El badge vuelve a 🟡 amarillo

---

### 9️⃣ PRUEBA 7: Filtros de Biblioteca

**Pasos:**
1. En Biblioteca, usar el campo "Buscar"
2. Escribir: `FO-LC-21-001`

**Resultado Esperado:**
- ✅ Solo aparece FO-LC-21-001
- ✅ FO-LC-21-002 se oculta

**Probar filtro de formato:**
3. Limpiar búsqueda
4. En dropdown "Formato", seleccionar: `FO-LC-21`

**Resultado:**
- ✅ Solo aparecen formatos FO-LC-21-XXX
- ✅ Otros formatos se ocultan

---

### 🔟 PRUEBA 8: Otro Tipo de Formato

**Pasos:**
1. Dashboard → Seleccionar **FO-OP-15** (Operaciones)
2. Completar campos de prueba
3. Click "Guardar"

**Resultado Esperado:**
```
✅ Nuevo documento guardado: FO-OP-15-001
```

**Verificaciones:**
- ✅ Código correcto: FO-OP-15-001 (no FO-LC-21-003)
- ✅ Cada tipo de formato tiene su propia secuencia
- ✅ Aparece en Biblioteca junto con los FO-LC-21

---

## 🎯 RESUMEN DE VERIFICACIONES

Si todas las pruebas pasaron, el sistema está funcionando correctamente:

- ✅ Códigos secuenciales por tipo (FO-LC-21-001, 002, 003...)
- ✅ Auto-incremento funciona
- ✅ Guardado en base de datos
- ✅ Carga de datos guardados
- ✅ Actualización de formatos existentes
- ✅ Biblioteca muestra todos los formatos
- ✅ Filtros de búsqueda funcionan
- ✅ Cambio de estados (DRAFT ↔ COMPLETED)
- ✅ Cada tipo de formato tiene secuencia independiente

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### "Código único ya existe"
**Causa:** El backend intentó crear un código duplicado
**Solución:** La función `nextUniqueCode()` auto-incrementa hasta encontrar uno libre

### Datos no se cargan al abrir formato
**Causa:** El parámetro `instance` no está en la URL
**Solución:** Siempre abrir desde la Biblioteca con el botón 📂

### El número de secuencia no incrementa
**Causa:** Posible error en la función de backend
**Solución:** Verificar logs del backend y tabla `format_instances`

### Formato no aparece en Biblioteca
**Causa:** No se guardó correctamente o filtro activo
**Solución:** 
1. Verificar mensaje de confirmación al guardar
2. Limpiar todos los filtros en Biblioteca
3. Click en "Actualizar"

---

## 📊 SQL DE VERIFICACIÓN

Para verificar directo en la base de datos:

```sql
-- Ver todos los formatos FO-LC-21
SELECT unique_code, format_type, status, created_at 
FROM format_instances 
WHERE format_type = 'FO-LC-21' 
ORDER BY created_at DESC;

-- Contar formatos por tipo
SELECT format_type, COUNT(*) as total 
FROM format_instances 
GROUP BY format_type 
ORDER BY total DESC;

-- Ver últimos 10 formatos creados
SELECT unique_code, format_type, status, created_at 
FROM format_instances 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## ✅ CHECKLIST FINAL

Antes de usar en producción:

- [ ] Todas las 10 pruebas pasadas exitosamente
- [ ] Códigos secuenciales correctos (FO-XX-XXX-###)
- [ ] Biblioteca muestra todos los formatos
- [ ] Filtros funcionan correctamente
- [ ] Estados se cambian sin errores
- [ ] Backend no muestra errores en logs
- [ ] Base de datos recibe los registros

**Si todas están marcadas:** ✅ **SISTEMA LISTO PARA PRODUCCIÓN**

---

**Tiempo estimado de prueba completa:** 15-20 minutos  
**Nivel de dificultad:** Fácil  
**Conocimientos requeridos:** Uso básico de la aplicación

**¡Éxito con las pruebas!** 🚀
