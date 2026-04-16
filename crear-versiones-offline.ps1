# Script para crear versiones offline de formatos HTML
# Convierte formatos HTML con referencias externas a versiones offline con estilos y scripts inline

$formatsPath = "src\frontend\formats"
$offlinePath = "$formatsPath\offLine"

# Leer archivos de recursos
$cssContent = Get-Content "$formatsPath\format-styles.css" -Raw -Encoding UTF8
$cssOperacionesContent = Get-Content "$formatsPath\format-styles-operaciones.css" -Raw -Encoding UTF8
$jsContent = Get-Content "$formatsPath\format-app.js" -Raw -Encoding UTF8
$jsOperacionesContent = Get-Content "$formatsPath\format-app-operaciones.js" -Raw -Encoding UTF8
$jsBarcodeContent = Get-Content "$offlinePath\JsBarcode.all.min.js" -Raw -Encoding UTF8

# CSS Offline específico (más compacto)
$cssOfflineContent = Get-Content "$offlinePath\format-styles-OffLine.css" -Raw -Encoding UTF8

# Lista de formatos que necesitan versión offline
$formatosFaltantes = @(
    "FO-LC-32-B.html",
    "FO-OP-40-B.html",
    "FO-OP-56.html",
    "FO-OP-57.html",
    "FO-OP-58.html",
    "FO-OP-59.html",
    "FO-OP-60.html",
    "FO-QA-06.html",
    "FO-QA-11.html",
    "FO-SGC-04.html",
    "FO-SGC-I.html",
    "FO-SGC-M.html"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CREADOR DE VERSIONES OFFLINE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$exitosos = 0
$errores = 0

foreach ($formato in $formatosFaltantes) {
    $archivoOriginal = Join-Path $formatsPath $formato
    $nombreOffline = $formato -replace '\.html$', '-OffLine.html'
    $archivoOffline = Join-Path $offlinePath $nombreOffline
    
    Write-Host "Procesando: $formato" -ForegroundColor Yellow
    
    if (-not (Test-Path $archivoOriginal)) {
        Write-Host "  ❌ ERROR: Archivo original no existe" -ForegroundColor Red
        $errores++
        continue
    }
    
    if (Test-Path $archivoOffline) {
        Write-Host "  ⚠️  ADVERTENCIA: Versión offline ya existe, se sobrescribirá" -ForegroundColor Magenta
    }
    
    try {
        # Leer contenido original
        $contenido = Get-Content $archivoOriginal -Raw -Encoding UTF8
        
        # Determinar qué CSS y JS usa
        $usaOperaciones = $contenido -match 'format-styles-operaciones\.css'
        $usaJsBarcode = $contenido -match 'jsbarcode'
        
        $cssAUsar = if ($usaOperaciones) { $cssOperacionesContent } else { $cssOfflineContent }
        $jsAUsar = if ($usaOperaciones) { $jsOperacionesContent } else { $jsContent }
        
        # Modificar título para agregar "(Offline)"
        $contenido = $contenido -replace '<title>(.*?)</title>', '<title>$1 (Offline)</title>'
        
        # Reemplazar referencia a CSS con estilos inline
        $estilosInline = @"
<style>
        /* ==========================================================================
           ESTILOS COMPLETOS INLINE - VERSION OFFLINE
           ========================================================================== */

$cssAUsar
    </style>
"@
        
        $contenido = $contenido -replace '<link rel="stylesheet" href="format-styles(-operaciones)?\.css">', $estilosInline
        
        # Reemplazar referencia a JsBarcode
        if ($usaJsBarcode) {
            $jsBarcodeInline = @"
<script>
        /* JsBarcode Library */
$jsBarcodeContent
    </script>
"@
            $contenido = $contenido -replace '<script src="https://cdn\.jsdelivr\.net/npm/jsbarcode@[^"]+"></script>', $jsBarcodeInline
        }
        
        # Reemplazar referencia a format-app.js con script inline
        $scriptInline = @"
<script>
        /* ==========================================================================
           FUNCIONES INLINE - VERSION OFFLINE
           ========================================================================== */

$jsAUsar
    </script>
"@
        
        $contenido = $contenido -replace '<script src="format-app(-operaciones)?\.js"></script>', $scriptInline
        
        # Guardar archivo offline
        $contenido | Out-File -FilePath $archivoOffline -Encoding UTF8 -NoNewline
        
        Write-Host "  ✅ Creado exitosamente: $nombreOffline" -ForegroundColor Green
        $exitosos++
        
    }
    catch {
        Write-Host "  ❌ ERROR al procesar: $_" -ForegroundColor Red
        $errores++
    }
    
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUMEN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Exitosos: $exitosos" -ForegroundColor Green
Write-Host "❌ Errores: $errores" -ForegroundColor Red
Write-Host ""
Write-Host "Proceso completado!" -ForegroundColor Cyan
