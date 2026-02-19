/**
 * FORMAT-APP-COMERCIAL.JS - V2.2 ACTUALIZADO
 * Módulo Comercial: Pedido (15) -> Surtido (16) -> Remisión (17)
 * Actualización: Catálogo basado en "Manual de preparación de dosis"
 */

const AppCom = {
    config: {
        // BASE DE DATOS MAESTRA DE PRODUCTOS Y PRESENTACIONES
        DB_PRODUCTS: {
            // --- PRODUCTOS CELULARES ---
            "Stem Xelle": {
                lotPre: "XCM",
                pres: ["10 M", "25 M", "50 M", "100 M"]
            },
            "Stem Ortho": {
                lotPre: "XOR",
                pres: ["10 M", "25 M", "50 M", "100 M"]
            },
            "Hybrid Xelle": {
                lotPre: "XHY",
                pres: ["10M + 1B", "25M + 2B", "50M + 5B", "60M + 6B", "100M + 10B"]
            },
            "Hybrid Ortho": {
                lotPre: "XHO",
                pres: ["10M + 1B", "25M + 2B", "50M + 5B", "60M + 6B", "100M + 10B"]
            },

            // --- PRODUCTOS ACELULARES / BIOINGENIERÍA ---
            "X-Breath Nebulizer": {
                lotPre: "XNB",
                pres: ["Única"]
            },
            "X-Exosomes": {
                lotPre: "EXO",
                pres: ["3B", "9B", "15B", "30B", "75B", "90B"]
            },
            "X-Exosomes HA": {
                lotPre: "XHA",
                pres: ["Única"]
            },
            "X-Implant": {
                lotPre: "XIM",
                pres: ["1 G", "2 G"]
            },
            "X-Wound Care": {
                lotPre: "XWC",
                pres: ["5 x 5", "10 x 10", "10 x 15"]
            }
        }
    },

    state: {
        apiUrl: '/api',
        formatType: null,
        instanceCode: null,
        loadedFromBackend: false
    },

    init: function () {
        const docId = document.body.id;
        console.log("Iniciando App Comercial V2.2 para:", docId);

        this.Api.setup();

        this.Universal.setupDateInputs();
        this.Universal.setupBarcodes();
        this.Universal.loadData(docId);
        this.Universal.setupPrintHandler();

        // Inicializadores específicos
        switch (docId) {
            case 'doc-fo-op-15': this.FO_OP_15.init(); break;
            case 'doc-fo-op-16': this.FO_OP_16.init(); break;
            case 'doc-fo-op-17': this.FO_OP_17.init(); break;
        }

        this.Api.loadInstanceFromQuery();
    },

    Api: {
        setup: function () {
            const filename = (window.location.pathname.split('/').pop() || '').toUpperCase();
            AppCom.state.formatType = filename.replace('.HTML', '');
            const params = new URLSearchParams(window.location.search);
            const fromQuery = (params.get('instance') || '').trim();
            if (fromQuery) {
                AppCom.state.instanceCode = fromQuery;
            }
        },

        getSessionUserId: function () {
            try {
                const session = JSON.parse(localStorage.getItem('xelle_session') || 'null');
                return session?.id || null;
            } catch (_) {
                return null;
            }
        },

        getRegistryInput: function () {
            return document.querySelector('.registry-input.generate-barcode');
        },

        setRegistryCode: function (code) {
            const input = this.getRegistryInput();
            if (!input || !code) {
                return;
            }
            input.value = code;
            input.dispatchEvent(new Event('input'));
            input.dispatchEvent(new Event('change'));
        },

        ensureUniqueCode: async function () {
            const current = (this.getRegistryInput()?.value || '').trim();
            if (current) {
                AppCom.state.instanceCode = current;
                return current;
            }

            const response = await fetch(`${AppCom.state.apiUrl}/formats/generate-unique-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ format_type: AppCom.state.formatType })
            });

            if (!response.ok) {
                throw new Error('No fue posible generar código único.');
            }

            const data = await response.json();
            const generated = data.unique_code;
            AppCom.state.instanceCode = generated;
            this.setRegistryCode(generated);
            return generated;
        },

        loadInstanceFromQuery: async function () {
            if (!AppCom.state.instanceCode) {
                return;
            }
            try {
                const response = await fetch(`${AppCom.state.apiUrl}/format-instances/${encodeURIComponent(AppCom.state.instanceCode)}`);
                if (!response.ok) {
                    return;
                }
                const instance = await response.json();
                if (instance?.data_payload && typeof instance.data_payload === 'object') {
                    AppCom.Universal.applyData(instance.data_payload);
                }
                this.setRegistryCode(AppCom.state.instanceCode);
                AppCom.state.loadedFromBackend = true;
            } catch (_) {
                // Si falla backend, se conserva carga local
            }
        },

        saveToBackend: async function (dataPayload) {
            const uniqueCode = await this.ensureUniqueCode();
            const payload = {
                unique_code: uniqueCode,
                format_type: AppCom.state.formatType,
                status: 'DRAFT',
                data_payload: dataPayload,
                user_id: this.getSessionUserId(),
                notes: ''
            };

            if (AppCom.state.loadedFromBackend) {
                const updateResponse = await fetch(`${AppCom.state.apiUrl}/format-instances/${encodeURIComponent(uniqueCode)}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!updateResponse.ok) {
                    throw new Error('No fue posible actualizar la tarjeta en backend.');
                }
                return uniqueCode;
            }

            const createResponse = await fetch(`${AppCom.state.apiUrl}/format-instances`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (createResponse.ok) {
                AppCom.state.loadedFromBackend = true;
                return uniqueCode;
            }

            const errorBody = await createResponse.json().catch(() => ({}));
            const message = (errorBody.msg || '').toLowerCase();
            if (message.includes('ya existe')) {
                const updateResponse = await fetch(`${AppCom.state.apiUrl}/format-instances/${encodeURIComponent(uniqueCode)}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!updateResponse.ok) {
                    throw new Error('No fue posible actualizar la tarjeta en backend.');
                }
                AppCom.state.loadedFromBackend = true;
                return uniqueCode;
            }

            throw new Error(errorBody.msg || 'No fue posible guardar la tarjeta en backend.');
        }
    },

    Universal: {
        setupDateInputs: function () {
            document.querySelectorAll('input[type="date"]').forEach(input => {
                // Solo autollenar si está vacío y no tiene la clase 'no-auto-date'
                if (!input.value && !input.classList.contains('no-auto-date')) {
                    input.valueAsDate = new Date();
                }
            });
        },
        setupBarcodes: function () {
            const process = (input) => {
                const prefix = input.dataset.prefix || '';
                const val = input.value;
                if (val && window.JsBarcode) {
                    try {
                        // Genera código concatenado: Prefijo + Valor (Ej: FO-OP-15-001)
                        JsBarcode(`#${input.dataset.target}`, prefix + val, {
                            format: "CODE128",
                            height: 30,
                            displayValue: true,
                            fontSize: 10,
                            margin: 0
                        });
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
                // Convierte selects a texto visible para impresión limpia
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
        saveData: async function () {
            const docId = document.body.id;
            const data = {};

            // Guardar inputs básicos
            document.querySelectorAll('input, select, textarea').forEach(el => {
                if ((el.id || el.name) && el.type !== 'submit' && !el.closest('tr')) {
                    if (el.type === 'checkbox') data[el.id || el.name] = el.checked;
                    else if (el.type === 'radio') { if (el.checked) data[el.name] = el.value; }
                    else data[el.id || el.name] = el.value;
                }
            });

            // Guardar tablas dinámicas
            const modName = docId.replace(/-/g, '_').toUpperCase().replace('DOC_', '');
            if (AppCom[modName] && AppCom[modName].getCustomData) {
                Object.assign(data, AppCom[modName].getCustomData());
            }

            // Persistencia Local
            localStorage.setItem(`xelle_comercial_${docId}`, JSON.stringify(data));
            try {
                const code = await AppCom.Api.saveToBackend(data);
                Swal.fire({ icon: 'success', title: 'Guardado', text: `Código único: ${code}`, timer: 1300, showConfirmButton: false });
            } catch (error) {
                Swal.fire({ icon: 'warning', title: 'Guardado local', text: error.message || 'No se pudo guardar en backend.' });
            }
        },
        loadData: function (docId) {
            const saved = localStorage.getItem(`xelle_comercial_${docId}`);
            if (!saved) return;
            const data = JSON.parse(saved);
            this.applyData(data);
        },
        applyData: function (data) {

            // Cargar inputs básicos
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

            // Cargar tablas dinámicas
            const docId = document.body.id;
            const modName = docId.replace(/-/g, '_').toUpperCase().replace('DOC_', '');
            if (AppCom[modName] && AppCom[modName].loadCustomData) {
                AppCom[modName].loadCustomData(data);
            }
        },
        clearForm: function () {
            Swal.fire({
                title: '¿Limpiar todo?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                confirmButtonText: 'Sí'
            }).then((result) => {
                if (result.isConfirmed) {
                    localStorage.removeItem(`xelle_comercial_${document.body.id}`);
                    location.reload();
                }
            });
        },
        printForm: function () { window.print(); },

        // --- UTILIDADES DE PRODUCTOS ---
        fillProdSelect: function (selectElement) {
            const prods = Object.keys(AppCom.config.DB_PRODUCTS).map(p => `<option value="${p}">${p}</option>`).join('');
            selectElement.innerHTML = `<option value="">Seleccionar Producto...</option>${prods}`;
        },
        onProdChange: function (selectElement) {
            const row = selectElement.closest('tr');
            const val = selectElement.value;
            const presSelect = row.querySelector('.pres-select');

            if (!presSelect) return;
            presSelect.innerHTML = '<option>-</option>';

            if (val && AppCom.config.DB_PRODUCTS[val]) {
                AppCom.config.DB_PRODUCTS[val].pres.forEach(p => {
                    presSelect.add(new Option(p, p));
                });
            }
        }
    },

    // --- FO-OP-15: PEDIDO MAESTRO ---
    FO_OP_15: {
        init: function () {
            if (document.querySelector('#tbl-pedidos tbody').children.length === 0) this.addPedidoRow();
        },
        addPedidoRow: function () {
            const r = document.createElement('tr');
            r.innerHTML = `
                <td><input type="number" class="cedit text-center" placeholder="1"></td>
                <td><select class="cedit prod-select" onchange="AppCom.Universal.onProdChange(this)"></select></td>
                <td><select class="cedit pres-select"><option>-</option></select></td>
                <td><select class="cedit"><option>Stock (Almacén)</option><option>Producción (Lab)</option></select></td>
                <td><input type="date" class="cedit"></td>
                <td class="no-print"><button class="btn btn-danger btn-mini" onclick="this.closest('tr').remove()">x</button></td>`;
            document.querySelector('#tbl-pedidos tbody').appendChild(r);
            AppCom.Universal.fillProdSelect(r.querySelector('.prod-select'));
        },
        getCustomData: function () {
            const r = [];
            document.querySelectorAll('#tbl-pedidos tbody tr').forEach(tr => {
                const i = tr.querySelectorAll('input, select');
                r.push({ c: i[0].value, p: i[1].value, pr: i[2].value, o: i[3].value, f: i[4].value });
            });
            return { t_ped: r };
        },
        loadCustomData: function (d) {
            if (d.t_ped) {
                const tb = document.querySelector('#tbl-pedidos tbody'); tb.innerHTML = '';
                d.t_ped.forEach(x => {
                    this.addPedidoRow();
                    const i = tb.lastElementChild.querySelectorAll('input, select');
                    i[0].value = x.c;
                    i[1].value = x.p;
                    AppCom.Universal.onProdChange(i[1]);
                    i[2].value = x.pr;
                    i[3].value = x.o;
                    i[4].value = x.f;
                });
            }
        }
    },

    // --- FO-OP-16: SURTIDO ---
    FO_OP_16: {
        init: function () {
            if (document.querySelector('#tbl-picking tbody').children.length === 0) this.addPickingRow();
        },
        addPickingRow: function () {
            const r = document.createElement('tr');
            r.innerHTML = `
                <td><select class="cedit prod-select" onchange="AppCom.Universal.onProdChange(this)"></select></td>
                <td><select class="cedit pres-select"><option>-</option></select></td>
                <td><input class="cedit" placeholder="Ubicación"></td>
                <td><input class="cedit" placeholder="Lote"></td>
                <td><input type="number" class="cedit text-center"></td>
                <td><input type="number" class="cedit text-center"></td>
                <td class="no-print"><button class="btn btn-danger btn-mini" onclick="this.closest('tr').remove()">x</button></td>`;
            document.querySelector('#tbl-picking tbody').appendChild(r);
            AppCom.Universal.fillProdSelect(r.querySelector('.prod-select'));
        },
        getCustomData: function () {
            const r = [];
            document.querySelectorAll('#tbl-picking tbody tr').forEach(tr => {
                const i = tr.querySelectorAll('input, select');
                r.push({ p: i[0].value, pr: i[1].value, u: i[2].value, l: i[3].value, cr: i[4].value, cs: i[5].value });
            });
            return { t_pick: r };
        },
        loadCustomData: function (d) {
            if (d.t_pick) {
                const tb = document.querySelector('#tbl-picking tbody'); tb.innerHTML = '';
                d.t_pick.forEach(x => {
                    this.addPickingRow();
                    const i = tb.lastElementChild.querySelectorAll('input, select');
                    i[0].value = x.p;
                    AppCom.Universal.onProdChange(i[0]);
                    i[1].value = x.pr;
                    i[2].value = x.u;
                    i[3].value = x.l;
                    i[4].value = x.cr;
                    i[5].value = x.cs;
                });
            }
        }
    },

    // --- FO-OP-17: REMISIÓN ---
    FO_OP_17: {
        init: function () {
            if (document.querySelector('#tbl-remision tbody').children.length === 0) this.addRemisionRow();
        },
        addRemisionRow: function () {
            const r = document.createElement('tr');
            r.innerHTML = `
                <td><input type="number" class="cedit text-center"></td>
                <td><select class="cedit prod-select" onchange="AppCom.Universal.onProdChange(this)"></select></td>
                <td><select class="cedit pres-select"><option>-</option></select></td>
                <td><input class="cedit" placeholder="Lote"></td>
                <td><input type="date" class="cedit"></td>
                <td class="no-print"><button class="btn btn-danger btn-mini" onclick="this.closest('tr').remove()">x</button></td>`;
            document.querySelector('#tbl-remision tbody').appendChild(r);
            AppCom.Universal.fillProdSelect(r.querySelector('.prod-select'));
        },
        getCustomData: function () {
            const r = [];
            document.querySelectorAll('#tbl-remision tbody tr').forEach(tr => {
                const i = tr.querySelectorAll('input, select');
                r.push({ c: i[0].value, p: i[1].value, pr: i[2].value, l: i[3].value, cad: i[4].value });
            });
            return { t_rem: r };
        },
        loadCustomData: function (d) {
            if (d.t_rem) {
                const tb = document.querySelector('#tbl-remision tbody'); tb.innerHTML = '';
                d.t_rem.forEach(x => {
                    this.addRemisionRow();
                    const i = tb.lastElementChild.querySelectorAll('input, select');
                    i[0].value = x.c;
                    i[1].value = x.p;
                    AppCom.Universal.onProdChange(i[1]);
                    i[2].value = x.pr;
                    i[3].value = x.l;
                    i[4].value = x.cad;
                });
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', () => AppCom.init());

// Funciones globales expuestas para botones HTML
window.saveForm = () => AppCom.Universal.saveData();
window.printForm = () => AppCom.Universal.printForm();
window.clearForm = () => AppCom.Universal.clearForm();
window.addPedidoRow = () => AppCom.FO_OP_15.addPedidoRow();
window.addPickingRow = () => AppCom.FO_OP_16.addPickingRow();
window.addRemisionRow = () => AppCom.FO_OP_17.addRemisionRow();