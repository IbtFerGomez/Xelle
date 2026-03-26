# Prueba de Persistencia - FO-LC-24 (Dosificación)

## ✅ Correcciones Aplicadas

### 1. **Campo de Fecha de Registro** 
- **Antes**: `<input type="date" class="registry-date no-auto-date">` ❌
- **Ahora**: `<input type="date" id="reg-24-date" class="registry-date cedit no-auto-date">` ✅
- **Resultado**: La fecha del registro ahora se guarda correctamente

### 2. **Campos de Firma**
- **Antes**: 3 inputs sin ID ni clase `cedit` ❌
- **Ahora**: ✅
  - `<input type="text" id="sig-elaboro-24" class="cedit">`
  - `<input type="text" id="sig-reviso-24" class="cedit">`
  - `<input type="text" id="sig-autorizo-24" class="cedit">`
- **Resultado**: Los nombres de firma ahora se guardan correctamente

### 3. **Recálculo de Inventario al Cargar**
- **Mejora**: Se resetean los flags `manualGrandTotals` e `inventoryManualOverride` al cargar datos
- **Resultado**: El inventario se recalcula correctamente al cargar un documento guardado

---

## 📋 Checklist de Pruebas

### Prueba 1: Crear Documento Nuevo ✓
1. Abrir: `http://localhost/formats/FO-LC-24.html?new=1`
2. Verificar: Formulario en blanco
3. Completar:
   - **Folio**: `TEST001`
   - **Fecha Registro**: `2026-03-25`
   - **Fecha Operación**: `2026-03-25`
   - **Agregar 1 Insumo**: ID: `INS-001`, Insumo: `Medio DMEM`, Marca: `Gibco`, Lote: `L123`, Caducidad: `2027-01-01`
   - **Agregar 2 Dosis**:
     - Dosis 1: Producto: `Stem Xelle`, Origen: `TPL-001`, Presentación: `25M`
     - Dosis 2: Producto: `Hybrid Xelle`, Origen: `TPL-002`, Presentación: `50M+5B`
   - **Firmas**:
     - Elaboró: `Dr. Juan Pérez`
     - Revisó: `QA María López`
     - Autorizó: `Dir. Carlos García`
4. Clic en **Guardar**
5. Verificar: Mensaje "Documento Creado" con código `FO-LC-24-TEST001`

### Prueba 2: Cargar Documento Existente ✓
1. Abrir: `http://localhost/formats/FO-LC-24.html?instance=FO-LC-24-TEST001`
2. Verificar que se carguen TODOS los campos:
   - ✅ Folio: `TEST001`
   - ✅ Fecha Registro: `2026-03-25`
   - ✅ Fecha Operación: `2026-03-25`
   - ✅ Tabla de Insumos con 1 fila
   - ✅ Tabla de Dosis con 2 filas
   - ✅ Inventario calculado automáticamente:
     - Stem Xelle: 1 vial
     - Hybrid Xelle: 1 vial
     - Total Viales: 2
     - Células calculadas según presentación
   - ✅ Nombres en las 3 firmas

### Prueba 3: Modificar y Actualizar ✓
1. Cargar documento `FO-LC-24-TEST001`
2. Modificar:
   - Cambiar nombre en "Elaboró" a: `Dr. Pedro Ramírez`
   - Agregar 1 dosis más: Producto: `Exosomas`, Presentación: `15B`
3. Clic en **Guardar**
4. Verificar: Mensaje "Actualizado"
5. Recargar página
6. Verificar: Cambios persistidos correctamente

