graph TD
    %% Estilos
    classDef procs fill:#1E3A5F,stroke:#fff,color:#fff,stroke-width:2px;
    classDef forms fill:#2fa785,stroke:#fff,color:#fff,stroke-width:1px,stroke-dasharray: 5 5;
    classDef inputs fill:#64C4ED,stroke:#333,color:#000;

    %% --- GESTIÓN TRANSVERSAL (RIESGOS Y CALIDAD) ---
    subgraph SGC_TRANSVERSAL [SGC Transversal]
        PR_OP_27(PR-OP-27: Gestión de Riesgos) --> FO_LC_10(FO-LC-10: Matriz de Riesgos)
        PR_OP_27 --> FO_LC_01(FO-LC-01: Lista de Difusión)
    end

    %% --- FASE 1: RECEPCIÓN Y MATERIA PRIMA ---
    subgraph FASE_1 [Recepción y MP]
        PR_OP_12(PR-OP-12: Recolección y Traslado) --> PR_OP_25
        PR_OP_25(PR-OP-25: Manejo MP No Conforme) --> FO_OP_13(FO-OP-13: Check-list Recepción MP)
        PR_OP_25 --> FO_OP_52(FO-OP-52: Reporte MPNC)
        PR_OP_25 --> FO_OP_12(FO-OP-12: Dictamen Concesión)
        PR_OP_25 --> FO_LC_50(FO-LC-50: Manifiesto Destrucción)
    end

    %% --- FASE 2: PROCESAMIENTO (AISLAMIENTO Y BANCO) ---
    subgraph FASE_2 [Procesamiento Celular]
        PR_LC_13(PR-LC-13: Aislamiento Placenta) --> FO_LC_14(FO-LC-14: Histórico Placentas Liberadas)
        PR_LC_13 --> FO_LC_03(FO-LC-03: Control Pasajes)
        
        PR_LC_17(PR-LC-17: Bancos Celulares) --> FO_LC_17(FO-LC-17: Registro Criopreservación)
        PR_LC_17 --> FO_LC_18(FO-LC-18: Inventario Histórico Banco)
        PR_LC_17 --> FO_LC_19(FO-LC-19: Movimientos Banco)
        PR_LC_17 --> FO_LC_15(FO-LC-15: Histórico Líneas Liberadas)
    end

    %% --- FASE 3: NO CONFORMIDADES (PRODUCTO) ---
    subgraph FASE_3 [Salidas No Conformes]
        PR_OP_26(PR-OP-26 / PR-LC-15: Manejo Producto No Conforme) --> FO_LC_51(FO-LC-51: Producto No Conforme/Desviación)
    end

    %% CONEXIONES DE FLUJO
    PR_OP_27 -.-> PR_LC_13
    FO_OP_13 --> PR_LC_13
    FO_LC_14 --> PR_LC_17
    FO_LC_15 --> PR_LC_14(PR-LC-14: Cosecha y Dosificación)

    %% APLICACIÓN DE ESTILOS
    class PR_OP_27,PR_OP_12,PR_OP_25,PR_LC_13,PR_LC_17,PR_OP_26,PR_LC_14 procs;
    class FO_LC_10,FO_LC_01,FO_OP_13,FO_OP_52,FO_OP_12,FO_LC_50,FO_LC_14,FO_LC_03,FO_LC_17,FO_LC_18,FO_LC_19,FO_LC_15,FO_LC_51 forms;