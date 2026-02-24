# Script para actualizar TODOS los formatos HTML con API integration
# Este script actualiza los imports de scripts en todos los archivos FO-*.html
# para incluir el módulo api-integration.js

$formatsDir = "g:\Mi unidad\Proyectos\XelleDocumentos\Version 5. SGCE\formats"
$updateCount = 0
$errorCount = 0

Write-Host "🔄 Iniciando actualización de formatos HTML..." -ForegroundColor Cyan

# Template del código antiguo (a buscar)
$oldPattern = @"
    <script src="../../core/database.js"></script>
    <script src="../../core/auth.js"></script>
    <script src="../../core/utils.js"></script>
    <script src="../formats/manager.js"></script>
"@

# Template del código nuevo (a reemplazar)
$newCode = @"
    <script src="../../sgc-integration/core/database.js"></script>
    <script src="../../sgc-integration/core/auth.js"></script>
    <script src="../../sgc-integration/core/utils.js"></script>
    <script src="../../sgc-integration/core/api-integration.js"></script>
    <script src="../../sgc-integration/modules/formats/manager.js"></script>
"@

# Buscar todos los archivos FO-*.html en la carpeta formats
Get-ChildItem -Path $formatsDir -Filter "FO-*.html" | ForEach-Object {
    try {
        $file = $_
        $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        
        # Verificar si ya tiene api-integration.js
        if ($content -like "*api-integration.js*") {
            Write-Host "✅ $($file.Name) - Ya tiene api-integration.js" -ForegroundColor Green
            return
        }
        
        # Hacer el reemplazo
        if ($content -like "*../../core/database.js*") {
            $newContent = $content -replace [regex]::Escape($oldPattern), $newCode
            
            # Guardar el archivo
            Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
            Write-Host "✅ $($file.Name) - Actualizado correctamente" -ForegroundColor Green
            $updateCount++
        } else {
            Write-Host "⚠️  $($file.Name) - Path diferente, requiere actualización manual" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "❌ $($file.Name) - Error: $_" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 RESUMEN DE ACTUALIZACIÓN" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Formatos actualizados: $updateCount" -ForegroundColor Green
Write-Host "❌ Errores: $errorCount" -ForegroundColor Red
Write-Host ""

if ($updateCount -gt 0) {
    Write-Host "🎉 ¡Actualización completada!" -ForegroundColor Green
    Write-Host "Todos los formatos ahora tienen persistencia con código único" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos pasos:" -ForegroundColor Yellow
    Write-Host "1. Verificar que el backend_v6.py esté corriendo" -ForegroundColor Yellow
    Write-Host "2. Abrir un formato en /formats/FO-LC-17.html" -ForegroundColor Yellow
    Write-Host "3. Click en 'Guardar' para generar código único" -ForegroundColor Yellow
    Write-Host "4. Ver historial en /sgc-integration/modules/formats/historial.html" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  No se realizó ninguna actualización" -ForegroundColor Yellow
}

Read-Host "Presione ENTER para cerrar"
