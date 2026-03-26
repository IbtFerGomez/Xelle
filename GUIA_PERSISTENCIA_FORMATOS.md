# 📋 GUÍA DE PERSISTENCIA DE FORMATOS - XELLE LIMS

## 🎯 RESUMEN DEL SISTEMA

El sistema de persistencia de XELLE LIMS permite guardar, recuperar y gestionar todos los formatos con un esquema de código único **secuencial por formato**.

### Esquema de Códigos Únicos

Cada formato guardado recibe un código único siguiendo este patrón:

```
FO-LC-21-001
FO-LC-21-002
FO-LC-21-003
...
FO-OP-15-001
FO-OP-15-002
```

**Estructura del Código:**
- `FO-LC-21` = Código del formato (tipo de formato)
- `001` = Número secuencial (3 dígitos, auto-incrementado)

## 📊 ARQUITECTURA DEL SISTEMA

### Backend (Java Spring Boot)

**Tabla Principal:** `format_instances`
- `id`: ID interno (auto-incrementado)
- `unique_code`: **PRIMARY KEY** - Código único (ej: FO-LC-21-001)
- `format_type`: Tipo de formato (ej: FO-LC-21)
- `status`: Estado (DRAFT / COMPLETED)
- `data_payload`: Datos del formulario (JSON)
- `created_by`: ID del usuario creador
- `updated_by`: ID del último usuario que modificó
- `created_at`: Fecha de creación
- `updated_at`: Fecha de última actualización
- `notes`: Notas adicionales

### API Endpoints

1. **Generar Código Único**
   ```
   POST /api/formats/generate-unique-code
   Body: { "format_type": "FO-LC-21" }
   Response: { "unique_code": "FO-LC-21-001" }
   ```

2. **Crear Instancia**
   ```
   POST /api/format-instances
   Body: {
     "unique_code": "FO-LC-21-001",
     "format_type": "FO-LC-21",
     "status": "DRAFT",
     "data_payload": { ... },
     "user_id": 1
   }
   ```

3. **Obtener Instancia**
   ```
   GET /api/format-instances/FO-LC-21-001
   Response: { "unique_code": "FO-LC-21-001", "data_payload": {...}, ... }
   ```

4. **Actualizar Instancia**
   ```
   PUT /api/format-instances/FO-LC-21-001
   Body: { "status": "COMPLETED", "data_payload": {...}, "user_id": 1 }
   ```

5. **Listar Todas las Instancias**
   ```
   GET /api/format-instances
   Response: [{ "unique_code": "FO-LC-21-001", ... }, ...]
   ```

6. **Eliminar Instancia**
   ```
   DELETE /api/format-instances/FO-LC-21-001?actor_user_id=1
   ```

### Frontend (JavaScript)

**Archivo Principal:** `/src/frontend/formats/format-app.js`

**Funciones Principales:**

1. **`App.Universal.saveData()`**
   - Recopila todos los datos del formulario
   - Valida que exista un código de barras
   - Guarda en servidor y localStorage
   - Muestra confirmación al usuario

2. **`App.Universal.loadData(docId)`**
   - Se ejecuta automáticamente al cargar el formulario
   - Recupera datos desde servidor o localStorage
   - Aplica los datos al formulario

3. **`App.Universal.clearForm()`**
   - Limpia el formulario actual
   - Solicita confirmación antes de borrar

## 🔍 BIBLIOTECA DE FORMATOS (Dashboard)

### Acceso
1. Iniciar sesión en el sistema
2. En el Dashboard, hacer clic en **"Biblioteca"** en el menú lateral

### Funcionalidades

#### **Filtros Disponibles:**
- **Buscar:** Por código único o tipo de formato
- **Formato:** Filtrar por tipo específico (FO-LC-21, FO-OP-15, etc.)
- **Estado:** DRAFT o COMPLETED

#### **Acciones Disponibles:**

1. **📂 Abrir y Editar**
   - Abre el formato guardado con todos sus datos
   - Permite modificar y volver a guardar

2. **✅ Marcar como Completado**
   - Cambia el estado a COMPLETED
   - Indica que el formato está finalizado

3. **✏️ Volver a Draft**
   - Cambia el estado a DRAFT
   - Permite seguir editando

4. **🗑️ Eliminar**
   - Elimina permanentemente el registro
   - Requiere permisos de administrador

## 📝 CÓMO USAR EL SISTEMA

### 1. Crear un Nuevo Formato

1. Desde el Dashboard, seleccionar el formato deseado (ej: FO-LC-21)
2. Se abre el formulario en blanco
3. Completar todos los campos necesarios
4. El sistema auto-genera el código de barras único (ej: FO-LC-21-001)
5. Hacer clic en **"Guardar"**
6. El sistema confirma: "Nuevo documento guardado: FO-LC-21-001"

### 2. Editar un Formato Existente

