# Script para remover todas las referencias a "Cumplimiento" de los formatos
# Autor: Sistema Automático
# Fecha: 2026-04-03

$ErrorActionPreference = 'Continue'
$archivosModificados = 0

# Obtener todos los archivos HTML en formats y offLine
$archivos = Get-ChildItem -Path "src\frontend\formats" -Filter "*.html" -Recurse -File

Write-Host "Iniciando remoción de referencias a 'Cumplimiento'..." -ForegroundColor Cyan
Write-Host "Total de archivos a procesar: $($archivos.Count)" -ForegroundColor Yellow
Write-Host ""

foreach ($archivo in $archivos) {
    Write-Host "Procesando: $($archivo.Name)" -ForegroundColor Gray
    
    $contenido = Get-Content $archivo.FullName -Raw -Encoding UTF8
    $contenidoOriginal = $contenido
    $modificado = $false
    
    # 1. Eliminar de metadata: | Cumplimiento: [texto] |
    if ($contenido -match '\s*\|\s*Cumplimiento:[^|]+\|') {
        $contenido = $contenido -replace '\s*\|\s*Cumplimiento:[^|]+\|', ' |'
        $modificado = $true
        Write-Host "  ✓ Removida línea de metadata" -ForegroundColor Green
    }
    
    # 2. Eliminar columna de tabla <th>Cumplimiento</th>
    if ($contenido -match '<th[^>]*>\s*Cumplimiento\s*</th>') {
        $contenido = $contenido -replace '<th[^>]*>\s*Cumplimiento\s*</th>\s*', ''
        $modificado = $true
        Write-Host "  ✓ Removido encabezado de tabla" -ForegroundColor Green
    }
    
    # 3. Para FO-SGC-03: eliminar campo cumplimiento del formulario y JavaScript
    if ($archivo.Name -like "*SGC-03*") {
        # Eliminar label y input de cumplimiento
        if ($contenido -match '<label[^>]*>Cumplimiento:</label>') {
            $contenido = $contenido -replace '<label[^>]*>Cumplimiento:</label>\s*<input[^>]*id="(input|edit)-cumplimiento"[^>]*>', ''
            $modificado = $true
            Write-Host "  ✓ Removidos campos de formulario" -ForegroundColor Green
        }
        
        # Eliminar referencias en JavaScript
        if ($contenido -match 'cumplimiento') {
            $contenido = $contenido -replace 'const cumplimiento\s*=\s*document\.getElementById\([^)]+\)\.value;\s*', ''
            $contenido = $contenido -replace ',\s*cumplimiento\s*:', ','
            $contenido = $contenido -replace 'cumplimiento:\s*[^,}]+,?\s*', ''
            $contenido = $contenido -replace '\$\{data\.cumplimiento\}', ''
            $contenido = $contenido -replace 'cells\[5\]\.textContent\.trim\(\)', "''"
            $contenido = $contenido -replace 'cells\[5\]\.textContent\s*=\s*data\.cumplimiento;', ''
            $contenido = $contenido -replace '5=cumplimiento,\s*', ''
            $modificado = $true
            Write-Host "  ✓ Removidas referencias JavaScript" -ForegroundColor Green
        }
    }
    else {
        # Para otros archivos: eliminar celdas <td> con cumplimiento si existen
        if ($contenido -match '<td[^>]*>\s*\$\{data\.cumplimiento\}\s*</td>') {
            $contenido = $contenido -replace '<td[^>]*>\s*\$\{data\.cumplimiento\}\s*</td>\s*', ''
            $modificado = $true
            Write-Host "  ✓ Removidas celdas de datos" -ForegroundColor Green
        }
    }
    
    # 4. Eliminar comentarios que mencionen "Evidencia de cumplimiento"
    if ($contenido -match '<strong>Evidencia de cumplimiento:</strong>') {
        $contenido = $contenido -replace '<strong>Evidencia de cumplimiento:</strong>\s*<input[^>]*>', ''
        $modificado = $true
        Write-Host "  ✓ Removida evidencia de cumplimiento" -ForegroundColor Green
    }
    
    # 5. Limpiar texto "asegurar el cumplimiento" en contenido descriptivo
    if ($contenido -match 'asegurar el cumplimiento') {
        $contenido = $contenido -replace 'asegurar el cumplimiento de las Buenas Prácticas de Fabricación\.', 'asegurar las Buenas Prácticas de Fabricación.'
        $modificado = $true
        Write-Host "  ✓ Limpiado texto descriptivo" -ForegroundColor Green
    }
    
    # 6. Eliminar comentarios CSS sobre cumplimiento
    if ($contenido -match '/\*\s*Estilos específicos para cumplimiento\s*\*/') {
        $contenido = $contenido -replace '/\*\s*Estilos específicos para cumplimiento\s*\*/\s*', ''
        $modificado = $true
        Write-Host "  ✓ Removido comentario CSS" -ForegroundColor Green
    }
    
    # Si hubo modificaciones, guardar el archivo
    if ($modificado -and ($contenido -ne $contenidoOriginal)) {
        Set-Content -Path $archivo.FullName -Value $contenido -Encoding UTF8 -NoNewline
        $archivosModificados++
        Write-Host "  ✅ ARCHIVO MODIFICADO" -ForegroundColor Cyan
    }
    
    Write-Host ""
}

Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Proceso completado" -ForegroundColor Green
Write-Host "Archivos procesados: $($archivos.Count)" -ForegroundColor Yellow
Write-Host "Archivos modificados: $archivosModificados" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan
