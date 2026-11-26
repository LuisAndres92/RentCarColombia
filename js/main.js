(function ($) {
    "use strict";
    
    // Comportamiento de Dropdowns de Bootstrap: solo al clic y cierre al hacer clic fuera (sin hover brusco)
    $(document).ready(function () {
        $('.navbar .dropdown').off('mouseover mouseout');
    });


    // Configurar idioma español en Moment.js
    if (window.moment) {
        moment.locale('es');
    }

    // Date and time picker en español con paleta corporativa
    if ($.fn.datetimepicker) {
        $('.date').datetimepicker({
            format: 'L',
            locale: 'es',
            icons: {
                time: 'fa fa-clock',
                date: 'fa fa-calendar',
                up: 'fa fa-chevron-up',
                down: 'fa fa-chevron-down',
                previous: 'fa fa-chevron-left',
                next: 'fa fa-chevron-right',
                today: 'fa fa-calendar-check',
                clear: 'fa fa-trash',
                close: 'fa fa-times'
            }
        });
        $('.time').datetimepicker({
            format: 'LT',
            locale: 'es',
            icons: {
                time: 'fa fa-clock',
                date: 'fa fa-calendar',
                up: 'fa fa-chevron-up',
                down: 'fa fa-chevron-down',
                previous: 'fa fa-chevron-left',
                next: 'fa fa-chevron-right',
                today: 'fa fa-calendar-check',
                clear: 'fa fa-trash',
                close: 'fa fa-times'
            }
        });
    }
    
    
    // Back to top button
    $(window).scroll(function () {
        if ($(this).scrollTop() > 100) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({scrollTop: 0}, 1500, 'easeInOutExpo');
        return false;
    });


    // Carousels con verificación defensiva de Owl Carousel
    if ($.fn.owlCarousel) {
        // Team carousel
        $(".team-carousel, .related-carousel").owlCarousel({
            autoplay: true,
            smartSpeed: 1000,
            center: true,
            margin: 30,
            dots: false,
            loop: true,
            nav : true,
            navText : [
                '<i class="fa fa-angle-left" aria-hidden="true"></i>',
                '<i class="fa fa-angle-right" aria-hidden="true"></i>'
            ],
            responsive: {
                0:{
                    items:1
                },
                576:{
                    items:1
                },
                768:{
                    items:2
                },
                992:{
                    items:3
                }
            }
        });


        // Testimonials carousel
        $(".testimonial-carousel").owlCarousel({
            autoplay: true,
            smartSpeed: 1500,
            margin: 30,
            dots: true,
            loop: true,
            center: true,
            responsive: {
                0:{
                    items:1
                },
                576:{
                    items:1
                },
                768:{
                    items:2
                },
                992:{
                    items:3
                }
            }
        });


        // Vendor carousel
        $('.vendor-carousel').owlCarousel({
            loop: true,
            margin: 30,
            dots: true,
            autoplay: true,
            smartSpeed: 1000,
            responsive: {
                0:{
                    items:2
                },
                576:{
                    items:3
                },
                768:{
                    items:4
                },
                992:{
                    items:5
                },
                1200:{
                    items:6
                }
            }
        });
    }

    /**
     * =========================================================================
     * SEGURIDAD DE SESIÓN: CONTROL DE INACTIVIDAD
     * Límite: 30 minutos sin interacción física del usuario.
     * =========================================================================
     */
    const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutos

    function isSessionTimedOut() {
        const currentUser = localStorage.getItem('renteasy_current_user');
        if (!currentUser) return false;

        const storedLast = parseInt(localStorage.getItem('renteasy_last_activity'), 10);
        if (!storedLast || isNaN(storedLast)) {
            // Inicializar timestamp fresco si no existía previamente
            localStorage.setItem('renteasy_last_activity', Date.now().toString());
            return false;
        }

        return (Date.now() - storedLast) >= INACTIVITY_LIMIT_MS;
    }

    async function performInactivityLogout() {
        console.warn("Seguridad Rent Car Colombia: Sesión finalizada automáticamente por inactividad prolongada (30 min).");

        try {
            sessionStorage.setItem('renteasy_explicit_logout', 'true');
            localStorage.removeItem('renteasy_current_user');
            localStorage.removeItem('renteasy_last_activity');
            localStorage.removeItem('renteasy_pending_role');

            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && (k.startsWith('sb-') || k.includes('auth-token') || k.startsWith('renteasy_current_user'))) {
                    keysToRemove.push(k);
                }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));

            if (typeof getSupabaseClient === 'function') {
                const client = getSupabaseClient();
                if (client && client.auth) {
                    await Promise.race([
                        client.auth.signOut({ scope: 'local' }),
                        new Promise(resolve => setTimeout(resolve, 500))
                    ]);
                }
            }
        } catch (e) {
            console.warn("Inactivity logout cleanup error:", e);
        } finally {
            const currentPath = window.location.pathname.toLowerCase();
            if (!currentPath.includes('login.html')) {
                const redirectTarget = encodeURIComponent(window.location.pathname + window.location.search);
                window.location.href = `LOGIN.html?reason=timeout&redirect=${redirectTarget}`;
            } else {
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.get('reason') !== 'timeout') {
                    window.location.href = 'LOGIN.html?reason=timeout';
                }
            }
        }
    }

    window.isSessionTimedOut = isSessionTimedOut;
    window.performInactivityLogout = performInactivityLogout;

    /**
     * =========================================================================
     * NAVBAR DE USUARIO: PERFIL, FOTO, CONFIGURACIÓN Y CERRAR SESIÓN
     * Detecta si hay una sesión activa (localStorage o Supabase Auth) y renderiza
     * dinámicamente el botón de usuario con avatar, nombre, rol, modal de perfil
     * y redirige 'Publicar mi Auto' directamente a la gestión de propietarios.
     * =========================================================================
     */
    function initUserNavbar() {
        // Asegurar que el modal de perfil exista siempre en cualquier página
        injectProfileModal();

        // 1. Verificación estricta de inactividad antes de procesar o renderizar sesión
        if (isSessionTimedOut()) {
            performInactivityLogout();
            return;
        }

        let user = null;
        try {
            user = JSON.parse(localStorage.getItem('renteasy_current_user'));
        } catch (e) {
            user = null;
        }

        // Si existe un usuario en sesión local, asegurar campos mínimos
        if (user && (user.email || user.name || user.id)) {
            user.email = user.email || ((user.name ? user.name.replace(/\s+/g, '_').toLowerCase() : 'usuario') + '@rentcarcolombia.com');
            user.name = user.name || user.email.split('@')[0];
            user.avatar = user.avatar || 'img/team-1.jpg';
            user.role = user.role || 'conductor';
        }

        function renderUser(u) {
            if (!u || (!u.email && !u.name && !u.id)) {
                // Si NO hay sesión activa, asegurar que los botones de publicar lleven a login/registro
                document.querySelectorAll('a[href*="role=propietario"], a[href*="dashboard-propietario"], .btn-publish-car').forEach(btn => {
                    const text = (btn.textContent || '').trim().toLowerCase();
                    if (text.includes('publicar') || btn.getAttribute('href')?.includes('dashboard-propietario')) {
                        btn.href = 'LOGIN.html?action=register&role=propietario&redirect=dashboard-propietario.html';
                    }
                });
                return;
            }

            // Normalizar datos del usuario autenticado
            u.email = u.email || ((u.name ? u.name.replace(/\s+/g, '_').toLowerCase() : 'usuario') + '@rentcarcolombia.com');
            u.name = u.name || u.email.split('@')[0];
            const userPhoto = u.avatar || 'img/team-1.jpg';
            const rawName = u.name;
            const firstName = (rawName.split(' ')[0] || 'Mi Perfil').replace(/[()]/g, '');

            // 1. Si el usuario está autenticado, TODOS los botones de "Publicar mi Auto" lo llevan directo a su panel
            document.querySelectorAll('a[href*="role=propietario"], a[href*="dashboard-propietario"], a.btn-primary, a.btn-outline-light, .btn-publish-car').forEach(btn => {
                const text = (btn.textContent || '').trim().toLowerCase();
                const currentHref = (btn.getAttribute('href') || '').toLowerCase();
                if (text.includes('publicar') || currentHref.includes('role=propietario') || currentHref.includes('dashboard-propietario')) {
                    btn.href = 'dashboard-propietario.html';
                    btn.onclick = function(e) {
                        // Promover automáticamente el rol a propietario si estaba como conductor
                        if (u.role !== 'admin' && u.role !== 'propietario') {
                            u.role = 'propietario';
                            localStorage.setItem('renteasy_current_user', JSON.stringify(u));
                            localStorage.setItem('renteasy_pending_role', 'propietario');
                            if (typeof getSupabaseClient === 'function') {
                                const client = getSupabaseClient();
                                if (client) {
                                    client.from('perfiles').update({ rol: 'propietario' }).eq('id', u.id).catch(() => {});
                                }
                            }
                        }
                    };
                }
            });

            // Garantizar que la cuenta maestra admin@rentcarcolombia.com nunca pierda su rol admin
            if ((u.email || '').toLowerCase().trim() === 'admin@rentcarcolombia.com' && u.role !== 'admin') {
                u.role = 'admin';
                localStorage.setItem('renteasy_current_user', JSON.stringify(u));
            }

            // En dashboard-propietario.html, actualizar nombre e icono en la barra si existe
            const ownerNavName = document.getElementById('nav-user-name');
            if (ownerNavName) {
                ownerNavName.innerText = u.name;
            }

            // 2. Si ya existe el dropdown dinámico renderizado, actualizar datos (y recrear si cambió el rol)
            const existingDropdown = document.querySelector('.user-profile-nav-item');
            if (existingDropdown) {
                if (existingDropdown.dataset.userRole === u.role) {
                    existingDropdown.querySelectorAll('.user-current-avatar').forEach(img => img.src = userPhoto);
                    existingDropdown.querySelectorAll('.user-current-name').forEach(span => span.textContent = firstName);
                    existingDropdown.querySelectorAll('.user-full-name').forEach(div => div.textContent = u.name);
                    return;
                }
                existingDropdown.remove();
            }

            // 3. Localizar el botón/enlace de inicio de sesión de forma infalible
            let loginLink = document.getElementById('nav-login-link') || document.querySelector('.nav-auth-link');
            if (!loginLink) {
                const navLinks = document.querySelectorAll('.navbar-nav a, nav a');
                for (let i = 0; i < navLinks.length; i++) {
                    const a = navLinks[i];
                    const text = (a.textContent || '').trim().toLowerCase();
                    const href = (a.getAttribute('href') || '').toLowerCase();
                    if (text.includes('publicar') || href.includes('role=propietario')) continue;
                    if (text === 'iniciar sesión' || text === 'iniciar sesion' || text === 'ingresar' || text === 'login' || href.includes('login.html')) {
                        loginLink = a;
                        break;
                    }
                }
            }

            const roleBadge = u.role === 'admin' 
                ? '<span class="badge badge-warning text-dark font-weight-bold ml-1 px-1" style="font-size:10px;">Admin</span>' 
                : u.role === 'propietario'
                ? '<span class="badge badge-success text-white font-weight-bold ml-1 px-1" style="font-size:10px;">Anfitrión</span>'
                : '<span class="badge badge-primary text-white font-weight-bold ml-1 px-1" style="font-size:10px;">Conductor</span>';

            let panelLinkHtml = '';
            if (u.role === 'admin') {
                panelLinkHtml = `
                    <a class="dropdown-item py-2" href="admin.html"><i class="fa fa-tachometer-alt text-primary mr-2"></i> Panel de Administración</a>
                    <a class="dropdown-item py-2" href="dashboard-propietario.html"><i class="fa fa-car text-success mr-2"></i> Panel de Anfitrión</a>
                    <a class="dropdown-item py-2" href="mis-reservas.html"><i class="fa fa-calendar-check text-info mr-2"></i> Mis Reservas e Historial</a>
                `;
            } else if (u.role === 'propietario') {
                panelLinkHtml = `
                    <a class="dropdown-item py-2 font-weight-bold" href="dashboard-propietario.html"><i class="fa fa-car text-primary mr-2"></i> Mis Autos y Ganancias</a>
                    <a class="dropdown-item py-2" href="mis-reservas.html"><i class="fa fa-calendar-check text-info mr-2"></i> Mis Reservas e Historial</a>
                    <a class="dropdown-item py-2" href="car.html"><i class="fa fa-search text-secondary mr-2"></i> Explorar Autos</a>
                `;
            } else {
                panelLinkHtml = `
                    <a class="dropdown-item py-2 font-weight-bold" href="mis-reservas.html"><i class="fa fa-calendar-check text-primary mr-2"></i> Mis Reservas e Historial</a>
                    <a class="dropdown-item py-2" href="car.html"><i class="fa fa-car text-secondary mr-2"></i> Catálogo de Autos</a>
                    <a class="dropdown-item py-2 text-primary font-weight-bold" href="dashboard-propietario.html"><i class="fa fa-plus-circle text-primary mr-2"></i> Publicar mi Auto (Modo Anfitrión)</a>
                `;
            }

            const userDropdown = document.createElement('div');
            userDropdown.className = 'nav-item dropdown user-profile-nav-item d-inline-block';
            userDropdown.id = 'nav-user-dropdown';
            userDropdown.dataset.userRole = u.role || 'conductor';
            userDropdown.innerHTML = `
                <a href="javascript:void(0)" class="nav-link dropdown-toggle d-flex align-items-center py-2 text-white font-weight-bold" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false" style="cursor: pointer;">
                    <img src="${userPhoto}" alt="${u.name}" class="rounded-circle border mr-2 user-current-avatar" style="width: 34px; height: 34px; object-fit: cover; border-color: rgba(255,255,255,0.4) !important;" onerror="this.src='img/team-1.jpg'">
                    <span class="user-current-name text-truncate" style="max-width: 120px;">${firstName}</span>
                    ${roleBadge}
                </a>
                <div class="dropdown-menu dropdown-menu-right rounded shadow-lg border-0 py-2 mt-1" style="min-width: 250px; z-index: 1050;">
                    <div class="px-3 py-2 border-bottom bg-light">
                        <div class="font-weight-bold text-dark text-truncate user-full-name">${u.name}</div>
                        <div class="small text-muted text-truncate">${u.email}</div>
                    </div>
                    ${panelLinkHtml}
                    <a class="dropdown-item py-2 btn-open-profile-modal" href="javascript:void(0)">
                        <i class="fa fa-user-cog text-secondary mr-2"></i> Configurar mi Perfil
                    </a>
                    <div class="dropdown-divider my-1"></div>
                    <a class="dropdown-item py-2 text-danger btn-logout-user font-weight-bold" href="javascript:void(0)">
                        <i class="fa fa-sign-out-alt mr-2"></i> Cerrar Sesión
                    </a>
                </div>
            `;

            if (loginLink) {
                loginLink.replaceWith(userDropdown);
            } else {
                // Inserción defensiva si no había link de login explícito
                const navContainer = document.querySelector('.navbar-nav');
                if (navContainer && !navContainer.querySelector('.user-profile-nav-item')) {
                    const pubBtn = navContainer.querySelector('a[href*="role=propietario"], a[href*="dashboard-propietario"], .btn-primary');
                    if (pubBtn) {
                        navContainer.insertBefore(userDropdown, pubBtn);
                    } else {
                        navContainer.appendChild(userDropdown);
                    }
                }
            }

            injectProfileModal();
        }

        // 1. Si ya hay usuario en sesión, renderizar de inmediato
        if (user && (user.email || user.name || user.id)) {
            renderUser(user);
        } else {
            renderUser(null);
        }

        // 2. Sincronizar también con la sesión de Supabase Auth en segundo plano
        if (typeof getSupabaseClient === 'function') {
            const client = getSupabaseClient();
            if (client && client.auth) {
                // Si el usuario acaba de cerrar sesión explícitamente o expiró por inactividad, no re-hidratar sesión
                if (sessionStorage.getItem('renteasy_explicit_logout') === 'true' || window.location.search.includes('action=logged_out') || window.location.search.includes('reason=timeout') || isSessionTimedOut()) {
                    if (isSessionTimedOut()) {
                        performInactivityLogout();
                    }
                    return;
                }

                // Escuchar cambios de autenticación
                if (typeof client.auth.onAuthStateChange === 'function') {
                    client.auth.onAuthStateChange((event, session) => {
                        if (event === 'SIGNED_OUT' || sessionStorage.getItem('renteasy_explicit_logout') === 'true' || window.location.search.includes('action=logged_out') || window.location.search.includes('reason=timeout') || isSessionTimedOut()) {
                            if (isSessionTimedOut()) {
                                performInactivityLogout();
                            } else {
                                localStorage.removeItem('renteasy_current_user');
                            }
                            return;
                        }
                        if (session && session.user) {
                            const sbUser = session.user;
                            const meta = sbUser.user_metadata || {};
                            let curUser = null;
                            try { curUser = JSON.parse(localStorage.getItem('renteasy_current_user')); } catch (e) {}
                            const isMasterAdmin = (sbUser.email || '').toLowerCase().trim() === 'admin@rentcarcolombia.com';
                            const currentRole = isMasterAdmin ? 'admin' : ((curUser && curUser.role) || meta.role || localStorage.getItem('renteasy_pending_role') || 'conductor');
                            const syncedUser = {
                                id: sbUser.id,
                                name: meta.full_name || meta.name || (curUser && curUser.name) || sbUser.email.split('@')[0],
                                email: sbUser.email,
                                role: currentRole,
                                avatar: meta.avatar_url || meta.picture || (curUser && curUser.avatar) || 'img/team-1.jpg',
                                phone: meta.phone || (curUser && curUser.phone) || '',
                                city: meta.city || (curUser && curUser.city) || 'Valledupar',
                                provider: sbUser.app_metadata?.provider || 'google',
                                loggedAt: (curUser && curUser.loggedAt) || new Date().toISOString()
                            };
                            localStorage.setItem('renteasy_current_user', JSON.stringify(syncedUser));
                            renderUser(syncedUser);
                        }
                    });
                }

                client.auth.getSession().then(({ data: { session } }) => {
                    if (sessionStorage.getItem('renteasy_explicit_logout') === 'true' || window.location.search.includes('action=logged_out') || window.location.search.includes('reason=timeout') || isSessionTimedOut()) {
                        if (isSessionTimedOut()) {
                            performInactivityLogout();
                        }
                        return;
                    }
                    if (session && session.user) {
                        const sbUser = session.user;
                        const meta = sbUser.user_metadata || {};
                        let curUser = null;
                        try { curUser = JSON.parse(localStorage.getItem('renteasy_current_user')); } catch (e) {}
                        const isMasterAdmin = (sbUser.email || '').toLowerCase().trim() === 'admin@rentcarcolombia.com';
                        const currentRole = isMasterAdmin ? 'admin' : ((curUser && curUser.role) || meta.role || localStorage.getItem('renteasy_pending_role') || 'conductor');
                        const syncedUser = {
                            id: sbUser.id,
                            name: meta.full_name || meta.name || (curUser && curUser.name) || sbUser.email.split('@')[0],
                            email: sbUser.email,
                            role: currentRole,
                            avatar: meta.avatar_url || meta.picture || (curUser && curUser.avatar) || 'img/team-1.jpg',
                            phone: meta.phone || (curUser && curUser.phone) || '',
                            city: meta.city || (curUser && curUser.city) || 'Valledupar',
                            provider: sbUser.app_metadata?.provider || 'google',
                            loggedAt: (curUser && curUser.loggedAt) || new Date().toISOString()
                        };
                        localStorage.setItem('renteasy_current_user', JSON.stringify(syncedUser));
                        renderUser(syncedUser);
                    }
                }).catch(() => {});
            }
        }
    }
    window.initUserNavbar = initUserNavbar;

    function injectProfileModal() {
        if (document.getElementById('modalUserProfile')) return;

        const modalHtml = `
            <div class="modal fade" id="modalUserProfile" tabindex="-1" role="dialog" aria-hidden="true" style="z-index: 1060;">
                <div class="modal-dialog modal-dialog-centered" role="document">
                    <div class="modal-content border-0 shadow-lg rounded-lg overflow-hidden">
                        <div class="modal-header bg-secondary text-white py-3">
                            <h5 class="modal-title font-weight-bold text-white">
                                <i class="fa fa-user-cog text-primary mr-2"></i> Mi Perfil y Configuración
                            </h5>
                            <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body p-4 text-left">
                            <form id="form-user-profile-modal">
                                <!-- Sección de Foto de Perfil -->
                                <div class="text-center mb-4">
                                    <div class="position-relative d-inline-block">
                                        <img id="mp-avatar-preview" src="img/team-1.jpg" alt="Foto de perfil" class="rounded-circle border shadow-sm" style="width: 90px; height: 90px; object-fit: cover;">
                                        <label for="mp-avatar-input" class="btn btn-sm btn-primary rounded-circle position-absolute shadow" style="bottom: 0; right: 0; width: 32px; height: 32px; padding: 0; line-height: 32px; text-align: center; cursor: pointer;" title="Cambiar foto de perfil">
                                            <i class="fa fa-camera text-white" style="font-size: 13px;"></i>
                                        </label>
                                        <input type="file" id="mp-avatar-input" accept="image/*" style="display: none;">
                                    </div>
                                    <div class="small text-muted mt-2">Haz clic en la cámara para subir una foto nueva</div>
                                </div>

                                <div class="form-group mb-3">
                                    <label class="small font-weight-bold text-dark">Nombre Completo *</label>
                                    <input type="text" id="mp-name" class="form-control" required style="height: 44px;">
                                </div>

                                <div class="form-group mb-3">
                                    <label class="small font-weight-bold text-dark">Correo Electrónico (Principal)</label>
                                    <input type="email" id="mp-email" class="form-control bg-light" disabled style="height: 44px;">
                                </div>

                                <div class="form-row">
                                    <div class="col-md-6 form-group mb-3">
                                        <label class="small font-weight-bold text-dark">Teléfono / WhatsApp *</label>
                                        <input type="tel" id="mp-phone" class="form-control" placeholder="+57 300 000 0000" style="height: 44px;">
                                    </div>
                                    <div class="col-md-6 form-group mb-3">
                                        <label class="small font-weight-bold text-dark">Ciudad</label>
                                        <input type="text" id="mp-city" class="form-control" placeholder="Valledupar" style="height: 44px;">
                                    </div>
                                </div>

                                <div class="form-group mb-3">
                                    <label class="small font-weight-bold text-dark">Rol en la Plataforma</label>
                                    <div class="p-2 border rounded bg-light d-flex align-items-center justify-content-between">
                                        <span id="mp-role-text" class="font-weight-bold text-dark text-capitalize small">Conductor</span>
                                        <span class="badge badge-success small py-1 px-2"><i class="fa fa-shield-alt mr-1"></i> Cuenta Verificada</span>
                                    </div>
                                </div>

                                <div id="mp-alert" class="alert d-none small p-2 rounded" role="alert"></div>

                                <div class="d-flex justify-content-between mt-4">
                                    <button type="button" class="btn btn-outline-secondary font-weight-bold px-3" data-dismiss="modal">
                                        Cancelar
                                    </button>
                                    <button type="submit" id="mp-btn-save" class="btn btn-primary font-weight-bold px-4 shadow-sm">
                                        <i class="fa fa-save mr-1"></i> Guardar Cambios
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Listener de cambio de imagen en el modal
        let newAvatarData = null;
        document.getElementById('mp-avatar-input').addEventListener('change', function(e) {
            const file = e.target.files && e.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    alert('La foto seleccionada excede el límite de 5MB.');
                    return;
                }
                const reader = new FileReader();
                reader.onload = function(evt) {
                    document.getElementById('mp-avatar-preview').src = evt.target.result;
                    newAvatarData = evt.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        // Guardar cambios del perfil
        document.getElementById('form-user-profile-modal').addEventListener('submit', async function(e) {
            e.preventDefault();
            const btn = document.getElementById('mp-btn-save');
            const alertBox = document.getElementById('mp-alert');
            const origHtml = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fa fa-spinner fa-spin mr-1"></i> Guardando...';

            let user = JSON.parse(localStorage.getItem('renteasy_current_user')) || {};
            const updatedName = document.getElementById('mp-name').value.trim();
            const updatedPhone = document.getElementById('mp-phone').value.trim();
            const updatedCity = document.getElementById('mp-city').value.trim();

            user.name = updatedName || user.name;
            user.phone = updatedPhone || user.phone;
            user.city = updatedCity || user.city;
            if (newAvatarData) {
                user.avatar = newAvatarData;
            }

            // 1. Guardar en sesión local
            localStorage.setItem('renteasy_current_user', JSON.stringify(user));

            // 2. Actualizar en Supabase si está disponible
            if (typeof getSupabaseClient === 'function') {
                const client = getSupabaseClient();
                if (client) {
                    try {
                        await client.from('perfiles').upsert({
                            id: user.id,
                            email: user.email,
                            nombre_completo: user.name,
                            telefono: user.phone,
                            ciudad: user.city,
                            avatar_url: user.avatar
                        });
                    } catch(err) {
                        console.warn("Error actualizando perfil en Supabase:", err);
                    }
                }
            }

            // Actualizar vista en el navbar
            document.querySelectorAll('.user-current-avatar').forEach(img => img.src = user.avatar);
            document.querySelectorAll('.user-current-name').forEach(span => span.textContent = (user.name || '').split(' ')[0]);
            document.querySelectorAll('.user-full-name').forEach(div => div.textContent = user.name || '');
            const ownerNavName = document.getElementById('nav-user-name');
            if (ownerNavName) {
                ownerNavName.innerText = user.name || user.email.split('@')[0];
            }

            alertBox.className = 'alert alert-success small p-2 rounded';
            alertBox.innerHTML = '<i class="fa fa-check-circle mr-1"></i> ¡Perfil actualizado con éxito!';
            alertBox.classList.remove('d-none');

            btn.disabled = false;
            btn.innerHTML = origHtml;

            setTimeout(() => {
                alertBox.classList.add('d-none');
                $('#modalUserProfile').modal('hide');
            }, 1200);
        });
    }

    // Delegación de eventos para Abrir Modal y Cerrar Sesión
    $(document).on('click', '.btn-open-profile-modal', function(e) {
        if (e) e.preventDefault();
        injectProfileModal();
        let user = {};
        try {
            user = JSON.parse(localStorage.getItem('renteasy_current_user')) || {};
        } catch (err) {
            user = {};
        }

        const elName = document.getElementById('mp-name');
        const elEmail = document.getElementById('mp-email');
        const elPhone = document.getElementById('mp-phone');
        const elCity = document.getElementById('mp-city');
        const elAvatar = document.getElementById('mp-avatar-preview');
        const elRole = document.getElementById('mp-role-text');

        if (elName) elName.value = user.name || '';
        if (elEmail) elEmail.value = user.email || '';
        if (elPhone) elPhone.value = user.phone || '';
        if (elCity) elCity.value = user.city || 'Valledupar';
        if (elAvatar) elAvatar.src = user.avatar || 'img/team-1.jpg';
        if (elRole) elRole.textContent = user.role || 'Conductor';

        $('#modalUserProfile').modal('show');
    });

    async function performFullLogout() {
        try {
            sessionStorage.setItem('renteasy_explicit_logout', 'true');
            localStorage.removeItem('renteasy_current_user');
            localStorage.removeItem('renteasy_last_activity');
            localStorage.removeItem('renteasy_pending_role');

            // Limpiar tokens de Supabase Auth en localStorage
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && (k.startsWith('sb-') || k.includes('auth-token') || k.startsWith('renteasy_current_user'))) {
                    keysToRemove.push(k);
                }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));

            if (typeof getSupabaseClient === 'function') {
                const client = getSupabaseClient();
                if (client && client.auth) {
                    await Promise.race([
                        client.auth.signOut({ scope: 'local' }),
                        new Promise(resolve => setTimeout(resolve, 600))
                    ]);
                }
            }
        } catch (e) {
            console.warn("Logout error:", e);
        } finally {
            window.location.href = 'LOGIN.html?action=logged_out';
        }
    }
    window.performFullLogout = performFullLogout;

    $(document).off('click.rcLogout').on('click.rcLogout', '.btn-logout-user, #btn-logout, .btn-admin-logout', function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const btn = $(this);
        if (typeof window.openLogoutConfirmModal === 'function') {
            window.openLogoutConfirmModal(async function() {
                btn.prop('disabled', true);
                await performFullLogout();
            });
        } else {
            btn.prop('disabled', true);
            performFullLogout();
        }
    });

    // Intercepción global: exigir sesión obligatoria antes de rentar o pasar al checkout
    $(document).on('click', 'a[href*="booking.html"], .btn-rent-car', function(e) {
        let u = null;
        try {
            u = JSON.parse(localStorage.getItem('renteasy_current_user'));
        } catch(err) {
            u = null;
        }

        if (!u || (!u.email && !u.name && !u.id)) {
            e.preventDefault();
            alert('Para rentar un vehículo en Rent Car Colombia debes iniciar sesión o crear tu cuenta de conductor.');
            const targetHref = $(this).attr('href') || 'booking.html';
            window.location.href = 'LOGIN.html?action=register&role=conductor&redirect=' + encodeURIComponent(targetHref);
        }
    });

    window.injectProfileModal = injectProfileModal;

    // Ejecutar inicialización de forma inmediata y en todos los ciclos de vida del DOM
    initUserNavbar();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            injectProfileModal();
            initUserNavbar();
        });
    } else {
        injectProfileModal();
        initUserNavbar();
    }

    $(document).ready(function() {
        injectProfileModal();
        initUserNavbar();
    });

    $(window).on('load', function() {
        initUserNavbar();
    });

    /**
     * =========================================================================
     * SEGURIDAD: MONITOR ACTIVO DE INACTIVIDAD
     * Captura interacción física real (clic, teclas, touch, scroll) y detecta
     * retorno a la pestaña (visibilitychange / focus) tras ausencias prolongadas.
     * =========================================================================
     */
    (function setupInactivityMonitor() {
        if (window._rentcarInactivityInitialized) return;
        const CHECK_INTERVAL_MS = 10 * 1000; // Verificar cada 10 segundos
        let lastInteraction = 0;

        // Si ya está expirada al inicializar, cerrar de inmediato
        if (isSessionTimedOut()) {
            performInactivityLogout();
            return;
        }

        // Registrar interacción física REAL del usuario (con throttle de 3 seg)
        function registerUserActivity() {
            const currentUser = localStorage.getItem('renteasy_current_user');
            if (!currentUser) return;

            const now = Date.now();
            if (now - lastInteraction > 3000) {
                lastInteraction = now;
                try {
                    localStorage.setItem('renteasy_last_activity', now.toString());
                } catch (e) {}
            }
        }

        // Eventos reales de interacción física del usuario
        const realEvents = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
        realEvents.forEach(evt => {
            window.addEventListener(evt, registerUserActivity, { passive: true });
        });

        // Mousemove throttled a 15 segundos para no sobrecargar el almacenamiento
        let lastMouseMove = 0;
        window.addEventListener('mousemove', function() {
            const now = Date.now();
            if (now - lastMouseMove > 15000) {
                lastMouseMove = now;
                registerUserActivity();
            }
        }, { passive: true });

        // Verificador periódico
        function checkInactivity() {
            const currentUser = localStorage.getItem('renteasy_current_user');
            if (!currentUser) return;

            const storedLast = parseInt(localStorage.getItem('renteasy_last_activity'), 10);
            if (!storedLast) return;

            const idleDuration = Date.now() - storedLast;
            if (idleDuration >= INACTIVITY_LIMIT_MS) {
                performInactivityLogout();
            }
        }

        // 1. Verificación periódica continua
        setInterval(checkInactivity, CHECK_INTERVAL_MS);

        // 2. Verificación instantánea al regresar a la pestaña (cuando el usuario vuelve tras mucho tiempo)
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'visible') {
                checkInactivity();
            }
        });

        // 3. Verificación instantánea al enfocar la ventana
        window.addEventListener('focus', function() {
            checkInactivity();
        });
    })();
    
})(jQuery);

