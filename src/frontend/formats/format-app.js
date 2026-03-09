/**
 * FORMAT-APP.JS - V10.0 FINAL MASTER
 * - Soporte Completo: FO-LC-17 a FO-LC-45
 * - Lógica FO-24: Inventario descuenta Reproceso/Devolución. Alerta Eliminación.
 * - Lógica FO-21: Restaurada (Padre-Hijo, Cosecha, Alimentación).
 * - Lógica FO-20: Fix toggle congelación.
 */

const API_URL = '/api';

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
        this.Universal.setupPrintHandler();

        switch (docId) {
            case 'doc-fo-lc-ResumenRecepcion': case 'doc-fo-lc-17': case 'doc-fo-lc-18': case 'doc-fo-lc-19': case 'doc-fo-lc-23': break;
            case 'doc-fo-lc-20': this.Docs.FO_LC_20.init(); break;
            case 'doc-fo-lc-21': this.Docs.FO_LC_21.init(); break;
            case 'doc-fo-lc-22': this.Docs.FO_LC_22.init(); break;
            case 'doc-fo-lc-24': this.Docs.FO_LC_24.init(); break;
            case 'doc-fo-lc-31': this.Docs.FO_LC_31.init(); break;
            case 'doc-fo-lc-40': case 'doc-fo-lc-40-b': case 'doc-fo-lc-41': case 'doc-fo-lc-42': case 'doc-fo-lc-43': case 'doc-fo-lc-44': case 'doc-fo-lc-45':
                this.Docs.FO_Generic.init(docId); break;
        }

        setTimeout(() => this.Universal.loadData(docId), 0);
    },

    Universal: {
        getDocHandler: function (docId) {
            const key = String(docId || '')
                .replace(/^doc-/, '')
                .replace(/-/g, '_')
                .toUpperCase();
            return App.Docs[key] || null;
        },
        getInstanceCode: function () {
            const params = new URLSearchParams(window.location.search);
            return (params.get('instance') || '').trim();
        },
        isNewMode: function () {
            const params = new URLSearchParams(window.location.search);
            const value = String(params.get('new') || '').trim().toLowerCase();
            return value === '1' || value === 'true' || value === 'yes';
        },
        setInstanceCode: function (instanceCode) {
            if (!instanceCode) return;
            const url = new URL(window.location.href);
            url.searchParams.set('instance', instanceCode);
            window.history.replaceState({}, '', url.toString());
        },
        getStorageKey: function (docId, instanceCode = '') {
            const code = String(instanceCode || this.getInstanceCode() || '').trim();
            return code ? `xelle_${docId}_${code}` : `xelle_${docId}`;
        },
        getSession: function () {
            try {
                return JSON.parse(localStorage.getItem('xelle_session') || 'null') || null;
            } catch (e) {
                return null;
            }
        },
        getCurrentUserId: function () {
            const session = this.getSession();
            const raw = session?.id ?? session?.userId ?? session?.user_id ?? null;
            const parsed = Number(raw);
            return Number.isFinite(parsed) ? parsed : null;
        },
        getFormatType: function (docId) {
            const barcodeInput = document.querySelector('.generate-barcode');
            const prefix = (barcodeInput?.dataset?.prefix || '').trim();
            if (prefix) return prefix.replace(/-$/, '');
            return String(docId || '').replace(/^doc-/, '').toUpperCase();
        },
        getFieldKey: function (el, index) {
            if (el.id) return `id:${el.id}`;
            if (el.name) return `name:${el.name}`;
            return `idx:${index}`;
        },
        collectData: function () {
            const data = {};
            const fields = Array.from(document.querySelectorAll('input, select, textarea'))
                .filter(el => el.type !== 'submit');

            fields.forEach((el, index) => {
                const key = this.getFieldKey(el, index);
                if (el.type === 'checkbox') {
                    data[key] = el.checked;
                } else if (el.type === 'radio') {
                    if (el.checked) data[key] = el.value;
                } else {
                    data[key] = el.value;
                }
            });

            return data;
        },
        applyDataToForm: function (data) {
            if (!data || typeof data !== 'object') return;
            const fields = Array.from(document.querySelectorAll('input, select, textarea'))
                .filter(el => el.type !== 'submit');

            fields.forEach((el, index) => {
                const key = this.getFieldKey(el, index);
                if (!(key in data)) return;
                const value = data[key];

                if (el.type === 'checkbox') {
                    el.checked = Boolean(value);
                } else if (el.type === 'radio') {
                    el.checked = String(el.value) === String(value);
                } else {
                    el.value = value ?? '';
                }

                el.dispatchEvent(new Event('input'));
                el.dispatchEvent(new Event('change'));
            });
        },
        ensureBarcodeValueFromCode: function (instanceCode) {
            const barcodeInput = document.querySelector('.generate-barcode');
            if (!barcodeInput || !instanceCode) return;

            const prefix = barcodeInput.dataset.prefix || '';
            let raw = instanceCode;
            if (prefix && instanceCode.startsWith(prefix)) {
                raw = instanceCode.slice(prefix.length);
            }
            barcodeInput.value = raw;
            barcodeInput.dispatchEvent(new Event('input'));
        },
        resolveOrCreateInstanceCode: async function (docId) {
            const fromQuery = this.getInstanceCode();
            if (fromQuery) return fromQuery;

            const barcodeInput = document.querySelector('.generate-barcode');
            const prefix = barcodeInput?.dataset?.prefix || '';
            const barcodeValue = String(barcodeInput?.value || '').trim();
            if (barcodeValue) return `${prefix}${barcodeValue}`;

            const formatType = this.getFormatType(docId);
            const response = await fetch(`${API_URL}/formats/generate-unique-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ format_type: formatType })
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok || !payload.unique_code) {
                throw new Error(payload.msg || 'No se pudo generar código único');
            }
            return String(payload.unique_code).trim();
        },
        persistInstance: async function (docId, data) {
            const barcodeInput = document.querySelector('.generate-barcode');
            const prefix = barcodeInput?.dataset?.prefix || '';
            const manualRaw = String(barcodeInput?.value || '').trim();
            const hasManualCode = Boolean(manualRaw);
            const manualUniqueCode = hasManualCode ? `${prefix}${manualRaw}` : '';
            const queryInstanceCode = this.getInstanceCode();
            const shouldUpdateExisting = Boolean(queryInstanceCode)
                && (!hasManualCode || manualUniqueCode === queryInstanceCode);
            let uniqueCode = queryInstanceCode || manualUniqueCode;
            if (!uniqueCode) {
                uniqueCode = await this.resolveOrCreateInstanceCode(docId);
            }
            const userId = this.getCurrentUserId();
            const formatType = this.getFormatType(docId);

            const payload = {
                unique_code: uniqueCode,
                format_type: formatType,
                status: 'DRAFT',
                data_payload: data,
                user_id: userId,
                notes: ''
            };

            let response;
            if (shouldUpdateExisting) {
                response = await fetch(`${API_URL}/format-instances/${encodeURIComponent(queryInstanceCode)}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'DRAFT', data_payload: data, user_id: userId })
                });

                if (!response.ok) {
                    response = await fetch(`${API_URL}/format-instances`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                }
            } else {
                response = await fetch(`${API_URL}/format-instances`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    if (!hasManualCode) {
                        uniqueCode = await this.resolveOrCreateInstanceCode(docId);
                        response = await fetch(`${API_URL}/format-instances`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                unique_code: uniqueCode,
                                format_type: formatType,
                                status: 'DRAFT',
                                data_payload: data,
                                user_id: userId,
                                notes: ''
                            })
                        });
                    } else {
                        throw new Error('El código único ya existe. Usa otro folio para guardar.');
                    }
                }
            }

            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(result.msg || 'No se pudo guardar en servidor');
            }

            this.setInstanceCode(uniqueCode);
            this.ensureBarcodeValueFromCode(uniqueCode);
            return uniqueCode;
        },
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
        saveData: async function () {
            const docId = document.body.id;
            const data = this.collectData();
            const docHandler = this.getDocHandler(docId);
            if (docHandler?.getCustomData) {
                Object.assign(data, docHandler.getCustomData());
            }

            const draftKey = this.getStorageKey(docId);
            localStorage.setItem(draftKey, JSON.stringify(data));

            try {
                const instanceCode = await this.persistInstance(docId, data);
                const instanceKey = this.getStorageKey(docId, instanceCode);
                localStorage.setItem(instanceKey, JSON.stringify(data));
                Swal.fire({ icon: 'success', title: 'Guardado', timer: 1100, showConfirmButton: false });
            } catch (e) {
                Swal.fire({ icon: 'warning', title: 'Guardado local', text: e.message || 'No se pudo sincronizar con servidor', timer: 1800, showConfirmButton: false });
            }
        },
        loadData: async function (docId) {
            let data = null;
            const instanceCode = this.getInstanceCode();
            const isNewMode = this.isNewMode();

            if (instanceCode) {
                try {
                    const response = await fetch(`${API_URL}/format-instances/${encodeURIComponent(instanceCode)}`);
                    const payload = await response.json().catch(() => ({}));
                    if (response.ok && payload && payload.data_payload && typeof payload.data_payload === 'object') {
                        data = payload.data_payload;
                        this.ensureBarcodeValueFromCode(instanceCode);
                        localStorage.setItem(this.getStorageKey(docId, instanceCode), JSON.stringify(data));
                    }
                } catch (e) { }
            }

            if (!data && !isNewMode) {
                const saved = localStorage.getItem(this.getStorageKey(docId, instanceCode))
                    || localStorage.getItem(`xelle_${docId}`);
                if (saved) {
                    try {
                        data = JSON.parse(saved);
                    } catch (e) {
                        data = null;
                    }
                }
            }

            if (!data) return;

            const docHandler = this.getDocHandler(docId);
            if (docHandler?.loadCustomData) docHandler.loadCustomData(data);
            this.applyDataToForm(data);
        },
        clearForm: function () {
            Swal.fire({
                title: '¿Limpiar todo?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sí'
            }).then((result) => {
                if (result.isConfirmed) {
                    const docId = document.body.id;
                    localStorage.removeItem(this.getStorageKey(docId));
                    localStorage.removeItem(`xelle_${docId}`);
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
            manualGrandTotals: {
                vials: false,
                cells: false
            },
            inventoryManualOverride: {
                "Stem Xelle": false,
                "Hybrid Xelle": false,
                "Stem Ortho": false,
                "Hybrid Ortho": false,
                "Exosomas": false
            },
            productsDB: {
                "Stem Xelle": { lotPre: "XCM", pres: ["10M", "25M", "50M", "100M", "Especial"] },
                "Hybrid Xelle": { lotPre: "XHY", pres: ["10M+1B", "25M+2B", "50M+5B", "60M+6B", "100M+10B", "Especial"] },
                "Stem Ortho": { lotPre: "XOR", pres: ["10M", "25M", "50M", "100M", "Especial"] },
                "Hybrid Ortho": { lotPre: "XHO", pres: ["10M+1B", "25M+2B", "50M+5B", "60M+6B", "100M+10B", "Especial"] },
                "Exosomas": { lotPre: "EXO", pres: ["3B", "9B", "15B", "30B", "75B", "90B", "Especial"] }
            },
            init: function () {
                if (document.querySelectorAll('#tbl-dosis tbody tr').length === 0) this.addDosis();
                const fechaOperacion = document.getElementById('fecha_operacion');
                if (fechaOperacion) {
                    fechaOperacion.addEventListener('change', () => {
                        document.querySelectorAll('#tbl-dosis tbody tr').forEach(r => {
                            const prodSelect = r.querySelector('.prod-select');
                            if (prodSelect && prodSelect.value) this.onProd(prodSelect);
                        });
                    });
                }
                this.calcInventory();
            },
            productToFieldId: function (product) {
                switch (product) {
                    case 'Stem Xelle': return 'cell-stem';
                    case 'Hybrid Xelle': return 'cell-hybrid';
                    case 'Stem Ortho': return 'cell-stem-ortho';
                    case 'Hybrid Ortho': return 'cell-hybrid-ortho';
                    case 'Exosomas': return 'cell-exo';
                    default: return '';
                }
            },
            onCellSummaryInput: function (inputEl) {
                const fieldToProduct = {
                    'cell-stem': 'Stem Xelle',
                    'cell-hybrid': 'Hybrid Xelle',
                    'cell-stem-ortho': 'Stem Ortho',
                    'cell-hybrid-ortho': 'Hybrid Ortho',
                    'cell-exo': 'Exosomas'
                };

                const product = fieldToProduct[inputEl?.id || ''];
                if (!product) return;

                const valueMillions = this.parseMillions(inputEl.value);
                if (valueMillions === null || valueMillions <= 0) {
                    this.inventoryManualOverride[product] = false;
                    inputEl.value = '0';
                } else {
                    this.inventoryManualOverride[product] = true;
                    inputEl.value = this.formatCellsDisplay(this.normalizeMillions(valueMillions, product));
                }

                this.updateGrandTotalCellsFromSummary();
            },
            onGrandTotalVialsInput: function (inputEl) {
                const n = Number(inputEl?.value);
                if (!Number.isFinite(n) || n < 0) {
                    this.manualGrandTotals.vials = false;
                    this.calcInventory();
                    return;
                }

                this.manualGrandTotals.vials = true;
                inputEl.value = String(Math.floor(n));
            },
            onGrandTotalCellsInput: function (inputEl) {
                const millions = this.parseMillions(inputEl?.value || '');
                if (millions === null || millions <= 0) {
                    this.manualGrandTotals.cells = false;
                    this.calcInventory();
                    return;
                }

                this.manualGrandTotals.cells = true;
                inputEl.value = this.formatCellsDisplay(millions);
            },
            updateGrandTotalCellsFromSummary: function () {
                const ids = ['cell-stem', 'cell-hybrid', 'cell-stem-ortho', 'cell-hybrid-ortho', 'cell-exo'];
                const total = ids.reduce((acc, id) => {
                    const el = document.getElementById(id);
                    const val = this.parseMillions(el?.value || '0') || 0;
                    return acc + val;
                }, 0);

                if (!this.manualGrandTotals.cells) {
                    document.getElementById('grand-tot-cells').value = this.formatCellsDisplay(total);
                }
            },
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
        <input type="text" class="cedit special-pres-input" style="display:none; margin-top:2px; border:1px solid #2e9d82;" placeholder="¿Cuál?" oninput="App.Docs.FO_LC_24.syncRowCellCount(this.closest('tr')); App.Docs.FO_LC_24.calcInventory()">
    </td>
    <td><input class="cedit cell-count-input" placeholder="No." oninput="App.Docs.FO_LC_24.calcInventory()"></td>
    <td><input class="cedit" placeholder="Venta"></td>
    <td><input class="cedit unique-code" readonly style="font-weight:bold;color:#2980b9"></td>
    <td><input class="cedit obs-input" placeholder="Obs" oninput="App.Docs.FO_LC_24.calcInventory()"></td>
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
                this.syncRowCellCount(r);
                this.calcInventory();
            },
            parseMillions: function (rawValue) {
                const raw = String(rawValue || '').trim();
                if (!raw) return null;

                const clean = raw.replace(',', '.');

                let match = clean.match(/(\d+(?:\.\d+)?)\s*[xX]\s*10\s*[eE]?\s*6/);
                if (match) return Number(match[1]);

                match = clean.match(/(\d+(?:\.\d+)?)\s*[mM]\b/);
                if (match) return Number(match[1]);

                const numeric = Number(clean.replace(/[^0-9.\-]/g, ''));
                if (!Number.isFinite(numeric) || numeric <= 0) return null;

                if (numeric >= 1000000) {
                    return numeric / 1000000;
                }

                return numeric;
            },
            parseMillionsFromPresentation: function (presentationValue, specialValue) {
                const base = String(presentationValue || '').trim();
                if (!base) return null;

                if (base === 'Especial') {
                    return this.parseMillions(specialValue);
                }

                const millionPart = base.split('+')[0];
                return this.parseMillions(millionPart);
            },
            normalizeMillions: function (millions, product) {
                if (!Number.isFinite(millions) || millions <= 0) return 0;
                if (product === 'Exosomas') return millions;
                return Math.max(10, millions);
            },
            formatMillionsValue: function (millions) {
                if (!Number.isFinite(millions) || millions <= 0) return '0';
                if (Number.isInteger(millions)) return String(millions);
                return millions.toFixed(2).replace(/\.00$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
            },
            syncRowCellCount: function (row) {
                const product = row.querySelector('.prod-select')?.value || '';
                if (!product || product === 'Exosomas') return;

                const cellInput = row.querySelector('.cell-count-input');
                const presValue = row.querySelector('.pres-select')?.value || '';
                const specialPres = row.querySelector('.special-pres-input')?.value || '';

                const inputMillions = this.parseMillions(cellInput?.value || '');
                const presMillions = this.parseMillionsFromPresentation(presValue, specialPres);
                const normalized = this.normalizeMillions(inputMillions ?? presMillions ?? 0, product);

                if (cellInput && normalized > 0) {
                    cellInput.value = `${this.formatMillionsValue(normalized)}M`;
                }
            },
            getRowMillions: function (row) {
                const product = row.querySelector('.prod-select')?.value || '';
                if (!product) return 0;

                const cellInput = row.querySelector('.cell-count-input');
                const presValue = row.querySelector('.pres-select')?.value || '';
                const specialPres = row.querySelector('.special-pres-input')?.value || '';

                const inputMillions = this.parseMillions(cellInput?.value || '');
                const presMillions = this.parseMillionsFromPresentation(presValue, specialPres);
                const rawMillions = inputMillions ?? presMillions ?? 0;
                const normalized = this.normalizeMillions(rawMillions, product);

                if (cellInput && normalized > 0 && product !== 'Exosomas') {
                    cellInput.value = `${this.formatMillionsValue(normalized)}M`;
                }

                return normalized;
            },
            formatCellsDisplay: function (millions) {
                if (!Number.isFinite(millions) || millions <= 0) return '0';
                return `${this.formatMillionsValue(millions)}x10E6`;
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
                const c = { "Stem Xelle": 0, "Hybrid Xelle": 0, "Stem Ortho": 0, "Hybrid Ortho": 0, "Exosomas": 0 };
                document.querySelectorAll('#tbl-dosis tbody tr').forEach(r => {
                    const obs = r.querySelector('.obs-input').value;
                    if (!obs) {
                        const p = r.querySelector('.prod-select').value;
                        if (t[p] !== undefined) {
                            t[p]++;
                            c[p] += this.getRowMillions(r);
                        }
                    }
                });

                const totalVials = t["Stem Xelle"] + t["Hybrid Xelle"] + t["Stem Ortho"] + t["Hybrid Ortho"] + t["Exosomas"];
                const totalCells = c["Stem Xelle"] + c["Hybrid Xelle"] + c["Stem Ortho"] + c["Hybrid Ortho"] + c["Exosomas"];

                document.getElementById('tot-stem').value = t["Stem Xelle"];
                document.getElementById('tot-hybrid').value = t["Hybrid Xelle"];
                document.getElementById('tot-stem-ortho').value = t["Stem Ortho"];
                document.getElementById('tot-hybrid-ortho').value = t["Hybrid Ortho"];
                document.getElementById('tot-exo').value = t["Exosomas"];
                if (!this.manualGrandTotals.vials) {
                    document.getElementById('grand-tot-vials').value = totalVials;
                }

                ["Stem Xelle", "Hybrid Xelle", "Stem Ortho", "Hybrid Ortho", "Exosomas"].forEach(product => {
                    const fieldId = this.productToFieldId(product);
                    if (!fieldId) return;
                    const fieldEl = document.getElementById(fieldId);
                    if (!fieldEl) return;

                    if (!this.inventoryManualOverride[product]) {
                        fieldEl.value = this.formatCellsDisplay(c[product]);
                    }
                });

                const hasManual = Object.values(this.inventoryManualOverride).some(Boolean);
                const computedGrandCells = hasManual
                    ? this.formatCellsDisplay(
                        (this.parseMillions(document.getElementById('cell-stem')?.value || '0') || 0)
                        + (this.parseMillions(document.getElementById('cell-hybrid')?.value || '0') || 0)
                        + (this.parseMillions(document.getElementById('cell-stem-ortho')?.value || '0') || 0)
                        + (this.parseMillions(document.getElementById('cell-hybrid-ortho')?.value || '0') || 0)
                        + (this.parseMillions(document.getElementById('cell-exo')?.value || '0') || 0)
                    )
                    : this.formatCellsDisplay(totalCells);

                if (!this.manualGrandTotals.cells) {
                    document.getElementById('grand-tot-cells').value = computedGrandCells;
                }
            },
            getCustomData: function () {
                const dosisRows = [];
                document.querySelectorAll('#tbl-dosis tbody tr').forEach(r => {
                    const presValue = r.querySelector('.pres-select')?.value || '';
                    const specialPres = r.querySelector('.special-pres-input')?.value || '';
                    dosisRows.push({
                        producto: r.querySelector('.prod-select')?.value || '',
                        origen: r.querySelector('.origin-input')?.value || '',
                        caducidad: r.querySelector('td:nth-child(4) input')?.value || '',
                        lote: r.querySelector('.lote-input')?.value || '',
                        presentacion: presValue,
                        presentacionEspecial: specialPres,
                        numeroCelulas: r.querySelector('.cell-count-input')?.value || '',
                        codigoVenta: r.querySelector('td:nth-child(8) input')?.value || '',
                        codigoUnico: r.querySelector('.unique-code')?.value || '',
                        observaciones: r.querySelector('.obs-input')?.value || ''
                    });
                });

                const insumosRows = [];
                document.querySelectorAll('#tbl-insumos tbody tr').forEach(r => {
                    insumosRows.push(Array.from(r.querySelectorAll('input')).map(i => i.value));
                });

                this.persistDailySummary(dosisRows);

                return {
                    t_dosis: dosisRows,
                    t_insumos_24: insumosRows
                };
            },
            loadCustomData: function (data) {
                if (Array.isArray(data.t_insumos_24)) {
                    const tbodyInsumos = document.querySelector('#tbl-insumos tbody');
                    if (tbodyInsumos) {
                        tbodyInsumos.innerHTML = '';
                        data.t_insumos_24.forEach(rowData => {
                            if (typeof window.addInsumoRow24 === 'function') window.addInsumoRow24();
                            const row = tbodyInsumos.lastElementChild;
                            if (!row) return;
                            const inputs = row.querySelectorAll('input');
                            rowData.forEach((value, idx) => {
                                if (inputs[idx]) inputs[idx].value = value || '';
                            });
                        });
                    }
                }

                if (Array.isArray(data.t_dosis)) {
                    const tbodyDosis = document.querySelector('#tbl-dosis tbody');
                    if (tbodyDosis) {
                        tbodyDosis.innerHTML = '';
                        data.t_dosis.forEach(rowData => {
                            this.addDosis();
                            const row = tbodyDosis.lastElementChild;
                            if (!row) return;

                            const prodSelect = row.querySelector('.prod-select');
                            const presSelect = row.querySelector('.pres-select');
                            const specialInput = row.querySelector('.special-pres-input');

                            if (prodSelect) {
                                prodSelect.value = rowData.producto || '';
                                this.onProd(prodSelect);
                            }

                            const cadInput = row.querySelector('td:nth-child(4) input');
                            const ventaInput = row.querySelector('td:nth-child(8) input');

                            if (row.querySelector('.origin-input')) row.querySelector('.origin-input').value = rowData.origen || '';
                            if (cadInput) cadInput.value = rowData.caducidad || '';
                            if (row.querySelector('.lote-input')) row.querySelector('.lote-input').value = rowData.lote || '';

                            if (presSelect) {
                                presSelect.value = rowData.presentacion || '';
                                this.onPresChange(presSelect);
                            }
                            if (specialInput) specialInput.value = rowData.presentacionEspecial || '';

                            if (row.querySelector('.cell-count-input')) row.querySelector('.cell-count-input').value = rowData.numeroCelulas || '';
                            if (ventaInput) ventaInput.value = rowData.codigoVenta || '';
                            if (row.querySelector('.unique-code')) row.querySelector('.unique-code').value = rowData.codigoUnico || '';
                            if (row.querySelector('.obs-input')) row.querySelector('.obs-input').value = rowData.observaciones || '';
                        });
                    }
                }

                this.reindex();
                this.calcInventory();
                this.updateGrandTotalCellsFromSummary();
            },
            persistDailySummary: function (dosisRows) {
                const fechaOperacion = document.getElementById('fecha_operacion')?.value;
                if (!fechaOperacion || !Array.isArray(dosisRows)) return;

                const reg24Input = document.getElementById('reg-24');
                let folio = (reg24Input?.value || '').trim();
                if (!folio) {
                    const now = new Date();
                    const hh = String(now.getHours()).padStart(2, '0');
                    const mm = String(now.getMinutes()).padStart(2, '0');
                    const ss = String(now.getSeconds()).padStart(2, '0');
                    folio = `${fechaOperacion.replace(/-/g, '')}${hh}${mm}${ss}`;
                    if (reg24Input) {
                        reg24Input.value = folio;
                        reg24Input.dispatchEvent(new Event('input'));
                    }
                }
                const barcodeCode = `FO-LC-24-${folio}`;

                const grouped = {};
                dosisRows.forEach(row => {
                    if (row.observaciones) return;
                    const producto = (row.producto || '').trim();
                    if (!producto) return;

                    const presentacionBase = (row.presentacion || '').trim();
                    const presentacion = presentacionBase === 'Especial'
                        ? (`Especial: ${(row.presentacionEspecial || '').trim() || 'Sin especificar'}`)
                        : (presentacionBase || 'Sin especificar');

                    const key = `${producto}||${presentacion}`;
                    if (!grouped[key]) {
                        grouped[key] = {
                            producto,
                            presentacion,
                            cantidad: 0,
                            lotes: new Set(),
                            codigosUnicos: []
                        };
                    }

                    grouped[key].cantidad += 1;
                    if (row.lote) grouped[key].lotes.add(row.lote);
                    if (row.codigoUnico) grouped[key].codigosUnicos.push(row.codigoUnico);
                });

                const items = Object.values(grouped).map(item => ({
                    producto: item.producto,
                    presentacion: item.presentacion,
                    cantidad: item.cantidad,
                    lotes: Array.from(item.lotes),
                    codigosUnicos: item.codigosUnicos
                }));

                const payload = {
                    fechaOperacion,
                    folio,
                    barcodeCode,
                    generatedAt: new Date().toISOString(),
                    dosisRows,
                    items
                };

                localStorage.setItem(`xelle_fo_lc_24_daily_${fechaOperacion}`, JSON.stringify(payload));
                localStorage.setItem(`xelle_fo_lc_24_daily_${fechaOperacion}_${folio}`, JSON.stringify(payload));
                localStorage.setItem('xelle_fo_lc_24_daily_latest', JSON.stringify(payload));

                const recordsRaw = localStorage.getItem('xelle_fo_lc_24_records');
                let records = [];
                try {
                    const parsed = JSON.parse(recordsRaw || '[]');
                    if (Array.isArray(parsed)) records = parsed;
                } catch (e) { }

                const idx = records.findIndex(r => (r?.barcodeCode || '') === barcodeCode && (r?.fechaOperacion || '') === fechaOperacion);
                const record = {
                    fechaOperacion,
                    folio,
                    barcodeCode,
                    savedAt: payload.generatedAt,
                    dosisRows,
                    items
                };

                if (idx >= 0) records[idx] = record;
                else records.push(record);

                localStorage.setItem('xelle_fo_lc_24_records', JSON.stringify(records));
            }
        },

        FO_LC_31: {
            init: function () { },
            scrapeRow: function (row) {
                return Array.from(row.querySelectorAll('input, select, textarea')).map(el => {
                    if (el.type === 'checkbox') return el.checked;
                    return el.value;
                });
            },
            fillRow: function (row, data) {
                const fields = row.querySelectorAll('input, select, textarea');
                (data || []).forEach((value, idx) => {
                    const el = fields[idx];
                    if (!el) return;
                    if (el.type === 'checkbox') el.checked = Boolean(value);
                    else el.value = value ?? '';
                    el.dispatchEvent(new Event('input'));
                    el.dispatchEvent(new Event('change'));
                });
            },
            rebuildTable: function (tableSelector, rowsData, addRowFnName) {
                const tbody = document.querySelector(`${tableSelector} tbody`);
                if (!tbody || !Array.isArray(rowsData)) return;
                tbody.innerHTML = '';
                rowsData.forEach(rowData => {
                    if (typeof window[addRowFnName] === 'function') {
                        window[addRowFnName]();
                        const row = tbody.lastElementChild;
                        if (row) this.fillRow(row, rowData);
                    }
                });
            },
            getCustomData: function () {
                const componentes = Array.from(document.querySelectorAll('#tbl-componentes tbody tr')).map(r => this.scrapeRow(r));
                const materiales = Array.from(document.querySelectorAll('#tbl-materiales tbody tr')).map(r => this.scrapeRow(r));
                const controles = Array.from(document.querySelectorAll('#tbl-control tbody tr')).map(r => this.scrapeRow(r));
                return {
                    t_comp_30: componentes,
                    t_mat_30: materiales,
                    t_control_30: controles
                };
            },
            loadCustomData: function (data) {
                if (Array.isArray(data?.t_comp_30)) this.rebuildTable('#tbl-componentes', data.t_comp_30, 'addCompRow');
                if (Array.isArray(data?.t_mat_30)) this.rebuildTable('#tbl-materiales', data.t_mat_30, 'addMatRow');
                if (Array.isArray(data?.t_control_30)) this.rebuildTable('#tbl-control', data.t_control_30, 'addControlRow');

                if (typeof window.updateProductLogic === 'function') window.updateProductLogic();
                if (typeof window.calcYield === 'function') window.calcYield();
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