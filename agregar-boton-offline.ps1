# Script para agregar el botón de modo offline a todos los formatos
# Este script agrega el botón "Modo Offline" y la función toggleOfflineMode()
# a todos los archivos de formatos que no lo tienen

$formatsPath = "src\frontend\formats"
$botonOffline = '        <button class="btn btn-warning" onclick="toggleOfflineMode()" id="btn-offline">Modo Offline</button>'

$funcionOffline = @'
    <script>
        let isOfflineMode = false;

        function toggleOfflineMode() {
            isOfflineMode = !isOfflineMode;
            const btn = document.getElementById('btn-offline');
            if (isOfflineMode) {
                btn.textContent = 'Modo Online';
                btn.style.backgroundColor = '#f59e0b';

                // Convertir <select> a <input type="text">
                document.querySelectorAll('select.cedit').forEach(sel => {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.className = sel.className;
                    input.value = sel.options[sel.selectedIndex]?.text || '';
                    input.setAttribute('data-original-type', 'select');
                    if (sel.style.cssText) input.style.cssText = sel.style.cssText;
                    const options = Array.from(sel.options).map(opt => opt.text).join('|');
                    input.setAttribute('data-select-options', options);
                    sel.parentNode.replaceChild(input, sel);
                });

                // Convertir <input type="date"> a <input type="text">
                document.querySelectorAll('input[type="date"].cedit, input[type="date"].registry-date').forEach(inp => {
                    inp.setAttribute('data-original-type', 'date');
                    inp.type = 'text';
                    inp.placeholder = 'DD/MM/AAAA';
                });

                // Convertir <input type="time"> a <input type="text">
                document.querySelectorAll('input[type="time"].cedit').forEach(inp => {
                    inp.setAttribute('data-original-type', 'time');
                    inp.type = 'text';
                    inp.placeholder = 'HH:MM';
                });

                // Convertir <input type="number"> a <input type="text">
                document.querySelectorAll('input[type="number"].cedit').forEach(inp => {
                    inp.setAttribute('data-original-type', 'number');
                    const currentPlaceholder = inp.placeholder;
                    inp.type = 'text';
                    if (currentPlaceholder) inp.placeholder = currentPlaceholder;
                });
            } else {
                btn.textContent = 'Modo Offline';
                btn.style.backgroundColor = '';

                // Restaurar <select> desde <input type="text">
                document.querySelectorAll('input[data-original-type="select"]').forEach(inp => {
                    const sel = document.createElement('select');
                    sel.className = inp.className;
                    if (inp.style.cssText) sel.style.cssText = inp.style.cssText;
                    const options = inp.getAttribute('data-select-options')?.split('|') || [];
                    options.forEach(optText => {
                        const opt = document.createElement('option');
                        opt.text = optText;
                        sel.appendChild(opt);
                    });
                    const currentValue = inp.value;
                    for (let i = 0; i < sel.options.length; i++) {
                        if (sel.options[i].text === currentValue) {
                            sel.selectedIndex = i;
                            break;
                        }
                    }
                    inp.parentNode.replaceChild(sel, inp);
                });

                // Restaurar <input type="date">
                document.querySelectorAll('input[data-original-type="date"]').forEach(inp => {
                    inp.type = 'date';
                    inp.placeholder = '';
                    inp.removeAttribute('data-original-type');
                });

                // Restaurar <input type="time">
                document.querySelectorAll('input[data-original-type="time"]').forEach(inp => {
                    inp.type = 'time';
                    inp.placeholder = '';
                    inp.removeAttribute('data-original-type');
                });

                // Restaurar <input type="number">
                document.querySelectorAll('input[data-original-type="number"]').forEach(inp => {
                    inp.type = 'number';
                    inp.removeAttribute('data-original-type');
                });
            }
        }
    </script>
'@

# Obtener todos los archivos HTML de formatos
$archivos = Get-ChildItem -Path $formatsPath -Filter "FO-*.html"

$procesados = 0
$conBoton = 0
$agregados = 0
$errores = 0

Write-Host "Iniciando proceso de agregar botón Modo Offline..." -ForegroundColor Cyan
Write-Host "Total de archivos a revisar: $($archivos.Count)" -ForegroundColor Cyan
Write-Host ""

foreach ($archivo in $archivos) {
    $procesados++
    $rutaCompleta = $archivo.FullName
    $contenido = Get-Content -Path $rutaCompleta -Raw -Encoding UTF8
    
    # Verificar si ya tiene el botón offline
    if ($contenido -match 'btn-offline') {
        Write-Host "[$procesados/$($archivos.Count)] $($archivo.Name) - Ya tiene botón offline" -ForegroundColor Yellow
        $conBoton++
        continue
    }
    
    try {
        # Agregar el botón antes del cierre de global-controls
        $botonAgregado = $false
        
        # Intentar primero después del botón Limpiar (si existe)
        if ($contenido -match '(<button class="btn btn-danger" onclick="clearForm\(\)">Limpiar</button>)') {
            $contenido = $contenido -replace '(<button class="btn btn-danger" onclick="clearForm\(\)">Limpiar</button>)', "`$1`n$botonOffline"
            $botonAgregado = $true
        }
        # Si no existe Limpiar, buscar después de Imprimir con window.print()
        elseif ($contenido -match '(<button class="btn btn-primary" onclick="window\.print\(\)">Imprimir</button>)') {
            $contenido = $contenido -replace '(<button class="btn btn-primary" onclick="window\.print\(\)">Imprimir</button>)', "`$1`n$botonOffline"
            $botonAgregado = $true
        }
        # Si no existe, buscar después de Imprimir con printForm()
        elseif ($contenido -match '(<button class="btn btn-primary" onclick="printForm\(\)">Imprimir</button>)') {
            $contenido = $contenido -replace '(<button class="btn btn-primary" onclick="printForm\(\)">Imprimir</button>)', "`$1`n$botonOffline"
            $botonAgregado = $true
        }
        
        if (-not $botonAgregado) {
            Write-Host "[$procesados/$($archivos.Count)] $($archivo.Name) - ERROR: No se encontró dónde agregar el botón" -ForegroundColor Red
            $errores++
            continue
        }
        
        # Agregar la función antes del cierre de </body>
        if ($contenido -match '</body>') {
            $contenido = $contenido -replace '</body>', "$funcionOffline`n</body>"
        }
        else {
            Write-Host "[$procesados/$($archivos.Count)] $($archivo.Name) - ERROR: No se encontró </body>" -ForegroundColor Red
            $errores++
            continue
        }
        
        # Guardar el archivo modificado
        Set-Content -Path $rutaCompleta -Value $contenido -Encoding UTF8 -NoNewline
        Write-Host "[$procesados/$($archivos.Count)] $($archivo.Name) - Botón agregado exitosamente" -ForegroundColor Green
        $agregados++
        
    }
    catch {
        Write-Host "[$procesados/$($archivos.Count)] $($archivo.Name) - ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $errores++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUMEN DEL PROCESO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Archivos procesados: $procesados" -ForegroundColor White
Write-Host "Ya tenían botón: $conBoton" -ForegroundColor Yellow
Write-Host "Botones agregados: $agregados" -ForegroundColor Green
Write-Host "Errores: $errores" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Cyan
