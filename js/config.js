/**
 * Rent Car Colombia - Configuración Global y Dinámica de la Plataforma
 * Permite actualizar teléfonos, correos, redes sociales y textos sin tocar el código.
 */

const DEFAULT_CONFIG = {
    brandName: "Rent Car Colombia",
    brandShort: "Rent Car Col",
    slogan: "La plataforma líder de alquiler de autos entre personas en Colombia",
    phoneDisplay: "+57 316 235 7871",
    phoneRaw: "573162357871",
    emailMain: "contacto@rentcarcolombia.com",
    emailSupport: "soporte@rentcarcolombia.com",
    emailBookings: "reservas@rentcarcolombia.com",
    cityBase: "Valledupar, Cesar",
    country: "Colombia",
    addressDisplay: "Plataforma 100% Digital • Sede Operativa: Valledupar, Colombia",
    coverageDisplay: "Cobertura Nacional (Valledupar, Bogotá, Medellín, Cali, Barranquilla, Cartagena, Bucaramanga y más)",
    schedule: "Lun - Vie: 8:00 AM - 6:00 PM | Sáb: 8:00 AM - 1:00 PM | Soporte en Carretera 24/7",
    social: {
        whatsapp: "https://wa.me/573162357871?text=Hola%20Rent%20Car%20Colombia,%20quisiera%20recibir%20informaci%C3%B3n",
        instagram: "https://instagram.com/rentcarcolombia",
        facebook: "https://facebook.com/rentcarcolombia",
        twitter: "https://twitter.com/rentcarcol",
        tiktok: "https://tiktok.com/@rentcarcolombia"
    },
    payments: {
        commissionPercent: 15,
        defaultDeposit: 200000,
        mercadoPagoKey: "",
        mercadoPagoToken: "",
        wompiPubKey: "",
        stripePubKey: "",
        bankName: "Bancolombia",
        bankAccountType: "Ahorros",
        bankAccountNumber: "542-000000-00",
        bankAccountHolder: "Rent Car Colombia",
        bancolombiaAccount: "Bancolombia Ahorros 542-000000-00",
        nequiAccount: "3162357871",
        daviplataAccount: "3162357871"
    },
    cms: {
        // Lista dinámica de diapositivas para el carrusel principal (Ilimitadas y administrables)
        slides: [
            {
                id: "slide_1",
                title: "Alquila el mejor coche al mejor precio",
                subtitle: "Renta de autos particulares directamente con sus dueños en Colombia",
                image: "img/carousel-1.jpg",
                btn1Text: "Explorar Autos Disponibles",
                btn1Url: "car.html",
                btn2Text: "Publicar mi Auto",
                btn2Url: "LOGIN.html?action=register&role=propietario"
            },
            {
                id: "slide_2",
                title: "El mejor servicio local y personalizado",
                subtitle: "Marketplace Seguro y Verificado en Colombia",
                image: "img/carousel-2.jpg",
                btn1Text: "Explorar Autos Disponibles",
                btn1Url: "car.html",
                btn2Text: "Publicar mi Auto",
                btn2Url: "LOGIN.html?action=register&role=propietario"
            }
        ],

        // Retrocompatibilidad
        heroTitle: "Alquila el mejor coche al mejor precio",
        heroSubtitle: "Renta de autos particulares directamente con sus dueños en Colombia",
        heroImage1: "img/carousel-1.jpg",
        heroBtn1Text: "Explorar Autos Disponibles",
        heroBtn1Url: "car.html",
        heroBtn2Text: "Publicar mi Auto",
        heroBtn2Url: "LOGIN.html?action=register&role=propietario",

        heroTitle2: "El mejor servicio local y personalizado",
        heroSubtitle2: "Marketplace Seguro y Verificado en Colombia",
        heroImage2: "img/carousel-2.jpg",
        heroBtn21Text: "Explorar Autos Disponibles",
        heroBtn21Url: "car.html",
        heroBtn22Text: "Publicar mi Auto",
        heroBtn22Url: "LOGIN.html?action=register&role=propietario",

        // Banners y Cupones Promocionales con Fechas Controladas y Calendario de Expiración
        promoEnabled: true,
        promoDiscountTitle: "50% DE DESCUENTO",
        promoDiscountText: "Oferta especial para nuevos miembros",
        promoExpiryDate: "2026-12-31",
        promoValidityText: "Válido hasta el 31 de Diciembre de 2026 para nuevos usuarios",
        promoCode: "VALLEDUPAR2026",
        faqs: [
            { q: "¿Qué requisitos necesito para alquilar un auto?", a: "Tener más de 21 años, documento de identidad vigente y licencia de conducir válida." },
            { q: "¿Cómo y cuándo recibo mis ganancias como propietario?", a: "Recibes el 85% neto del alquiler mediante transferencia directa a tu cuenta bancaria o Nequi una vez finalizado el viaje." },
            { q: "¿Qué cubre el depósito de garantía?", a: "Cubre posibles infracciones de tránsito no reportadas, combustible faltante o rayones leves ocasionados durante el alquiler." }
        ]
    },
    legal: {
        terms: "Términos del Servicio de Rent Car Colombia: La plataforma actúa como intermediario digital entre arrendadores y arrendatarios particulares. Es deber de ambas partes verificar el estado físico del vehículo y las firmas del acta de entrega.",
        privacy: "Tratamiento de Datos Personales (Habeas Data): La información de cédulas, licencias y teléfonos se resguarda bajo estrictos protocolos de confidencialidad y solo se comparte entre las partes involucradas en la reserva activa.",
        contractClauses: "Cláusula Primera - Objeto: El arrendador entrega en calidad de alquiler el vehículo automotor al arrendatario identificado para su uso exclusivo particular..."
    },
    about: {
        title: "Revolucionando la movilidad compartida en Colombia",
        quote: "Conectamos a dueños que desean rentabilizar su patrimonio con conductores responsables que buscan libertad y economía en cada rincón de Colombia.",
        text: "Nacemos desde Valledupar, Cesar como la primera plataforma 100% digital de economía colaborativa automotriz con cobertura en toda Colombia. Conectamos directamente a propietarios de vehículos con conductores verificados, eliminando sobrecostos de agencias intermediarias y garantizando contratos digitales y acompañamiento en cada viaje.",
        mission: "Facilitar soluciones de movilidad confiables y accesibles en toda Colombia, conectando personas mediante tecnología intuitiva, contratos transparentes y garantías de seguridad integrales para ambas partes.",
        vision: "Convertirnos en la plataforma tecnológica de referencia de economía colaborativa automotriz en el país, conectando las principales ciudades y regiones con la mayor flota comunitaria de vehículos particulares.",
        values: "Confianza mutua, transparencia en tarifas sin cobros ocultos, validación rigurosa de licencias e identidades, y compromiso total con el acompañamiento en carretera 24/7."
    },
    visibility: {
        team: true,
        testimonials: true,
        vendors: true,
        promoBanner: true,
        services: true
    },
    team: [
        {
            id: "team_1",
            name: "Andrés Rodríguez",
            role: "Dirección de Operaciones",
            desc: "Lidera la expansión de la red de anfitriones y la calidad del servicio en cada ciudad.",
            image: "img/team-1.jpg"
        },
        {
            id: "team_2",
            name: "Camila Valencia",
            role: "Validación y Seguridad KYC",
            desc: "Responsable del filtro de licencias, antecedentes y verificación de pólizas vehiculares.",
            image: "img/team-2.jpg"
        },
        {
            id: "team_3",
            name: "Mateo Gómez",
            role: "Soporte y Asistencia 24/7",
            desc: "Acompaña a conductores y anfitriones en carretera durante cualquier incidencia.",
            image: "img/team-3.jpg"
        },
        {
            id: "team_4",
            name: "Daniela Morales",
            role: "Relación con Propietarios",
            desc: "Asesora a los anfitriones para optimizar sus ganancias y tarifas por temporada.",
            image: "img/team-4.jpg"
        }
    ],
    testimonials: [
        {
            id: "test_1",
            name: "Carlos Mendoza",
            city: "Propietario en Valledupar",
            text: "Tener mi camioneta trabajando con Rent Car Colombia ha sido una bendición. Recibo mis ganancias puntual y la fianza me da total tranquilidad.",
            image: "img/testimonial-1.jpg"
        },
        {
            id: "test_2",
            name: "Laura Gómez",
            city: "Conductora Turista",
            text: "Alquilé un auto para recorrer el Cesar y La Guajira durante el Festival Vallenato. Trato directo, auto impecable y mucho más económico.",
            image: "img/testimonial-2.jpg"
        },
        {
            id: "test_3",
            name: "Andrés Restrepo",
            city: "Empresario / Propietario en Medellín",
            text: "Tengo dos autos publicados. El proceso de aprobación y verificación de clientes es muy estricto y profesional. Recomiendo 100% esta plataforma.",
            image: "img/testimonial-3.jpg"
        },
        {
            id: "test_4",
            name: "Diana Paternina",
            city: "Conductora en Barranquilla",
            text: "Excelente atención al cliente por WhatsApp. Reservé un sedán para un viaje de negocios y todo estuvo listo a mi llegada. La mejor opción en Colombia.",
            image: "img/testimonial-4.jpg"
        }
    ]
};

