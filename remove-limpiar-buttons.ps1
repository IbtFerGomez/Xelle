# Script para remover botones "Limpiar" de todos los formatos HTML
$formatFiles = Get-ChildItem -Path "src\frontend\formats\FO-*.html" -Recurse

$count = 0
foreach ($file in $formatFiles) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Remover diferentes variaciones del botón limpiar
    $content = $content -replace '<button\s+class="btn\s+btn-danger"\s+onclick="clearForm\(\)">Limpiar</button>\s*', ''
    $content = $content -replace '<button\s+class="btn\s+btn-danger"\s+onclick="clearForm\(\)">Limpiar</button>', ''
    
    # Si hubo cambios, guardar el archivo
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $count++
        Write-Host "✓ Actualizado: $($file.Name)"
    }
}

Write-Host "`nTotal de archivos actualizados: $count"
