/* config-users.js - V18.1 PATHS UPDATED (formats/) */

const ICONS = {
    LOGO: `<svg viewBox="0 0 320 80" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%;">
            <defs><style>.s1{fill:#FFFFFF}</style></defs>
            <circle class="s1" cx="25" cy="25" r="13"/><circle class="s1" cx="75" cy="75" r="13"/>
            <path class="s1" d="M15.8,65.8C28.5,53.1 33.7,59.2 46.5,46.5C59.2,33.7 53.1,28.5 65.8,15.8A13 13 0 1 1 84.2,34.2C71.5,46.9 66.3,40.8 53.5,53.5C40.8,66.3 46.9,71.5 34.2,84.2A13 13 0 1 1 15.8,65.8Z"/>
           </svg>`
};

window.SeedData = {
    // 1. USUARIOS
    users: [
        { id: 1, user: 'Admin', pass: 'xelle2026', name: 'Administrador', active: true },
        { id: 2, user: 'Soporte', pass: '1234', name: 'Soporte Técnico', active: true },
        { id: 3, user: 'Banco', pass: 'celulas', name: 'Operador Banco', active: true },
        { id: 4, user: 'Calidad', pass: 'calidad', name: 'Aseg. Calidad', active: true }
    ],

    // 2. LISTADO MAESTRO DE FORMATOS (RUTAS CORREGIDAS)
    formats: [
        // --- BANCO DE CÉLULAS ---
        { code: 'FO-LC-16', title: 'Cover Sheet (Resumen Lote)', area: 'banco', file: 'formats/FO-LC-16.html' },
        { code: 'FO-LC-20', title: 'Procesamiento de Tejido', area: 'banco', file: 'formats/FO-LC-20.html' },
        { code: 'FO-LC-21', title: 'Bitácora de Cultivo Celular', area: 'banco', file: 'formats/FO-LC-21.html' },
        { code: 'FO-LC-22', title: 'Mapa de Crio-Conservación', area: 'banco', file: 'formats/FO-LC-22.html' },
        { code: 'FO-LC-23', title: 'Bitácora Movimientos Banco', area: 'banco', file: 'formats/FO-LC-23.html' },
        { code: 'FO-LC-24', title: 'Inventario Prod. Terminado', area: 'banco', file: 'formats/FO-LC-24.html' },
        { code: 'FO-LC-29', title: 'Hoja Producción Lote Final', area: 'banco', file: 'formats/FO-LC-29.html' },

        // --- LABORATORIO DE CALIDAD ---
        { code: 'FO-LC-17', title: 'Recepción Muestras (MP)', area: 'calidad', file: 'formats/FO-LC-17.html' },
        { code: 'FO-LC-18', title: 'Evaluación Macroscópica', area: 'calidad', file: 'formats/FO-LC-18.html' },
        { code: 'FO-LC-25', title: 'Preparación de Medios', area: 'calidad', file: 'formats/FO-LC-25.html' },
        { code: 'FO-LC-26', title: 'Bitácora de Autoclave', area: 'calidad', file: 'formats/FO-LC-26.html' },
        { code: 'FO-LC-27', title: 'Uso y Limpieza Equipos', area: 'calidad', file: 'formats/FO-LC-27.html' },
        { code: 'FO-LC-28', title: 'Programa Mantenimiento', area: 'calidad', file: 'formats/FO-LC-28.html' },

        // --- ALMACÉN Y LOGÍSTICA ---
        { code: 'FO-LC-19', title: 'Recepción Insumos Críticos', area: 'almacen', file: 'formats/FO-LC-18.html' }, /* Nota: Revisa si el archivo 19 ya existe o usa el 18 renombrado */
        { code: 'FO-LC-30', title: 'Acondicionamiento Final', area: 'almacen', file: 'formats/FO-LC-30.html' },
        { code: 'FO-LC-31', title: 'Salida y Distribución', area: 'almacen', file: 'formats/FO-LC-31.html' },

        // --- SISTEMA DE GESTIÓN (SGC) ---
        { code: 'FO-LC-32', title: 'Desviaciones (CAPA)', area: 'sgc', file: 'formats/FO-LC-32.html' },
        { code: 'FO-OP-01', title: 'Limpieza de Áreas (Digital)', area: 'sgc', file: 'formats/FO-OP-OP-01.html' }
    ],
    LOGO_SVG: ICONS.LOGO
};