# Sistema de Persistencia - Xelle

## Descripción General

El sistema de persistencia de Xelle permite guardar y recuperar datos de formatos de manera robusta y eficiente, utilizando el código de barcode como identificador único e irrepetible para cada documento.

## Arquitectura

### Backend (Java/Spring Boot)
- **Base de datos**: PostgreSQL
- **ORM**: JPA/Hibernate
- **Tabla principal**: `format_instances`

#### Entidad: FormatInstanceEntity

```java
@Entity
@Table(name = "format_instances")
public class FormatInstanceEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "unique_code", nullable = false, unique = true)
    private String uniqueCode;  // ← Código de barcode (único e irrepetible)
    
    @Column(name = "format_type", nullable = false)
    private String formatType;  // Ej: FO-LC-12, FO-OP-15
    
    @Column(name = "data_payload", columnDefinition = "text")
    private String dataPayload;  // JSON con todos los campos del formato
    
    @Column(nullable = false)
    private String status;  // DRAFT, COMPLETED, etc.
    
    @Column(name = "created_by")
    private Long createdBy;
    
    @Column(name = "updated_by")
    private Long updatedBy;
    
    @Column(name = "created_at")
    private OffsetDateTime createdAt;
    
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
```

#### Endpoints REST

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/format-instances` | Crear nueva instancia de formato |
| GET | `/api/format-instances/{uniqueCode}` | Obtener formato por código de barcode |
| PUT | `/api/format-instances/{uniqueCode}` | Actualizar formato existente |
| GET | `/api/format-instances` | Listar todos los formatos |
| DELETE | `/api/format-instances/{uniqueCode}` | Eliminar formato (admin) |

### Frontend (JavaScript)

#### Identificación Única de Campos

Cada campo del formulario (input, select, textarea, checkbox) se identifica mediante:

1. **ID del elemento** (prioridad 1)
2. **Name del elemento** (prioridad 2)
3. **Índice posicional** (fallback)

**Asignación automática de IDs**: El sistema automáticamente asigna IDs únicos a campos que no los tienen al cargar el formulario, usando el patrón:
- `{formato}_{name}` si tiene atributo name
- `{formato}_{placeholder}_{index}` si tiene placeholder
- `{formato}_{tipo}_{index}` en caso contrario

Ejemplo:
```javascript
// Campo sin ID:
<input class="cedit" placeholder="Nombre del paciente">

// ID asignado automáticamente:
fo_lc_12_nombre_del_paciente_5
```

## Flujo de Trabajo

### 1. Documento Nuevo (Nueva Tarjeta)

Cuando el usuario hace clic en una tarjeta de formato desde el dashboard:

```
Dashboard → Formato (con ?new=1) → Documento en blanco
```

- No se cargan datos previos
- Formulario limpio para ingresar nueva información
- El código de barcode debe ser ingresado manualmente

### 2. Guardar Documento

**Requisito obligatorio**: Debe existir un código de barcode antes de guardar.

```javascript
// Flujo de guardado
Usuario ingresa código → Presiona "Guardar" → Validación → Guardado
```

**Validación**:
- ✅ Si el código de barcode existe → Actualiza el documento (sobrescribe campos)
- ✅ Si el código NO existe → Crea nuevo documento
- ❌ Si NO hay código de barcode → Error: "Debe ingresar un código de folio único"

**Campos que se sobrescriben**: TODOS excepto el código de barcode único

### 3. Cargar Documento Existente

Para cargar un documento guardado:

```
Dashboard → Lista de documentos → Click en documento → Formato cargado con datos
```

Alternativamente, acceder directamente con URL:
```
/formats/FO-LC-12.html?instance=FO-LC-12-001234
```

### 4. Imprimir Documento

El botón "Imprimir" mantiene su funcionalidad original:
- Imprime el documento con todos los datos actuales
- No requiere guardado previo
- Utiliza CSS de impresión para ocultar elementos no imprimibles

## Botones de Control

### Botón Guardar
```html
<button class="btn btn-success" onclick="saveForm()">Guardar</button>
```

**Funcionalidad**:
1. Valida que exista código de barcode
2. Recolecta todos los campos del formulario
3. Envía al servidor (crea o actualiza)
4. Muestra mensaje de confirmación
5. Actualiza URL con el código de instancia

### Botón Imprimir
```html
<button class="btn btn-primary" onclick="window.print()">Imprimir</button>
```

**Funcionalidad**:
- Abre diálogo de impresión del navegador
- Aplica estilos específicos de impresión
- No modifica los datos

### ~~Botón Limpiar~~ (REMOVIDO)

Este botón ha sido eliminado de todos los formatos según los nuevos requerimientos.

## Estructura de Datos

### data_payload (JSON)

El campo `data_payload` en la base de datos almacena un JSON con todos los campos del formato:

```json
{
  "id:reg-12": "000123",
  "id:registry-date": "2026-03-10",
  "idx:5": "Material X123",
  "idx:6": "Producción",
  "idx:7": "Se evaluó que no afecta...",
  "idx:8": "NO",
  "idx:9": "",
  "idx:10": "NO"
}
```

**Características**:
- Estructura flexible (schema-less)
- Permite agregar/modificar campos sin migrar BD
- Cada formato puede tener estructura diferente
- Fácil de serializar/deserializar

## Código de Barcode

### Características

- **Único e irrepetible**: No pueden existir dos documentos con el mismo código
- **Formato**: `{PREFIX}-{NÚMERO}` (Ej: `FO-LC-12-001234`)
- **Validación**: El backend rechaza códigos duplicados
- **Inmutable**: Una vez guardado, el código no puede cambiar

### Generación

El usuario ingresa manualmente el número en el campo de folio:

```html
<input type="text" 
       id="reg-12" 
       class="registry-input generate-barcode" 
       data-target="barcode-12"
       data-prefix="FO-LC-12-" 
       placeholder="000">
