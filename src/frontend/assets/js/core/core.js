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
                // Mantener los nuevos módulos sin normalización
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
                administracion: 'Administración',
                almacen: 'Almacén',
                banco: 'Banco celular',
                biblioteca: 'Biblioteca SGC',
                comercial: 'Comercial',
                calidad: 'Lab Calidad'
            };

            const areaColors = {
                administracion: 'bg-purple-50 border-purple-200',
                almacen: 'bg-yellow-50 border-yellow-200',
                banco: 'bg-emerald-50 border-emerald-200',
                biblioteca: 'bg-slate-50 border-slate-200',
                comercial: 'bg-orange-50 border-orange-200',
                calidad: 'bg-blue-50 border-blue-200'
            };

            const areaBadgeColors = {
                administracion: 'bg-purple-100 text-purple-700',
                almacen: 'bg-yellow-100 text-yellow-700',
                banco: 'bg-emerald-100 text-emerald-700',
                biblioteca: 'bg-slate-100 text-slate-700',
                comercial: 'bg-orange-100 text-orange-700',
                calidad: 'bg-blue-100 text-blue-700'
            };

            const areaIcons = {
                administracion: 'assets/icons/Administracion.ico',
                almacen: 'assets/icons/Almacen.ico',
                banco: 'assets/icons/BancoCelulas.ico',
                biblioteca: 'assets/icons/BibliotecaSGC.ico',
                comercial: 'assets/icons/Comercial.ico',
                calidad: 'assets/icons/LabCalidad.ico'
            };

            const renderWorkspace = function (selectedArea = null) {
                let html = '';
                // Renderizar TODAS las áreas aunque no tengan formatos
                const allAreas = ['administracion', 'almacen', 'banco', 'biblioteca', 'comercial', 'calidad'];
                const areasToRender = selectedArea
                    ? [selectedArea]
                    : allAreas;

                areasToRender.forEach(area => {
                    const areaFormats = areas[area] || [];
                    html += `
                    <div class="mb-8" data-area="${area}">
                        <div class="flex items-center gap-2 mb-4">
                            <h3 class="text-lg font-black text-navy">${areaLabels[area] || area}</h3>
                            <span class="px-2 py-1 rounded text-xs font-bold ${areaBadgeColors[area]}">${areaFormats.length} tarjetas</span>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    `;

                    if (areaFormats.length > 0) {
                        areaFormats.forEach(f => {
                            const iconSrc = areaIcons[area] || '';
                            html += `
                                <button onclick="Core.UI.openFormat('${f.file}')" class="p-4 rounded-xl border-2 transition-all ${areaColors[area]} hover:shadow-lg hover:scale-105 text-left group">
                                    <div class="flex items-center gap-2 mb-2">
                                        ${iconSrc ? `<img src="${iconSrc}" alt="" class="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity">` : ''}
                                        <div class="text-xs uppercase font-bold text-slate-500 group-hover:text-primary">${f.code}</div>
                                    </div>
                                    <div class="text-sm font-bold text-navy mb-3 line-clamp-2 group-hover:text-primary">${f.title}</div>
                                    <div class="flex items-center gap-2 text-slate-400 group-hover:text-primary transition-colors">
                                        <span class="material-symbols-outlined text-lg">open_in_new</span>
                                        <span class="text-xs font-bold">Abrir</span>
                                    </div>
                                </button>
                            `;
                        });
                    } else {
                        html += `<p class="text-slate-400 text-sm italic col-span-full">No hay formatos disponibles en este módulo</p>`;
                    }

                    html += `</div></div>`;
                });

                workspace.innerHTML = html;
            };

            renderWorkspace();

            // Aplicar visibilidad y eventos a los filtros en sidebar
            const filterContainer = document.getElementById('filter-container');
            if (filterContainer) {
                const filterButtons = filterContainer.querySelectorAll('.area-filter');

                // Mostrar TODOS los módulos siempre (sin filtrar por permisos)
                filterButtons.forEach(btn => {
                    btn.style.display = '';
                });

                let selectedArea = null;

                const updateFilterStyles = () => {
                    filterButtons.forEach(button => {
                        const isActive = button.dataset.area === selectedArea;
                        button.classList.toggle('bg-white/20', isActive);
                        button.classList.toggle('text-white', isActive);
                        button.classList.toggle('text-white/70', !isActive);
                    });
                };

                // Inicializar estilos (todos inactivos al inicio)
                updateFilterStyles();

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
