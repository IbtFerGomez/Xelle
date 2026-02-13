# Script de Limpieza Segura del Proyecto Xelle
# Elimina archivos duplicados y obsoletos después de la migración

$ErrorActionPreference = "Stop"

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🧹 LIMPIEZA SEGURA DEL PROYECTO XELLE" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$rootDir = Split-Path $PSScriptRoot -Parent
$backupDir = Join-Path $rootDir "archive\pre-cleanup-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# Verificar que la nueva estructura existe
Write-Host "🔍 Verificando estructura del proyecto..." -ForegroundColor Yellow

$requiredPaths = @(
    "src\backend\main.py",
    "src\frontend\index.html",
    "src\frontend\dashboard.html",
    "src\frontend\assets\js\config\users.js",
    "src\frontend\assets\js\core\core.js",
    "src\frontend\assets\css\theme.css"
)

$missingFiles = @()
foreach ($path in $requiredPaths) {
    $fullPath = Join-Path $rootDir $path
    if (-not (Test-Path $fullPath)) {
        $missingFiles += $path
        Write-Host "  ❌ Falta: $path" -ForegroundColor Red
    } else {
        Write-Host "  ✓ $path" -ForegroundColor Green
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "`n❌ ERROR: La nueva estructura no está completa." -ForegroundColor Red
    Write-Host "Faltan $($missingFiles.Count) archivos críticos." -ForegroundColor Red
    Write-Host "Por favor, completa la migración antes de ejecutar la limpieza." -ForegroundColor Yellow
    exit 1
}

Write-Host "`n✅ Estructura verificada correctamente.`n" -ForegroundColor Green

# Verificar si los formatos HTML fueron migrados
Write-Host "🔍 Verificando migración de formatos HTML..." -ForegroundColor Yellow
$formatsInNewLocation = Get-ChildItem (Join-Path $rootDir "src\frontend\formats") -Filter "*.html" -ErrorAction SilentlyContinue
$formatsInOldLocation = Get-ChildItem (Join-Path $rootDir "formats") -Filter "*.html" -ErrorAction SilentlyContinue

if ($formatsInOldLocation.Count -gt 0 -and $formatsInNewLocation.Count -eq 0) {
    Write-Host "  ⚠️  Los formatos HTML NO han sido migrados aún." -ForegroundColor Yellow
    Write-Host "  📝 Necesitas ejecutar: scripts\migrate-formats.ps1" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "¿Deseas continuar sin eliminar la carpeta 'formats/'? (S/N)"
    if ($response -ne "S" -and $response -ne "s") {
        Write-Host "Limpieza cancelada." -ForegroundColor Yellow
        exit 0
    }
    $skipFormats = $true
} else {
    Write-Host "  ✓ Formatos HTML migrados: $($formatsInNewLocation.Count) archivos" -ForegroundColor Green
    $skipFormats = $false
}

Write-Host ""

# Mostrar resumen de lo que se va a eliminar
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  📋 RESUMEN DE ARCHIVOS A ELIMINAR" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$itemsToDelete = @{
    "Carpetas Completas" = @(
        "backend\",
        "frontend\",
        "assets\"
    )
    "Archivos Python" = @(
        "backend.py",
        "colores.py"
    )
    "Archivos HTML" = @(
        "index.html",
        "dashboard.html"
    )
    "Archivos JavaScript" = @(
        "config-users.js",
        "jquery-3.7.1.min.js",
        "jszip.min.js"
    )
}

if (-not $skipFormats) {
    $itemsToDelete["Carpetas Completas"] += "formats\"
}

$totalItems = 0
foreach ($category in $itemsToDelete.Keys) {
    Write-Host "📁 $category`:" -ForegroundColor Yellow
    foreach ($item in $itemsToDelete[$category]) {
        $fullPath = Join-Path $rootDir $item
        if (Test-Path $fullPath) {
            Write-Host "   ❌ $item" -ForegroundColor Red
            $totalItems++
        } else {
            Write-Host "   ⊘  $item (ya no existe)" -ForegroundColor DarkGray
        }
    }
    Write-Host ""
}

Write-Host "Total de elementos a eliminar: $totalItems" -ForegroundColor Cyan
Write-Host ""

# Confirmar con el usuario
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "  ⚠️  ADVERTENCIA" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""
Write-Host "Se eliminará permanentemente:" -ForegroundColor Yellow
Write-Host "  • $totalItems archivos y carpetas duplicados/obsoletos" -ForegroundColor White
Write-Host "  • Se creará un backup en: archive\pre-cleanup-backup-*" -ForegroundColor White
Write-Host ""
Write-Host "Esta acción NO se puede deshacer fácilmente." -ForegroundColor Red
Write-Host ""

$confirmation = Read-Host "¿Estás seguro de continuar? Escribe 'ELIMINAR' para confirmar"

