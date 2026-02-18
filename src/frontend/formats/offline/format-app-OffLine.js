/**
 * FORMAT-APP-OFFLINE.JS - V1.6 MASTER FINAL
 * Soporte universal FO-LC-40, 41, 42, 43, 44 y 45.
 */
const App = {
    init: function () {
        const docId = document.body.id;
        this.Universal.setupBarcodes();
        this.Universal.loadData(docId);
        this.Universal.setupPrintHandler();

        // Inicialización de filas vacías por documento
        if (docId === 'doc-fo-lc-40') {
            if (document.querySelector('#tbl-medios tbody').children.length === 0) window.addMedio40();
        } else if (docId === 'doc-fo-lc-41') {
            if (document.querySelector('#tbl-micro tbody').children.length === 0) window.addMuestra41();
        } else if (docId === 'doc-fo-lc-42') {
            if (document.querySelector('#tbl-mp tbody').children.length === 0) window.addPlacenta42();
            if (document.querySelector('#tbl-mon tbody').children.length === 0) window.addMonitoreo42();
            if (document.querySelector('#tbl-dos tbody').children.length === 0) window.addDosificacion42();
        } else if (docId === 'doc-fo-lc-43') {
            if (document.querySelector('#tbl-mc tbody').children.length === 0) window.addLote43();
        } else if (docId === 'doc-fo-lc-44') {
            if (document.querySelector('#tbl-flask tbody').children.length === 0) window.addMuestra44();
        } else if (docId === 'doc-fo-lc-45') {
            if (document.querySelector('#tbl-emb tbody').children.length === 0) window.addProduct45();
        }
    },

    Universal: {
        setupBarcodes: function () {
            const process = (input) => {
                const targetId = input.dataset.target;
                const prefix = input.dataset.prefix || '';
                const val = input.value;
                if (val && window.JsBarcode) {
                    try {
                        JsBarcode(`#${targetId}`, prefix + val, { 
                            format: "CODE128", height: 30, displayValue: true, fontSize: 10, margin: 0 
                        });
                    } catch (e) { console.warn("Barcode error"); }
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

        saveData: function () {
            const docId = document.body.id;
            const data = { inputs: {}, tables: {}, checks: {} };
            
            document.querySelectorAll('input[type="text"], textarea').forEach(el => {
                if (el.id && !el.closest('tr')) data.inputs[el.id] = el.value;
            });

            document.querySelectorAll('input[type="checkbox"]').forEach(el => {
                if (el.id) data.checks[el.id] = el.checked;
            });

            document.querySelectorAll('table[id]').forEach(table => {
                const rows = [];
                table.querySelectorAll('tbody tr').forEach(tr => {
                    const rowData = Array.from(tr.querySelectorAll('input, textarea')).map(i => i.value);
                    if (rowData.length > 0) rows.push(rowData);
                });
                data.tables[table.id] = rows;
            });

            localStorage.setItem(`xelle_off_v1_${docId}`, JSON.stringify(data));
            Swal.fire({ icon: 'success', title: 'Guardado local', timer: 1000, showConfirmButton: false });
        },

        loadData: function (docId) {
            const saved = localStorage.getItem(`xelle_off_v1_${docId}`);
            if (!saved) return;
            const data = JSON.parse(saved);
            
            for (const id in data.inputs) {
                const el = document.getElementById(id);
                if (el) { el.value = data.inputs[id]; el.dispatchEvent(new Event('input')); }
            }

            for (const id in data.checks) {
                const el = document.getElementById(id);
                if (el) el.checked = data.checks[id];
            }

            for (const tableId in data.tables) {
                const tbody = document.querySelector(`#${tableId} tbody`);
                if (!tbody) continue;
                tbody.innerHTML = '';
                data.tables[tableId].forEach(rowData => {
                    if (tableId === 'tbl-medios') window.addMedio40();
                    else if (tableId === 'tbl-micro') window.addMuestra41();
                    else if (tableId === 'tbl-mp') window.addPlacenta42();
                    else if (tableId === 'tbl-mon') window.addMonitoreo42();
                    else if (tableId === 'tbl-dos') window.addDosificacion42();
                    else if (tableId === 'tbl-mc') window.addLote43();
                    else if (tableId === 'tbl-flask') window.addMuestra44();
                    else if (tableId === 'tbl-emb') window.addProduct45();
                    
                    const lastRow = tbody.lastElementChild;
                    const inputs = lastRow.querySelectorAll('input, textarea');
                    rowData.forEach((val, i) => { if (inputs[i]) inputs[i].value = val; });
                });
            }
        },

        clearForm: function () {
            Swal.fire({ title: '¿Limpiar?', icon: 'warning', showCancelButton: true }).then(res => {
                if (res.isConfirmed) {
                    localStorage.removeItem(`xelle_off_v1_${document.body.id}`);
                    location.reload();
                }
            });
        }
    }
};

// --- FUNCIONES DE FILAS (40-45) ---
window.addMedio40 = () => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td style='vertical-align:top'><input type='text' class='cedit'></td>
        <td style='vertical-align:top'><textarea class='cedit' rows='2'></textarea></td>
        <td style='vertical-align:top'><input type='text' class='cedit'></td>
        <td style='vertical-align:top'><textarea class='cedit' rows='3'></textarea></td>
        <td style='vertical-align:top'><input type='text' class='cedit'></td>
        <td style='vertical-align:top'><input type='text' class='cedit'></td>
        <td style='vertical-align:top'><input type='text' class='cedit' style='margin-bottom:3px;'><input type='text' class='cedit'></td>
        <td class='no-print' style='vertical-align:top'><button class='btn-danger btn-mini' onclick='this.closest("tr").remove()'>x</button></td>`;
    document.querySelector('#tbl-medios tbody').appendChild(tr);
};
window.addMuestra41 = () => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><input class='cedit'></td><td><input class='cedit'></td><td><input class='cedit'></td><td><input class='cedit'></td><td><input class='cedit'></td><td><input class='cedit'></td><td><input class='cedit'></td><td class='no-print'><button class='btn-danger btn-mini' onclick='this.closest("tr").remove()'>x</button></td>`;
    document.querySelector('#tbl-micro tbody').appendChild(tr);
};
window.addPlacenta42 = () => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><input class='cedit'></td><td><input class='cedit'></td><td><input class='cedit'></td><td><input class='cedit'></td><td class='no-print'><button class='btn-danger btn-mini' onclick='this.closest("tr").remove()'>x</button></td>`;
    document.querySelector('#tbl-mp tbody').appendChild(tr);
};
window.addMonitoreo42 = () => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><input class='cedit'></td><td><input class='cedit'></td><td><input class='cedit'></td><td><input class='cedit'></td><td><input class='cedit'></td><td><input class='cedit'></td><td><input class='cedit'></td><td><input class='cedit'></td><td><input class='cedit'></td><td class='no-print'><button class='btn-danger btn-mini' onclick='this.closest("tr").remove()'>x</button></td>`;
    document.querySelector('#tbl-mon tbody').appendChild(tr);
};
window.addDosificacion42 = () => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><input class='cedit'></td><td><input class='cedit'></td><td><input class='cedit'></td><td><input class='cedit'></td><td class='no-print'><button class='btn-danger btn-mini' onclick='this.closest("tr").remove()'>x</button></td>`;
    document.querySelector('#tbl-dos tbody').appendChild(tr);
};
window.addLote43 = () => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><input class='cedit'></td><td><input class='cedit'></td><td><input class='cedit'></td><td><input class='cedit'></td><td><input class='cedit'></td><td><input class='cedit'></td><td><input class='cedit'></td><td><input class='cedit'></td><td class='no-print'><button class='btn-danger btn-mini' onclick='this.closest("tr").remove()'>x</button></td>`;
    document.querySelector('#tbl-mc tbody').appendChild(tr);
};
window.addMuestra44 = () => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><input class='cedit'></td><td><input class='cedit'></td><td><input class='cedit'></td><td><input class='cedit'></td><td><input class='cedit'></td><td><input class='cedit'></td><td><input class='cedit'></td><td><input class='cedit'></td><td><input class='cedit'></td><td><input class='cedit'></td><td class='no-print'><button class='btn-danger btn-mini' onclick='this.closest("tr").remove()'>x</button></td>`;
    document.querySelector('#tbl-flask tbody').appendChild(tr);
};
window.addProduct45 = () => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><input class='cedit'></td><td><input class='cedit'></td><td><input class='cedit'></td><td><input class='cedit'></td><td class='no-print'><button class='btn-danger btn-mini' onclick='this.closest("tr").remove()'>x</button></td>`;
    document.querySelector('#tbl-emb tbody').appendChild(tr);
};

window.saveForm = () => App.Universal.saveData();
window.printForm = () => window.print();
window.clearForm = () => App.Universal.clearForm();
document.addEventListener('DOMContentLoaded', () => App.init());