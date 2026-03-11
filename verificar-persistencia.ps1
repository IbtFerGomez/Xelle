# Script para verificar persistencia en todos los formatos
$formatFiles = Get-ChildItem -Path "src\frontend\formats\FO-*.html" -Recurse | Where-Object { 
    $_.Name -notlike "*OffLine*" -and $_.DirectoryName -notlike "*offLine*" 
}

Write-Host "`n=== VERIFICACIÓN DE PERSISTENCIA EN FORMATOS ===" -ForegroundColor Cyan
Write-Host "Total de formatos a verificar: $($formatFiles.Count)`n" -ForegroundColor Yellow

$report = @{
    ConPersistenciaCompleta = @()
    SinFormatAppJS          = @()
    SinGenerateBarcode      = @()
    SinBotones              = @()
}

foreach ($file in $formatFiles) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    
    $tieneFormatApp = ($content -match "format-app\.js") -or ($content -match "format-app-operaciones\.js")
    $tieneSweetAlert = $content -match "sweetalert2"
    $tieneBarcode = $content -match "generate-barcode"
    $tieneDataPrefix = $content -match "data-prefix"
    $tieneSaveForm = $content -match "saveForm\(\)"
    $tienePrint = ($content -match "window\.print\(\)") -or ($content -match "printForm\(\)")
    
    $persistenciaCompleta = $tieneFormatApp -and $tieneSweetAlert -and $tieneBarcode -and $tieneDataPrefix -and $tieneSaveForm -and $tienePrint
    
    if ($persistenciaCompleta) {
        $report.ConPersistenciaCompleta += $file.Name
        Write-Host "✅ $($file.Name)" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  $($file.Name)" -ForegroundColor Yellow
        
        if (-not $tieneFormatApp) {
            $report.SinFormatAppJS += $file.Name
            Write-Host "   - Falta: format-app.js" -ForegroundColor Red
        }
        if (-not $tieneBarcode) {
            $report.SinGenerateBarcode += $file.Name
            Write-Host "   - Falta: generate-barcode class" -ForegroundColor Red
        }
        if (-not $tieneDataPrefix) {
            Write-Host "   - Falta: data-prefix attribute" -ForegroundColor Red
        }
        if (-not $tieneSaveForm) {
            $report.SinBotones += $file.Name
            Write-Host "   - Falta: botón Guardar (saveForm)" -ForegroundColor Red
        }
        if (-not $tieneSweetAlert) {
            Write-Host "   - Falta: SweetAlert2" -ForegroundColor Red
        }
    }
}

Write-Host "`n=== RESUMEN ===" -ForegroundColor Cyan
Write-Host "✅ Con persistencia completa: $($report.ConPersistenciaCompleta.Count)" -ForegroundColor Green
Write-Host "⚠️  Sin format-app.js: $($report.SinFormatAppJS.Count)" -ForegroundColor Yellow
Write-Host "⚠️  Sin generate-barcode: $($report.SinGenerateBarcode.Count)" -ForegroundColor Yellow
Write-Host "⚠️  Sin botones guardar: $($report.SinBotones.Count)" -ForegroundColor Yellow

if ($report.SinFormatAppJS.Count -gt 0) {
    Write-Host "`nFormatos SIN format-app.js:" -ForegroundColor Red
    $report.SinFormatAppJS | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
}

if ($report.SinGenerateBarcode.Count -gt 0) {
    Write-Host "`nFormatos SIN campo de barcode:" -ForegroundColor Red
    $report.SinGenerateBarcode | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
}

Write-Host "`n✅ VERIFICACIÓN COMPLETADA" -ForegroundColor Green