// Obtener configuración guardada o usar la por defecto con fusión profunda
function getSiteConfig() {
    try {
        const stored = localStorage.getItem('rentcar_global_config');
        if (stored) {
            const parsed = JSON.parse(stored);
            const merged = Object.assign({}, DEFAULT_CONFIG, parsed);
            merged.cms = Object.assign({}, DEFAULT_CONFIG.cms, parsed.cms || {});
            merged.visibility = Object.assign({}, DEFAULT_CONFIG.visibility, parsed.visibility || {});
            merged.payments = Object.assign({}, DEFAULT_CONFIG.payments, parsed.payments || parsed.payment || {});
            merged.payment = merged.payments;
            return merged;
        }
    } catch (e) {
        console.error("Error al leer configuración:", e);
    }
    return DEFAULT_CONFIG;
}

// Verifica si la promoción de descuento debe mostrarse en la portada
function isPromoActive() {
    const cfg = getSiteConfig();
    const cms = cfg.cms || {};

    // 1. Interruptor manual de activación
    if (cms.promoEnabled === false) return false;

    // 2. Requiere código de cupón
    if (!cms.promoCode || !cms.promoCode.trim()) return false;

    // 3. Verificación de fecha límite por calendario
    if (cms.promoExpiryDate) {
        const expiryDate = new Date(cms.promoExpiryDate + 'T23:59:59');
        const now = new Date();
        if (now > expiryDate) {
            return false; // Venció la fecha -> Se inhabilita y oculta automáticamente
        }
    }

    // 4. Verificación de visibilidad general
    if (cfg.visibility && cfg.visibility.promoBanner === false) {
        return false;
    }

    return true;
}

