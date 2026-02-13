# Script de migración de archivos de formatos
# Este script mueve los archivos de formatos a la nueva estructura

$ErrorActionPreference = "Stop"

Write-Host "=== Iniciando migración de formatos ===" -ForegroundColor Cyan

# Definir rutas base
$rootDir = Split-Path $PSScriptRoot -Parent
$oldFormatsDir = Join-Path $rootDir "formats"
$newFormatsDir = Join-Path $rootDir "src\frontend\formats"
$newAssetsJsFormats = Join-Path $rootDir "src\frontend\assets\js\formats"
$newAssetsCssFormats = Join-Path $rootDir "src\frontend\assets\css\formats"

# Crear directorios si no existen
Write-Host "`nCreando directorios de destino..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $newFormatsDir | Out-Null
New-Item -ItemType Directory -Force -Path $newAssetsJsFormats | Out-Null
New-Item -ItemType Directory -Force -Path $newAssetsCssFormats | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $newFormatsDir "offline") | Out-Null
Write-Host "✓ Directorios creados" -ForegroundColor Green

# Función para actualizar referencias en archivos HTML
function Update-HtmlReferences {
    param(
        [string]$FilePath,
        [bool]$IsOffline
    )
    
    $content = Get-Content $FilePath -Raw -Encoding UTF8
    
    # Actualizar referencias a CSS
    if ($IsOffline) {
        $content = $content -replace 'format-styles-OffLine\.css', '../assets/css/formats/styles-offline.css'
    } else {
        $content = $content -replace 'href="[^"]*format-styles\.css"', 'href="../assets/css/formats/styles.css"'
    }
    
    # Actualizar referencias a JS
    if ($IsOffline) {
        $content = $content -replace 'format-app-OffLine\.js', '../assets/js/formats/format-app-offline.js'
    } else {
        $content = $content -replace 'src="[^"]*format-app\.js"', 'src="../assets/js/formats/format-app.js"'
        $content = $content -replace 'src="[^"]*format-app-comercial\.js"', 'src="../assets/js/formats/format-app-comercial.js"'
    }
    
    # Actualizar referencias a jQuery y jszip (ahora en vendor)
    $content = $content -replace 'src="[^"]*jquery-3\.7\.1\.min\.js"', 'src="../assets/js/vendor/jquery-3.7.1.min.js"'
    $content = $content -replace 'src="[^"]*jszip\.min\.js"', 'src="../assets/js/vendor/jszip.min.js"'
    
    # Guardar cambios
    [System.IO.File]::WriteAllText($FilePath, $content, [System.Text.Encoding]::UTF8)
}

# Copiar archivos de formatos HTML (online)
Write-Host "`nCopiando archivos HTML de formatos (online)..." -ForegroundColor Yellow
$htmlFiles = Get-ChildItem -Path $oldFormatsDir -Filter "*.html" -File
$copiedCount = 0

foreach ($file in $htmlFiles) {
    $destPath = Join-Path $newFormatsDir $file.Name
    Copy-Item -Path $file.FullName -Destination $destPath -Force
    Update-HtmlReferences -FilePath $destPath -IsOffline $false
    $copiedCount++
    Write-Host "  ✓ $($file.Name)" -ForegroundColor Gray
}
Write-Host "✓ $copiedCount archivos HTML copiados y actualizados" -ForegroundColor Green

# Copiar archivos de formatos HTML (offline)
Write-Host "`nCopiando archivos HTML de formatos (offline)..." -ForegroundColor Yellow
$offlineDir = Join-Path $oldFormatsDir "formats-offLine"
if (Test-Path $offlineDir) {
    $offlineFiles = Get-ChildItem -Path $offlineDir -Filter "*.html" -File
    $offlineCopiedCount = 0
    
    foreach ($file in $offlineFiles) {
        $destPath = Join-Path (Join-Path $newFormatsDir "offline") $file.Name
        Copy-Item -Path $file.FullName -Destination $destPath -Force
        Update-HtmlReferences -FilePath $destPath -IsOffline $true
        $offlineCopiedCount++
        Write-Host "  ✓ $($file.Name)" -ForegroundColor Gray
    }
    Write-Host "✓ $offlineCopiedCount archivos HTML offline copiados y actualizados" -ForegroundColor Green
} else {
    Write-Host "⚠ No se encontró directorio formats-offLine" -ForegroundColor Yellow
}

# Copiar y renombrar archivos JavaScript de formatos
Write-Host "`nCopiando archivos JavaScript de formatos..." -ForegroundColor Yellow

# format-app.js
$formatAppJs = Join-Path $oldFormatsDir "format-app.js"
if (Test-Path $formatAppJs) {
    Copy-Item -Path $formatAppJs -Destination (Join-Path $newAssetsJsFormats "format-app.js") -Force
    Write-Host "  ✓ format-app.js" -ForegroundColor Gray
}