```

El sistema automáticamente:
1. Añade el prefijo configurado
2. Genera el código de barras visual (SVG)
3. Usa este código como identificador único

## Mejores Prácticas

### Para Desarrolladores

1. **Siempre definir IDs únicos** en campos importantes:
   ```html
   <input id="patient-name" class="cedit">
   ```

2. **Usar nombres descriptivos** para facilitar mantenimiento:
   ```html
   <input name="diagnosis-date" type="date" class="cedit">
   ```

3. **No confiar solo en índices** ya que pueden cambiar si se modifica el HTML

4. **Validar códigos de barcode** antes de operaciones críticas

### Para Usuarios

1. **Ingresar código de folio** antes de guardar
2. **No reutilizar códigos** de documentos anteriores
3. **Guardar frecuentemente** para no perder datos
4. **Verificar código único** al crear documentos nuevos

## Seguridad y Auditoría

### Auditoría de Cambios

Cada operación se registra en `audit_logs`:

```java
@Entity
@Table(name = "audit_logs")
public class AuditLogEntity {
    private String action;        // INSTANCE_CREATE, INSTANCE_UPDATE
    private String entityType;    // FORMAT_INSTANCE
    private String entityKey;     // FO-LC-12-001234
    private Long userId;          // ID del usuario
    private String username;      // Nombre del usuario
    private OffsetDateTime createdAt;
    private String details;       // JSON con detalles adicionales
}
```

### Control de Acceso

- Operaciones de lectura: Todos los usuarios
- Operaciones de escritura: Usuarios autenticados
- Operaciones de eliminación: Solo administradores

## Configuración

### Variables de Entorno

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST:postgres}:${DB_PORT:5432}/${DB_NAME:xelle_db}
    username: ${DB_USER:postgres}
    password: ${DB_PASSWORD:123}
  jpa:
    hibernate:
      ddl-auto: update  # Crea/actualiza tablas automáticamente
```

### Frontend

```javascript
// format-app.js
const API_URL = '/api';  // Base URL para endpoints REST
```

## Mantenimiento

### Backup de Base de Datos

Recomendación: Backup diario de PostgreSQL

```bash
pg_dump -U postgres xelle_db > backup_$(date +%Y%m%d).sql
```

### Limpieza de Datos Antiguos

Considerar implementar políticas de retención:
- Borradores sin actualizar en 30+ días
- Documentos archivados después de 1 año

## Resolución de Problemas

### Error: "Código único ya existe"

**Causa**: Intentando crear documento con código duplicado

**Solución**: 
1. Verificar si el documento ya existe
2. Usar un código diferente para el nuevo documento
3. Si necesita modificar existente, cargar y editar en lugar de crear nuevo

### Error: "Debe ingresar un código de folio único"

**Causa**: Intentando guardar sin ingresar código de barcode

**Solución**: Ingresar un número válido en el campo de folio antes de guardar

### Datos no se guardan

**Posibles causas**:
1. No hay conexión con el servidor
2. Usuario no autenticado
3. Error en formato de datos

**Solución**:
1. Verificar conexión de red
2. Verificar sesión activa
3. Revisar consola del navegador para errores

### Campos no se cargan correctamente

**Causa**: IDs o índices han cambiado

**Solución**:
1. Asegurarse de que campos críticos tienen IDs estáticos
2. No reordenar campos sin considerar persistencia
3. Limpiar localStorage si hay conflictos

## Versiones

- **V10.0**: Sistema de persistencia implementado
  - Persistencia por código de barcode único
  - Eliminación de botón "Limpiar"
  - Asignación automática de IDs únicos
  - Documento en blanco al crear nuevo
  - Sobrescritura de campos en actualización

## Soporte

Para problemas o mejoras, contactar al equipo de desarrollo de Xelle Scientific.

---

**Última actualización**: Marzo 2026  
**Versión del documento**: 1.0