### Prueba 4: Inventario con Observaciones (Reproceso/Devolución) ✓
1. Crear nuevo documento
2. Agregar 3 dosis del mismo producto (ej: Stem Xelle 25M)
3. En la 2da fila, clic en botón "X" > Seleccionar "Reproceso/Dev" > "Reproceso"
4. Verificar:
   - Fila se marca con fondo rojo (#fdedec)
   - Campo Observaciones = "Reproceso"
   - **Inventario NO cuenta esa fila** (debe mostrar 2 viales, no 3)
5. Guardar documento
6. Recargar y verificar que la fila marcada sigue excluida del inventario

### Prueba 5: Valores de Inventario Manuales ✓
1. Crear nuevo documento con 2 dosis de Stem Xelle 10M
2. Inventario automático muestra: `20x10E6` células
3. Cambiar manualmente el campo "Células > Stem Xelle" a: `30M`
4. Verificar:
   - El valor se mantiene como `30x10E6` (no se sobrescribe)
   - Total de células se actualiza a 30x10E6
5. Guardar documento
6. Recargar y verificar que el valor manual se mantiene

### Prueba 6: Presentación "Especial" ✓
1. Agregar dosis con Producto: `Stem Xelle`
2. Seleccionar Presentación: `Especial`
3. Verificar: Aparece input de texto "¿Cuál?"
4. Escribir: `75M` en el campo especial
5. Verificar:
   - Campo "No. Células" se completa con `75M`
   - Inventario se actualiza correctamente
6. Guardar y recargar
7. Verificar: Presentación "Especial" y valor "75M" se mantienen

### Prueba 7: Persistencia de localStorage Adicional ✓
El FO-LC-24 tiene una persistencia adicional en localStorage para resúmenes diarios:
1. Crear documento con Fecha Operación: `2026-03-25`
2. Agregar varias dosis
3. Guardar
4. Abrir DevTools > Application > Local Storage
5. Verificar claves creadas:
   - ✅ `xelle_fo_lc_24_daily_2026-03-25`
   - ✅ `xelle_fo_lc_24_daily_2026-03-25_TEST001`
   - ✅ `xelle_fo_lc_24_daily_latest`
   - ✅ `xelle_fo_lc_24_records` (array de todos los registros)

---

## 🔍 Campos que se Guardan

### Campos Simples (input/select/textarea)
| Campo | ID | Clase | ¿Se guarda? |
|-------|----|----|-------------|
| Folio | `reg-24` | `generate-barcode cedit` | ✅ |
| Fecha Registro | `reg-24-date` | `cedit` | ✅ |
| Fecha Operación | `fecha_operacion` | `cedit` | ✅ |
| Tot. Stem Xelle | `tot-stem` | `cedit` | ✅ (readonly, recalculado) |
| Tot. Hybrid Xelle | `tot-hybrid` | `cedit` | ✅ (readonly, recalculado) |
| Tot. Stem Ortho | `tot-stem-ortho` | `cedit` | ✅ (readonly, recalculado) |
| Tot. Hybrid Ortho | `tot-hybrid-ortho` | `cedit` | ✅ (readonly, recalculado) |
| Tot. Exosomas | `tot-exo` | `cedit` | ✅ (readonly, recalculado) |
| Total Viales | `grand-tot-vials` | `cedit` | ✅ |
| Células Stem Xelle | `cell-stem` | `cedit` | ✅ |
| Células Hybrid Xelle | `cell-hybrid` | `cedit` | ✅ |
| Células Stem Ortho | `cell-stem-ortho` | `cedit` | ✅ |
| Células Hybrid Ortho | `cell-hybrid-ortho` | `cedit` | ✅ |
| Células Exosomas | `cell-exo` | `cedit` | ✅ |
| Total Células | `grand-tot-cells` | `cedit` | ✅ |
| Obs. Generales | `obs_dia` | `cedit` | ✅ |
| Firma Elaboró | `sig-elaboro-24` | `cedit` | ✅ **NUEVO** |
| Firma Revisó | `sig-reviso-24` | `cedit` | ✅ **NUEVO** |
| Firma Autorizó | `sig-autorizo-24` | `cedit` | ✅ **NUEVO** |

### Tablas Dinámicas (getCustomData / loadCustomData)
| Tabla | Guardado en | Campos |
|-------|-------------|---------|
| **Insumos** | `data.t_insumos_24` | ID Insumo, Insumo, Marca, Lote, Caducidad |
| **Dosis** | `data.t_dosis` | Producto, Origen, Caducidad, Lote, Presentación, Presentación Especial, No. Células, Cód. Venta, Código Único, Observaciones |

### Persistencia Adicional en localStorage
```javascript
// Resumen diario por fecha
localStorage.getItem('xelle_fo_lc_24_daily_2026-03-25')

// Resumen por fecha + folio
localStorage.getItem('xelle_fo_lc_24_daily_2026-03-25_TEST001')

// Último guardado
localStorage.getItem('xelle_fo_lc_24_daily_latest')

// Registro histórico de todos los folios
localStorage.getItem('xelle_fo_lc_24_records')
```

---

## 🎯 Resultado Final

### Antes de las Correcciones ❌
- Fecha de registro NO se guardaba
- Firmas NO se guardaban
- Inventario podía descalcularse al cargar datos con valores manuales

### Después de las Correcciones ✅
- **Todos** los campos se guardan correctamente
- **Todos** los campos se cargan correctamente
- Inventario se recalcula automáticamente
- Valores manuales se respetan
- Sistema de persistencia adicional en localStorage funciona
- Resumen diario agrupado por producto/presentación

---

## 📝 Notas Técnicas

### Flujo de Guardado
```
1. Usuario hace clic en "Guardar"
2. saveForm() → App.Universal.saveData()
3. Validación de código de barcode (obligatorio)
4. collectData() → Recoge todos los campos con clase 'cedit'
5. FO_LC_24.getCustomData() → Recoge tablas dinámicas
   - t_insumos_24 (array de arrays)
   - t_dosis (array de objetos)
6. persistInstance() → Envía a backend
7. persistDailySummary() → Guarda en localStorage
8. Mostrar mensaje de éxito
```

### Flujo de Carga
```
1. Página carga con ?instance=FO-LC-24-TEST001
2. App.Universal.loadData()
3. Fetch desde backend: GET /api/format-instances/FO-LC-24-TEST001
4. applyDataToForm() → Restaura campos simples
5. FO_LC_24.loadCustomData() → Restaura tablas
   - Resetea flags de manual override
   - Reconstruye tabla de insumos
   - Reconstruye tabla de dosis
   - Llama a calcInventory()
   - Llama a updateGrandTotalCellsFromSummary()
6. Usuario ve formulario completo
```

---

## 🔧 Mantenimiento

Si en el futuro se agregan nuevos campos al formulario:

1. **Campo Simple**: Agregar atributo `class="cedit"` y preferentemente un `id` único
2. **Campo en Tabla Dinámica**: Actualizar `getCustomData()` y `loadCustomData()` para incluir el nuevo campo
3. **Campo Calculado**: Marcar como `readonly` y recalcular en `calcInventory()`

---

**Fecha de Prueba**: 25 de marzo de 2026  
**Estado**: ✅ Todas las correcciones aplicadas  
**Formulario**: FO-LC-24.html (Dosificación)  
**Script**: format-app.js (v10.0)