# format-app-comercial.js
$formatAppComercialJs = Join-Path $oldFormatsDir "format-app-comercial.js"
if (Test-Path $formatAppComercialJs) {
    Copy-Item -Path $formatAppComercialJs -Destination (Join-Path $newAssetsJsFormats "format-app-comercial.js") -Force
    Write-Host "  ✓ format-app-comercial.js" -ForegroundColor Gray
}

# format-app-OffLine.js
$formatAppOfflineJs = Join-Path $offlineDir "format-app-OffLine.js"
if (Test-Path $formatAppOfflineJs) {
    Copy-Item -Path $formatAppOfflineJs -Destination (Join-Path $newAssetsJsFormats "format-app-offline.js") -Force
    Write-Host "  ✓ format-app-offline.js" -ForegroundColor Gray
}

Write-Host "✓ Archivos JavaScript copiados" -ForegroundColor Green

# Copiar archivos CSS de formatos
Write-Host "`nCopiando archivos CSS de formatos..." -ForegroundColor Yellow

# Buscar archivos CSS en la carpeta formats
$formatsCssDir = Join-Path $oldFormatsDir "formats-offLine"
$formatStylesCss = Join-Path $formatsCssDir "format-styles-OffLine.css"

if (Test-Path $formatStylesCss) {
    Copy-Item -Path $formatStylesCss -Destination (Join-Path $newAssetsCssFormats "styles-offline.css") -Force
    Write-Host "  ✓ styles-offline.css" -ForegroundColor Gray
}

# También copiar el CSS de la carpeta formats si existe
$mainFormatStylesCss = Join-Path $oldFormatsDir "format-styles.css"
if (Test-Path $mainFormatStylesCss) {
    Copy-Item -Path $mainFormatStylesCss -Destination (Join-Path $newAssetsCssFormats "styles.css") -Force
    Write-Host "  ✓ styles.css" -ForegroundColor Gray
} else {
    # Buscar en subcarpeta css
    $cssSubDir = Join-Path $oldFormatsDir "css"
    if (Test-Path $cssSubDir) {
        $cssFiles = Get-ChildItem -Path $cssSubDir -Filter "*.css" -File
        foreach ($cssFile in $cssFiles) {
            Copy-Item -Path $cssFile.FullName -Destination (Join-Path $newAssetsCssFormats $cssFile.Name) -Force
            Write-Host "  ✓ $($cssFile.Name)" -ForegroundColor Gray
        }
    }
}

Write-Host "✓ Archivos CSS copiados" -ForegroundColor Green

# Crear archivo de resumen
Write-Host "`nCreando archivo de resumen..." -ForegroundColor Yellow
$summaryPath = Join-Path $rootDir "MIGRATION-SUMMARY.txt"
$summary = @"
=== RESUMEN DE MIGRACIÓN DE FORMATOS ===
Fecha: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

ARCHIVOS MIGRADOS:
- $copiedCount archivos HTML de formatos (online)
- $offlineCopiedCount archivos HTML de formatos (offline)
- Archivos JavaScript de formatos
- Archivos CSS de formatos

NUEVA ESTRUCTURA:
src/frontend/
  ├── formats/
  │   ├── FO-*.html (archivos de formatos online)
  │   └── offline/
  │       └── FO-*-OffLine.html (archivos offline)
  └── assets/
      ├── css/
      │   └── formats/
      │       ├── styles.css
      │       └── styles-offline.css
      └── js/
          └── formats/
              ├── format-app.js
              ├── format-app-comercial.js
              └── format-app-offline.js

CAMBIOS REALIZADOS EN HTML:
✓ Referencias a CSS actualizadas a ../assets/css/formats/
✓ Referencias a JS actualizadas a ../assets/js/formats/
✓ Referencias a jQuery/JSZip actualizadas a ../assets/js/vendor/

PRÓXIMOS PASOS:
1. Verificar que los formatos se carguen correctamente
2. Probar la funcionalidad de cada formato
3. Eliminar archivos antiguos si todo funciona correctamente
4. Actualizar nginx.conf si es necesario

ARCHIVOS ORIGINALES:
Los archivos originales permanecen en: formats/
Puedes eliminarlos después de verificar que todo funciona.
"@

[System.IO.File]::WriteAllText($summaryPath, $summary, [System.Text.Encoding]::UTF8)
Write-Host "✓ Resumen guardado en MIGRATION-SUMMARY.txt" -ForegroundColor Green

Write-Host "`n=== Migración completada exitosamente ===" -ForegroundColor Green
Write-Host "`nRevisa MIGRATION-SUMMARY.txt para más detalles" -ForegroundColor Cyan
Write-Host "Los archivos originales en 'formats/' no fueron eliminados por seguridad" -ForegroundColor Yellow
Write-Host "Puedes eliminarlos después de verificar que todo funciona correctamente`n" -ForegroundColor Yellow
