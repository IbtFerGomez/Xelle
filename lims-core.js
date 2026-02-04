/* lims-core.js - V18 FILTER MANAGER LOGIC */

const KEYS = {
    SESSION: 'xelle_v18_session',
    USERS: 'xelle_v18_users',
    FORMATS: 'xelle_v18_formats'
};

const Core = {
    Data: {
        get: (k) => JSON.parse(localStorage.getItem(k) || '[]'),
        set: (k, v) => localStorage.setItem(k, JSON.stringify(v))
    },

    init: function() {
        if(window.SeedData) {
            Core.Data.set(KEYS.USERS, window.SeedData.users);
            Core.Data.set(KEYS.FORMATS, window.SeedData.formats);
        }
    },

    Auth: {
        login: function(u, p) {
            const users = Core.Data.get(KEYS.USERS);
            const user = users.find(x => x.user.toLowerCase() === u.trim().toLowerCase());
            if(!user || user.pass !== p.trim()) return { success: false, msg: 'Credenciales inválidas.' };
            
            Core.Data.set(KEYS.SESSION, { id: user.id, name: user.name, role: 'user' });
            return { success: true };
        },
        logout: function() { localStorage.removeItem(KEYS.SESSION); window.location.href = 'index.html'; },
        check: function() {
            try { return Core.Data.get(KEYS.SESSION).id ? Core.Data.get(KEYS.SESSION) : null; } 
            catch { return null; }
        }
    },

    UI: {
        renderDashboard: function() {
            const sess = Core.Auth.check();
            if(!sess) { window.location.href = 'index.html'; return; }

            $('#u-name').text(sess.name);
            $('#u-initial').text(sess.name.charAt(0));

            // GENERAR FILTROS LATERALES
            const areas = [
                { id: 'all', label: 'Ver Todo', icon: 'fa-layer-group' },
                { id: 'banco', label: 'Banco de Células', icon: 'fa-dna' },
                { id: 'calidad', label: 'Lab. Calidad', icon: 'fa-microscope' },
                { id: 'almacen', label: 'Almacén', icon: 'fa-boxes' },
                { id: 'sgc', label: 'Sistema SGC', icon: 'fa-file-shield' }
            ];

            let filterHtml = '';
            areas.forEach(a => {
                filterHtml += `
                <div class="filter-item ${a.id === 'all' ? 'active' : ''}" onclick="Core.UI.filterView('${a.id}', this)">
                    <div class="f-icon"><i class="fas ${a.icon}"></i></div>
                    <div class="f-label">${a.label}</div>
                    <div class="f-check"></div>
                </div>`;
            });
            $('#filter-container').html(filterHtml);

            // RENDERIZAR TODO INICIALMENTE
            Core.UI.filterView('all');

            // BUSCADOR
            $('#searchBox').on('keyup', function() {
                const val = $(this).val().toLowerCase();
                $('.format-card').each(function() {
                    const text = $(this).data('search').toLowerCase();
                    $(this).toggle(text.includes(val));
                });
            });
        },

        filterView: function(areaId, element) {
            // 1. Manejo visual de selección
            if(element) {
                $('.filter-item').removeClass('active');
                $(element).addClass('active');
            }

            const formats = Core.Data.get(KEYS.FORMATS);
            const container = $('#workspace');
            
            // Definir qué áreas mostrar
            const areasMap = {
                'banco': { title: 'Banco de Células', icon: 'fa-dna' },
                'calidad': { title: 'Laboratorio de Calidad', icon: 'fa-microscope' },
                'almacen': { title: 'Almacén y Logística', icon: 'fa-boxes' },
                'sgc': { title: 'Sistema de Gestión (SGC)', icon: 'fa-file-shield' }
            };

            let html = '';
            let keysToShow = (areaId === 'all') ? Object.keys(areasMap) : [areaId];

            keysToShow.forEach(key => {
                const info = areasMap[key];
                const areaFormats = formats.filter(f => f.area === key);
                
                if(areaFormats.length > 0) {
                    html += `
                    <div class="area-section">
                        <div class="area-header">
                            <div class="area-title"><i class="fas ${info.icon}" style="color:var(--c-principal)"></i> ${info.title}</div>
                            <div style="flex-grow:1"></div>
                            <div class="area-count">${areaFormats.length} Formatos</div>
                        </div>
                        <div class="formats-grid">`;
                    
                    areaFormats.forEach(f => {
                        html += `
                        <div class="format-card fc-${key}" data-search="${f.code} ${f.title}" onclick="window.open('${f.file}', '_blank')">
                            <div>
                                <div class="fmt-code">${f.code}</div>
                                <div class="fmt-title">${f.title}</div>
                            </div>
                            <div class="fmt-action">Abrir <i class="fas fa-external-link-alt"></i></div>
                        </div>`;
                    });
                    html += `</div></div>`;
                }
            });

            // Inyectar con efecto fade
            container.hide().html(html).fadeIn(300);
        }
    }
};

window.Core = Core;

$(document).ready(function() {
    Core.init();
    if(window.location.pathname.includes('dashboard.html')) {
        Core.UI.renderDashboard();
    }
});