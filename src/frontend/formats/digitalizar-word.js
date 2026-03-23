(function () {
    const fileInput = document.getElementById('word-file');
    const convertBtn = document.getElementById('btn-convert');
    const copyBtn = document.getElementById('btn-copy');
    const downloadBtn = document.getElementById('btn-download');
    const openBtn = document.getElementById('btn-open');
    const acceptBtn = document.getElementById('btn-accept');
    const acceptCodeInput = document.getElementById('accept-code');
    const acceptTitleInput = document.getElementById('accept-title');
    const acceptAreaSelect = document.getElementById('accept-area');
    const output = document.getElementById('html-output');
    const preview = document.getElementById('html-preview');
    const status = document.getElementById('status');
    const modeTemplate = document.getElementById('mode-template');
    const docTitleInput = document.getElementById('doc-title');
    const docFileNameInput = document.getElementById('doc-file-name');
    const docCodeInput = document.getElementById('doc-code');
    const docVersionInput = document.getElementById('doc-version');
    const docVigenciaInput = document.getElementById('doc-vigencia');
    const API_URL = '/api';
    const FORMATS_STORAGE_KEY = 'xelle_formats';
    const DIGITALIZED_DOCS_STORAGE_KEY = 'xelle_digitalized_docs';

    let generatedHtml = '';
    let generatedCode = '';
    let generatedTitle = '';
    let generatedVersion = '';
    let generatedVigencia = '';
    let generatedOutputFileName = '';

    const setStatus = (text) => {
        status.textContent = text;
    };

    const setDocumentDefaults = (meta = {}, force = false) => {
        const title = String(meta.TITULO_FORMATO || '').trim();
        const code = String(meta.CODIGO_BASE || '').trim();
        const version = String(meta.VERSION || '').trim();
        const vigencia = String(meta.VIGENCIA_MES_ANIO || '').trim();
        const fileName = String(meta.NOMBRE_ARCHIVO_HTML || '').trim() || (code ? `${code}.html` : '');

        if (docTitleInput && (force || !String(docTitleInput.value || '').trim())) docTitleInput.value = title;
        if (docCodeInput && (force || !String(docCodeInput.value || '').trim())) docCodeInput.value = code;
        if (docVersionInput && (force || !String(docVersionInput.value || '').trim())) docVersionInput.value = version;
        if (docVigenciaInput && (force || !String(docVigenciaInput.value || '').trim())) docVigenciaInput.value = vigencia;
        if (docFileNameInput && (force || !String(docFileNameInput.value || '').trim())) docFileNameInput.value = fileName;
    };

    const getDocumentMetaFromInputs = (validate = false) => {
        const title = String(docTitleInput?.value || '').trim();
        const code = String(docCodeInput?.value || '').trim().toUpperCase();
        const version = String(docVersionInput?.value || '').trim();
        const vigencia = String(docVigenciaInput?.value || '').trim();
        const rawFileName = String(docFileNameInput?.value || '').trim();

        if (validate) {
            const missing = [];
            if (!title) missing.push('[TITULO_FORMATO]');
            if (!code) missing.push('[CODIGO_BASE]');
            if (!version) missing.push('[VERSION]');
            if (!vigencia) missing.push('[VIGENCIA_MES_ANIO]');

            if (missing.length) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Datos de documento incompletos',
                    text: `Completa: ${missing.join(', ')}`
                });
                return null;
            }
        }

        const fileName = rawFileName
            ? (rawFileName.toLowerCase().endsWith('.html') ? rawFileName : `${rawFileName}.html`)
            : (code ? `${code}.html` : '');

        return {
            TITULO_FORMATO: title,
            NOMBRE_ARCHIVO_HTML: fileName,
            CODIGO_BASE: code,
            VERSION: version,
            VIGENCIA_MES_ANIO: vigencia
        };
    };

    const escapeHtml = (text) => {
        return String(text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };

    const getBaseHref = () => {
        const href = window.location.href || '';
        return href.replace(/[^/]*([?#].*)?$/, '');
    };

    const readStoredArray = (key) => {
        try {
            const parsed = JSON.parse(localStorage.getItem(key) || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };

    const writeStoredArray = (key, arr) => {
        localStorage.setItem(key, JSON.stringify(Array.isArray(arr) ? arr : []));
    };

    const upsertByCode = (arr, item) => {
        const idx = arr.findIndex((x) => String(x.code || '').toUpperCase() === String(item.code || '').toUpperCase());
        if (idx >= 0) {
            arr[idx] = { ...arr[idx], ...item };
        } else {
            arr.push(item);
        }
        return arr;
    };

    const suggestCardTitle = () => {
        const normalizedTitle = String(generatedTitle || '').trim();
        if (normalizedTitle) return normalizedTitle;
        const normalizedCode = String(generatedCode || '').trim();
        return normalizedCode ? `Digitalizado ${normalizedCode}` : 'Documento digitalizado';
    };

    const setAcceptDefaults = (force = false) => {
        if (acceptCodeInput && (force || !acceptCodeInput.value.trim())) {
            acceptCodeInput.value = String(generatedCode || '').trim().toUpperCase();
        }
        if (acceptTitleInput && (force || !acceptTitleInput.value.trim())) {
            acceptTitleInput.value = suggestCardTitle();
        }
        if (acceptAreaSelect && !acceptAreaSelect.value) {
            acceptAreaSelect.value = 'biblioteca';
        }
    };

    const extractBodyPreview = (html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(String(html || ''), 'text/html');
        return doc.body?.innerHTML || '<p>No se encontró contenido para previsualizar.</p>';
    };

    const loadDocumentFromQuery = () => {
        const params = new URLSearchParams(window.location.search || '');
        const docCode = (params.get('docCode') || '').trim().toUpperCase();
        if (!docCode) return;

        const docs = readStoredArray(DIGITALIZED_DOCS_STORAGE_KEY);
        const found = docs.find((item) => String(item.code || '').trim().toUpperCase() === docCode);
        if (!found || !found.html) {
            setStatus(`No se encontró documento digitalizado para ${docCode}.`);
            return;
        }

        generatedCode = found.code || docCode;
        generatedTitle = found.title || '';
        generatedOutputFileName = found.outputFileName || `documento-digitalizado-${generatedCode || 'word'}.html`;
        generatedHtml = found.html;

        output.value = generatedHtml;
        preview.innerHTML = extractBodyPreview(generatedHtml);
        setDocumentDefaults({
            TITULO_FORMATO: generatedTitle,
            CODIGO_BASE: generatedCode,
            NOMBRE_ARCHIVO_HTML: generatedOutputFileName
        }, true);
        setAcceptDefaults(true);
        if (acceptAreaSelect && found.area) acceptAreaSelect.value = found.area;

        setStatus(`Documento ${generatedCode} cargado desde tarjeta del dashboard.`);
    };

    const acceptAndRegisterCard = async () => {
        if (!hasHtml()) return;

        const code = String(acceptCodeInput?.value || generatedCode || '').trim().toUpperCase();
        const title = String(acceptTitleInput?.value || suggestCardTitle()).trim();
        const area = String(acceptAreaSelect?.value || 'biblioteca').trim();

        if (!code || !title) {
            Swal.fire({ icon: 'warning', title: 'Datos incompletos', text: 'Captura código y título para crear la tarjeta.' });
            return;
        }

        const filePath = `formats/digitalizar-word.html?docCode=${encodeURIComponent(code)}`;

        const docs = readStoredArray(DIGITALIZED_DOCS_STORAGE_KEY);
        upsertByCode(docs, {
            code,
            title,
            area,
            outputFileName: generatedOutputFileName || `documento-digitalizado-${code}.html`,
            html: generatedHtml,
            updatedAt: new Date().toISOString()
        });
        writeStoredArray(DIGITALIZED_DOCS_STORAGE_KEY, docs);

        const formats = readStoredArray(FORMATS_STORAGE_KEY);
        upsertByCode(formats, { code, title, area, file: filePath });
        writeStoredArray(FORMATS_STORAGE_KEY, formats);

        let apiMessage = 'Tarjeta registrada en dashboard (local).';
        try {
            const response = await fetch(`${API_URL}/formats`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, title, area, file_path: filePath })
            });

            if (response.ok) {
                apiMessage = 'Tarjeta registrada en dashboard y en backend.';
            } else {
                const err = await response.json().catch(() => ({}));
                apiMessage = err?.msg
                    ? `Tarjeta local creada. Backend respondió: ${err.msg}`
                    : 'Tarjeta local creada. No se pudo registrar en backend.';
            }
        } catch {
            apiMessage = 'Tarjeta local creada. No hubo conexión con backend.';
        }

        generatedCode = code;
        generatedTitle = title;
        setAcceptDefaults(true);

        Swal.fire({
            icon: 'success',
            title: 'Formato digitalizado aceptado',
            text: apiMessage,
            confirmButtonText: 'Abrir dashboard'
        }).then(() => {
            window.open('../dashboard.html', '_blank');
        });
    };

    const getEmbeddedDocumentStyles = () => `
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; margin: 0; padding: 16px; background: #f3f4f6; color: #333; }
.container { background: #fff; width: 95%; max-width: 1400px; margin: 0 auto; padding: 30px; border-radius: 8px; box-sizing: border-box; }
.header-top { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2c3e50; padding-bottom: 8px; margin-bottom: 14px; }
.header-main { text-align: center; margin-bottom: 14px; border-bottom: 1px solid #d1d5db; padding-bottom: 8px; }
.header-main h1 { margin: 0; font-size: 18px; color: #2c3e50; text-transform: uppercase; }
.metadata { margin-top: 4px; font-size: 11px; color: #34495e; }
.logo-container svg { height: 60px; width: auto; }
.registry-container { display: flex; flex-direction: column; align-items: flex-end; }
.registry-wrapper { display: flex; align-items: center; gap: 6px; }
.registry-prefix { font-weight: 700; color: #2c3e50; }
.registry-input { width: 80px; text-align: center; }
.barcode-svg { max-height: 40px; margin-top: 4px; }
.section { margin-bottom: 14px; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; page-break-inside: avoid; }
.section-title { background: #34495e; color: #fff; font-weight: 700; margin: -12px -12px 10px -12px; padding: 6px 10px; border-radius: 6px 6px 0 0; text-transform: uppercase; font-size: 12px; }
table { width: 100%; border-collapse: collapse; margin-bottom: 10px; table-layout: fixed; }
th, td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; vertical-align: middle; }
th { background: #f8f9fa; text-transform: uppercase; font-size: 11px; }
input:not([type="checkbox"]):not([type="radio"]), select, textarea, .cedit { width: 100%; box-sizing: border-box; border: 1px solid #d1d5db; padding: 6px 8px; border-radius: 4px; font-size: 11px; }
textarea { resize: vertical; min-height: 30px; }
.signature-area { display: flex; justify-content: space-around; margin-top: 26px; gap: 20px; }
.signature-box { width: 40%; text-align: center; }
.signature-box input { border: none; border-bottom: 1px solid #333; background: transparent; text-align: center; }
.global-controls { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; z-index: 1000; background: rgba(255,255,255,.95); padding: 8px 14px; border-radius: 999px; border: 1px solid #ccc; }
.btn { border: none; border-radius: 6px; color: #fff; padding: 8px 14px; font-size: 12px; cursor: pointer; }
.btn-success { background: #27ae60; }
.btn-primary { background: #2c3e50; }
.btn-danger { background: #e74c3c; }
.btn-warning { background: #f39c12; }
.footer { margin-top: 14px; border-top: 1px solid #eee; padding-top: 8px; text-align: center; color: #888; font-size: 10px; }
.legal-legend { margin-top: 14px; font-size: 10px; color: #444; text-align: center; }
.print-only-value { display: none; }
@media print {
    @page { size: letter; margin: 0.8cm; }
    body { background: #fff; padding: 0; margin: 0; }
    .container { width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; border: none !important; }
    .global-controls, .no-print, button, .footer { display: none !important; }
    input:not([type="checkbox"]):not([type="radio"]), textarea, .cedit, .registry-date { border: none !important; box-shadow: none !important; background: transparent !important; padding: 0 !important; margin: 0 !important; }
    select { display: none !important; }
    .print-only-value { display: inline-block !important; }
    .section { border: none !important; padding: 0 !important; margin-bottom: 18px !important; }
    .section-title { margin: 0 0 5px 0 !important; }
    th, td { white-space: normal !important; word-break: break-word !important; overflow-wrap: anywhere !important; }
}
`;

    const htmlToLines = (rawHtml) => {
        const withBreaks = String(rawHtml || '')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6|tr)>/gi, '\n');

        const textOnly = withBreaks.replace(/<[^>]+>/g, ' ');
        return textOnly
            .split('\n')
            .map((line) => line.replace(/\s+/g, ' ').trim())
            .filter(Boolean);
    };

    const META_KEYS = ['TITULO_FORMATO', 'NOMBRE_ARCHIVO_HTML', 'CODIGO_BASE', 'VERSION', 'VIGENCIA_MES_ANIO'];
    const isMetaMarkerLine = (text) => /^\*{2,}$/.test(String(text || '').replace(/\s+/g, ' ').trim());
    const isMetaDataLine = (text) => {
        const match = String(text || '').replace(/\s+/g, ' ').trim().match(/^\[([A-Z0-9_]+)\]\s*:\s*(.*)$/i);
        if (!match) return false;
        return META_KEYS.includes(String(match[1] || '').toUpperCase());
    };
    const hasMetaKeyToken = (text) => {
        const normalized = String(text || '').toUpperCase();
        return META_KEYS.some((key) => normalized.includes(`[${key}]`));
    };

    const isAsteriskMarker = (text) => /^\*{3,}$/.test(String(text || '').trim());

    const serializeNodeHtml = (node) => {
        if (!node) return '';
        if (typeof node.outerHTML === 'string') return node.outerHTML;
        const txt = node.textContent || '';
        return txt ? `<p>${escapeHtml(txt)}</p>` : '';
    };

    const extractExternalMetaBlock = (rawHtml) => {
        const parser = new DOMParser();
        const parsed = parser.parseFromString(`<div id="dgw-meta-root">${rawHtml || ''}</div>`, 'text/html');
        const root = parsed.getElementById('dgw-meta-root');

        if (!root) {
            return { hasMetaBlock: false, meta: {}, contentHtml: rawHtml || '' };
        }

        const nodes = Array.from(root.childNodes || []);
        let startMarker = -1;
        let endMarker = -1;
        let inMeta = false;
        let hasMetaPayload = false;

        for (let i = 0; i < nodes.length; i++) {
            const line = (nodes[i].textContent || '').replace(/\s+/g, ' ').trim();

            if (isAsteriskMarker(line)) {
                if (!inMeta) {
                    inMeta = true;
                    startMarker = i;
                    continue;
                }

                if (!hasMetaPayload) {
                    continue;
                }

                endMarker = i;
                break;
            }

            if (inMeta && line) {
                hasMetaPayload = true;
            }
        }

        if (startMarker === -1 || endMarker === -1 || endMarker <= startMarker || !hasMetaPayload) {
            return { hasMetaBlock: false, meta: {}, contentHtml: rawHtml || '' };
        }

        const metaHtml = nodes
            .slice(startMarker + 1, endMarker)
            .map((node) => serializeNodeHtml(node))
            .join('');

        const contentHtml = nodes
            .slice(endMarker + 1)
            .map((node) => serializeNodeHtml(node))
            .join('')
            .trim();

        const meta = {};
        htmlToLines(metaHtml).forEach((line) => {
            const match = line.match(/^\[([A-Z0-9_]+)\]\s*:\s*(.*)$/i);
            if (!match) return;
            meta[match[1].toUpperCase()] = (match[2] || '').trim();
        });

        return {
            hasMetaBlock: true,
            meta,
            contentHtml: contentHtml || ''
        };
    };

    const extractInlineMetaBlock = (rawHtml) => {
        const parser = new DOMParser();
        const parsed = parser.parseFromString(`<div id="dgw-inline-meta-root">${rawHtml || ''}</div>`, 'text/html');
        const root = parsed.getElementById('dgw-inline-meta-root');

        if (!root) {
            return { hasMetaBlock: false, meta: {}, contentHtml: rawHtml || '' };
        }

        const nodes = Array.from(root.childNodes || []);
        const meta = {};
        const consumed = new Set();
        const requiredKeys = ['TITULO_FORMATO', 'NOMBRE_ARCHIVO_HTML', 'CODIGO_BASE', 'VERSION', 'VIGENCIA_MES_ANIO'];

        let startMarker = -1;
        let endMarker = -1;
        let inMeta = false;
        let hasMetaPayload = false;

        for (let i = 0; i < nodes.length; i++) {
            const text = (nodes[i].textContent || '').replace(/\s+/g, ' ').trim();
            if (isMetaMarkerLine(text)) {
                if (!inMeta) {
                    inMeta = true;
                    startMarker = i;
                    continue;
                }

                if (!hasMetaPayload) {
                    continue;
                }

                endMarker = i;
                break;
            }

            if (inMeta && text) {
                hasMetaPayload = true;
            }
        }

        if (startMarker === -1 || endMarker === -1 || endMarker <= startMarker || !hasMetaPayload) {
            return { hasMetaBlock: false, meta: {}, contentHtml: rawHtml || '' };
        }

        for (let i = startMarker; i <= endMarker; i++) {
            consumed.add(i);
            const text = (nodes[i].textContent || '').replace(/\s+/g, ' ').trim();
            const match = text.match(/^\[([A-Z0-9_]+)\]\s*:\s*(.*)$/i);
            if (!match) continue;
            const key = String(match[1] || '').toUpperCase();
            if (!requiredKeys.includes(key)) continue;
            meta[key] = (match[2] || '').trim();
        }

        const contentHtml = nodes
            .filter((_, i) => !consumed.has(i))
            .map((node) => serializeNodeHtml(node))
            .join('')
            .trim();

        return {
            hasMetaBlock: Object.keys(meta).length > 0,
            meta,
            contentHtml: contentHtml || ''
        };
    };

    const extractMetaFromLinesFallback = (rawHtml) => {
        const lines = htmlToLines(rawHtml);
        const meta = {};

        let startMarker = -1;
        let endMarker = -1;
        let inMeta = false;
        let hasMetaPayload = false;

        for (let i = 0; i < lines.length; i++) {
            const line = String(lines[i] || '').trim();
            if (isMetaMarkerLine(line)) {
                if (!inMeta) {
                    inMeta = true;
                    startMarker = i;
                    continue;
                }

                if (!hasMetaPayload) {
                    continue;
                }

                endMarker = i;
                break;
            }

            if (inMeta && line) {
                hasMetaPayload = true;
            }
        }

        const parseLine = (line) => {
            const match = String(line || '').match(/^\[([A-Z0-9_]+)\]\s*:\s*(.*)$/i);
            if (!match) return;
            const key = String(match[1] || '').toUpperCase();
            if (!META_KEYS.includes(key)) return;
            meta[key] = (match[2] || '').trim();
        };

        if (startMarker !== -1 && endMarker !== -1 && endMarker > startMarker && hasMetaPayload) {
            lines.slice(startMarker + 1, endMarker).forEach(parseLine);
            return meta;
        }

        lines.forEach(parseLine);
        return meta;
    };

    const extractLeadingMetaBlock = (rawHtml) => {
        const lines = htmlToLines(rawHtml);
        if (!lines.length) return { hasMetaBlock: false, meta: {} };

        let start = -1;
        for (let i = 0; i < lines.length; i++) {
            const line = String(lines[i] || '').trim();
            if (!line) continue;
            if (isMetaMarkerLine(line)) {
                start = i;
            }
            break;
        }

        if (start === -1) return { hasMetaBlock: false, meta: {} };

        const meta = {};
        let hasPayload = false;
        let end = -1;

        for (let i = start + 1; i < lines.length; i++) {
            const line = String(lines[i] || '').trim();

            if (isMetaMarkerLine(line)) {
                if (!hasPayload) {
                    continue;
                }
                end = i;
                break;
            }

            if (!line) continue;
            hasPayload = true;

            const match = line.match(/^\[([A-Z0-9_]+)\]\s*:\s*(.*)$/i);
            if (!match) continue;

            const key = String(match[1] || '').toUpperCase();
            if (!META_KEYS.includes(key)) continue;
            meta[key] = (match[2] || '').trim();
        }

        const hasMeta = end !== -1 && hasPayload && Object.keys(meta).length > 0;
        return { hasMetaBlock: hasMeta, meta: hasMeta ? meta : {} };
    };

    const parseTemplateData = (rawHtml) => {
        const lines = htmlToLines(rawHtml);
        const data = {};
        const sectionMarkers = [];
        let hasSectionStructure = false;
        let hasNaturalSections = false;
        let hasSectionHints = false;

        lines.forEach((line, index) => {
            const match = line.match(/^\[([A-Z0-9_]+)\]\s*:\s*(.*)$/i);
            if (!match) return;

            const key = match[1].toUpperCase();
            const value = (match[2] || '').trim();
            data[key] = value;

            if (/^SECCION_\d+_(TITULO|CAMPOS|TABLA)$/i.test(key)) {
                hasSectionStructure = true;
            }

            const sectionMatch = key.match(/^SECCION_(\d+)_TITULO$/);
            if (sectionMatch) {
                sectionMarkers.push({
                    section: parseInt(sectionMatch[1], 10),
                    index,
                    title: value || `SECCIÓN ${sectionMatch[1]}`
                });
            }
        });

        lines.forEach((line, index) => {
            if (/^\d+[\.)]\s+.+/.test(line)) {
                hasNaturalSections = true;
                if (!sectionMarkers.some((s) => s.index === index)) {
                    sectionMarkers.push({
                        section: sectionMarkers.length + 1,
                        index,
                        title: line.replace(/^\d+[\.)]\s+/, '').trim()
                    });
                }
            }

            if (/^encabezados\s+sugeridos\s*:/i.test(line)) {
                hasSectionHints = true;
            }

            if (/\|/.test(line) && /\[[^\]]+\]\s*:\s*/.test(line)) {
                hasSectionHints = true;
            }
        });

        const requiredMetaKeys = ['TITULO_FORMATO', 'NOMBRE_ARCHIVO_HTML', 'CODIGO_BASE', 'VERSION', 'VIGENCIA_MES_ANIO'];
        const requiredMetaCount = requiredMetaKeys.filter((key) => Boolean(data[key])).length;

        sectionMarkers.sort((a, b) => a.index - b.index);

        const isTemplate = hasSectionStructure || (requiredMetaCount >= 3 && (hasNaturalSections || hasSectionHints));
        return { isTemplate, data, lines, sectionMarkers };
    };

    const stripSizeTag = (text) => {
        return String(text || '').replace(/\{\s*(CORTA|LARGA)\s*\}/gi, '').trim();
    };

    const detectSizeTag = (text) => {
        const match = String(text || '').match(/\{\s*(CORTA|LARGA)\s*\}/i);
        return match ? match[1].toUpperCase() : '';
    };

    const chooseFieldType = (label, value) => {
        const labelTag = detectSizeTag(label);
        const valueTag = detectSizeTag(value);
        const explicit = valueTag || labelTag;

        if (explicit === 'CORTA') return 'input';
        if (explicit === 'LARGA') return 'textarea';

        const cleanLabel = stripSizeTag(label);
        const cleanValue = stripSizeTag(value);
        const isLongByContent = cleanValue.length > 50 || /observ|descrip|coment|detalle|justific/i.test(cleanLabel);
        return isLongByContent ? 'textarea' : 'input';
    };

    const extractTableHeaders = (line) => {
        const match = String(line || '').match(/^encabezados\s+sugeridos\s*:\s*(.*)$/i);
        if (!match) return [];

        return match[1]
            .split('|')
            .map((h) => {
                const raw = h.replace(/^\[/, '').replace(/\]$/, '').trim();
                const label = stripSizeTag(raw);
                return { raw, label };
            })
            .filter((h) => Boolean(h.label));
    };

    const renderFieldControl = (name, label, value) => {
        const cleanLabel = stripSizeTag(label);
        const cleanValue = stripSizeTag(value);
        const fieldType = chooseFieldType(label, value);
        const placeholder = escapeHtml(cleanValue || 'Captura aquí');

        if (fieldType === 'textarea') {
            return `<textarea class="cedit" name="${name}" rows="3" placeholder="${placeholder}"></textarea>`;
        }

        return `<input class="cedit" name="${name}" placeholder="${placeholder}">`;
    };

    const buildTemplateSectionsHtml = (lines, sectionMarkers) => {
        if (!sectionMarkers.length) {
            return {
                html: `
                <div class="section">
                    <div class="section-title">Contenido del formato</div>
                    <table>
                        <tbody>
                            <tr><td><input class="cedit" placeholder="Dato 1"></td></tr>
                            <tr><td><input class="cedit" placeholder="Dato 2"></td></tr>
                            <tr><td><textarea class="cedit" rows="3" placeholder="Observaciones"></textarea></td></tr>
                        </tbody>
                    </table>
                </div>
            `,
                maxTableColumns: 0
            };
        }

        const markers = [...sectionMarkers].sort((a, b) => a.index - b.index);
        let result = '';
        let inputCounter = 1;
        let maxTableColumns = 0;

        markers.forEach((marker, markerIndex) => {
            const nextIndex = markers[markerIndex + 1] ? markers[markerIndex + 1].index : lines.length;
            const blockLines = lines.slice(marker.index + 1, nextIndex);

            let rows = '';
            let headers = [];

            blockLines.forEach((line) => {
                if (/^\[SECCION_\d+_CAMPOS\]/i.test(line)) return;
                if (/^\[SECCION_\d+_TABLA\]/i.test(line)) return;
                if (/^filas:/i.test(line)) return;
                if (/^\[(TITULO_FORMATO|NOMBRE_ARCHIVO_HTML|CODIGO_BASE|VERSION|VIGENCIA_MES_ANIO|INPUT_FOLIO|ORIENTACION|IMPRIMIR_CON_CAMPOS_VACIOS)\]\s*:/i.test(line)) return;
                if (/^resultado\s+esperado/i.test(line)) return;

                const detectedHeaders = extractTableHeaders(line);
                if (detectedHeaders.length) {
                    headers = detectedHeaders;
                    if (headers.length > maxTableColumns) maxTableColumns = headers.length;
                    return;
                }

                const linePairs = [];
                line.split('|').forEach((chunk) => {
                    const pair = chunk.match(/^[-•]?\s*\[([^\]]+)\]\s*:\s*(.*)$/i);
                    if (!pair) return;
                    const label = (pair[1] || '').trim();
                    const sample = (pair[2] || '').trim();
                    if (!label) return;
                    linePairs.push({ label, sample });
                });

                if (!linePairs.length) return;

                if (linePairs.length >= 2) {
                    const left = linePairs[0];
                    const right = linePairs[1];
                    const leftName = `dgw_tpl_${inputCounter++}`;
                    const rightName = `dgw_tpl_${inputCounter++}`;

                    rows += `<tr>
                        <td width="20%"><strong>${escapeHtml(stripSizeTag(left.label))}</strong></td>
                        <td width="30%">${renderFieldControl(leftName, left.label, left.sample)}</td>
                        <td width="20%"><strong>${escapeHtml(stripSizeTag(right.label))}</strong></td>
                        <td width="30%">${renderFieldControl(rightName, right.label, right.sample)}</td>
                    </tr>`;
                    return;
                }

                const only = linePairs[0];
                const fieldName = `dgw_tpl_${inputCounter++}`;
                rows += `<tr><td width="35%"><strong>${escapeHtml(stripSizeTag(only.label))}</strong></td><td>${renderFieldControl(fieldName, only.label, only.sample)}</td></tr>`;
            });

            let tableHtml = '';
            if (headers.length) {
                const colWidth = (100 / headers.length).toFixed(2);
                const head = headers.map((h) => `<th style="width:${colWidth}%">${escapeHtml(h.label)}</th>`).join('');
                const body = headers.map((h, index) => {
                    const fieldName = `dgw_tbl_${marker.section}_${index + 1}`;
                    return `<td>${renderFieldControl(fieldName, h.raw, '')}</td>`;
                }).join('');

                tableHtml = `
                    <table class="compact-table">
                        <thead><tr>${head}</tr></thead>
                        <tbody><tr>${body}</tr></tbody>
                    </table>
                `;
            }

            const hasRows = rows.trim().length > 0;
            const hasTable = tableHtml.trim().length > 0;
            const sectionContent = hasRows
                ? `<table><tbody>${rows}</tbody></table>`
                : (hasTable ? '' : '<p class="hint">Sin campos definidos en esta sección.</p>');

            result += `
                <div class="section">
                    <div class="section-title">${escapeHtml(marker.title)}</div>
                    ${sectionContent}
                    ${tableHtml}
                </div>
            `;
        });

        return { html: result, maxTableColumns };
    };

    const buildTemplateDrivenHtml = (templateInfo, metaOverrides = {}) => {
        const data = { ...(templateInfo.data || {}), ...(metaOverrides || {}) };

        const fileName = data.NOMBRE_ARCHIVO_HTML || '';
        const codeFromFile = fileName ? fileName.replace(/\.html$/i, '').trim() : '';
        const codeBase = (data.CODIGO_BASE || codeFromFile || 'FO-LC-00').trim();
        const version = (data.VERSION || '1.0').trim();
        const vig = (data.VIGENCIA_MES_ANIO || 'Ene2026').trim();
        const title = (data.TITULO_FORMATO || 'FORMATO DIGITALIZADO').trim();
        generatedTitle = title;
        generatedVersion = version;
        generatedVigencia = vig;
        const orientation = (data.ORIENTACION || 'Vertical').trim().toLowerCase();
        const builtSections = buildTemplateSectionsHtml(templateInfo.lines, templateInfo.sectionMarkers);
        const autoLandscape = builtSections.maxTableColumns >= 6;
        const orientationCss = (orientation.includes('horiz') || autoLandscape) ? '@page { size: landscape; }' : '@page { size: portrait; }';
        const sectionsHtml = builtSections.html;
        const legalLegend = 'El contenido de este documento es propiedad de “Xelle Scientific”, S.A.P.I., de C. V., y está protegido por los derechos de autor, por lo que está prohibida su reproducción total o parcial.';

        generatedCode = `${codeBase}`;
        generatedOutputFileName = fileName
            ? (fileName.toLowerCase().endsWith('.html') ? fileName : `${fileName}.html`)
            : `documento-digitalizado-${codeBase}.html`;

        return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<base href="${escapeHtml(getBaseHref())}">
<link rel="stylesheet" href="format-styles.css">
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<script src="format-app.js"></script>
<style>
${getEmbeddedDocumentStyles()}
${orientationCss}
.legal-legend { margin-top: 20px; font-size: 10px; color: #444; text-align: center; }
.section .section-title { margin-bottom: 0 !important; }
.section > table,
.section > .compact-table { margin-top: 0 !important; }
</style>
</head>
<body id="doc-digitalizado-word">
    <div class="global-controls no-print">
        <button class="btn btn-success" onclick="saveForm()">Guardar</button>
        <button class="btn btn-primary" onclick="printForm()">Imprimir</button>
        <button class="btn btn-danger" onclick="clearForm()">Limpiar</button>
    </div>

    <div class="container">
        <div class="header-top">
            <div class="logo-container">
                <svg viewBox="0 0 320 80"><defs><style>.svg-logo-titulo{font-family:'Arial Black',sans-serif;font-weight:900;fill:#1D1D1B}.svg-logo-subtitulo{font-family:'Arial',sans-serif;font-weight:700;fill:#1D1D1B;letter-spacing:2px}.svg-logo-celula{fill:#2E9D82}</style></defs><g transform="translate(0, -2) scale(0.85)"><circle class="svg-logo-celula" cx="25" cy="25" r="13"/><circle class="svg-logo-celula" cx="75" cy="75" r="13"/><path class="svg-logo-celula" d="M15.81,65.81C28.54,53.08 33.74,59.19 46.46,46.46C59.19,33.74 53.08,28.54 65.81,15.81A13 13 0 1 1 84.19,34.19C71.46,46.92 66.26,40.81 53.54,53.54C40.81,66.26 46.92,71.46 34.19,84.19A13 13 0 1 1 15.81,65.81Z"/></g><text x="90" y="42" class="svg-logo-titulo" font-size="34">XELLE</text><text x="91" y="68" class="svg-logo-subtitulo" font-size="19">SCIENTIFIC</text><text x="215" y="35" font-family="Arial" font-size="10" fill="#1D1D1B">®</text></svg>
            </div>
            <div class="registry-container">
                <label>Folio Código de barras</label>
                <div class="registry-wrapper">
                    <span class="registry-prefix">${escapeHtml(codeBase)}-</span>
                    <input type="text" id="reg-template-folio" class="registry-input generate-barcode" data-target="barcode-template" data-prefix="${escapeHtml(codeBase)}-" placeholder="001">
                </div>
                <input type="date" class="registry-date no-auto-date">
                <svg id="barcode-template" class="barcode-svg"></svg>
            </div>
        </div>

        <div class="header-main">
            <h1>${escapeHtml(title)}</h1>
            <div class="metadata">Código: ${escapeHtml(codeBase)} | Versión: ${escapeHtml(version)} | Vig: ${escapeHtml(vig)}</div>
        </div>

        ${sectionsHtml}

        <div class="signature-area">
            <div class="signature-box"><p>Realizó:</p><input type="text"><p>Firma</p></div>
            <div class="signature-box"><p>Verificó:</p><input type="text"><p>Firma</p></div>
        </div>
        <div class="legal-legend">${legalLegend}</div>
        <div class="footer">${escapeHtml(codeBase)} | Versión: ${escapeHtml(version)} | Vig: ${escapeHtml(vig)}</div>
    </div>
</body>
</html>`;
    };

    const buildFillableContent = (rawHtml) => {
        const parser = new DOMParser();
        const parsed = parser.parseFromString(`<div id="dgw-root">${rawHtml || ''}</div>`, 'text/html');
        const root = parsed.getElementById('dgw-root');
        let fieldCounter = 1;

        if (!root) return '';

        {
            const nodes = Array.from(root.childNodes || []);
            let startMarker = -1;
            let endMarker = -1;

            for (let i = 0; i < nodes.length; i++) {
                const text = (nodes[i].textContent || '').replace(/\s+/g, ' ').trim();
                if (isMetaMarkerLine(text)) {
                    if (startMarker === -1) {
                        startMarker = i;
                    } else {
                        endMarker = i;
                        break;
                    }
                }
            }

            if (startMarker !== -1 && endMarker !== -1 && endMarker >= startMarker) {
                for (let i = startMarker; i <= endMarker; i++) {
                    if (nodes[i]) nodes[i].remove();
                }
            }
        }

        root.querySelectorAll('table').forEach((table) => {
            table.querySelectorAll('td').forEach((cell) => {
                if (cell.querySelector('input, textarea, select')) return;

                const text = cell.textContent.trim();
                if (isMetaMarkerLine(text) || isMetaDataLine(text) || hasMetaKeyToken(text)) {
                    cell.innerHTML = '';
                    return;
                }
                const fieldName = `dgw_field_${fieldCounter++}`;
                const placeholder = escapeHtml(text || 'Captura aquí');

                if (text.length > 40) {
                    cell.innerHTML = `<textarea class="cedit" name="${fieldName}" rows="2" placeholder="${placeholder}" oninput="if(window.App?.Universal?.autoResize){App.Universal.autoResize(this)}"></textarea>`;
                    return;
                }

                cell.innerHTML = `<input class="cedit" name="${fieldName}" value="" placeholder="${placeholder}">`;
            });
        });

        root.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, blockquote').forEach((node) => {
            if (node.closest('table')) return;
            if (node.querySelector('input, textarea, select, img, svg')) return;

            const text = node.textContent.trim();
            if (!text) return;
            if (isMetaMarkerLine(text) || isMetaDataLine(text) || hasMetaKeyToken(text)) {
                node.remove();
                return;
            }

            const fieldName = `dgw_field_${fieldCounter++}`;
            const label = escapeHtml(text.slice(0, 80));
            const placeholder = escapeHtml(text || 'Captura aquí');

            if (text.length > 80) {
                node.innerHTML = `
                    <div class="dgw-field-wrap">
                        <label class="dgw-field-label">${label}</label>
                        <textarea class="cedit" name="${fieldName}" rows="3" placeholder="${placeholder}" oninput="if(window.App?.Universal?.autoResize){App.Universal.autoResize(this)}"></textarea>
                    </div>
                `;
                return;
            }

            node.innerHTML = `
                <div class="dgw-field-wrap">
                    <label class="dgw-field-label">${label}</label>
                    <input class="cedit" name="${fieldName}" value="" placeholder="${placeholder}">
                </div>
            `;
        });

        return root.innerHTML;
    };

    const hasHtml = () => {
        if (!generatedHtml.trim()) {
            Swal.fire({ icon: 'info', title: 'Sin contenido', text: 'Primero digitaliza un archivo Word.' });
            return false;
        }
        return true;
    };

    const buildDocumentCode = (fileName) => {
        const now = new Date();
        const y = now.getFullYear().toString().slice(-2);
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const h = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const base = (fileName || 'WORD').replace(/\.docx$/i, '').replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 6) || 'WORD';
        return `DGW-${base}-${y}${m}${d}-${h}${min}`;
    };

    const normalizeHtml = (rawHtml, docCode, externalMeta = {}) => {
        const today = new Date().toISOString().split('T')[0];
        const fillableContent = buildFillableContent(rawHtml);
        const legalLegend = 'El contenido de este documento es propiedad de “Xelle Scientific”, S.A.P.I., de C. V., y está protegido por los derechos de autor, por lo que está prohibida su reproducción total o parcial.';
        const title = (externalMeta.TITULO_FORMATO || 'DOCUMENTO DIGITALIZADO DESDE WORD').trim();
        generatedTitle = title;
        const codeBase = (externalMeta.CODIGO_BASE || docCode).trim();
        const version = (externalMeta.VERSION || '1.0').trim();
        const vig = (externalMeta.VIGENCIA_MES_ANIO || 'Ene2026').trim();
        generatedVersion = version;
        generatedVigencia = vig;
        const metaFileName = (externalMeta.NOMBRE_ARCHIVO_HTML || '').trim();
        const outputName = metaFileName || generatedOutputFileName || `documento-digitalizado-${codeBase}.html`;

        generatedOutputFileName = outputName.toLowerCase().endsWith('.html') ? outputName : `${outputName}.html`;
        generatedCode = codeBase;

        return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<base href="${escapeHtml(getBaseHref())}">
<link rel="stylesheet" href="format-styles.css">
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<script src="format-app.js"></script>
<style>
    ${getEmbeddedDocumentStyles()}
    .word-content table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    .word-content td, .word-content th { border: 1px solid var(--border-color); padding: 6px; }
    .word-content img { max-width: 100%; height: auto; }
    .dgw-field-wrap { display: flex; flex-direction: column; gap: 4px; }
    .dgw-field-label { font-size: 11px; font-weight: 700; color: var(--secondary-color); }
    .section .section-title { margin-bottom: 0 !important; }
    .section.word-content,
    .section.required-meta { padding-top: 0 !important; }
    .section.word-content > *:first-child { margin-top: 0 !important; }
    .section.word-content .section-title + *,
    .section.required-meta .section-title + * { margin-top: 0 !important; }
    .section.word-content table,
    .section.required-meta table { margin-top: 0 !important; }
    .legal-legend { margin-top: 20px; font-size: 10px; color: #444; text-align: center; }
    @media print {
        .word-content table { table-layout: auto !important; width: 100% !important; }
        .word-content th,
        .word-content td { white-space: normal !important; word-break: break-word !important; overflow-wrap: anywhere !important; }
        .word-content textarea,
        .word-content .cedit,
        .word-content input { white-space: normal !important; }
    }
</style>
</head>
<body id="doc-digitalizado-word">
    <div class="global-controls no-print">
        <button class="btn btn-success" onclick="saveForm()">Guardar</button>
        <button class="btn btn-primary" onclick="printForm()">Imprimir</button>
        <button class="btn btn-danger" onclick="clearForm()">Limpiar</button>
    </div>

    <div class="container">
        <div class="header-top">
            <div class="logo-container">
                <svg viewBox="0 0 320 80"><defs><style>.svg-logo-titulo{font-family:'Arial Black',sans-serif;font-weight:900;fill:#1D1D1B}.svg-logo-subtitulo{font-family:'Arial',sans-serif;font-weight:700;fill:#1D1D1B;letter-spacing:2px}.svg-logo-celula{fill:#2E9D82}</style></defs><g transform="translate(0, -2) scale(0.85)"><circle class="svg-logo-celula" cx="25" cy="25" r="13"/><circle class="svg-logo-celula" cx="75" cy="75" r="13"/><path class="svg-logo-celula" d="M15.81,65.81C28.54,53.08 33.74,59.19 46.46,46.46C59.19,33.74 53.08,28.54 65.81,15.81A13 13 0 1 1 84.19,34.19C71.46,46.92 66.26,40.81 53.54,53.54C40.81,66.26 46.92,71.46 34.19,84.19A13 13 0 1 1 15.81,65.81Z"/></g><text x="90" y="42" class="svg-logo-titulo" font-size="34">XELLE</text><text x="91" y="68" class="svg-logo-subtitulo" font-size="19">SCIENTIFIC</text><text x="215" y="35" font-family="Arial" font-size="10" fill="#1D1D1B">®</text></svg>
            </div>
            <div class="registry-container">
                <label>Código Documento</label>
                <div class="registry-wrapper">
                    <input type="text" id="reg-digital" class="registry-input generate-barcode" data-target="barcode-digital" data-prefix="" value="${escapeHtml(codeBase)}">
                </div>
                <input type="date" class="registry-date no-auto-date" value="${today}">
                <svg id="barcode-digital" class="barcode-svg"></svg>
            </div>
        </div>

        <div class="header-main">
            <h1>${escapeHtml(title)}</h1>
            <div class="metadata">Código: ${escapeHtml(codeBase)} | Versión: ${escapeHtml(version)} | Vig: ${escapeHtml(vig)} | Fuente: Word (.docx)</div>
        </div>

        <div class="section word-content">
            <div class="section-title">Contenido digitalizado</div>
            ${fillableContent || '<p>No se pudo extraer contenido visible.</p>'}
        </div>

        <div class="signature-area">
            <div class="signature-box"><p>Realizó:</p><input type="text"><p>Firma</p></div>
            <div class="signature-box"><p>Verificó:</p><input type="text"><p>Firma</p></div>
        </div>

        <div class="legal-legend">${legalLegend}</div>
        <div class="footer">Digitalizado automáticamente | ${escapeHtml(codeBase)} | Versión: ${escapeHtml(version)} | Vig: ${escapeHtml(vig)}</div>
    </div>
</body>
</html>`;
    };

    const digitalizeDocx = async () => {
        const file = fileInput.files && fileInput.files[0];

        if (!file) {
            Swal.fire({ icon: 'warning', title: 'Archivo requerido', text: 'Selecciona un archivo Word .docx.' });
            return;
        }

        const extension = file.name.split('.').pop().toLowerCase();
        if (extension !== 'docx') {
            Swal.fire({
                icon: 'error',
                title: 'Formato no soportado',
                text: 'Solo se permite Word .docx en esta herramienta.'
            });
            return;
        }

        if (!window.mammoth) {
            Swal.fire({ icon: 'error', title: 'Librería no disponible', text: 'No se pudo cargar el motor de conversión.' });
            return;
        }

        setStatus('Digitalizando documento...');

        try {
            const buffer = await file.arrayBuffer();
            const result = await window.mammoth.convertToHtml({ arrayBuffer: buffer });
            generatedOutputFileName = '';

            const manualMeta = getDocumentMetaFromInputs(true);
            if (!manualMeta) {
                setStatus('Completa los datos de documento.');
                return;
            }

            const extracted = extractExternalMetaBlock(result.value || '');
            const htmlAfterExternal = extracted.hasMetaBlock ? extracted.contentHtml : (result.value || '');
            const inlineExtracted = extractInlineMetaBlock(htmlAfterExternal);

            const sourceHtml = inlineExtracted.hasMetaBlock ? inlineExtracted.contentHtml : htmlAfterExternal;
            const mergedMeta = { ...(manualMeta || {}) };

            const templateInfo = parseTemplateData(sourceHtml);
            const forceTemplateMode = modeTemplate && modeTemplate.value === 'force';
            const hasTemplateStructure = Boolean(
                templateInfo?.isTemplate
                || (Array.isArray(templateInfo?.sectionMarkers) && templateInfo.sectionMarkers.length > 0)
            );

            if (templateInfo.isTemplate || forceTemplateMode) {
                if (forceTemplateMode && !hasTemplateStructure) {
                    generatedCode = mergedMeta.CODIGO_BASE || buildDocumentCode(file.name);
                    generatedOutputFileName = mergedMeta.NOMBRE_ARCHIVO_HTML
                        ? (mergedMeta.NOMBRE_ARCHIVO_HTML.toLowerCase().endsWith('.html')
                            ? mergedMeta.NOMBRE_ARCHIVO_HTML
                            : `${mergedMeta.NOMBRE_ARCHIVO_HTML}.html`)
                        : `documento-digitalizado-${generatedCode || 'word'}.html`;
                    generatedHtml = normalizeHtml(sourceHtml, generatedCode, mergedMeta);
                    output.value = generatedHtml;
                    preview.innerHTML = buildFillableContent(sourceHtml) || '<p>No se pudo extraer contenido visible.</p>';
                    setStatus('Modo plantilla sin estructura detectable: se aplicó digitalización completa del documento.');
                    setAcceptDefaults(true);
                    return;
                }

                const autoDetectMetaOverrides = mergedMeta;
                generatedHtml = buildTemplateDrivenHtml(templateInfo, autoDetectMetaOverrides);
                output.value = generatedHtml;
                preview.innerHTML = forceTemplateMode
                    ? '<p><strong>Modo plantilla forzado:</strong> se aplicaron reglas de plantilla para construir secciones y campos.</p>'
                    : '<p><strong>Modo plantilla detectado:</strong> se aplicaron reglas de plantilla para construir secciones y campos.</p>';

                if (result.messages && result.messages.length > 0) {
                    setStatus(`${forceTemplateMode ? 'Plantilla forzada' : 'Plantilla detectada'} y procesada. Código base: ${generatedCode}. Avisos: ${result.messages.length}.`);
                } else {
                    setStatus(`${forceTemplateMode ? 'Plantilla forzada' : 'Plantilla detectada'} y procesada. Código base: ${generatedCode}.`);
                }
                setAcceptDefaults(true);
                return;
            }

            generatedCode = mergedMeta.CODIGO_BASE || buildDocumentCode(file.name);
            generatedOutputFileName = mergedMeta.NOMBRE_ARCHIVO_HTML
                ? (mergedMeta.NOMBRE_ARCHIVO_HTML.toLowerCase().endsWith('.html')
                    ? mergedMeta.NOMBRE_ARCHIVO_HTML
                    : `${mergedMeta.NOMBRE_ARCHIVO_HTML}.html`)
                : `documento-digitalizado-${generatedCode || 'word'}.html`;
            generatedHtml = normalizeHtml(sourceHtml, generatedCode, mergedMeta);
            output.value = generatedHtml;
            preview.innerHTML = buildFillableContent(sourceHtml) || '<p>No se pudo extraer contenido visible.</p>';

            if (result.messages && result.messages.length > 0) {
                setStatus(`Digitalización completada (${generatedCode}) con campos vacíos generados. Avisos: ${result.messages.length}.`);
            } else {
                setStatus(`Digitalización completada correctamente. Código: ${generatedCode} con campos vacíos generados.`);
            }
            setAcceptDefaults(true);
        } catch (error) {
            setStatus('Error al digitalizar.');
            Swal.fire({ icon: 'error', title: 'Error de conversión', text: error.message || 'No se pudo convertir el archivo.' });
        }
    };

    const copyHtml = async () => {
        if (!hasHtml()) return;

        try {
            await navigator.clipboard.writeText(generatedHtml);
            Swal.fire({ icon: 'success', title: 'Copiado', timer: 1000, showConfirmButton: false });
        } catch {
            output.select();
            document.execCommand('copy');
            window.getSelection().removeAllRanges();
            Swal.fire({ icon: 'success', title: 'Copiado', timer: 1000, showConfirmButton: false });
        }
    };

    const downloadHtml = () => {
        if (!hasHtml()) return;

        const blob = new Blob([generatedHtml], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = generatedOutputFileName || `documento-digitalizado-${generatedCode || 'word'}.html`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const openInTab = () => {
        if (!hasHtml()) return;

        const win = window.open('', '_blank');
        if (!win) {
            Swal.fire({ icon: 'warning', title: 'Bloqueado', text: 'Tu navegador bloqueó la pestaña emergente.' });
            return;
        }
        win.document.open();
        win.document.write(generatedHtml);
        win.document.close();
    };

    convertBtn.addEventListener('click', digitalizeDocx);
    copyBtn.addEventListener('click', copyHtml);
    downloadBtn.addEventListener('click', downloadHtml);
    openBtn.addEventListener('click', openInTab);
    if (acceptBtn) acceptBtn.addEventListener('click', acceptAndRegisterCard);

    fileInput.addEventListener('change', () => {
        const file = fileInput.files && fileInput.files[0];
        if (!file) {
            setStatus('Esperando archivo...');
            return;
        }
        setStatus(`Archivo seleccionado: ${file.name}`);
    });

    setAcceptDefaults();
    setDocumentDefaults();
    loadDocumentFromQuery();
})();

// Hacer la barra de controles draggable
(function () {
    const controlBar = document.querySelector('.global-controls');
    if (!controlBar) return;

    let isDragging = false;
    let currentX, currentY, initialX, initialY;
    let xOffset = 0, yOffset = 0;

    controlBar.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
    controlBar.addEventListener('touchstart', dragStart);
    document.addEventListener('touchmove', drag);
    document.addEventListener('touchend', dragEnd);

    function dragStart(e) {
        if (e.target.tagName === 'BUTTON') return;
        if (e.type === 'touchstart') {
            initialX = e.touches[0].clientX - xOffset;
            initialY = e.touches[0].clientY - yOffset;
        } else {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
        }
        isDragging = true;
    }

    function drag(e) {
        if (!isDragging) return;
        e.preventDefault();
        if (e.type === 'touchmove') {
            currentX = e.touches[0].clientX - initialX;
            currentY = e.touches[0].clientY - initialY;
        } else {
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
        }
        xOffset = currentX;
        yOffset = currentY;
        controlBar.style.transform = `translate(${currentX}px, calc(-50% + ${currentY}px))`;
    }

    function dragEnd() {
        isDragging = false;
    }
})();
