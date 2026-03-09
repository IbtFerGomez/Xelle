// core.js - XELLE LIMS Core Logic v1.0

const KEYS = {
    USERS: 'xelle_users',
    SESSION: 'xelle_session',
    FORMATS: 'xelle_formats'
};

const FORMAT_ORDER_KEY = 'xelle_format_order_map';

const Core = {
    Data: {
        get: (k) => JSON.parse(localStorage.getItem(k) || '[]'),
        set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
        clear: () => localStorage.clear()
    },

    Formats: {
        syncWithSeed: function () {
            const seedFormats = SeedData.formats || [];
            const hasStoredFormats = localStorage.getItem(KEYS.FORMATS) !== null;
            const currentFormats = hasStoredFormats ? (Core.Data.get(KEYS.FORMATS) || []) : [];

            const sanitizedCurrent = currentFormats.filter(format => {
                const code = String(format.code || '').trim().toUpperCase();
                const file = String(format.file || '').trim();
                const normalizedFile = file.toLowerCase();
                const isInvalidFoLc46 = code === 'FO-LC-46' && normalizedFile !== 'formats/fo-lc-46.html';
                return !(
                    code === 'DGW-TOOL'
                    || file === 'formats/digitalizar-word.html'
                    || code === 'FO-LC-TEST'
                    || file === 'formats/FO-LC-TEST.html'
                    || code === 'FO-LC-13'
                    || file === 'formats/FO-LC-13.html'
                    || normalizedFile.includes('fo-lc-13.html')
                    || code === 'FO-LC-51'
                    || file === 'formats/FO-LC-51.html'
                    || normalizedFile.includes('fo-lc-51.html')
                    || code === 'FO-OP-OP-01'
                    || code === 'FO-OP-01'
                    || normalizedFile.includes('fo-op-op-01.html')
                    || isInvalidFoLc46
                );
            });

            if (hasStoredFormats) {
                if (sanitizedCurrent.length === 0 && seedFormats.length > 0) {
                    Core.Data.set(KEYS.FORMATS, seedFormats);
                    return seedFormats;
                }

                const toKey = (format) => {
                    const code = String(format?.code || '').trim().toUpperCase();
                    const file = String(format?.file || format?.file_path || '').trim().toLowerCase();
                    return `${code}::${file}`;
                };

                const mergedFormats = [...sanitizedCurrent];
                const existingKeys = new Set(mergedFormats.map(toKey));

                seedFormats.forEach(seedFormat => {
                    const key = toKey(seedFormat);
                    if (!existingKeys.has(key)) {
                        mergedFormats.push(seedFormat);
                        existingKeys.add(key);
                    }
                });

                if (mergedFormats.length !== currentFormats.length) {
                    Core.Data.set(KEYS.FORMATS, mergedFormats);
                } else if (sanitizedCurrent.length !== currentFormats.length) {
                    Core.Data.set(KEYS.FORMATS, mergedFormats);
                }

                return mergedFormats;
            }

            Core.Data.set(KEYS.FORMATS, seedFormats);
            return seedFormats;
        }
    },

    Auth: {
        login: function (u, p) {
            const users = Core.Data.get(KEYS.USERS);
            if (!users.length) {
                users.push(...SeedData.users);
                Core.Data.set(KEYS.USERS, users);
            }
            const user = users.find(x => x.username === u && x.pass === p);
            if (!user) return { success: false, msg: 'Credenciales inválidas' };

            const session = {
                id: user.id,
                name: user.fullName,
                user: user.username,
                role: user.role,
                access: user.moduleAccess
            };
            Core.Data.set(KEYS.SESSION, session);
            return { success: true, user: session };
        },

        check: function () {
            const sess = Core.Data.get(KEYS.SESSION);
            return sess && sess.id ? sess : null;
        },

        logout: function () {
            Core.Data.set(KEYS.SESSION, null);
            window.location.href = 'index.html';
        }
    },

    UI: {
        renderDashboard: function () {
            const sess = Core.Auth.check();
            if (!sess) return;

            const formats = Core.Formats.syncWithSeed();
            const userAccess = Array.isArray(sess.access)
                ? sess.access
                : (Array.isArray(sess.moduleAccess) ? sess.moduleAccess : []);
            const normalizeArea = (value) => {
                const area = String(value || '').trim().toLowerCase();
                if (area === 'almacen' || area === 'comercial') return 'operaciones';
                return area;
            };
            const normalizedUserAccess = Array.from(new Set(userAccess.map(normalizeArea)));

            // Renderizar tarjetas de formatos
            const workspace = document.getElementById('workspace');
            if (!workspace) return;

            const areas = {};
            formats.forEach(f => {
                const normalizedArea = normalizeArea(f.area);
                if (!areas[normalizedArea]) areas[normalizedArea] = [];
                areas[normalizedArea].push({ ...f, area: normalizedArea });
            });

            let orderMap = {};
            try {
                const parsed = JSON.parse(localStorage.getItem(FORMAT_ORDER_KEY) || '{}');
                orderMap = parsed && typeof parsed === 'object' ? parsed : {};
            } catch {
                orderMap = {};
            }

            const getSortOrder = (code) => {
                const key = String(code || '').trim().toUpperCase();
                const rawValue = orderMap[key];
                const numericValue = Number(rawValue);
                return Number.isFinite(numericValue) ? numericValue : Number.MAX_SAFE_INTEGER;
            };

            Object.keys(areas).forEach(area => {
                areas[area].sort((a, b) => {
                    const orderA = getSortOrder(a.code);
                    const orderB = getSortOrder(b.code);
                    if (orderA !== orderB) return orderA - orderB;

                    const codeA = String(a.code || '');
                    const codeB = String(b.code || '');
                    return codeA.localeCompare(codeB, 'es', { numeric: true, sensitivity: 'base' });
                });
            });

            const areaLabels = {
                banco: 'Banco de Células',
                calidad: 'Laboratorio de Calidad',
                operaciones: 'Operaciones',
                sgc: 'Sistema de Gestión'
            };

            const areaColors = {
                banco: 'bg-emerald-50 border-emerald-200',
                calidad: 'bg-blue-50 border-blue-200',
                operaciones: 'bg-orange-50 border-orange-200',
                sgc: 'bg-slate-50 border-slate-200'
            };

            const areaBadgeColors = {
                banco: 'bg-emerald-100 text-emerald-700',
                calidad: 'bg-blue-100 text-blue-700',
                operaciones: 'bg-orange-100 text-orange-700',
                sgc: 'bg-slate-100 text-slate-700'
            };

            const renderWorkspace = function (selectedArea = null) {
                let html = '';
                const areasToRender = selectedArea && areas[selectedArea]
                    ? [selectedArea]
                    : Object.keys(areas);

                areasToRender.forEach(area => {
                    html += `
                    <div class="mb-8" data-area="${area}">
                        <div class="flex items-center gap-2 mb-4">
                            <h3 class="text-lg font-black text-navy">${areaLabels[area] || area}</h3>
                            <span class="px-2 py-1 rounded text-xs font-bold ${areaBadgeColors[area]}">${areas[area].length} tarjetas</span>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    `;

                    areas[area].forEach(f => {
                        html += `
                            <button onclick="Core.UI.openFormat('${f.file}')" class="p-4 rounded-xl border-2 transition-all ${areaColors[area]} hover:shadow-lg hover:scale-105 text-left group">
                                <div class="text-xs uppercase font-bold text-slate-500 mb-1 group-hover:text-primary">${f.code}</div>
                                <div class="text-sm font-bold text-navy mb-3 line-clamp-2 group-hover:text-primary">${f.title}</div>
                                <div class="flex items-center gap-2 text-slate-400 group-hover:text-primary transition-colors">
                                    <span class="material-symbols-outlined text-lg">open_in_new</span>
                                    <span class="text-xs font-bold">Abrir</span>
                                </div>
                            </button>
                        `;
                    });

                    html += `</div></div>`;
                });

                workspace.innerHTML = html;
            };

            renderWorkspace();

            // Renderizar filtros en sidebar
            const filterContainer = document.getElementById('filter-container');
            if (filterContainer) {
                let filterHtml = '';
                Object.keys(areas).forEach(area => {
                    if (normalizedUserAccess.includes('all') || normalizedUserAccess.includes(area)) {
                        filterHtml += `
                            <button class="area-filter w-full text-left px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors text-sm font-bold" data-area="${area}">
                                ${areaLabels[area] || area}
                            </button>
                        `;
                    }
                });
                filterContainer.innerHTML = filterHtml;

                let selectedArea = null;
                const filterButtons = document.querySelectorAll('.area-filter');

                const updateFilterStyles = () => {
                    filterButtons.forEach(button => {
                        const isActive = button.dataset.area === selectedArea;
                        button.classList.toggle('bg-white/20', isActive);
                        button.classList.toggle('text-white', isActive);
                        button.classList.toggle('text-white/70', !isActive);
                    });
                };

                filterButtons.forEach(btn => {
                    btn.addEventListener('click', () => {
                        const area = btn.dataset.area;
                        selectedArea = selectedArea === area ? null : area;
                        renderWorkspace(selectedArea);
                        updateFilterStyles();
                    });
                });
            }
        },

        openFormat: function (file) {
            const rawPath = String(file || '').trim().replace(/\\/g, '/');
            if (!rawPath) {
                alert('Esta tarjeta no tiene ruta de formato configurada.');
                return;
            }

            const splitIndex = rawPath.indexOf('?');
            const basePath = splitIndex >= 0 ? rawPath.slice(0, splitIndex) : rawPath;
            const query = splitIndex >= 0 ? rawPath.slice(splitIndex + 1) : '';

            let targetPath = rawPath;
            if (!/^https?:\/\//i.test(basePath) && !basePath.startsWith('/') && !basePath.startsWith('./') && !basePath.startsWith('../')) {
                if (!basePath.toLowerCase().includes('/')) {
                    const withExtension = basePath.toLowerCase().endsWith('.html') ? basePath : `${basePath}.html`;
                    targetPath = `formats/${withExtension}`;
                }
            }

            try {
                const urlObj = new URL(targetPath, window.location.href);
                if (query) {
                    const incomingParams = new URLSearchParams(query);
                    incomingParams.forEach((value, key) => urlObj.searchParams.set(key, value));
                }
                urlObj.searchParams.set('new', '1');
                targetPath = urlObj.pathname.replace(/^\//, '') + urlObj.search;
            } catch (e) {
                const separator = targetPath.includes('?') ? '&' : '?';
                targetPath = `${targetPath}${separator}new=1`;
            }

            window.open(targetPath, '_blank');
        }
    }
};

// Inicializar seed data si no existe
window.addEventListener('load', () => {
    Core.Formats.syncWithSeed();
    if (!Core.Data.get(KEYS.USERS).length) {
        Core.Data.set(KEYS.USERS, SeedData.users);
    }
});
