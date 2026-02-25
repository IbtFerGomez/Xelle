/* config-users.js - V2.1 RESTAURADO COMPLETO */

window.SeedData = {
    // 1. USUARIOS Y ROLES
    users: [
        {
            id: 1,
            username: "Xelle_Fer",
            pass: "123",
            fullName: "Luis Fernando Gómez",
            role: "super_admin",
            moduleAccess: ["all"]
        },
        {
            id: 2,
            username: "calidad",
            pass: "123",
            fullName: "Gerente de Calidad",
            role: "quality_manager",
            moduleAccess: ["lab-calidad", "documentacion"]
        },
        {
            id: 3,
            username: "ventas",
            pass: "123",
            fullName: "Ejecutivo Comercial",
            role: "sales",
            moduleAccess: ["comercial"]
        }
    ],

    // 2. LISTADO MAESTRO DE FORMATOS (AQUÍ ESTÁN TUS TARJETAS)
    formats: [
        // --- BANCO DE CÉLULAS (Acceso: lab-calidad) ---
        { code: 'FO-LC-16', title: 'Cover Sheet (Resumen Lote)', area: 'banco', file: 'formats/FO-LC-16.html' },
        { code: 'FO-LC-20', title: 'Procesamiento de Tejido', area: 'banco', file: 'formats/FO-LC-20.html' },
        { code: 'FO-LC-21', title: 'Bitácora de Cultivo Celular', area: 'banco', file: 'formats/FO-LC-21.html' },
        { code: 'FO-LC-22', title: 'Mapa de Crio-Conservación', area: 'banco', file: 'formats/FO-LC-22.html' },
        { code: 'FO-LC-23', title: 'Bitácora Movimientos Banco', area: 'banco', file: 'formats/FO-LC-23.html' },
        { code: 'FO-LC-24', title: 'Inventario Prod. Terminado', area: 'banco', file: 'formats/FO-LC-24.html' },
        { code: 'FO-LC-29', title: 'REGISTRO DE LOTE DE PRODUCTO TERMINADO (CELULAR)', area: 'banco', file: 'formats/FO-LC-29.html' },
        { code: 'FO-LC-30', title: 'Hoja Prod. Lote Acelular', area: 'banco', file: 'formats/FO-LC-30.html' },
        { code: 'FO-LC-42', title: 'Liofilización Placenta', area: 'banco', file: 'formats/FO-LC-42.html' },
        { code: 'FO-LC-43', title: 'Liofilización Medio Cond.', area: 'banco', file: 'formats/FO-LC-43.html' },

        // --- LABORATORIO DE CALIDAD (Acceso: lab-calidad) ---
        { code: 'FO-LC-17', title: 'Recepción Muestras (MP)', area: 'calidad', file: 'formats/FO-LC-17.html' },
        { code: 'FO-LC-18', title: 'Evaluación Macroscópica', area: 'calidad', file: 'formats/FO-LC-18.html' },
        { code: 'FO-LC-19', title: 'Liberación MP (Serología)', area: 'calidad', file: 'formats/FO-LC-19.html' },
        { code: 'FO-LC-25', title: 'Preparación de Medios', area: 'calidad', file: 'formats/FO-LC-25.html' },
        { code: 'FO-LC-26', title: 'Bitácora de Autoclave', area: 'calidad', file: 'formats/FO-LC-26.html' },
        { code: 'FO-LC-27', title: 'Control de Equipos', area: 'calidad', file: 'formats/FO-LC-27.html' },
        { code: 'FO-LC-28', title: 'Uso de Equipos', area: 'calidad', file: 'formats/FO-LC-28.html' },
        { code: 'FO-LC-40', title: 'Prep. Soluciones (Gral)', area: 'calidad', file: 'formats/FO-LC-40.html' },
        { code: 'FO-LC-40-B', title: 'Prep. Soluciones (Alterno B)', area: 'calidad', file: 'formats/FO-LC-40-B.html' },
        { code: 'FO-LC-41', title: 'Control Microbiológico', area: 'calidad', file: 'formats/FO-LC-41.html' },
        { code: 'FO-LC-44', title: 'Lib. Micro Flasks/Viales', area: 'calidad', file: 'formats/FO-LC-44.html' },
        { code: 'FO-LC-46', title: 'Registro FO-LC-46', area: 'calidad', file: 'formats/FO-LC-46.html' },
        { code: 'FO-LC-47', title: 'Revisión Calidad Muestreo', area: 'calidad', file: 'formats/FO-LC-47.html' },
        { code: 'FO-LC-48', title: 'Resultados y Dictamen de Lote', area: 'calidad', file: 'formats/FO-LC-48.html' },
        { code: 'FO-LC-50', title: 'Manifiesto de Destrucción', area: 'calidad', file: 'formats/FO-LC-50.html' },

        // --- ALMACÉN Y COMERCIAL (Acceso: comercial) ---
        { code: 'FO-LC-12', title: 'Dictamen Técnico de Concesión (FO-LC-12)', area: 'almacen', file: 'formats/FO-LC-12.html' },
        { code: 'FO-OP-13', title: 'Lista Verificación Recepción MP', area: 'almacen', file: 'formats/FO-OP-13.html' },
        { code: 'FO-OP-15', title: 'Pedido Maestro (Ventas)', area: 'almacen', file: 'formats/FO-OP-15.html' },
        { code: 'FO-OP-16', title: 'Orden de Surtido (Picking)', area: 'almacen', file: 'formats/FO-OP-16.html' },
        { code: 'FO-OP-17', title: 'Nota de Remisión', area: 'almacen', file: 'formats/FO-OP-17.html' },
        { code: 'FO-OP-20', title: 'Liberación a Almacén', area: 'almacen', file: 'formats/FO-OP-20.html' },
        { code: 'FO-OP-OP-01', title: 'Formato Operativo FO-OP-OP-01', area: 'almacen', file: 'formats/FO-OP-OP-01.html' },
        { code: 'FO-OP-52', title: 'Reporte de MPNC', area: 'almacen', file: 'formats/FO-OP-52.html' },
        { code: 'FO-LC-45', title: 'Envío a Esterilización', area: 'almacen', file: 'formats/FO-LC-45.html' },

        // --- SISTEMA DE GESTIÓN (Acceso: documentacion) ---
        { code: 'FO-LC-14', title: 'Histórico de Placentas', area: 'sgc', file: 'formats/FO-LC-14.html' },
        { code: 'FO-LC-15', title: 'Histórico de Líneas', area: 'sgc', file: 'formats/FO-LC-15.html' },
        { code: 'FO-LC-32', title: 'Desviaciones (CAPA)', area: 'sgc', file: 'formats/FO-LC-32.html' },
        { code: 'FO-LC-51', title: 'Registro de Desviaciones', area: 'sgc', file: 'formats/FO-LC-51.html' }
    ],

    LOGO_SVG: `<svg viewBox="0 0 320 80" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%;">
            <defs><style>.s1{fill:#FFFFFF}</style></defs>
            <circle class="s1" cx="25" cy="25" r="13"/><circle class="s1" cx="75" cy="75" r="13"/>
            <path class="s1" d="M15.8,65.8C28.5,53.1 33.7,59.2 46.5,46.5C59.2,33.7 53.1 28.5 65.8,15.8A13 13 0 1 1 84.2,34.2C71.5,46.9 66.3,40.8 53.5,53.5C40.8,66.3 46.9,71.5 34.2,84.2A13 13 0 1 1 15.8,65.8Z"/>
           </svg>`
};