// Validador universal de cupón para registro y checkout (detecta expiración, código inválido o inactivo)
function checkCouponStatus(inputCode) {
    if (!inputCode || !inputCode.trim()) {
        return { valid: false, status: 'empty', message: '' };
    }
    const code = inputCode.trim().toUpperCase();
    const cfg = getSiteConfig();
    const cms = cfg.cms || {};
    const activeCode = (cms.promoCode || '').trim().toUpperCase();

    if (!activeCode || code !== activeCode) {
        return {
            valid: false,
            status: 'invalid',
            code: code,
            message: `El código "${code}" no es válido o no existe.`
        };
    }

    if (cms.promoEnabled === false) {
        return {
            valid: false,
            status: 'disabled',
            code: code,
            message: `El cupón "${code}" se encuentra pausado o inactivo temporalmente.`
        };
    }

    if (cms.promoExpiryDate) {
        const expiryDate = new Date(cms.promoExpiryDate + 'T23:59:59');
        const now = new Date();
        const [y, m, d] = cms.promoExpiryDate.split('-');
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const formatted = `${parseInt(d)} de ${months[parseInt(m) - 1]} de ${y}`;

        if (now > expiryDate) {
            return {
                valid: false,
                status: 'expired',
                code: code,
                expiryDate: cms.promoExpiryDate,
                formattedExpiry: formatted,
                message: `El cupón "${code}" ha expirado el ${formatted}. Ya no es válido.`
            };
        }
    }

    let formattedDate = '';
    if (cms.promoExpiryDate) {
        const [y, m, d] = cms.promoExpiryDate.split('-');
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        formattedDate = `${parseInt(d)} de ${months[parseInt(m) - 1]} de ${y}`;
    }

    return {
        valid: true,
        status: 'active',
        code: code,
        discountPercent: 50,
        title: cms.promoDiscountTitle || '50% DE DESCUENTO',
        expiryDate: cms.promoExpiryDate,
        formattedExpiry: formattedDate,
        message: `¡Cupón "${code}" activo y válido! Aplica 50% de descuento${formattedDate ? ' (Vence el ' + formattedDate + ')' : ''}.`
    };
}

// Canal de sincronización en vivo entre pestañas (sin recargar)
const RENTCAR_SYNC_CHANNEL = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('rentcar_live_sync') : null;

function broadcastLiveSync(type = 'config_updated') {
    if (RENTCAR_SYNC_CHANNEL) {
        try { RENTCAR_SYNC_CHANNEL.postMessage({ type, timestamp: Date.now() }); } catch (e) { }
    }
}
window.broadcastLiveSync = broadcastLiveSync;

// Guardar nueva configuración desde el panel de administración
function saveSiteConfig(newConfig) {
    try {
        localStorage.setItem('rentcar_global_config', JSON.stringify(newConfig));
        applyGlobalConfig();
        broadcastLiveSync('config_updated');
        if (typeof dbSaveConfig === 'function') {
            dbSaveConfig(newConfig);
        }
        return true;
    } catch (e) {
        console.error("Error al guardar configuración:", e);
        return false;
    }
}

