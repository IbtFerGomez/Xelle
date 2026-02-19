/**
 * FORMAT-APP.JS - V10.0 FINAL MASTER
 * - Soporte Completo: FO-LC-17 a FO-LC-45
 * - Lógica FO-24: Inventario descuenta Reproceso/Devolución. Alerta Eliminación.
 * - Lógica FO-21: Restaurada (Padre-Hijo, Cosecha, Alimentación).
 * - Lógica FO-20: Fix toggle congelación.
 */

const App = {
    config: {
        recipientTypes: [
            "Flask 75 cm²", "Flask 175 cm²", "Flask 225 cm²",
            "Hyper Flask", "Cell Stack", "Bioreactor",
            "Placa Petri", "Tubo Cónico"
        ]
    },

    init: function () {
        const docId = document.body.id;
        console.log("Iniciando App V10 para:", docId);

        this.Universal.setupDateInputs();
        this.Universal.setupBarcodes();
        this.Universal.loadData(docId);
        this.Universal.setupPrintHandler();

        switch (docId) {
            case 'doc-fo-lc-ResumenRecepcion': case 'doc-fo-lc-17': case 'doc-fo-lc-18': case 'doc-fo-lc-19': case 'doc-fo-lc-23': break;
            case 'doc-fo-lc-20': this.Docs.FO_LC_20.init(); break;
            case 'doc-fo-lc-21': this.Docs.FO_LC_21.init(); break;
            case 'doc-fo-lc-22': this.Docs.FO_LC_22.init(); break;
            case 'doc-fo-lc-24': this.Docs.FO_LC_24.init(); break;
            case 'doc-fo-lc-40': case 'doc-fo-lc-41': case 'doc-fo-lc-42': case 'doc-fo-lc-43': case 'doc-fo-lc-44': case 'doc-fo-lc-45':
                this.Docs.FO_Generic.init(docId); break;
        }
    },

    Universal: {
        setupDateInputs: function () {
            document.querySelectorAll('input[type="date"]').forEach(input => {
                // Autollenar solo si no es fecha de registro (clase no-auto-date)
                if (!input.value && !input.classList.contains('no-auto-date')) input.valueAsDate = new Date();
            });
        },
        setupBarcodes: function () {
            const process = (input) => {
                const prefix = input.dataset.prefix || '';
                const val = input.value;
                if (val && window.JsBarcode) {
                    try {
                        JsBarcode(`#${input.dataset.target}`, prefix + val, { format: "CODE128", height: 30, displayValue: true, fontSize: 10, margin: 0 });
                    } catch (e) { }
                }
            };
            document.querySelectorAll('.generate-barcode').forEach(i => {
                i.addEventListener('input', (e) => process(e.target));
                if (i.value) process(i);
            });
        },
        setupPrintHandler: function () {
            window.addEventListener('beforeprint', () => {
                document.querySelectorAll('select').forEach(sel => {
                    let span = sel.nextElementSibling;
                    if (!span || !span.classList.contains('print-only-value')) {
                        span = document.createElement('span');
                        span.className = 'print-only-value';
                        sel.parentNode.insertBefore(span, sel.nextSibling);
                    }
                    span.textContent = sel.options[sel.selectedIndex]?.text || '';
                });
            });
        },
        autoResize: function (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        },
        saveData: function () {
            const docId = document.body.id;
            const data = {};
            document.querySelectorAll('input, select, textarea').forEach(el => {
                if ((el.id || el.name) && el.type !== 'submit' && !el.closest('tr')) {
                    if (el.type === 'checkbox') data[el.id || el.name] = el.checked;
                    else if (el.type === 'radio') { if (el.checked) data[el.name] = el.value; }
                    else data[el.id || el.name] = el.value;
                }
            });
            if (App.Docs[docId.replace(/-/g, '_').toUpperCase()]?.getCustomData) {
                Object.assign(data, App.Docs[docId.replace(/-/g, '_').toUpperCase()].getCustomData());
            }
            localStorage.setItem(`xelle_${docId}`, JSON.stringify(data));
            Swal.fire({ icon: 'success', title: 'Guardado', timer: 1000, showConfirmButton: false });
        },
        loadData: function (docId) {
            const saved = localStorage.getItem(`xelle_${docId}`);
            if (!saved) return;
            const data = JSON.parse(saved);
            for (const [key, value] of Object.entries(data)) {
                let el = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
                if (el && !el.closest('tr')) {
                    if (el.type === 'checkbox') el.checked = value;
                    else if (el.type === 'radio') {
                        const r = document.querySelector(`input[name="${key}"][value="${value}"]`);
                        if (r) r.checked = true;
                    } else el.value = value;
                    el.dispatchEvent(new Event('input'));
                    el.dispatchEvent(new Event('change'));
                }
            }
            const docHandler = App.Docs[docId.replace(/-/g, '_').toUpperCase()];
            if (docHandler?.loadCustomData) docHandler.loadCustomData(data);
        },
        clearForm: function () {
            Swal.fire({
                title: '¿Limpiar todo?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sí'
            }).then((result) => {
                if (result.isConfirmed) {
                    localStorage.removeItem(`xelle_${document.body.id}`);
                    location.reload();
                }
            });
        },
        printForm: function () { window.print(); }
    },

    Docs: {
        // --- FO-LC-20: PROCESAMIENTO ---
        FO_LC_20: {
            init: function () {
                const tplInput = document.getElementById('tpl-id-input');
                if (tplInput) tplInput.addEventListener('input', this.updateCodes);

                const freezeSelect = document.getElementById('freeze-select');
                if (freezeSelect) {
                    freezeSelect.addEventListener('change', (e) => {
                        document.getElementById('freeze-container').style.display = (e.target.value === 'Si') ? 'block' : 'none';
                    });
                    if (freezeSelect.value === 'Si') document.getElementById('freeze-container').style.display = 'block';
                }

                if (document.querySelectorAll('#flask-table-body tr').length === 0) {
                    this.addFlaskRow(); window.addSupplyRow();
                }
            },
            updateCodes: function () {
                const tpl = document.getElementById('tpl-id-input')?.value || '';
                const date = document.querySelector('.today-date')?.value || '';
                const formatDate = (d) => {
                    if (!d) return 'DDMMAA';
                    const dt = new Date(d + 'T00:00:00');
                    const m = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'][dt.getMonth()];
                    return `${dt.getDate().toString().padStart(2, '0')}${m}${dt.getFullYear().toString().substr(-2)}`;
                };
                document.querySelectorAll('#flask-table-body tr').forEach((row, i) => {
                    const type = row.querySelector('.flask-method').value;
                    row.querySelector('.code-preview').textContent = `${tpl} ${formatDate(date)} ${type} #${i + 1}`;
                });
            },
            addFlaskRow: function () {
                const tbody = document.getElementById('flask-table-body');
                const row = document.createElement('tr');
                const count = tbody.children.length + 1;
                const opts = App.config.recipientTypes.map(t => `<option value="${t}">${t}</option>`).join('');
                row.innerHTML = `
    <td>${document.getElementById('tpl-id-input')?.value || '---'}</td>
    <td><select class="flask-method" onchange="App.Docs.FO_LC_20.updateCodes()"><option value="EX">EX</option><option value="DG">DG</option></select></td>
    <td>${document.querySelector('.today-date')?.value || ''}</td>
    <td>${count}</td>
    <td class="code-preview" style="font-weight:bold; color: var(--primary-color);">---</td>
    <td><select style="width:100%">${opts}</select></td>
    <td class="no-print"><button class="btn btn-danger btn-mini" onclick="this.closest('tr').remove(); App.Docs.FO_LC_20.updateCodes()">X</button></td>
`;
                tbody.appendChild(row);
                this.updateCodes();
            },
            getCustomData: function () {
                const supplies = [], flasks = [], freeze = [];
                document.querySelectorAll('#supplies-table-body tr').forEach(r => supplies.push(this.scrape(r)));
                document.querySelectorAll('#flask-table-body tr').forEach(r => flasks.push(this.scrape(r)));
                document.querySelectorAll('#freeze-table-body tr').forEach(r => freeze.push(this.scrape(r)));
                return { t_supplies: supplies, t_flasks: flasks, t_freeze: freeze };
            },
            scrape: (row) => Array.from(row.querySelectorAll('input, select')).map(i => i.value),
            loadCustomData: function (data) {
                if (data.t_supplies) this.restore('supplies-table-body', data.t_supplies, window.addSupplyRow);
                if (data.t_flasks) this.restore('flask-table-body', data.t_flasks, () => this.addFlaskRow());
                if (data.t_freeze) this.restore('freeze-table-body', data.t_freeze, window.addFreezeRow);
            },
            restore: function (id, data, fn) {
                const tbody = document.getElementById(id); tbody.innerHTML = '';
                data.forEach(d => { fn(); const ins = tbody.lastElementChild.querySelectorAll('input, select'); d.forEach((v, i) => { if (ins[i]) ins[i].value = v; }); });
            }
        },

        // --- FO-LC-21: BITÁCORA ---
        FO_LC_21: {
            init: function () { },
            handleAction: function (btn, action) {
                const row = btn.closest('tr');
                const codigo = row.cells[0].querySelector('input').value || 'Sin Cód';
                const linea = row.cells[1].querySelector('input').value || '';
                const paseActual = parseInt(row.cells[2].querySelector('input').value) || 0;

                if (action === 'alim') {
                    Swal.fire({ title: `Alim: ${codigo}`, input: 'text', showCancelButton: true }).then(res => {
                        if (res.value) {
                            const today = new Date().toISOString().split('T')[0];
                            row.cells[5].querySelector('input').value = today; // Columna 6 (Indice 5) es Último Medio
                            row.style.backgroundColor = '#eafaf1';
                        }
                    });
                } else if (action === 'pase') {
                    const opts = App.config.recipientTypes.map(t => `<option value="${t}">${t}</option>`).join('');
                    Swal.fire({
                        title: `Subcultivo ${codigo}`,
                        html: `<label>Hijos:</label><input id="sw-h" type="number" class="swal2-input" value="3"><label>Células:</label><input id="sw-c" class="swal2-input"><br><input type="checkbox" id="sw-k"> Mantener Padre`,
                        preConfirm: () => ({ num: document.getElementById('sw-h').value, cel: document.getElementById('sw-c').value, keep: document.getElementById('sw-k').checked })
                    }).then(res => {
                        if (res.isConfirmed) {
                            const nuevoPase = paseActual + 1;
                            const tbody = document.getElementById('tbody-nuevos');
                            for (let i = 1; i <= res.value.num; i++) {
                                const tr = document.createElement('tr');
                                const codHijo = `${linea}-P${nuevoPase}-${i}`;
                                tr.innerHTML = `<td><input class="cedit" value="${codigo}" readonly></td><td><input class="cedit" value="${codHijo}" style="color:#27ae60;font-weight:bold"></td><td><select class="cedit">${opts}</select></td><td><input class="cedit" value="${res.value.cel}"></td><td><input class="cedit" value="INC-01"></td><td class="no-print"><button class="btn-danger btn-mini" onclick="this.closest('tr').remove()">x</button></td>`;
                                tbody.appendChild(tr);
                            }
                            if (!res.value.keep) {
                                row.querySelector('.status-select').value = 'SUBCULTIVADO';
                                row.style.backgroundColor = '#eaecee';
                            }
                        }
                    });
                } else if (action === 'cosecha') {
                    Swal.fire({
                        title: `Cosecha ${codigo}`,
                        html: `<input id="sw-t" class="swal2-input" placeholder="Total"><input id="sw-v" class="swal2-input" placeholder="Viab %">`,
                        preConfirm: () => ({ tot: document.getElementById('sw-t').value, via: document.getElementById('sw-v').value })
                    }).then(res => {
                        if (res.isConfirmed) {
                            const tbody = document.getElementById('tbody-cosechas');
                            const tr = document.createElement('tr');
                            tr.innerHTML = `<td><input class="cedit" value="${codigo}"></td><td><input class="cedit" value="${res.value.tot}"></td><td><input class="cedit" value="${res.value.via}"></td><td><input class="cedit" value="Dosificación"></td><td><input class="cedit"></td><td class="no-print"><button class="btn-danger btn-mini" onclick="this.closest('tr').remove()">x</button></td>`;
                            tbody.appendChild(tr);
                            row.querySelector('.status-select').value = 'COSECHADO';
                            row.style.backgroundColor = '#fcf3cf';
                        }
                    });
                } else if (action === 'contaminacion') {
                    Swal.fire({ title: '¿Contaminación?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33' }).then(res => {
                        if (res.isConfirmed) {
                            row.querySelector('.status-select').value = 'CONTAMINADO';
                            row.style.backgroundColor = '#f2d7d5';
                            row.style.textDecoration = 'line-through';
                        }
                    });
                }
            },
            addFlaskManual: function () {
                const tbody = document.getElementById('tbody-flasks');
                const row = document.createElement('tr');
                row.innerHTML = `<td><input class="cedit" placeholder="Cod"></td><td><input class="cedit" placeholder="Lin"></td><td><input class="cedit" type="number" style="width:40px" value="1"></td><td><input type="date" class="cedit"></td><td><input class="cedit"></td><td><input type="date" class="cedit"></td><td><select class="cedit status-select" style="font-weight:bold;"><option>ACTIVO</option><option>CUARENTENA</option><option>COSECHADO</option><option>SUBCULTIVADO</option><option>CONTAMINADO</option></select></td><td class="no-print"><button class="btn-primary btn-mini" onclick="App.Docs.FO_LC_21.handleAction(this, 'alim')">🥦</button><button class="btn-success btn-mini" onclick="App.Docs.FO_LC_21.handleAction(this, 'pase')">🌱</button><button class="btn-warning btn-mini" onclick="App.Docs.FO_LC_21.handleAction(this, 'cosecha')">📦</button><button class="btn-danger btn-mini" onclick="App.Docs.FO_LC_21.handleAction(this, 'contaminacion')">☣️</button><button class="btn-danger btn-mini" onclick="this.closest('tr').remove()">X</button></td>`;
                tbody.appendChild(row);
            },
            getCustomData: function () {
                const f = [], i = [], n = [], c = [];
                document.querySelectorAll('#tbody-flasks tr').forEach(r => { let d = this.scrape(r); d.push(r.style.backgroundColor); d.push(r.style.textDecoration); f.push(d); });
                document.querySelectorAll('#tabla-insumos-dia tbody tr').forEach(r => i.push(this.scrape(r)));
                document.querySelectorAll('#tbody-nuevos tr').forEach(r => n.push(this.scrape(r)));
                document.querySelectorAll('#tbody-cosechas tr').forEach(r => c.push(this.scrape(r)));
                return { t_flasks: f, t_insumos: i, t_nuevos: n, t_cosechas: c };
            },
            scrape: (r) => Array.from(r.querySelectorAll('input, select')).map(i => i.value),
            loadCustomData: function (d) {
                if (d.t_flasks) { document.getElementById('tbody-flasks').innerHTML = ''; d.t_flasks.forEach(r => { this.addFlaskManual(); const tr = document.getElementById('tbody-flasks').lastElementChild; const ins = tr.querySelectorAll('input, select'); r.forEach((v, k) => { if (k < ins.length) ins[k].value = v; }); if (r[r.length - 2]) tr.style.backgroundColor = r[r.length - 2]; if (r[r.length - 1]) tr.style.textDecoration = r[r.length - 1]; }); }
                if (d.t_insumos) this.restore('tabla-insumos-dia', d.t_insumos, window.agregarFilaInsumo);
                if (d.t_nuevos) this.restoreGen('tbody-nuevos', d.t_nuevos, 6);
                if (d.t_cosechas) this.restoreGen('tbody-cosechas', d.t_cosechas, 6);
            },
            restore: function (id, data, fn) { document.getElementById(id).innerHTML = ''; data.forEach(d => { fn(); const tr = document.getElementById(id).querySelector('tbody').lastElementChild; const ins = tr.querySelectorAll('input, select'); d.forEach((v, k) => { if (ins[k]) ins[k].value = v; }); }); },
            restoreGen: function (id, data, cols) {
                const tb = document.getElementById(id); tb.innerHTML = '';
                data.forEach(d => { const tr = document.createElement('tr'); for (let i = 0; i < cols - 1; i++) tr.innerHTML += `<td><input class="cedit" value="${d[i] || ''}"></td>`; tr.innerHTML += `<td class="no-print"><button class="btn-danger btn-mini" onclick="this.closest('tr').remove()">x</button></td>`; tb.appendChild(tr); });
            }
        },

        // --- FO-LC-22: CRIO ---
        FO_LC_22: {
            init: function () { this.renderGrid(); },
            renderGrid: function () { const c = document.getElementById('cryo-grid'); if (!c || c.children.length > 0) return; for (let i = 1; i <= 100; i++) { const d = document.createElement('div'); d.className = 'cryo-cell p-empty'; d.textContent = i; d.onclick = () => this.toggle(d); c.appendChild(d); } },
            toggle: function (d) {
                if (!d.classList.contains('p-empty')) { d.className = 'cryo-cell p-empty'; return; }
                const p = parseInt(document.getElementById('input-pase').value) || 0;
                let c = 'p-0-1'; if (p >= 2 && p <= 3) c = 'p-2-3'; if (p >= 4 && p <= 5) c = 'p-4-5'; if (p >= 6 && p <= 7) c = 'p-6-7'; if (p >= 8) c = 'p-8-9';
                d.className = `cryo-cell ${c}`;
            },
            getCustomData: function () { const s = []; document.querySelectorAll('.cryo-cell').forEach(c => s.push(c.className)); return { grid: s }; },
            loadCustomData: function (d) { if (d.grid) document.querySelectorAll('.cryo-cell').forEach((c, i) => { if (d.grid[i]) c.className = d.grid[i]; }); }
        },

        // --- FO-LC-24: DOSIS (ACTUALIZADO) ---
        FO_LC_24: {
            productsDB: {
                "Stem Xelle": { lotPre: "XCM", pres: ["10M", "25M", "50M", "100M", "Especial"] },
                "Hybrid Xelle": { lotPre: "XHY", pres: ["10M+1B", "25M+2B", "50M+5B", "60M+6B", "100M+10B", "Especial"] },
                "Stem Ortho": { lotPre: "XOR", pres: ["10M", "25M", "50M", "100M", "Especial"] },
                "Hybrid Ortho": { lotPre: "XHO", pres: ["10M+1B", "25M+2B", "50M+5B", "60M+6B", "100M+10B", "Especial"] },
                "Exosomas": { lotPre: "EXO", pres: ["3B", "9B", "15B", "30B", "75B", "90B", "Especial"] }
            },
            init: function () { if (document.querySelectorAll('#tbl-dosis tbody tr').length === 0) this.addDosis(); this.calcInventory(); },
            addDosis: function () {
                const tbody = document.querySelector('#tbl-dosis tbody');
                const row = document.createElement('tr');
                const n = tbody.rows.length + 1;
                // Se agregó un div contenedor para la opción "Especial" en la columna de Pres.
                row.innerHTML = `
    <td class="text-center row-num">${n}</td>
    <td><select class="cedit prod-select" onchange="App.Docs.FO_LC_24.onProd(this)">
        <option value="">Sel...</option>
        <option value="Stem Xelle">Stem Xelle</option>
        <option value="Hybrid Xelle">Hybrid Xelle</option>
        <option value="Stem Ortho">Stem Ortho</option>
        <option value="Hybrid Ortho">Hybrid Ortho</option>
        <option value="Exosomas">Exosomas</option>
    </select></td>
    <td><textarea class="cedit origin-input" rows="1" placeholder="Origen" oninput="App.Universal.autoResize(this)"></textarea></td>
    <td><input type="date" class="cedit"></td>
    <td><input class="cedit lote-input" readonly style="background:#eee;"></td>
    <td>
        <select class="cedit pres-select" onchange="App.Docs.FO_LC_24.onPresChange(this)">
            <option>-</option>
        </select>
        <input type="text" class="cedit special-pres-input" style="display:none; margin-top:2px; border:1px solid #2e9d82;" placeholder="¿Cuál?">
    </td>
    <td><input class="cedit cell-count-input" placeholder="No."></td>
    <td><input class="cedit" placeholder="Venta"></td>
    <td><input class="cedit unique-code" readonly style="font-weight:bold;color:#2980b9"></td>
    <td><input class="cedit obs-input" placeholder="Obs"></td>
    <td class="no-print"><button class="btn-danger btn-mini" onclick="App.Docs.FO_LC_24.handleDelete(this)">X</button></td>`;
                tbody.appendChild(row);
            },
            onProd: function (s) {
                const r = s.closest('tr'); const c = this.productsDB[s.value]; const p = r.querySelector('.pres-select');
                p.innerHTML = '<option value="">-</option>';
                if (c) c.pres.forEach(x => p.add(new Option(x, x)));

                const d = document.getElementById('fecha_operacion').value;
                if (d && c) r.querySelector('.lote-input').value = `${c.lotPre}${d.replace(/-/g, '').substring(2)}`;
                this.updateCode(r); this.calcInventory();
            },
            onPresChange: function (s) {
                const r = s.closest('tr');
                const specialInput = r.querySelector('.special-pres-input');
                // Si elige "Especial", muestra el input de texto, si no lo oculta
                if (s.value === "Especial") {
                    specialInput.style.display = "block";
                    specialInput.focus();
                } else {
                    specialInput.style.display = "none";
                    specialInput.value = "";
                }
            },
            updateCode: function (r) {
                const l = r.querySelector('.lote-input').value; const n = r.querySelector('.row-num').innerText.padStart(3, '0');
                if (l) r.querySelector('.unique-code').value = `${l.replace(/\s/g, '')}-${n}`;
            },
            handleDelete: function (b) {
                Swal.fire({ title: '¿Acción?', icon: 'question', showDenyButton: true, showCancelButton: true, confirmButtonText: 'Eliminar Fila', denyButtonText: 'Reproceso/Dev' }).then(r => {
                    const row = b.closest('tr');
                    if (r.isConfirmed) { row.remove(); this.reindex(); this.calcInventory(); }
                    else if (r.isDenied) {
                        Swal.fire({ input: 'select', inputOptions: { 'Reproceso': 'Reproceso', 'Devolución': 'Devolución' }, title: 'Motivo' }).then(s => {
                            if (s.value) { row.querySelector('.obs-input').value = s.value; row.style.backgroundColor = '#fdedec'; this.calcInventory(); }
                        });
                    }
                });
            },
            reindex: function () { document.querySelectorAll('#tbl-dosis tbody tr').forEach((r, i) => { r.querySelector('.row-num').innerText = i + 1; this.updateCode(r); }); },
            calcInventory: function () {
                const t = { "Stem Xelle": 0, "Hybrid Xelle": 0, "Stem Ortho": 0, "Hybrid Ortho": 0, "Exosomas": 0 };
                document.querySelectorAll('#tbl-dosis tbody tr').forEach(r => {
                    const obs = r.querySelector('.obs-input').value;
                    if (!obs) {
                        const p = r.querySelector('.prod-select').value;
                        if (t[p] !== undefined) t[p]++;
                    }
                });
                document.getElementById('tot-stem').value = t["Stem Xelle"]; document.getElementById('tot-hybrid').value = t["Hybrid Xelle"]; document.getElementById('tot-stem-ortho').value = t["Stem Ortho"]; document.getElementById('tot-hybrid-ortho').value = t["Hybrid Ortho"]; document.getElementById('tot-exo').value = t["Exosomas"];
            }
        },

        FO_Generic: { init: function (id) { if (document.querySelector('table tbody').children.length === 0) { if (id.includes('41')) window.addMuestra41(); else if (id.includes('42')) window.addGenericRow('tbl-mp', `<td><input class='cedit'></td><td><input type='date' class='cedit'></td><td><input class='cedit'></td><td><input type='number' class='cedit'></td><td class='no-print'><button class='btn-danger btn-mini' onclick='this.closest("tr").remove()'>x</button></td>`); } } },
        addGenericRow: function (id, html) { const r = document.createElement('tr'); r.innerHTML = html; document.querySelector(`#${id} tbody`).appendChild(r); }
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());

window.saveForm = () => App.Universal.saveData(); window.printForm = () => App.Universal.printForm(); window.clearForm = () => App.Universal.clearForm(); window.addGenericRow = (i, h) => App.Docs.addGenericRow(i, h);
window.addFlaskRow = () => App.Docs.FO_LC_20.addFlaskRow(); window.addSupplyRow = () => { const r = document.createElement('tr'); r.innerHTML = `<td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="date"></td><td class="no-print"><button class="btn btn-danger btn-mini" onclick="this.closest('tr').remove()">X</button></td>`; document.getElementById('supplies-table-body').appendChild(r); }; window.addFreezeRow = () => { const r = document.createElement('tr'); r.innerHTML = `<td><input type="number" style="width:50px" value="1"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text" value="DMSO 10%"></td><td><input type="text"></td><td><input type="text"></td><td><select><option>Vial</option><option>Bolsa</option></select></td><td><input type="text"></td><td class="no-print"><button class="btn btn-danger btn-mini" onclick="this.closest('tr').remove()">X</button></td>`; document.getElementById('freeze-table-body').appendChild(r); };
window.agregarFilaInsumo = () => { const r = document.createElement('tr'); r.innerHTML = `<td><input class="cedit"></td><td><input class="cedit"></td><td><input class="cedit"></td><td><input type="date" class="cedit"></td><td class="no-print"><button class="btn-danger btn-mini" onclick="this.closest('tr').remove()">X</button></td>`; document.querySelector('#tabla-insumos-dia tbody').appendChild(r); }; window.addFlaskManual21 = () => App.Docs.FO_LC_21.addFlaskManual();
window.addDosis24 = () => App.Docs.FO_LC_24.addDosis(); window.addMuestra41 = () => App.Docs.addGenericRow('tbl-micro', `<td><input class='cedit'></td><td><input type='date' class='cedit'></td><td><select class='cedit'><option>-</option><option>NEG</option><option>POS</option><option>NA</option></select></td><td><select class='cedit'><option>-</option><option>NEG</option><option>POS</option><option>NA</option></select></td><td><select class='cedit'><option>-</option><option>NEG</option><option>POS</option><option>NA</option></select></td><td><input type='date' class='cedit'></td><td><input class='cedit'></td><td class='no-print'><button class='btn-danger btn-mini' onclick='this.closest("tr").remove()'>x</button></td>`);