(function ($) {
    "use strict";
    
    // Dropdown on mouse hover
    $(document).ready(function () {
        function toggleNavbarMethod() {
            if ($(window).width() > 992) {
                $('.navbar .dropdown').on('mouseover', function () {
                    $('.dropdown-toggle', this).trigger('click');
                }).on('mouseout', function () {
                    $('.dropdown-toggle', this).trigger('click').blur();
                });
            } else {
                $('.navbar .dropdown').off('mouseover').off('mouseout');
            }
        }
        toggleNavbarMethod();
        $(window).resize(toggleNavbarMethod);
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
     * NAVBAR DE USUARIO: PERFIL, FOTO, CONFIGURACIÓN Y CERRAR SESIÓN
     * Detecta si hay una sesión activa (localStorage o Supabase Auth) y renderiza
     * dinámicamente el botón de usuario con avatar, nombre, rol, modal de perfil
     * y redirige 'Publicar mi Auto' directamente a la gestión de propietarios.
     * =========================================================================
     */
    function initUserNavbar() {
        let user = null;
        try {
            user = JSON.parse(localStorage.getItem('renteasy_current_user'));
        } catch (e) {
            user = null;
        }

        function renderUser(u) {
            if (!u || !u.email) return;

            // 1. Si el usuario está autenticado, el botón "Publicar mi Auto" lo lleva a su panel de propietario
            document.querySelectorAll('.navbar-nav a[href*="role=propietario"], .navbar-nav a.btn-primary').forEach(btn => {
                if (btn.textContent.trim().toLowerCase().includes('publicar')) {
                    btn.href = 'dashboard-propietario.html';
                    btn.addEventListener('click', function(e) {
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
                    });
                }
            });

            // 2. Buscar enlace de login en el navbar (excluyendo botones de publicar)
            const loginLink = document.querySelector('.navbar-nav a.nav-link[href*="LOGIN.html"], .navbar-nav a.nav-link[href*="login.html"]');
            
            // Si ya existe el dropdown renderizado, solo actualizar textos e imagen
            const existingDropdown = document.querySelector('.user-profile-nav-item');
            if (existingDropdown) {
                existingDropdown.querySelectorAll('.user-current-avatar').forEach(img => img.src = u.avatar || 'img/team-1.jpg');
                existingDropdown.querySelectorAll('.user-current-name').forEach(span => span.textContent = (u.name || u.email.split('@')[0]).split(' ')[0]);
                existingDropdown.querySelectorAll('.user-full-name').forEach(div => div.textContent = u.name || u.email);
                return;
            }

            if (!loginLink) return;

            const userPhoto = u.avatar || 'img/team-1.jpg';
            const rawName = u.name || u.email.split('@')[0];
            const firstName = rawName.split(' ')[0];
            const roleBadge = u.role === 'admin' 
                ? '<span class="badge badge-warning text-dark font-weight-bold ml-1 px-1" style="font-size:10px;">Admin</span>' 
                : u.role === 'propietario'
                ? '<span class="badge badge-success text-white font-weight-bold ml-1 px-1" style="font-size:10px;">Anfitrión</span>'
                : '<span class="badge badge-primary text-white font-weight-bold ml-1 px-1" style="font-size:10px;">Conductor</span>';

            let panelLinkHtml = '';
            if (u.role === 'admin') {
                panelLinkHtml = `<a class="dropdown-item py-2" href="admin.html"><i class="fa fa-tachometer-alt text-primary mr-2"></i> Panel de Administración</a>`;
            } else if (u.role === 'propietario') {
                panelLinkHtml = `<a class="dropdown-item py-2" href="dashboard-propietario.html"><i class="fa fa-car text-primary mr-2"></i> Mis Autos y Ganancias</a>`;
            } else {
                panelLinkHtml = `<a class="dropdown-item py-2" href="car.html"><i class="fa fa-car text-primary mr-2"></i> Catálogo de Autos</a>`;
            }

            const userDropdown = document.createElement('div');
            userDropdown.className = 'nav-item dropdown user-profile-nav-item d-inline-block';
            userDropdown.innerHTML = `
                <a href="#" class="nav-link dropdown-toggle d-flex align-items-center py-2 text-white font-weight-bold" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false" style="cursor: pointer;">
                    <img src="${userPhoto}" alt="${u.name}" class="rounded-circle border mr-2 user-current-avatar" style="width: 34px; height: 34px; object-fit: cover; border-color: rgba(255,255,255,0.4) !important;" onerror="this.src='img/team-1.jpg'">
                    <span class="user-current-name text-truncate" style="max-width: 120px;">${firstName}</span>
                    ${roleBadge}
                </a>
                <div class="dropdown-menu dropdown-menu-right rounded shadow-lg border-0 py-2 mt-1" style="min-width: 250px; z-index: 1050;">
                    <div class="px-3 py-2 border-bottom bg-light">
                        <div class="font-weight-bold text-dark text-truncate user-full-name">${u.name || rawName}</div>
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

            loginLink.replaceWith(userDropdown);
            injectProfileModal();
        }

        // Si ya hay usuario en localStorage, renderizar de inmediato
        if (user && user.email) {
            renderUser(user);
        }

        // Sincronizar también directamente con la sesión de Supabase Auth
        if (typeof getSupabaseClient === 'function') {
            const client = getSupabaseClient();
            if (client && client.auth) {
                client.auth.getSession().then(({ data: { session } }) => {
                    if (session && session.user) {
                        const sbUser = session.user;
                        const meta = sbUser.user_metadata || {};
                        const currentRole = (user && user.role) || meta.role || localStorage.getItem('renteasy_pending_role') || 'conductor';
                        const syncedUser = {
                            id: sbUser.id,
                            name: meta.full_name || meta.name || (user && user.name) || sbUser.email.split('@')[0],
                            email: sbUser.email,
                            role: currentRole,
                            avatar: meta.avatar_url || meta.picture || (user && user.avatar) || 'img/team-1.jpg',
                            phone: meta.phone || (user && user.phone) || '',
                            city: meta.city || (user && user.city) || 'Valledupar',
                            provider: sbUser.app_metadata?.provider || 'google',
                            loggedAt: (user && user.loggedAt) || new Date().toISOString()
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
            <div class="modal fade" id="modalUserProfile" tabindex="-1" role="dialog" aria-hidden="true">
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
            document.querySelectorAll('.user-current-name').forEach(span => span.textContent = user.name.split(' ')[0]);
            document.querySelectorAll('.user-full-name').forEach(div => div.textContent = user.name);

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
    $(document).on('click', '.btn-open-profile-modal', function() {
        const user = JSON.parse(localStorage.getItem('renteasy_current_user')) || {};
        document.getElementById('mp-name').value = user.name || '';
        document.getElementById('mp-email').value = user.email || '';
        document.getElementById('mp-phone').value = user.phone || '';
        document.getElementById('mp-city').value = user.city || 'Valledupar';
        document.getElementById('mp-avatar-preview').src = user.avatar || 'img/team-1.jpg';
        document.getElementById('mp-role-text').textContent = user.role || 'Conductor';
        $('#modalUserProfile').modal('show');
    });

    $(document).on('click', '.btn-logout-user', function(e) {
        e.preventDefault();
        if (confirm('¿Deseas cerrar tu sesión en Rent Car Colombia?')) {
            // Cerrar sesión en Supabase
            if (typeof getSupabaseClient === 'function') {
                const client = getSupabaseClient();
                if (client && client.auth) {
                    client.auth.signOut().catch(() => {});
                }
            }
            localStorage.removeItem('renteasy_current_user');
            localStorage.removeItem('renteasy_last_activity');
            window.location.href = 'LOGIN.html';
        }
    });

    // Ejecutar al cargar la página
    $(document).ready(function() {
        initUserNavbar();
    });

    /**
     * =========================================================================
     * SEGURIDAD: CIERRE AUTOMÁTICO DE SESIÓN POR INACTIVIDAD PROLONGADA
     * Si el usuario deja la plataforma desatendida por 30 minutos sin mover
     * el cursor ni escribir, se cierra la sesión de forma segura.
     * =========================================================================
     */
    (function setupInactivityTimeout() {
        const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutos
        const CHECK_INTERVAL_MS = 15 * 1000;        // Verificar cada 15 segundos
        let lastActivity = Date.now();

        function registerActivity() {
            const now = Date.now();
            if (now - lastActivity > 4000) {
                lastActivity = now;
                try {
                    localStorage.setItem('renteasy_last_activity', now.toString());
                } catch (e) {}
            }
        }

        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
        events.forEach(evt => {
            window.addEventListener(evt, registerActivity, { passive: true });
        });

        // Verificador periódico
        setInterval(function() {
            const currentUser = localStorage.getItem('renteasy_current_user');
            if (!currentUser) return;

            const storedLast = parseInt(localStorage.getItem('renteasy_last_activity')) || lastActivity;
            const idleTime = Date.now() - storedLast;

            if (idleTime >= INACTIVITY_LIMIT_MS) {
                console.warn("Seguridad Rent Car Colombia: Sesión expirada por inactividad prolongada (" + Math.round(idleTime / 60000) + " min).");

                // Cerrar sesión en Supabase si está activo
                if (typeof getSupabaseClient === 'function') {
                    const client = getSupabaseClient();
                    if (client && client.auth) {
                        client.auth.signOut().catch(() => {});
                    }
                }

                // Limpiar almacenamiento de sesión
                localStorage.removeItem('renteasy_current_user');
                localStorage.removeItem('renteasy_last_activity');

                // Redirigir a login con aviso de seguridad si no está ya en el login
                const currentPath = window.location.pathname.toLowerCase();
                if (!currentPath.includes('login.html')) {
                    window.location.href = 'LOGIN.html?reason=timeout';
                }
            }
        }, CHECK_INTERVAL_MS);
    })();
    
})(jQuery);

