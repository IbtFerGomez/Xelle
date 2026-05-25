$filePath = "src/frontend/formats/FO-SGC-01.html"
$directoryPath = "src/frontend/formats"
$excludeFiles = @("PORT.html", "PORTADA.html", "INDEXGRAL.html", "00.html", "000.html")
$regex = "FO-[A-Z]+-[0-9]+(?:-[A-Z0-9]+)?|IT-[A-Z]+-[0-9]+|ET-[A-Z]+-[0-9]+(?:-[A-Z0-9]+)?"

# 1 & 2: Read file and extract codes
$content = Get-Content -Path $filePath -Raw
$codesInTable = [regex]::Matches($content, $regex).Value | Select-Object -Unique | Sort-Object

# 3: List html files and extract codes from names
$htmlFiles = Get-ChildItem -Path $directoryPath -Filter "*.html" | Where-Object { $excludeFiles -notcontains $_.Name }
$codesInFiles = $htmlFiles.BaseName | Sort-Object

# 4: Calculations and display
$missingFiles = $codesInTable | Where-Object { $_ -notin $codesInFiles }
$missingInTable = $codesInFiles | Where-Object { $_ -notin $codesInTable }

Write-Host "--- RESULTADOS DE ANÁLISIS ---"
Write-Host "Total de códigos encontrados en la tabla (regex): $($codesInTable.Count)"
Write-Host "Total de archivos HTML encontrados (excluyendo utilitarios): $($codesInFiles.Count)"
Write-Host ""
Write-Host "Códigos en la tabla que NO existen como archivo ($($missingFiles.Count)):"
$missingFiles | ForEach-Object { Write-Host " - $_" }
Write-Host ""
Write-Host "Códigos de archivos que NO están en la tabla ($($missingInTable.Count)):"
$missingInTable | ForEach-Object { Write-Host " - $_" }
