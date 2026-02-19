// core.js - XELLE LIMS Core Logic v1.0

const KEYS = {
    USERS: 'xelle_users',
    SESSION: 'xelle_session',
    FORMATS: 'xelle_formats'
};

const Core = {
    Data: {
        get: (k) => JSON.parse(localStorage.getItem(k) || '[]'),
        set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
        clear: () => localStorage.clear()
    },

    Formats: {
        syncWithSeed: function () {
            const currentFormats = Core.Data.get(KEYS.FORMATS) || [];
            const seedFormats = SeedData.formats || [];

            const currentByFile = new Map(currentFormats.map(f => [f.file, f]));
            const merged = [...currentFormats];

            seedFormats.forEach(seedFormat => {
                if (!currentByFile.has(seedFormat.file)) {
                    merged.push(seedFormat);
                }
            });

            if (merged.length !== currentFormats.length) {
                Core.Data.set(KEYS.FORMATS, merged);
            }

            return merged;
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

            // Renderizar tarjetas de formatos
            const workspace = document.getElementById('workspace');
            if (!workspace) return;

            const areas = {};
            formats.forEach(f => {
                if (!areas[f.area]) areas[f.area] = [];
                areas[f.area].push(f);
            });

            const areaLabels = {
                banco: 'Banco de Células',
                calidad: 'Laboratorio de Calidad',
                almacen: 'Almacén & Comercial',
                sgc: 'Sistema de Gestión'
            };

            const areaColors = {
                banco: 'bg-emerald-50 border-emerald-200',
                calidad: 'bg-blue-50 border-blue-200',
                almacen: 'bg-orange-50 border-orange-200',
                sgc: 'bg-slate-50 border-slate-200'
            };

            const areaBadgeColors = {
                banco: 'bg-emerald-100 text-emerald-700',
                calidad: 'bg-blue-100 text-blue-700',
                almacen: 'bg-orange-100 text-orange-700',
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
                    if (userAccess.includes('all') || userAccess.includes(area)) {
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
            window.open(file, '_blank');
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
