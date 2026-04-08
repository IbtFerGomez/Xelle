# Script para agregar campo de Cumplimiento normativo a TODOS los formatos
# Fecha: 2 de Abril, 2026
# Objetivo: Corregir metadata en formatos online y offline segun estandares normativos

$baseDir = "c:\Users\WINDOWS\Desktop\DriveProgra\Xelle\src\frontend\formats"

# Definir mapeo de normativas por categoria
$normativas = @{
    "FO-LC"  = "NOM-241-SSA1 / NOM-087-ECOL"
    "FO-OP"  = "GMP / ISO 13485"
    "FO-QA"  = "ISO 9001 / ISO 13485"
    "FO-SGC" = "ISO 9001"
    "FO-LG"  = "NOM-241-SSA1"
    "FO-AL"  = "ISO 9001"
    "IT-OP"  = "GMP / ISO 13485"
}

$archivosCorregidos = 0
$archivosError = 0
$archivosSinCambios = 0

Write-Host "=== INICIANDO CORRECCION DE METADATA - CAMPO CUMPLIMIENTO ===" -ForegroundColor Cyan
Write-Host ""

# Procesar archivos ONLINE
Write-Host "[FASE 1] Procesando formatos ONLINE..." -ForegroundColor Yellow
$archivosOnline = Get-ChildItem "$baseDir\*.html" -File | Where-Object { $_.Name -match '^(FO-|IT-)' }

foreach ($archivo in $archivosOnline) {
    $contenido = Get-Content $archivo.FullName -Raw -Encoding UTF8
    
    # Detectar categoria del formato
    $categoria = $null
    foreach ($key in $normativas.Keys) {
        if ($archivo.Name -like "$key-*") {
            $categoria = $key
            break
        }
    }
    
    if (-not $categoria) {
        Write-Host "  [ ? ] $($archivo.Name) - Categoria no reconocida, omitido" -ForegroundColor Gray
        $archivosSinCambios++
        continue
    }
    
    $normativa = $normativas[$categoria]
    
    # Buscar patron actual de metadata SIN campo Cumplimiento
    $patronActual = '(class="metadata">Código: [A-Z0-9-]+ \| Versión: [\d\.]+ \| Vigencia: [A-Z]+ \d{4}) \| Página:'
    
    if ($contenido -match $patronActual) {
        # Insertar campo Cumplimiento antes de "| Página:"
        $nuevoContenido = $contenido -replace $patronActual, "`$1 | Cumplimiento: $normativa | Página:"
        
        if ($nuevoContenido -ne $contenido) {
            Set-Content $archivo.FullName -Value $nuevoContenido -Encoding UTF8 -NoNewline
            Write-Host "  [OK] $($archivo.Name) - Agregado: $normativa" -ForegroundColor Green
            $archivosCorregidos++
        }
        else {
            Write-Host "  [--] $($archivo.Name) - Sin cambios" -ForegroundColor Gray
            $archivosSinCambios++
        }
    }
    elseif ($contenido -match 'Cumplimiento:') {
        Write-Host "  [OK] $($archivo.Name) - Ya tiene campo Cumplimiento" -ForegroundColor DarkGreen
        $archivosSinCambios++
    }
    else {
        Write-Host "  [!!] $($archivo.Name) - Patron no encontrado" -ForegroundColor Red
        $archivosError++
    }
}

Write-Host ""

# Procesar archivos OFFLINE
Write-Host "[FASE 2] Procesando formatos OFFLINE..." -ForegroundColor Yellow
$archivosOffline = Get-ChildItem "$baseDir\offLine\*-OffLine.html" -File | Where-Object { $_.Name -match '^(FO-|IT-)' }

foreach ($archivo in $archivosOffline) {
    $contenido = Get-Content $archivo.FullName -Raw -Encoding UTF8
    
    # Detectar categoria del formato
    $categoria = $null
    foreach ($key in $normativas.Keys) {
        if ($archivo.Name -like "$key-*") {
            $categoria = $key
            break
        }
    }
    
    if (-not $categoria) {
        Write-Host "  [ ? ] $($archivo.Name) - Categoria no reconocida, omitido" -ForegroundColor Gray
        $archivosSinCambios++
        continue
    }
    
    $normativa = $normativas[$categoria]
    
    # Buscar patron actual de metadata SIN campo Cumplimiento
    $patronActual = '(class="metadata">Código: [A-Z0-9-]+ \| Versión: [\d\.]+ \| Vigencia: [A-Z]+ \d{4}) \| Página:'
    
    if ($contenido -match $patronActual) {
        # Insertar campo Cumplimiento antes de "| Página:"
        $nuevoContenido = $contenido -replace $patronActual, "`$1 | Cumplimiento: $normativa | Página:"
        
        if ($nuevoContenido -ne $contenido) {
            Set-Content $archivo.FullName -Value $nuevoContenido -Encoding UTF8 -NoNewline
            Write-Host "  [OK] $($archivo.Name) - Agregado: $normativa" -ForegroundColor Green
            $archivosCorregidos++
        }
        else {
            Write-Host "  [--] $($archivo.Name) - Sin cambios" -ForegroundColor Gray
            $archivosSinCambios++
        }
    }
    elseif ($contenido -match 'Cumplimiento:') {
        Write-Host "  [OK] $($archivo.Name) - Ya tiene campo Cumplimiento" -ForegroundColor DarkGreen
        $archivosSinCambios++
    }
    else {
        Write-Host "  [!!] $($archivo.Name) - Patron no encontrado" -ForegroundColor Red
        $archivosError++
    }
}

Write-Host ""
Write-Host "=== RESUMEN DE EJECUCION ===" -ForegroundColor Cyan
Write-Host "Archivos corregidos:     $archivosCorregidos" -ForegroundColor Green
Write-Host "Archivos sin cambios:    $archivosSinCambios" -ForegroundColor Gray
Write-Host "Archivos con error:      $archivosError" -ForegroundColor Red
Write-Host ""
Write-Host "PROCESO COMPLETADO" -ForegroundColor Cyan