// Aplicar configuración automáticamente a todos los elementos del DOM
function applyGlobalConfig() {
    const config = getSiteConfig();

    // 1. Textos de Marca y Título
    document.querySelectorAll('.site-brand-name').forEach(el => el.textContent = config.brandName);
    document.querySelectorAll('.site-slogan').forEach(el => el.textContent = config.slogan);

    // 2. Teléfono y WhatsApp
    document.querySelectorAll('.site-phone').forEach(el => {
        el.textContent = config.phoneDisplay;
        if (el.tagName === 'A') el.href = `tel:+${config.phoneRaw}`;
    });

    document.querySelectorAll('.site-whatsapp-link').forEach(el => {
        el.href = config.social.whatsapp || `https://wa.me/${config.phoneRaw}`;
        el.target = "_blank";
        el.rel = "noopener noreferrer";
    });

    // 3. Correos Electrónicos
    document.querySelectorAll('.site-email').forEach(el => {
        el.textContent = config.emailMain;
        if (el.tagName === 'A') el.href = `mailto:${config.emailMain}`;
    });
    document.querySelectorAll('.site-email-support').forEach(el => {
        el.textContent = config.emailSupport;
        if (el.tagName === 'A') el.href = `mailto:${config.emailSupport}`;
    });

    // 4. Ubicación y Horarios
    document.querySelectorAll('.site-address').forEach(el => el.textContent = config.addressDisplay);
    document.querySelectorAll('.site-city').forEach(el => el.textContent = config.cityBase);
    document.querySelectorAll('.site-coverage').forEach(el => el.textContent = config.coverageDisplay);
    document.querySelectorAll('.site-schedule').forEach(el => el.textContent = config.schedule);

    // 5. Enlaces de Redes Sociales
    document.querySelectorAll('.site-social-instagram').forEach(el => {
        el.href = config.social.instagram || "#";
        el.target = "_blank";
    });
    document.querySelectorAll('.site-social-facebook').forEach(el => {
        el.href = config.social.facebook || "#";
        el.target = "_blank";
    });
    document.querySelectorAll('.site-social-twitter').forEach(el => {
        el.href = config.social.twitter || "#";
        el.target = "_blank";
    });
    document.querySelectorAll('.site-social-tiktok').forEach(el => {
        el.href = config.social.tiktok || "#";
        el.target = "_blank";
    });

    // 6. CMS Banners, Portadas Dinámicas y Cupones
    if (config.cms) {
        // Renderizado Dinámico de Múltiples Diapositivas (Sin límite de cantidad)
        const slides = config.cms.slides || [
            {
                id: "slide_1",
                title: config.cms.heroTitle || "Alquila el mejor coche al mejor precio",
                subtitle: config.cms.heroSubtitle || "Renta de autos particulares directamente con sus dueños en Colombia",
                image: config.cms.heroImage1 || "img/carousel-1.jpg",
                btn1Text: config.cms.heroBtn1Text || "Explorar Autos Disponibles",
                btn1Url: config.cms.heroBtn1Url || "car.html",
                btn2Text: config.cms.heroBtn2Text || "Publicar mi Auto",
                btn2Url: config.cms.heroBtn2Url || "LOGIN.html?action=register&role=propietario"
            },
            {
                id: "slide_2",
                title: config.cms.heroTitle2 || "El mejor servicio local y personalizado",
                subtitle: config.cms.heroSubtitle2 || "Marketplace Seguro y Verificado en Colombia",
                image: config.cms.heroImage2 || "img/carousel-2.jpg",
                btn1Text: config.cms.heroBtn21Text || "Explorar Autos Disponibles",
                btn1Url: config.cms.heroBtn21Url || "car.html",
                btn2Text: config.cms.heroBtn22Text || "Publicar mi Auto",
                btn2Url: config.cms.heroBtn22Url || "LOGIN.html?action=register&role=propietario"
            }
        ];

        const carouselInner = document.getElementById('header-carousel-inner');
        if (carouselInner && slides.length > 0) {
            carouselInner.innerHTML = slides.map((slide, idx) => `
                <div class="carousel-item ${idx === 0 ? 'active' : ''}">
                    <img class="w-100" src="${slide.image || 'img/carousel-1.jpg'}" alt="${slide.title || 'Rent Car Colombia'}">
                    <div class="carousel-caption d-flex flex-column align-items-center justify-content-center">
                        <div class="p-3" style="max-width: 900px;">
                            ${slide.subtitle ? `<h4 class="text-white text-uppercase mb-md-3">${slide.subtitle}</h4>` : ''}
                            <h1 class="display-4 font-weight-bold text-white mb-md-4">${slide.title || ''}</h1>
                            <div class="d-flex flex-wrap justify-content-center">
                                ${slide.btn1Text ? `<a href="${slide.btn1Url || 'car.html'}" class="btn btn-primary py-md-3 px-md-5 mt-2 font-weight-bold shadow mr-2">${slide.btn1Text}</a>` : ''}
                                ${slide.btn2Text ? `<a href="${slide.btn2Url || 'LOGIN.html?action=register&role=propietario'}" class="btn btn-outline-light py-md-3 px-md-4 mt-2 font-weight-bold">${slide.btn2Text}</a>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Banners y Cupones Promocionales con Fechas Controladas y Verificación
        const promoActive = isPromoActive();
        const discountBanners = document.querySelectorAll('.site-discount-banner, .site-promo-banner-section');

        discountBanners.forEach(banner => {
            if (promoActive) {
                banner.style.display = '';
                const promoTitle = config.cms.promoDiscountTitle || "50% DE DESCUENTO";
                const promoSubtitle = config.cms.promoDiscountText || "Oferta especial para nuevos miembros";
                let promoValidity = config.cms.promoValidityText;
                if (!promoValidity && config.cms.promoExpiryDate) {
                    const [y, m, d] = config.cms.promoExpiryDate.split('-');
                    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                    promoValidity = `Válido hasta el ${parseInt(d)} de ${months[parseInt(m) - 1]} de ${y} para nuevos usuarios`;
                }
                const promoCode = (config.cms.promoCode || 'VALLEDUPAR2026').trim().toUpperCase();

                banner.querySelectorAll('.site-promo-title').forEach(el => el.textContent = promoTitle);
                banner.querySelectorAll('.site-promo-subtitle').forEach(el => el.textContent = promoSubtitle);
                banner.querySelectorAll('.site-promo-validity').forEach(el => el.textContent = promoValidity);
                banner.querySelectorAll('.site-promo-code').forEach(el => el.textContent = promoCode);
                banner.querySelectorAll('.site-promo-link').forEach(el => {
                    el.href = `LOGIN.html?action=register&role=conductor&coupon=${encodeURIComponent(promoCode)}`;
                });
            } else {
                // Si la fecha ya venció o no hay cupón activo, NO DEBE MOSTRARSE EL BANNER DE DESCUENTO
                banner.style.display = 'none';
            }
        });
    }

    // 7. Control de Visibilidad de Secciones (Mostrar / Ocultar)
    const visibility = config.visibility || { team: true, testimonials: true, vendors: true, promoBanner: true, services: true };
    document.querySelectorAll('.site-team-section').forEach(el => {
        el.style.display = visibility.team === false ? 'none' : '';
    });
    document.querySelectorAll('.site-testimonials-section').forEach(el => {
        el.style.display = visibility.testimonials === false ? 'none' : '';
    });
    document.querySelectorAll('.site-vendors-section').forEach(el => {
        el.style.display = visibility.vendors === false ? 'none' : '';
    });
    document.querySelectorAll('.site-discount-banner, .site-promo-banner-section').forEach(el => {
        // Solo visible si está habilitado en visibilidad y además está activo (no vencido)
        el.style.display = (visibility.promoBanner !== false && isPromoActive()) ? '' : 'none';
    });
    document.querySelectorAll('.site-services-section').forEach(el => {
        el.style.display = visibility.services === false ? 'none' : '';
    });

    // 8. Renderizado Dinámico del Equipo de Trabajo (Sin redes personales por privacidad)
    const team = config.team || [];
    const teamCarousels = document.querySelectorAll('.site-team-carousel, .team-carousel');
    
    if (teamCarousels.length > 0) {
        teamCarousels.forEach(container => {
            if (window.jQuery && $(container).hasClass('owl-loaded')) {
                $(container).trigger('destroy.owl.carousel').removeClass('owl-loaded owl-hidden');
                $(container).find('.owl-stage-outer').children().unwrap();
            }

            if (team.length === 0) {
                container.innerHTML = '<div class="text-center text-muted py-4 w-100"><i class="fa fa-users mb-2" style="font-size: 28px;"></i><br>Sección de equipo en preparación.</div>';
                return;
            }

            // Se elimina .team-social para no mostrar redes personales de los colaboradores
            container.innerHTML = team.map(m => `
                <div class="team-item">
                    <img class="img-fluid w-100" src="${m.image || 'img/team-1.jpg'}" alt="${m.name}" style="height: 310px; object-fit: cover;" onerror="this.src='img/team-1.jpg'">
                    <div class="position-relative py-4 bg-light">
                        <h4 class="text-uppercase mb-1 font-weight-bold">${m.name}</h4>
                        <p class="m-0 text-muted">${m.role}</p>
                        ${m.desc ? `<small class="text-secondary d-block mt-2 px-2">${m.desc}</small>` : ''}
                    </div>
                </div>
            `).join('');

            // Inicializar Owl Carousel con flechas de navegación (< y >)
            if (window.jQuery && $.fn.owlCarousel) {
                $(container).owlCarousel({
                    autoplay: true,
                    smartSpeed: 800,
                    autoplayTimeout: 4500,
                    autoplayHoverPause: true,
                    center: team.length > 2,
                    margin: 30,
                    dots: false,
                    loop: team.length > 2,
                    nav: true,
                    navText: [
                        '<i class="fa fa-angle-left" aria-hidden="true"></i>',
                        '<i class="fa fa-angle-right" aria-hidden="true"></i>'
                    ],
                    responsive: {
                        0: { items: 1 },
                        576: { items: 1 },
                        768: { items: 2 },
                        992: { items: Math.min(3, team.length) }
                    }
                });
            }
        });
    }

    // 9. Textos de Acerca de Nosotros, Misión y Visión
    if (config.about) {
        document.querySelectorAll('.site-about-title').forEach(el => el.textContent = config.about.title);
        document.querySelectorAll('.site-about-quote').forEach(el => el.textContent = config.about.quote);
        document.querySelectorAll('.site-about-text').forEach(el => el.textContent = config.about.text);
        document.querySelectorAll('.site-about-mission').forEach(el => el.textContent = config.about.mission);
        document.querySelectorAll('.site-about-vision').forEach(el => el.textContent = config.about.vision);
        document.querySelectorAll('.site-about-values').forEach(el => el.textContent = config.about.values);
    }

    // 10. Marcas de Autos Registradas en la Plataforma (Carrusel de Aliados Dinámico)
    try { renderRegisteredBrandsCarousel(); } catch (e) { console.warn('Brands carousel:', e); }

    // 11. Buscador Dinámico de Flota (Marcas, Modelos y Tipos de Auto Reales)
    try { populateSearchFilters(); } catch (e) { console.warn('Search filters:', e); }

    // 12. Vehículos Destacados en Portada (Solo vehículos reales registrados)
    try { renderFeaturedCarsOnHome(); } catch (e) { console.warn('Featured cars:', e); }

    // 13. Renumeración Dinámica y Secuencial de Secciones Visibles (01, 02, 03...)
    try { renumberVisibleSections(); } catch (e) { console.warn('Renumber sections:', e); }
}

/** ================= 12. AUTOS REALES EN PORTADA PRINCIPAL ================= **/
function getCleanActiveCars() {
    let cars = [];
    try {
        cars = JSON.parse(localStorage.getItem('renteasy_cars')) || [];
    } catch (e) {
        cars = [];
    }
    cars = cars.filter(c => c && c.id !== 'car_mod_demo' && c.ownerName !== 'Felipe Daza' && c.ownerId !== 'usr_demo_host_2');
    if (cars.length === 0) {
        cars = [{
            id: 'car_valledupar_01',
            brand: 'Renault',
            model: 'Duster Iconic 4x4 Turbo',
            fullName: 'Renault Duster 4x4 Turbo',
            name: 'Renault Duster 4x4 Turbo',
            year: 2024,
            category: 'SUV / Camioneta',
            transmission: 'Automático',
            fuel: 'Gasolina',
            seats: 5,
            price: 220000,
            pricePerDay: 220000,
            city: 'Valledupar',
            image: 'img/car-rent-1.png',
            status: 'Activo',
            featured: true
        }];
    }
    return cars.filter(c => !c.status || String(c.status).toLowerCase() === 'activo');
}

function renderFeaturedCarsOnHome() {
    const container = document.getElementById('featured-cars-row');
    if (!container) return;

    const activeCars = getCleanActiveCars();
    if (activeCars.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-4 text-muted">
                <i class="fa fa-car fa-2x mb-2 text-primary"></i>
                <p class="mb-0">Próximamente nuevos vehículos disponibles en el catálogo.</p>
            </div>
        `;
        return;
    }

    const featured = activeCars.slice(0, 6);
    if (typeof window.renderCarCardHTML === 'function') {
        container.innerHTML = featured.map(car => window.renderCarCardHTML(car, { showOwner: false })).join('');
        if (typeof window.initCarCardCarousels === 'function') {
            window.initCarCardCarousels(container);
        }
        return;
    }

    container.innerHTML = featured.map(car => {
        const displayName = car.fullName || car.name || `${car.brand || ''} ${car.model || ''}`.trim();
        const displayPrice = Number(car.pricePerDay || car.price || 220000).toLocaleString('es-CO');
        const displayCat = car.category || car.type || 'SUV / Camioneta';
        const displayCity = car.city || 'Valledupar';
        const displayTrans = car.transmission || 'Automático';
        const displayFuel = car.fuel || 'Gasolina';
        const displaySeats = car.seats || 5;
        const displayYear = car.year || 2024;
        const displayImg = car.image || 'img/car-rent-1.png';

        return `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="rent-item mb-4 shadow-sm border rounded-lg overflow-hidden bg-white h-100 d-flex flex-column justify-content-between">
                    <div>
                        <div class="position-relative">
                            <img class="img-fluid w-100" src="${displayImg}" alt="${displayName}" style="height: 220px; object-fit: cover;" onerror="this.src='img/car-rent-1.png'">
                            <span class="badge badge-primary position-absolute px-3 py-2" style="top: 12px; left: 12px; font-size: 13px; border-radius: 20px;">
                                <i class="fa fa-map-marker-alt mr-1"></i> ${displayCity}
                            </span>
                            <span class="badge badge-dark position-absolute px-2 py-1" style="top: 12px; right: 12px; font-size: 11px;">
                                ${displayCat}
                            </span>
                        </div>
                        <div class="p-4 pb-2">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h5 class="text-uppercase font-weight-bold mb-0 text-dark">${displayName}</h5>
                                <span class="badge badge-light border text-primary font-weight-bold">${displayYear}</span>
                            </div>
                            <div class="d-flex justify-content-around py-2 px-1 bg-light rounded text-center small mb-3 border">
                                <div><i class="fa fa-cog text-primary"></i> ${displayTrans}</div>
                                <div class="border-left border-right px-2"><i class="fa fa-gas-pump text-primary"></i> ${displayFuel}</div>
                                <div><i class="fa fa-users text-primary"></i> ${displaySeats} Puestos</div>
                            </div>
                        </div>
                    </div>
                    <div class="px-4 pb-4 pt-2 d-flex justify-content-between align-items-center">
                        <div>
                            <span class="small text-muted d-block">Tarifa por día</span>
                            <h5 class="text-primary font-weight-bold mb-0">$${displayPrice} <small class="text-muted" style="font-size: 11px;">COP</small></h5>
                        </div>
                        <div class="btn-group">
                            <a class="btn btn-outline-secondary btn-sm px-2" href="detail.html?id=${car.id}">Detalles</a>
                            <a class="btn btn-primary btn-sm px-3 font-weight-bold" href="booking.html?id=${car.id}">Rentar</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/** ================= 13. RENUMERACIÓN SECUENCIAL DE SECCIONES VISIBLES ================= **/
function renumberVisibleSections() {
    const sections = document.querySelectorAll('.site-numbered-section');
    if (!sections || sections.length === 0) return;

    let seq = 1;
    sections.forEach(sec => {
        const isHidden = sec.style.display === 'none' || window.getComputedStyle(sec).display === 'none';
        if (!isHidden) {
            const numEl = sec.querySelector('.site-section-number');
            if (numEl) {
                numEl.textContent = String(seq).padStart(2, '0');
            }
            seq++;
        }
    });
}

/** ================= 10. MARCAS DE CARROS REGISTRADAS DINÁMICAMENTE ================= **/
function renderRegisteredBrandsCarousel() {
    const container = document.querySelector('.site-vendor-carousel, .vendor-carousel');
    if (!container) return;

    let cars = [];
    try {
        cars = JSON.parse(localStorage.getItem('renteasy_cars')) || [];
    } catch (e) {
        cars = [];
    }

    if (cars.length === 0) {
        cars = [
            { brand: 'Toyota', status: 'Activo' },
            { brand: 'Mazda', status: 'Activo' },
            { brand: 'Renault', status: 'Activo' },
            { brand: 'Chevrolet', status: 'Activo' },
            { brand: 'Nissan', status: 'Activo' },
            { brand: 'Kia', status: 'Activo' },
            { brand: 'Ford', status: 'Activo' },
            { brand: 'Volkswagen', status: 'Activo' },
            { brand: 'Hyundai', status: 'Activo' },
            { brand: 'BMW', status: 'Activo' }
        ];
    }

    const brandCounts = {};
    cars.forEach(c => {
        if (c.brand) {
            const b = c.brand.trim();
            brandCounts[b] = (brandCounts[b] || 0) + 1;
        }
    });

    const uniqueBrands = Object.keys(brandCounts);
    if (uniqueBrands.length === 0) return;

    if (window.jQuery && $(container).hasClass('owl-loaded')) {
        $(container).trigger('destroy.owl.carousel').removeClass('owl-loaded owl-hidden');
        $(container).find('.owl-stage-outer').children().unwrap();
    }

    container.innerHTML = uniqueBrands.map(b => `
        <div class="brand-vendor-card">
            <i class="fa fa-car"></i>
            <div class="brand-name">${b}</div>
            <div class="car-count">${brandCounts[b]} ${brandCounts[b] === 1 ? 'auto activo' : 'autos activos'}</div>
        </div>
    `).join('');

    if (window.jQuery && $.fn.owlCarousel) {
        $(container).owlCarousel({
            loop: uniqueBrands.length > 3,
            margin: 25,
            dots: false,
            autoplay: true,
            autoplayTimeout: 2500,
            autoplayHoverPause: true,
            smartSpeed: 800,
            responsive: {
                0: { items: 2 },
                576: { items: 3 },
                768: { items: 4 },
                992: { items: Math.min(5, uniqueBrands.length) }
            }
        });
    }
}

/** ================= 11. BUSCADOR DINÁMICO DE AUTOS REGISTRADOS ================= **/
function populateSearchFilters() {
    const brandSelect = document.getElementById('search-filter-brand');
    const modelSelect = document.getElementById('search-filter-model');
    const categorySelect = document.getElementById('search-filter-category');
    const searchBtn = document.getElementById('btn-search-cars');

    if (!brandSelect && !modelSelect && !categorySelect) return;

    let cars = [];
    try {
        cars = JSON.parse(localStorage.getItem('renteasy_cars')) || [];
    } catch (e) {
        cars = [];
    }

    if (cars.length === 0) {
        cars = [
            { brand: 'Mazda', model: 'CX-30 Touring', category: 'SUV / Camioneta' },
            { brand: 'Toyota', model: 'Corolla Cross Híbrido', category: 'SUV / Camioneta' },
            { brand: 'Renault', model: 'Duster 4x4', category: 'SUV / Camioneta' },
            { brand: 'Chevrolet', model: 'Onix Turbo', category: 'Sedán' },
            { brand: 'Kia', model: 'Picanto Ion', category: 'Hatchback / Compacto' },
            { brand: 'Nissan', model: 'Versa Advance', category: 'Sedán' }
        ];
    }

    const brands = [...new Set(cars.map(c => c.brand).filter(Boolean))].sort();
    const categories = [...new Set(cars.map(c => c.category).filter(Boolean))].sort();

    if (brandSelect) {
        const currentVal = brandSelect.value;
        brandSelect.innerHTML = '<option value="" selected>Todas las Marcas</option>' +
            brands.map(b => `<option value="${b}" ${currentVal === b ? 'selected' : ''}>${b}</option>`).join('');
    }

    const updateModels = (selectedBrand) => {
        if (!modelSelect) return;
        const filteredCars = selectedBrand ? cars.filter(c => c.brand === selectedBrand) : cars;
        const models = [...new Set(filteredCars.map(c => c.model).filter(Boolean))].sort();
        modelSelect.innerHTML = '<option value="" selected>Todos los Modelos</option>' +
            models.map(m => `<option value="${m}">${m}</option>`).join('');
    };

    updateModels(brandSelect ? brandSelect.value : '');

    if (brandSelect) {
        brandSelect.onchange = function() {
            updateModels(this.value);
        };
    }

    if (categorySelect) {
        categorySelect.innerHTML = '<option value="" selected>Tipo de Auto</option>' +
            categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    }

    if (searchBtn) {
        searchBtn.onclick = function() {
            const b = brandSelect ? brandSelect.value : '';
            const m = modelSelect ? modelSelect.value : '';
            const c = categorySelect ? categorySelect.value : '';
            const dateInput = document.getElementById('search-date-input');
            const date = dateInput ? dateInput.value : '';
            
            const params = new URLSearchParams();
            if (b) params.set('brand', b);
            if (m) params.set('model', m);
            if (c) params.set('category', c);
            if (date) params.set('date', date);

            window.location.href = 'car.html?' + params.toString();
        };
    }
}

// Barra de menú fija y compacta al hacer scroll en todas las páginas públicas
function initStickyCompactNavbar() {
    const navBar = document.querySelector('.nav-bar');
    if (!navBar) return;

    let spacer = document.getElementById('navbar-sticky-spacer');
    if (!spacer) {
        spacer = document.createElement('div');
        spacer.id = 'navbar-sticky-spacer';
        spacer.style.display = 'none';
        navBar.parentNode.insertBefore(spacer, navBar.nextSibling);
    }

    const onScroll = () => {
        if (window.scrollY > 45) {
            if (!navBar.classList.contains('navbar-sticky-compact')) {
                spacer.style.height = navBar.offsetHeight + 'px';
                spacer.style.display = 'block';
                navBar.classList.add('navbar-sticky-compact');
            }
        } else {
            if (navBar.classList.contains('navbar-sticky-compact')) {
                navBar.classList.remove('navbar-sticky-compact');
                spacer.style.display = 'none';
            }
        }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}

// Ejecutar automáticamente al cargar la página
function initGlobalConfigAndLiveCars() {
    applyGlobalConfig();
    initStickyCompactNavbar();

    if (typeof dbGetConfig === 'function') {
        dbGetConfig().then(remoteCfg => {
            if (remoteCfg) applyGlobalConfig();
        }).catch(() => { });
    }

    if (document.getElementById('featured-cars-row') && typeof dbGetVehiculos === 'function') {
        dbGetVehiculos().then(() => {
            try {
                renderFeaturedCarsOnHome();
                renderRegisteredBrandsCarousel();
                populateSearchFilters();
            } catch (e) { }
        }).catch(() => { });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlobalConfigAndLiveCars);
} else {
    initGlobalConfigAndLiveCars();
}

// Sincronización en tiempo real sin necesidad de recargar (F5) cuando el Superadmin guarda cambios en otra pestaña
function handleLiveConfigSync() {
    applyGlobalConfig();
    if (typeof window.renderMarketplaceCars === 'function') {
        try { window.renderMarketplaceCars(); } catch (e) { }
    }
    if (typeof window.refreshBookingSummary === 'function') {
        try { window.refreshBookingSummary(); } catch (e) { }
    }
}

window.addEventListener('storage', function (e) {
    if (e.key === 'rentcar_global_config' || e.key === 'renteasy_cars' || e.key === 'rentcar_verified_reviews') {
        handleLiveConfigSync();
    }
});

if (RENTCAR_SYNC_CHANNEL) {
    RENTCAR_SYNC_CHANNEL.onmessage = function () {
        handleLiveConfigSync();
    };
}
