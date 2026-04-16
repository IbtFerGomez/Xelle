# Script para analizar footers en archivos HTML

$basePath = "c:\Users\WINDOWS\Desktop\DriveProgra\Xelle\src\frontend\formats"
$textoDerechos = 'El contenido de este documento es propiedad de "Xelle Scientific", S.A.P.I., de C. V., y está protegido por los derechos de autor, por lo que está prohibida su reproducción total o parcial.'

# Arrays para clasificar archivos
$sinFooter = @()
$conFooterSinEstilos = @()
$conFooterSinTexto = @()
$completos = @()

# Archivos a excluir
$excluidos = @("digitalizar-word.html")
$carpetasExcluidas = @("Etiquetas.Control", "IdentificacionCarpetas", ".git")

function Test-FooterCompleto {
    param($archivo)
    
    $contenido = Get-Content $archivo -Raw -Encoding UTF8
    
    # Verificar si tiene class="footer"
    $tieneFooter = $contenido -match 'class="footer"'
    
    # Verificar estilos CSS para .footer
    $tieneEstilos = $contenido -match '\.footer\s*\{'
    
    # Verificar texto de derechos de autor (escapar comillas)
    $tieneTextoCompleto = $contenido -match [regex]::Escape($textoDerechos)
    
    return @{
        TieneFooter = $tieneFooter
        TieneEstilos = $tieneEstilos
        TieneTextoCompleto = $tieneTextoCompleto
        RutaRelativa = $archivo.Replace($basePath + "\", "")
    }
}

# Buscar archivos HTML en formats/
Write-Host "Analizando archivos en src/frontend/formats/..." -ForegroundColor Cyan
$archivosFormats = Get-ChildItem -Path $basePath -Filter "*.html" -File | Where-Object {
    $_.Name -notin $excluidos
}

foreach ($archivo in $archivosFormats) {
    $resultado = Test-FooterCompleto $archivo.FullName
    
    if (-not $resultado.TieneFooter) {
        $sinFooter += $resultado.RutaRelativa
    } elseif (-not $resultado.TieneEstilos) {
        $conFooterSinEstilos += $resultado.RutaRelativa
    } elseif (-not $resultado.TieneTextoCompleto) {
        $conFooterSinTexto += $resultado.RutaRelativa
    } else {
        $completos += $resultado.RutaRelativa
    }
}

# Buscar archivos HTML en formats/offLine/
Write-Host "Analizando archivos en src/frontend/formats/offLine/..." -ForegroundColor Cyan
$offLinePath = Join-Path $basePath "offLine"
if (Test-Path $offLinePath) {
    $archivosOffLine = Get-ChildItem -Path $offLinePath -Filter "*.html" -File
    
    foreach ($archivo in $archivosOffLine) {
        $resultado = Test-FooterCompleto $archivo.FullName
        $resultado.RutaRelativa = "offLine\" + $archivo.Name
        
        if (-not $resultado.TieneFooter) {
            $sinFooter += $resultado.RutaRelativa
        } elseif (-not $resultado.TieneEstilos) {
            $conFooterSinEstilos += $resultado.RutaRelativa
        } elseif (-not $resultado.TieneTextoCompleto) {
            $conFooterSinTexto += $resultado.RutaRelativa
        } else {
            $completos += $resultado.RutaRelativa
        }
    }
}

# Generar reporte
Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "REPORTE DE ANÁLISIS DE FOOTERS" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Yellow

Write-Host "Total de archivos analizados: $($sinFooter.Count + $conFooterSinEstilos.Count + $conFooterSinTexto.Count + $completos.Count)" -ForegroundColor White
Write-Host "Archivos completos (con footer, estilos y texto): $($completos.Count)" -ForegroundColor Green
Write-Host "Archivos que necesitan corrección: $($sinFooter.Count + $conFooterSinEstilos.Count + $conFooterSinTexto.Count)`n" -ForegroundColor Red

# Archivos SIN footer
if ($sinFooter.Count -gt 0) {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "1. ARCHIVOS SIN FOOTER ($($sinFooter.Count))" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Acción requerida: Agregar elemento <div class=`"footer`">, estilos CSS y texto de derechos de autor`n" -ForegroundColor Yellow
    $sinFooter | Sort-Object | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
    Write-Host ""
}

# Archivos CON footer PERO SIN estilos
if ($conFooterSinEstilos.Count -gt 0) {
    Write-Host "========================================" -ForegroundColor Magenta
    Write-Host "2. ARCHIVOS CON FOOTER PERO SIN ESTILOS CSS ($($conFooterSinEstilos.Count))" -ForegroundColor Magenta
    Write-Host "========================================" -ForegroundColor Magenta
    Write-Host "Acción requerida: Agregar estilos CSS para .footer (text-align, font-size, color, margin, padding, border-top)`n" -ForegroundColor Yellow
    $conFooterSinEstilos | Sort-Object | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
    Write-Host ""
}

# Archivos CON footer PERO SIN texto completo
if ($conFooterSinTexto.Count -gt 0) {
    Write-Host "========================================" -ForegroundColor DarkYellow
    Write-Host "3. ARCHIVOS CON FOOTER PERO SIN TEXTO DE DERECHOS DE AUTOR COMPLETO ($($conFooterSinTexto.Count))" -ForegroundColor DarkYellow
    Write-Host "========================================" -ForegroundColor DarkYellow
    Write-Host "Acción requerida: Agregar o corregir el texto: '$textoDerechos'`n" -ForegroundColor Yellow
    $conFooterSinTexto | Sort-Object | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
    Write-Host ""
}

# Guardar reporte en archivo
$reportePath = "c:\Users\WINDOWS\Desktop\DriveProgra\Xelle\REPORTE_FOOTERS.txt"
$reporte = @"
========================================
REPORTE DE ANÁLISIS DE FOOTERS
Fecha: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
========================================

Total de archivos analizados: $($sinFooter.Count + $conFooterSinEstilos.Count + $conFooterSinTexto.Count + $completos.Count)
Archivos completos: $($completos.Count)
Archivos que necesitan corrección: $($sinFooter.Count + $conFooterSinEstilos.Count + $conFooterSinTexto.Count)

========================================
1. ARCHIVOS SIN FOOTER ($($sinFooter.Count))
========================================
Acción requerida: Agregar elemento <div class="footer">, estilos CSS y texto de derechos de autor

$($sinFooter | Sort-Object | ForEach-Object { "  - $_" } | Out-String)

========================================
2. ARCHIVOS CON FOOTER PERO SIN ESTILOS CSS ($($conFooterSinEstilos.Count))
========================================
Acción requerida: Agregar estilos CSS para .footer (text-align, font-size, color, margin, padding, border-top)

$($conFooterSinEstilos | Sort-Object | ForEach-Object { "  - $_" } | Out-String)

========================================
3. ARCHIVOS CON FOOTER PERO SIN TEXTO DE DERECHOS DE AUTOR COMPLETO ($($conFooterSinTexto.Count))
========================================
Acción requerida: Agregar o corregir el texto de derechos de autor completo

$($conFooterSinTexto | Sort-Object | ForEach-Object { "  - $_" } | Out-String)

========================================
ARCHIVOS COMPLETOS (REFERENCIA) ($($completos.Count))
========================================
$($completos | Sort-Object | ForEach-Object { "  - $_" } | Out-String)

Texto de derechos de autor requerido:
"$textoDerechos"
"@

$reporte | Out-File -FilePath $reportePath -Encoding UTF8
Write-Host "Reporte guardado en: $reportePath" -ForegroundColor Green