**Opción A: Desde la Biblioteca**
1. Ir a "Biblioteca" en el Dashboard
2. Buscar el formato por código único
3. Hacer clic en el icono 📂 "Abrir y editar"
4. Modificar los campos necesarios
5. Hacer clic en **"Guardar"**
6. El sistema confirma: "Formato actualizado: FO-LC-21-001"

**Opción B: URL Directa**
```
/formats/FO-LC-21.html?instance=FO-LC-21-001
```

### 3. Ver Historial de Formatos

1. Ir a **"Biblioteca"** en el Dashboard
2. Usar los filtros para encontrar formatos específicos
3. La tabla muestra:
   - Código Único
   - Tipo de Formato
   - Estado (Draft/Completed)
   - Fecha de última actualización

### 4. Gestionar Estados

**Draft → Completed:**
- En la Biblioteca, buscar el formato
- Hacer clic en el icono ✅ "Marcar Completed"
- El badge cambia de amarillo a verde

**Completed → Draft:**
- En la Biblioteca, buscar el formato
- Hacer clic en el icono ✏️ "Volver Draft"
- El badge cambia de verde a amarillo

## 🔧 ESTRUCTURA DE DATOS

### Ejemplo de `data_payload` (JSON)

```json
{
  "id:codigo_barcode": "001",
  "id:fecha_registro": "2026-03-25",
  "name:nombre_analista": "Juan Pérez",
  "id:muestra_tipo": "Células CHO",
  "id:observaciones": "Todo en orden"
}
```

**Nota:** Cada campo se identifica por su `id` o `name`, preservando el estado completo del formulario.

## 📋 FORMATOS SOPORTADOS

El sistema soporta **TODOS** los formatos HTML en el directorio `/src/frontend/formats/`:

### Formatos Lab Calidad (FO-LC-XX):
- FO-LC-12 a FO-LC-52 (40+ formatos)

### Formatos Operaciones (FO-OP-XX):
- FO-OP-13, FO-OP-15, FO-OP-16, FO-OP-17, FO-OP-20
- FO-OP-39 a FO-OP-54 (15+ formatos)

### Formatos Otros:
- FO-LG-05 (Logística)
- FO-QA-10 (Quality Assurance)
- FO-SGC-01, FO-SGC-02, FO-SGC-03 (Sistema de Gestión de Calidad)

**TOTAL:** 58 formatos soportados

## 🚀 MEJORAS IMPLEMENTADAS

### ✅ Código Secuencial Simple
- Antes: `FO-LC-21-20260325-001` (con fecha)
- Ahora: `FO-LC-21-001` (sin fecha, más simple)

### ✅ Auto-incremento por Tipo
- Cada tipo de formato tiene su propia secuencia
- FO-LC-21-001, FO-LC-21-002, ...
- FO-OP-15-001, FO-OP-15-002, ...

### ✅ Persistencia Dual
- **Servidor (PostgreSQL):** Datos permanentes y compartidos
- **LocalStorage:** Caché local para acceso rápido

### ✅ Biblioteca Completa
- Filtros avanzados
- Búsqueda en tiempo real
- Acciones rápidas (abrir, completar, eliminar)

### ✅ Auditoría Completa
- Registro de todas las operaciones
- Tracking de usuario creador/modificador
- Historial de cambios de estado

## 🔐 SEGURIDAD Y PERMISOS

### Operaciones que Requieren Admin:
- ❌ Eliminar formatos guardados
- ❌ Ver historial de auditoría completo

### Operaciones para Todos los Usuarios:
- ✅ Crear nuevos formatos
- ✅ Guardar y editar sus formatos
- ✅ Ver biblioteca de formatos
- ✅ Cambiar estado (Draft ↔ Completed)

## 📖 SOLUCIÓN DE PROBLEMAS

### "Código único ya existe"
**Causa:** El código de barras ya está en uso
**Solución:** El sistema auto-genera un nuevo código secuencial

### "Sesión inválida al guardar"
**Causa:** La sesión expiró
**Solución:** Cerrar sesión y volver a iniciar

### "No se pudo cargar el formato"
**Causa:** El código único no existe en la base de datos
**Solución:** Verificar el código en la Biblioteca

### Formato no se carga automáticamente
**Causa:** Parámetro `instance` no está en la URL
**Solución:** Abrir desde la Biblioteca o agregar `?instance=CODIGO` a la URL

## 🎓 MEJORES PRÁCTICAS

1. **Guardar frecuentemente** durante el llenado de formatos largos
2. **Usar estados correctamente:**
   - DRAFT: Mientras se trabaja en el formato
   - COMPLETED: Cuando el formato está finalizado
3. **No modificar el código de barras** una vez guardado (se crea nuevo documento)
4. **Usar la Biblioteca** para acceder a formatos guardados (no URLs manuales)
5. **Verificar confirmaciones** después de guardar

## 📞 SOPORTE

Para problemas técnicos o preguntas:
- Revisar esta documentación
- Contactar al administrador del sistema
- Verificar logs en el módulo "Historial / Auditoría"

---

**Versión:** 2.0  
**Fecha:** Marzo 2026  
**Sistema:** XELLE LIMS - Scientific Management Platform
