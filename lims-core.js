/* lims-core.js - V2.0 AUTH & DASHBOARD LOGIC (CORREGIDO) */

const KEYS = {
    SESSION: 'xelle_v2_session',
    USERS: 'xelle_v2_users',
    FORMATS: 'xelle_v2_formats'
};

const Core = {
    Data: {
        get: (k) => JSON.parse(localStorage.getItem(k) || '[]'),
        set: (k, v) => localStorage.setItem(k, JSON.stringify(v))
    },

    init: function() {
        // Cargar datos semilla si existen (desde config-users.js)
        if(window.SeedData) {
            Core.Data.set(KEYS.USERS, window.SeedData.users);
            Core.Data.set(KEYS.FORMATS, window.SeedData.formats);
        }
    },

    Auth: {
        login: function(u, p) {
            const users = Core.Data.get(KEYS.USERS);
            
            // BUSQUEDA SEGURA:
            // Usamos optional chaining (?) para evitar error si username no existe en algún registro
            const user = users.find(x => x.username?.toLowerCase() === u.trim().toLowerCase());
            
            if(!user || user.pass !== p.trim()) {
                return { success: false, msg: 'Usuario o contraseña incorrectos.' };
            }
            
            // Guardamos sesión con roles
            Core.Data.set(KEYS.SESSION, { 
                id: user.id, 
                name: user.fullName, 
                role: user.role,
                access: user.moduleAccess // Array de permisos ej: ["comercial"]
            });
            return { success: true };
        },

        logout: function() { 
            localStorage.removeItem(KEYS.SESSION); 
            window.location.href = 'index.html'; 
        },

        check: function() {
            try { 
                const s = Core.Data.get(KEYS.SESSION);
                return s && s.id ? s : null; 
            } catch { return null; }
        }
    },

    UI: {
        renderDashboard: function() {
            const sess = Core.Auth.check();
            if(!sess) { window.location.href = 'index.html'; return; }

            // Mostrar nombre de usuario
            $('#u-name').text(sess.name);
            $('#u-initial').text(sess.name.charAt(0));

            // DEFINICIÓN DE ÁREAS Y REQUISITOS
            const navAreas = [
                { id: 'all', label: 'Ver Todo', icon: 'fa-layer-group', req: 'all' }, 
                { id: 'banco', label: 'Banco de Células', icon: 'fa-dna', req: 'lab-calidad' },
                { id: 'calidad', label: 'Lab. Calidad', icon: 'fa-microscope', req: 'lab-calidad' },
                { id: 'almacen', label: 'Comercial/Almacén', icon: 'fa-boxes', req: 'comercial' },
                { id: 'sgc', label: 'Sistema SGC', icon: 'fa-file-shield', req: 'documentacion' }
            ];

            // FILTRADO DE MENÚ SEGÚN ROL
            let visibleAreas = [];
            
            // Seguridad: Asegurar que access sea un array
            const userAccess = Array.isArray(sess.access) ? sess.access : [];

            if (userAccess.includes('all')) {
                visibleAreas = navAreas;
            } else {
                // Muestra 'all' Y las áreas donde el usuario tenga permiso
                visibleAreas = navAreas.filter(a => a.id === 'all' || userAccess.includes(a.req));
            }

            // Generar HTML del Sidebar
            let filterHtml = '';
            visibleAreas.forEach(a => {
                filterHtml += `
                <div class="filter-item ${a.id === 'all' ? 'active' : ''}" onclick="Core.UI.filterView('${a.id}', this)">
                    <div class="f-icon"><i class="fas ${a.icon}"></i></div>
                    <div class="f-label">${a.label}</div>
                    <div class="f-check"></div>
                </div>`;
            });
            $('#filter-container').html(filterHtml);

            // Cargar vista inicial
            Core.UI.filterView('all');

            // Activar Buscador
            $('#searchBox').off('keyup').on('keyup', function() {
                const val = $(this).val().toLowerCase();
                $('.format-card').each(function() {
                    const text = $(this).data('search').toLowerCase();
                    $(this).toggle(text.includes(val));
                });
            });
        },

        filterView: function(areaId, element) {
            // Manejo visual de selección (Clase Active)
            if(element) {
                $('.filter-item').removeClass('active');
                $(element).addClass('active');
            }

            const sess = Core.Auth.check();
            const formats = Core.Data.get(KEYS.FORMATS);
            const container = $('#workspace');
            const userAccess = Array.isArray(sess.access) ? sess.access : [];
            
            // Mapa de configuración visual
            const areasMap = {
                'banco': { title: 'Banco de Células', icon: 'fa-dna', req: 'lab-calidad' },
                'calidad': { title: 'Laboratorio de Calidad', icon: 'fa-microscope', req: 'lab-calidad' },
                'almacen': { title: 'Comercial y Logística', icon: 'fa-boxes', req: 'comercial' },
                'sgc': { title: 'Sistema de Gestión (SGC)', icon: 'fa-file-shield', req: 'documentacion' }
            };

            // Determinar qué áreas mostrar en el Grid
            let keysToShow = [];
            if (areaId === 'all') {
                // Si es "Ver Todo", mostrar solo lo permitido por el rol
                keysToShow = Object.keys(areasMap).filter(key => 
                    userAccess.includes('all') || userAccess.includes(areasMap[key].req)
                );
            } else {
                // Si es un área específica, mostrarla
                keysToShow = [areaId];
            }

            let html = '';
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

            if(html === '') {
                html = `<div style="text-align:center; padding:50px; color:#888;">
                            <i class="fas fa-lock fa-3x" style="margin-bottom:20px; opacity:0.3"></i><br>
                            No tienes permisos para ver módulos en esta sección.
                        </div>`;
            }

            container.hide().html(html).fadeIn(300);
        }
    }
};

// Exponer Core globalmente y arrancar
window.Core = Core;

$(document).ready(function() {
    Core.init();
    if(window.location.pathname.includes('dashboard.html')) {
        Core.UI.renderDashboard();
    }
});