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

