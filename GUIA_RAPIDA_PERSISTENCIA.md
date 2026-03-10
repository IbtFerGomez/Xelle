# Guía Rápida - Sistema de Persistencia Xelle

## ✅ Cambios Implementados

### 1. Persistencia por Código de Barcode
- Cada formato ahora se identifica de forma única mediante el código de barcode
- El código de barcode es **único e irrepetible**
- Todos los campos se guardan en una tabla interrelacionada con este código

### 2. Documento Nuevo
- Al hacer clic en una tarjeta desde el dashboard, se carga un **documento en blanco**
- No se cargan datos previos de localStorage
- Usuario ingresa datos desde cero

### 3. Botones Actualizados
- ✅ **Guardar**: Mantiene su función (mejorada)
- ✅ **Imprimir**: Mantiene su función
- ❌ **Limpiar**: Eliminado de todos los formatos (89 archivos actualizados)

### 4. IDs Únicos Automáticos
- El sistema asigna automáticamente IDs únicos a todos los campos que no los tienen
- Esto garantiza una persistencia robusta y confiable
- No requiere modificación manual de HTMLs

## 🚀 Cómo Usar

### Crear Documento Nuevo

1. Abrir formato desde dashboard (o con `?new=1` en URL)
2. Ingresar código de folio/barcode único (obligatorio)
3. Completar los campos del formulario
4. Presionar **Guardar**
   - ✅ Si el código NO existe → Se crea nuevo documento
   - ⚠️ Si NO hay código → Error: "Debe ingresar un código de folio único"

### Modificar Documento Existente

1. Cargar documento existente (desde lista o por URL)
2. Modificar los campos necesarios
3. Presionar **Guardar**
   - ✅ Si el código YA existe → Se sobrescriben los campos
   - ⚠️ El código de barcode NO se puede cambiar

### Imprimir Documento

1. Presionar **Imprimir**
2. Se abre el diálogo de impresión del navegador
3. No es necesario guardar antes de imprimir

## 📋 Archivos Modificados

### Backend
- No requiere cambios (ya existía la estructura necesaria)
- Entidad: `FormatInstanceEntity`
- Repositorio: `FormatInstanceRepository`
- Controlador: `ApiController`

### Frontend
- ✅ `src/frontend/formats/format-app.js` - Lógica de persistencia actualizada
  - Nueva función: `ensureFieldIds()` - Asigna IDs únicos automáticamente
  - Mejorada función: `saveData()` - Validación de barcode obligatorio
  - Mejorada función: `loadData()` - Respeta modo "nuevo documento"
  - Mejorada función: `persistInstance()` - Lógica de crear/actualizar simplificada

### HTML (49 archivos principales + 40 offLine)
- ✅ Removido botón "Limpiar" de 89 archivos HTML
- ✅ Solo mantienen botones "Guardar" e "Imprimir"

## 🔧 Arquitectura Técnica

### Base de Datos: PostgreSQL
```sql
-- Tabla principal
CREATE TABLE format_instances (
    id BIGSERIAL PRIMARY KEY,
    unique_code VARCHAR(255) UNIQUE NOT NULL,  -- Código de barcode
    format_type VARCHAR(255) NOT NULL,          -- Tipo de formato
    status VARCHAR(50) NOT NULL,                 -- Estado
    data_payload TEXT,                           -- JSON con todos los campos
    created_by BIGINT,
    updated_by BIGINT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

### Estructura data_payload (JSON)
```json
{
  "id:reg-12": "000123",
  "id:registry-date": "2026-03-10",
  "fo_lc_12_input_5": "Material X123",
  "fo_lc_12_input_6": "Producción",
  "fo_lc_12_textarea_7": "Justificación técnica..."
}
```

## ✨ Mejoras Implementadas

1. **Validación Obligatoria**: El sistema ahora requiere código de barcode antes de guardar
2. **Mensajes Claros**: Feedback mejorado al usuario sobre operaciones exitosas/fallidas
3. **IDs Automáticos**: No depende de índices frágiles
4. **Modo Nuevo**: Documento limpio al crear nuevo (parámetro `?new=1`)
5. **Sobrescritura Inteligente**: Actualiza solo los campos, mantiene el código único

## 🧪 Pruebas Recomendadas

### Prueba 1: Crear Documento Nuevo
```
1. Abrir: http://localhost/formats/FO-LC-12.html?new=1
2. Verificar: Formulario en blanco
3. Ingresar código: 001234
4. Completar campos
5. Guardar
6. Verificar: Mensaje "Guardado Exitoso"
```

### Prueba 2: Modificar Documento Existente
```
1. Abrir: http://localhost/formats/FO-LC-12.html?instance=FO-LC-12-001234
2. Verificar: Campos cargados con datos
3. Modificar algún campo
4. Guardar
5. Verificar: Mensaje "Guardado Exitoso"
6. Recargar página
7. Verificar: Cambios persistidos
```

### Prueba 3: Validación de Código Duplicado
```
1. Abrir nuevo documento
2. Intentar guardar sin código
3. Verificar: Error "Debe ingresar un código de folio único"
4. Ingresar código existente
5. Guardar
6. Verificar: Se actualiza el documento existente (no crea duplicado)
```

## 📝 Notas Adicionales

### Recomendaciones de Uso

- **Códigos únicos**: Usar secuencia numérica consecutiva (001, 002, 003...)
- **Backup**: Configurar backup automático de base de datos PostgreSQL
- **Auditoría**: Todos los cambios se registran en `audit_logs`

### Limitaciones Conocidas

- El código de barcode no puede modificarse después de guardado
- No hay función "Deshacer" (usar backup de BD si es crítico)
- El modo offline está limitado a localStorage del navegador

### Próximas Mejoras Sugeridas

1. Generación automática de códigos secuenciales
2. Lista de documentos guardados en el dashboard
3. Búsqueda de documentos por código o fecha
4. Exportación de datos a Excel/PDF
5. Historial de versiones de documentos

## 🐛 Resolución de Problemas

### "No se puede guardar el formato"
- **Verificar**: Conexión con servidor
- **Revisar**: Sesión de usuario activa
- **Console**: Abrir DevTools (F12) y revisar errores

### "Código único ya existe"
- **Normal**: Si está actualizando documento existente
- **Problema**: Si está creando nuevo, usar código diferente

### "Campos no se cargan"
- **Verificar**: URL contiene `?instance=CODIGO-CORRECTO`
- **Probar**: Limpiar caché del navegador
- **Revisar**: Base de datos contiene el registro

## 📧 Soporte

Para reportar problemas o sugerir mejoras:
- Revisar: [SISTEMA_PERSISTENCIA.md](SISTEMA_PERSISTENCIA.md) - Documentación completa
- Contactar: Equipo de desarrollo Xelle Scientific

---

**Fecha de implementación**: Marzo 2026  
**Versión**: 1.0  
**Estado**: ✅ Producción
