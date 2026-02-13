# Script para cambiar el repositorio Git a "Xelle"
# Actualiza el nombre del proyecto y configura el nuevo repositorio remoto

param(
    [Parameter(Mandatory=$true)]
    [string]$NewRepoUrl,
    
    [switch]$KeepOldRemote,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🔄 CAMBIO DE REPOSITORIO GIT - XELLE LIMS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$rootDir = Split-Path $PSScriptRoot -Parent
Set-Location $rootDir

# Verificar que es un repositorio Git
if (-not (Test-Path ".git")) {
    Write-Host "❌ ERROR: No se encontró un repositorio Git en esta ubicación." -ForegroundColor Red
    exit 1
}

# Mostrar repositorio actual
Write-Host "📍 Repositorio actual:" -ForegroundColor Yellow
git remote -v
Write-Host ""

# Verificar cambios pendientes
$status = git status --porcelain
if ($status) {
    Write-Host "📝 Cambios pendientes detectados:" -ForegroundColor Yellow
    Write-Host $status -ForegroundColor Gray
    Write-Host ""
    
    $response = Read-Host "¿Deseas hacer commit de estos cambios antes de continuar? (S/N)"
    if ($response -eq "S" -or $response -eq "s") {
        git add .
        git commit -m "Actualización del nombre del proyecto a Xelle"
        Write-Host "✅ Commit realizado`n" -ForegroundColor Green
    }
}

# Cambiar el repositorio remoto
Write-Host "🔄 Cambiando repositorio remoto..." -ForegroundColor Yellow

if ($KeepOldRemote) {
    Write-Host "   Renombrando 'origin' a 'old-origin'..." -ForegroundColor Gray
    try {
        git remote rename origin old-origin
        Write-Host "   ✓ Remoto anterior guardado como 'old-origin'" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  No se pudo renombrar (puede que no existía)" -ForegroundColor Yellow
    }
} else {
    Write-Host "   Eliminando 'origin' actual..." -ForegroundColor Gray
    try {
        git remote remove origin
        Write-Host "   ✓ Remoto anterior eliminado" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  No se pudo eliminar (puede que no existía)" -ForegroundColor Yellow
    }
}

# Agregar nuevo repositorio
Write-Host "   Agregando nuevo repositorio: $NewRepoUrl" -ForegroundColor Gray
git remote add origin $NewRepoUrl
Write-Host "   ✓ Nuevo repositorio agregado`n" -ForegroundColor Green

# Verificar cambio
Write-Host "📍 Nuevo repositorio configurado:" -ForegroundColor Green
git remote -v
Write-Host ""

# Detectar rama principal
$currentBranch = git branch --show-current
Write-Host "🌿 Rama actual: $currentBranch" -ForegroundColor Cyan

# Preguntar sobre el push
Write-Host ""
$pushNow = Read-Host "¿Deseas hacer push al nuevo repositorio ahora? (S/N)"

if ($pushNow -eq "S" -or $pushNow -eq "s") {
    Write-Host ""
    Write-Host "📤 Haciendo push a $currentBranch..." -ForegroundColor Yellow
    
    try {
        if ($Force) {
            Write-Host "   ⚠️  Usando --force (sobrescribirá el repositorio remoto)" -ForegroundColor Yellow
            git push -u origin $currentBranch --force
        } else {
            git push -u origin $currentBranch
        }
        
        Write-Host "   ✓ Push completado exitosamente`n" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Error durante el push:" -ForegroundColor Red
        Write-Host "   $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "💡 Sugerencias:" -ForegroundColor Yellow
        Write-Host "   1. Verifica que el repositorio exista en GitHub" -ForegroundColor White
        Write-Host "   2. Verifica tus permisos de acceso" -ForegroundColor White
        Write-Host "   3. Si el repositorio remoto tiene contenido, ejecuta:" -ForegroundColor White
        Write-Host "      git push -u origin $currentBranch --force" -ForegroundColor Gray
        Write-Host ""
        exit 1
    }
}

# Resumen final
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ CAMBIO DE REPOSITORIO COMPLETADO" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Resumen:" -ForegroundColor Cyan
Write-Host "   • Repositorio anterior: XelleModular" -ForegroundColor White
Write-Host "   • Nuevo repositorio: $NewRepoUrl" -ForegroundColor White
Write-Host "   • Rama: $currentBranch" -ForegroundColor White

if ($KeepOldRemote) {
    Write-Host "   • Remoto anterior guardado como 'old-origin'" -ForegroundColor White
}

Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Cyan
Write-Host "   1. Verifica en GitHub que el código se subió correctamente" -ForegroundColor White
Write-Host "   2. Actualiza la configuración de CI/CD si la tienes" -ForegroundColor White
Write-Host "   3. Notifica a tu equipo sobre el cambio de repositorio" -ForegroundColor White
Write-Host ""

# Crear log
$logContent = @"
CAMBIO DE REPOSITORIO GIT - XELLE LIMS
Fecha: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

REPOSITORIO ANTERIOR: git@github-trabajo:XelleFerGomez/XelleModular.git
NUEVO REPOSITORIO: $NewRepoUrl

RAMA: $currentBranch
CONSERVA REMOTO ANTERIOR: $KeepOldRemote

REMOTOS ACTUALES:
$(git remote -v)

ÚLTIMO COMMIT:
$(git log -1 --pretty=format:"%h - %s (%an, %ar)")
"@

$logPath = Join-Path $rootDir "GIT-CHANGE-LOG.txt"
[System.IO.File]::WriteAllText($logPath, $logContent, [System.Text.Encoding]::UTF8)

Write-Host "📝 Log guardado en: GIT-CHANGE-LOG.txt" -ForegroundColor Green
Write-Host ""