if ($confirmation -ne "ELIMINAR") {
    Write-Host "`n❌ Limpieza cancelada por el usuario." -ForegroundColor Yellow
    Write-Host "No se eliminó ningún archivo.`n" -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🚀 INICIANDO LIMPIEZA" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Crear directorio de backup
Write-Host "📦 Creando backup de seguridad..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
Write-Host "   ✓ Backup en: $backupDir" -ForegroundColor Green
Write-Host ""

# Función para hacer backup y eliminar
function Remove-WithBackup {
    param(
        [string]$ItemPath,
        [string]$ItemName
    )
    
    $fullPath = Join-Path $rootDir $ItemPath
    
    if (Test-Path $fullPath) {
        try {
            # Hacer backup
            $backupPath = Join-Path $backupDir $ItemPath
            $backupParent = Split-Path $backupPath -Parent
            if (-not (Test-Path $backupParent)) {
                New-Item -ItemType Directory -Force -Path $backupParent | Out-Null
            }
            
            Copy-Item -Path $fullPath -Destination $backupPath -Recurse -Force
            Write-Host "   📋 Backup: $ItemName" -ForegroundColor Gray
            
            # Eliminar
            Remove-Item -Path $fullPath -Recurse -Force
            Write-Host "   ✓ Eliminado: $ItemName" -ForegroundColor Green
            
            return $true
        } catch {
            Write-Host "   ❌ Error con $ItemName`: $_" -ForegroundColor Red
            return $false
        }
    } else {
        Write-Host "   ⊘  No existe: $ItemName" -ForegroundColor DarkGray
        return $false
    }
}

# Eliminar carpetas completas
Write-Host "🗑️  Eliminando carpetas duplicadas..." -ForegroundColor Yellow
$deletedCount = 0

foreach ($folder in $itemsToDelete["Carpetas Completas"]) {
    if ($skipFormats -and $folder -eq "formats\") {
        Write-Host "   ⊘  Omitido: $folder (migración pendiente)" -ForegroundColor Yellow
        continue
    }
    if (Remove-WithBackup -ItemPath $folder -ItemName $folder) {
        $deletedCount++
    }
}

Write-Host ""

# Eliminar archivos individuales
Write-Host "🗑️  Eliminando archivos duplicados..." -ForegroundColor Yellow

foreach ($category in @("Archivos Python", "Archivos HTML", "Archivos JavaScript")) {
    foreach ($file in $itemsToDelete[$category]) {
        if (Remove-WithBackup -ItemPath $file -ItemName $file) {
            $deletedCount++
        }
    }
}

Write-Host ""

# Resumen final
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ LIMPIEZA COMPLETADA" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Resumen:" -ForegroundColor Cyan
Write-Host "  • Archivos eliminados: $deletedCount" -ForegroundColor White
Write-Host "  • Backup guardado en: $backupDir" -ForegroundColor White
Write-Host ""

if ($skipFormats) {
    Write-Host "⚠️  RECORDATORIO:" -ForegroundColor Yellow
    Write-Host "   La carpeta 'formats\' NO fue eliminada." -ForegroundColor Yellow
    Write-Host "   Ejecuta 'scripts\migrate-formats.ps1' y luego elimínala manualmente." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Próximos pasos:" -ForegroundColor Cyan
Write-Host "  1. Verificar que la aplicación funciona: docker compose up -d" -ForegroundColor White
Write-Host "  2. Probar todos los formatos en: http://localhost" -ForegroundColor White
Write-Host "  3. Si todo está bien, el backup puede eliminarse después de 30 días" -ForegroundColor White
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Crear archivo de log
$logContent = @"
LIMPIEZA DEL PROYECTO XELLE
Fecha: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

ARCHIVOS ELIMINADOS: $deletedCount

BACKUP UBICADO EN:
$backupDir

ELEMENTOS ELIMINADOS:
$(foreach ($category in $itemsToDelete.Keys) {
    "$category`:
$(foreach ($item in $itemsToDelete[$category]) {
    if ($skipFormats -and $item -eq "formats\") { continue }
    $fullPath = Join-Path $rootDir $item
    if (Test-Path (Join-Path $backupDir $item)) {
        "  ✓ $item"
    }
})"
})

ESTRUCTURA FINAL:
La nueva estructura se encuentra en:
  - Backend: src/backend/
  - Frontend: src/frontend/

VERIFICACIÓN:
Asegúrate de probar la aplicación con:
  docker compose up -d
  
RECUPERACIÓN:
Si necesitas recuperar archivos, están en:
  $backupDir
"@

$logPath = Join-Path $rootDir "CLEANUP-LOG.txt"
[System.IO.File]::WriteAllText($logPath, $logContent, [System.Text.Encoding]::UTF8)

Write-Host "📝 Log guardado en: CLEANUP-LOG.txt" -ForegroundColor Green
Write-Host ""
