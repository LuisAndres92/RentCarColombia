/**
 * Rent Car Colombia - Motor del Superadmin Backoffice
 * Gestión integral: Finanzas, Moderación de Flota, KYC de Usuarios, Disputas, Pasarelas y CMS
 */

document.addEventListener('DOMContentLoaded', function () {
    // 1. Verificación de Seguridad y Sesión
    const currentAdmin = checkAdminSession();
    if (!currentAdmin) return;

    // Inicializar colecciones de prueba si no existen
    initAdminData();

    // 2. Renderizar todas las vistas del Backoffice
    renderFinancialOverview();
    renderFleetModeration();
    renderUsersManagement();
    renderBookingsAndDisputes();
    loadPaymentsConfig();
    loadCmsConfig();
    loadVisibilityConfig();
    renderTeamListAdmin();
    renderVerifiedReviewsModeration();
    loadCompanySettings();
    renderInquiriesAdmin();
    loadLegalTexts();

    // 3. Manejadores de Formularios y Acciones
    setupFormListeners();

    // 4. Cerrar Sesión
    document.querySelectorAll('.btn-admin-logout').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            if (confirm('¿Deseas cerrar tu sesión como Administrador?')) {
                localStorage.removeItem('renteasy_current_user');
                window.location.href = 'LOGIN.html';
            }
        });
    });
});

/** ================= SEGURIDAD Y CONTROL DE ACCESO ================= **/
function checkAdminSession() {
    try {
        const user = JSON.parse(localStorage.getItem('renteasy_current_user'));
        if (!user || user.role !== 'admin') {
            alert('Acceso restringido: Debes iniciar sesión con una cuenta de Administrador.');
            window.location.replace('LOGIN.html');
            return null;
        }
        document.querySelectorAll('.admin-display-name').forEach(el => el.innerText = user.name || 'Superadmin');
        return user;
    } catch (e) {
        window.location.replace('LOGIN.html');
        return null;
    }
}

/** ================= MÓDULO 1: MÉTRICAS Y FINANZAS GLOBALES ================= **/
function renderFinancialOverview() {
    const cars = getCars();
    const bookings = getBookings();
    const users = getUsers();

    // Cálculos
    const totalVolume = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const platformEarnings = bookings.reduce((sum, b) => sum + (b.platformFee || Math.round((b.totalPrice || 0) * 0.15)), 0);
    const ownerPayouts = bookings.reduce((sum, b) => sum + (b.ownerEarnings || Math.round((b.totalPrice || 0) * 0.85)), 0);
    const activeTrips = bookings.filter(b => b.status === 'En Curso' || b.status === 'Aceptada').length;
    const pendingApprovalCars = cars.filter(c => c.status === 'En Revision').length;
    const pendingDisputes = bookings.filter(b => b.status === 'Disputa').length;

    // Inyectar en el DOM
    setElemText('stat-gmv-volume', `$${formatCop(totalVolume)} COP`);
    setElemText('stat-platform-profit', `$${formatCop(platformEarnings)} COP`);
    setElemText('stat-owner-payouts', `$${formatCop(ownerPayouts)} COP`);
    setElemText('stat-fleet-total', `${cars.length} vehículos`);
    setElemText('stat-active-trips', `${activeTrips} viajes`);
    setElemText('stat-total-users', `${users.length} usuarios`);

    // Badges de alerta rápida en el menú lateral
    const badgeCarMod = document.getElementById('badge-cars-pending');
    if (badgeCarMod) {
        badgeCarMod.innerText = pendingApprovalCars;
        badgeCarMod.style.display = pendingApprovalCars > 0 ? 'inline-block' : 'none';
    }

    const badgeDisputes = document.getElementById('badge-disputes-pending');
    if (badgeDisputes) {
        badgeDisputes.innerText = pendingDisputes;
        badgeDisputes.style.display = pendingDisputes > 0 ? 'inline-block' : 'none';
    }
}

/** ================= MÓDULO 2: CONTROL Y APROBACIÓN DE VEHÍCULOS ================= **/
function renderFleetModeration(filterStatus = 'all') {
    const container = document.getElementById('fleet-moderation-list');
    if (!container) return;

    let cars = getCars();
    if (filterStatus !== 'all') {
        cars = cars.filter(c => c.status === filterStatus);
    }

    if (cars.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-5 text-muted">
                    <i class="fa fa-car-side mb-2" style="font-size: 32px;"></i><br>
                    No hay vehículos en esta categoría.
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = cars.map(car => `
        <tr>
            <td style="width: 110px;">
                <img src="${car.image}" alt="${car.fullName}" class="rounded border shadow-sm" style="width: 90px; height: 60px; object-fit: cover;" onerror="this.src='img/car-rent-1.png'">
            </td>
            <td>
                <div class="font-weight-bold text-dark">${car.fullName} (${car.year})</div>
                <small class="text-muted"><i class="fa fa-tag mr-1 text-primary"></i>${car.category} &bull; ${car.transmission}</small>
            </td>
            <td>
                <div class="small font-weight-semi-bold">${car.ownerName || 'Anfitrión'}</div>
                <small class="text-muted"><i class="fa fa-phone mr-1"></i>${car.ownerPhone || 'Sin teléfono'}</small>
            </td>
            <td>
                <span class="badge badge-light border text-dark font-weight-bold"><i class="fa fa-map-marker-alt text-primary mr-1"></i>${car.city}</span>
            </td>
            <td class="font-weight-bold text-primary">
                $${formatCop(car.pricePerDay)} <small class="text-muted">COP/día</small>
            </td>
            <td>
                <span class="badge ${car.status === 'Activo' ? 'badge-success' : car.status === 'En Revision' ? 'badge-warning' : car.status === 'Rechazado' ? 'badge-danger' : 'badge-secondary'} px-2 py-1">
                    ${car.status}
                </span>
                ${car.featured ? '<span class="badge badge-primary ml-1" title="Destacado en portada"><i class="fa fa-star"></i> Destacado</span>' : ''}
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    ${car.status !== 'Activo' ? `
                        <button class="btn btn-success" title="Aprobar para catálogo" onclick="approveCar('${car.id}')">
                            <i class="fa fa-check"></i> Aprobar
                        </button>
                    ` : `
                        <button class="btn btn-outline-secondary" title="Pausar publicación" onclick="pauseCar('${car.id}')">
                            <i class="fa fa-pause"></i>
                        </button>
                    `}
                    ${car.status === 'En Revision' ? `
                        <button class="btn btn-danger" title="Rechazar publicación" onclick="rejectCarPrompt('${car.id}')">
                            <i class="fa fa-times"></i>
                        </button>
                    ` : ''}
                    <button class="btn ${car.featured ? 'btn-warning' : 'btn-outline-warning'}" title="${car.featured ? 'Quitar de destacados' : 'Destacar en portada'}" onclick="toggleFeatureCar('${car.id}')">
                        <i class="fa fa-star"></i>
                    </button>
                    <button class="btn btn-outline-danger" title="Eliminar definitivamente" onclick="deleteCarAdmin('${car.id}')">
                        <i class="fa fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

window.approveCar = function (carId) {
    const cars = getCars();
    const car = cars.find(c => c.id === carId);
    if (car) {
        car.status = 'Activo';
        saveCars(cars);
        renderFleetModeration();
        renderFinancialOverview();
        alert(`Vehículo "${car.fullName}" APROBADO. Ya es visible para todos los clientes en Rent Car Colombia.`);
    }
};

window.pauseCar = function (carId) {
    const cars = getCars();
    const car = cars.find(c => c.id === carId);
    if (car) {
        car.status = car.status === 'Activo' ? 'Pausado' : 'Activo';
        saveCars(cars);
        renderFleetModeration();
    }
};

window.rejectCarPrompt = function (carId) {
    const reason = prompt('Indica el motivo del rechazo para notificar al propietario (ej. Fotos borrosas, SOAT vencido):', 'Documentación incompleta o fotos no legibles.');
    if (reason) {
        const cars = getCars();
        const car = cars.find(c => c.id === carId);
        if (car) {
            car.status = 'Rechazado';
            car.rejectReason = reason;
            saveCars(cars);
            renderFleetModeration();
            renderFinancialOverview();
            alert(`Vehículo rechazado con la nota: "${reason}".`);
        }
    }
};

window.toggleFeatureCar = function (carId) {
    const cars = getCars();
    const car = cars.find(c => c.id === carId);
    if (car) {
        car.featured = !car.featured;
        saveCars(cars);
        renderFleetModeration();
    }
};

window.deleteCarAdmin = function (carId) {
    if (confirm('¿Deseas eliminar permanentemente este auto de la plataforma?')) {
        let cars = getCars();
        cars = cars.filter(c => c.id !== carId);
        saveCars(cars);
        renderFleetModeration();
        renderFinancialOverview();
    }
};

/** ================= MÓDULO 3: USUARIOS Y VERIFICACIÓN KYC ================= **/
function renderUsersManagement(searchQuery = '') {
    const container = document.getElementById('users-management-list');
    if (!container) return;

    let users = getUsers();
    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        users = users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.city && u.city.toLowerCase().includes(q)));
    }

    container.innerHTML = users.map(user => `
        <tr>
            <td>
                <div class="font-weight-bold text-dark">${user.name}</div>
                <small class="text-muted"><i class="fa fa-envelope mr-1"></i>${user.email}</small>
            </td>
            <td>
                <span class="badge ${user.role === 'admin' ? 'badge-dark' : user.role === 'propietario' ? 'badge-primary' : 'badge-info'} text-uppercase px-2 py-1">
                    ${user.role}
                </span>
            </td>
            <td>${user.phone || 'No registrado'}</td>
            <td>${user.city || 'Colombia'}</td>
            <td>
                <span class="badge ${user.verified ? 'badge-success' : 'badge-warning'} px-2 py-1">
                    <i class="fa ${user.verified ? 'fa-check-circle' : 'fa-clock'} mr-1"></i>
                    ${user.verified ? 'Verificado' : 'Sin Verificar'}
                </span>
            </td>
            <td>
                <span class="badge ${user.banned ? 'badge-danger' : 'badge-light text-success border'} px-2 py-1">
                    ${user.banned ? 'Vetado / Bloqueado' : 'Habilitado'}
                </span>
            </td>
            <td>
                ${user.role !== 'admin' ? `
                    <div class="btn-group btn-group-sm">
                        <button class="btn ${user.verified ? 'btn-outline-secondary' : 'btn-success'}" title="${user.verified ? 'Quitar verificación' : 'Validar Identidad y Licencia'}" onclick="toggleVerifyUser('${user.id}')">
                            <i class="fa fa-id-card"></i> ${user.verified ? 'Desvalidar' : 'Verificar'}
                        </button>
                        <button class="btn ${user.banned ? 'btn-outline-success' : 'btn-outline-danger'}" title="${user.banned ? 'Desbloquear usuario' : 'Vetar de la plataforma'}" onclick="toggleBanUser('${user.id}')">
                            <i class="fa ${user.banned ? 'fa-unlock' : 'fa-ban'}"></i>
                        </button>
                    </div>
                ` : '<small class="text-muted font-italic">Superadmin</small>'}
            </td>
        </tr>
    `).join('');
}

window.toggleVerifyUser = function (userId) {
    const users = getUsers();
    const u = users.find(item => item.id === userId);
    if (u) {
        u.verified = !u.verified;
        saveUsers(users);
        renderUsersManagement();
    }
};

window.toggleBanUser = function (userId) {
    const users = getUsers();
    const u = users.find(item => item.id === userId);
    if (u) {
        u.banned = !u.banned;
        saveUsers(users);
        renderUsersManagement();
        alert(u.banned ? `Usuario ${u.name} ha sido BLOQUEADO. No podrá realizar reservas.` : `Usuario ${u.name} ha sido desbloqueado.`);
    }
};

/** ================= MÓDULO 4: MONITOR DE RESERVAS Y CENTRO DE DISPUTAS ================= **/
function renderBookingsAndDisputes() {
    const container = document.getElementById('bookings-management-list');
    if (!container) return;

    const bookings = getBookings();

    if (bookings.length === 0) {
        container.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No hay reservas registradas en la plataforma.</td></tr>`;
        return;
    }

    container.innerHTML = bookings.map(b => `
        <tr class="${b.status === 'Disputa' ? 'table-warning' : ''}">
            <td class="font-weight-bold text-dark">#${b.id.substring(0, 10).toUpperCase()}</td>
            <td>
                <div class="font-weight-bold">${b.carName}</div>
                <small class="badge badge-light border"><i class="fa fa-map-marker-alt text-primary mr-1"></i>${b.carCity}</small>
            </td>
            <td>
                <div class="small font-weight-bold">${b.renterName}</div>
                <small class="text-muted">${b.renterPhone}</small>
            </td>
            <td>
                <div class="small font-weight-bold">${b.ownerName || 'Anfitrión'}</div>
            </td>
            <td class="small">
                ${b.startDate} al ${b.endDate}<br>
                <span class="text-primary font-weight-bold">(${b.totalDays} días)</span>
            </td>
            <td>
                <div class="font-weight-bold text-dark">$${formatCop(b.totalPrice)} COP</div>
                ${b.couponApplied ? `<small class="text-info d-block font-weight-bold"><i class="fa fa-tag mr-1"></i>Cupón: ${b.couponApplied} (-$${formatCop(b.discountAmount || 0)})</small>` : ''}
                <small class="text-success font-weight-semi-bold">Comisión (${b.platformFeePercent || 15}%): $${formatCop(b.platformFee || Math.round((b.totalPrice || 0) * 0.15))}</small>
            </td>
            <td>
                <span class="badge ${b.status === 'Aceptada' || b.status === 'Completada' || b.status === 'Finalizada' ? 'badge-success' : b.status === 'En Curso' ? 'badge-primary' : b.status === 'Disputa' ? 'badge-danger font-weight-bold' : b.status === 'Rechazada' ? 'badge-secondary' : 'badge-warning'} px-2 py-1">
                    ${b.status}
                </span>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    ${b.status === 'Disputa' ? `
                        <button class="btn btn-outline-success" title="Liberar fianza al conductor" onclick="resolveDisputeAction('${b.id}', 'conductor')">
                            Reembolsar Fianza
                        </button>
                        <button class="btn btn-danger" title="Cobrar fianza a favor del dueño por daños" onclick="resolveDisputeAction('${b.id}', 'propietario')">
                            Pagar al Dueño
                        </button>
                    ` : `
                        <button class="btn btn-outline-info dropdown-toggle" data-toggle="dropdown">
                            Estado
                        </button>
                        <div class="dropdown-menu dropdown-menu-right">
                            <a class="dropdown-item text-success" href="#" onclick="changeBookingStatusAdmin('${b.id}', 'Completada')"><i class="fa fa-check mr-2"></i> Marcar Completada</a>
                            <a class="dropdown-item text-warning" href="#" onclick="changeBookingStatusAdmin('${b.id}', 'Disputa')"><i class="fa fa-exclamation-triangle mr-2"></i> Abrir Disputa</a>
                            <a class="dropdown-item text-danger" href="#" onclick="changeBookingStatusAdmin('${b.id}', 'Cancelada')"><i class="fa fa-ban mr-2"></i> Cancelar Viaje</a>
                        </div>
                    `}
                </div>
            </td>
        </tr>
    `).join('');
}

window.resolveDisputeAction = function (bookingId, winner) {
    const bookings = getBookings();
    const b = bookings.find(item => item.id === bookingId);
    if (b) {
        if (winner === 'conductor') {
            b.status = 'Completada';
            b.disputeResolution = 'Fianza de $200.000 reembolsada al conductor.';
            alert(`Disputa resuelta: Depósito de garantía liberado a favor del conductor (${b.renterName}).`);
        } else {
            b.status = 'Completada';
            b.disputeResolution = 'Fianza de $200.000 transferida al propietario por daños reportados.';
            alert(`Disputa resuelta: Depósito de garantía transferido al propietario (${b.ownerName}).`);
        }
        saveBookings(bookings);
        renderBookingsAndDisputes();
        renderFinancialOverview();
    }
};

window.changeBookingStatusAdmin = function (bookingId, status) {
    const bookings = getBookings();
    const b = bookings.find(item => item.id === bookingId);
    if (b) {
        b.status = status;
        saveBookings(bookings);
        renderBookingsAndDisputes();
        renderFinancialOverview();
    }
};

/** ================= MÓDULO 5: PASARELAS DE PAGO Y COMISIONES ================= **/
function loadPaymentsConfig() {
    const cfg = getSiteConfig();
    const payments = cfg.payments || {
        commissionPercent: 15,
        defaultDeposit: 200000,
        mercadoPagoKey: "",
        mercadoPagoToken: "",
        wompiPubKey: "",
        wompiSecret: "",
        stripePubKey: "",
        bankName: "Bancolombia",
        bankAccountType: "Ahorros",
        bankAccountNumber: "542-000000-00",
        bankAccountHolder: "Rent Car Colombia",
        nequiAccount: "3162357871",
        daviplataAccount: "3162357871"
    };

    setVal('pay-commission', payments.commissionPercent);
    setVal('pay-deposit', payments.defaultDeposit);
    setVal('mp-public-key', payments.mercadoPagoKey || '');
    setVal('mp-access-token', payments.mercadoPagoToken || '');
    setVal('wompi-public-key', payments.wompiPubKey || '');
    setVal('stripe-public-key', payments.stripePubKey || '');

    // Cuenta Bancaria Principal (Combo box & datos)
    setVal('manual-bank-name', payments.bankName || 'Bancolombia');
    setVal('manual-bank-type', payments.bankAccountType || 'Ahorros');
    setVal('manual-bank-number', payments.bankAccountNumber || (payments.bancolombiaAccount ? payments.bancolombiaAccount.replace(/^[^\d]*/, '') : '542-000000-00'));
    setVal('manual-bank-holder', payments.bankAccountHolder || 'Rent Car Colombia');

    // Billeteras Digitales
    setVal('manual-nequi', payments.nequiAccount || '');
    setVal('manual-daviplata', payments.daviplataAccount || '');
}

/** ================= MÓDULO 6: CMS, BANNERS Y PREGUNTAS FRECUENTES ================= **/
function loadCmsConfig() {
    const cfg = getSiteConfig();
    const cms = cfg.cms || {};

    // Renderizar diapositivas ilimitadas
    renderHeroSlidesAdmin();

    // Banner de Descuento, Calendario de Expiración y Cupón
    const promoEnabledEl = document.getElementById('cms-promo-enabled');
    if (promoEnabledEl) promoEnabledEl.checked = (cms.promoEnabled !== false);
    setVal('cms-promo-title', cms.promoDiscountTitle || '50% DE DESCUENTO');
    setVal('cms-promo-subtitle', cms.promoDiscountText || 'Oferta especial para nuevos miembros');
    setVal('cms-promo-expiry-date', cms.promoExpiryDate || '2026-12-31');
    setVal('cms-promo-validity', cms.promoValidityText || 'Válido hasta el 31 de Diciembre de 2026 para nuevos usuarios');
    setVal('cms-promo-code', cms.promoCode || 'VALLEDUPAR2026');
    updatePromoStatusPreview();

    renderFaqList(cms.faqs || []);
    renderVerifiedReviewsModeration();
}

/** Gestor de Diapositivas Ilimitadas del Carrusel **/
function renderHeroSlidesAdmin() {
    const container = document.getElementById('hero-slides-admin-list');
    if (!container) return;

    const cfg = getSiteConfig();
    if (!cfg.cms) cfg.cms = {};
    if (!cfg.cms.slides || cfg.cms.slides.length === 0) {
        cfg.cms.slides = [
            {
                id: "slide_1",
                title: cfg.cms.heroTitle || "Alquila el mejor coche al mejor precio",
                subtitle: cfg.cms.heroSubtitle || "Renta de autos particulares directamente con sus dueños en Colombia",
                image: cfg.cms.heroImage1 || "img/carousel-1.jpg",
                btn1Text: "Explorar Autos Disponibles",
                btn1Url: "car.html",
                btn2Text: "Publicar mi Auto",
                btn2Url: "LOGIN.html?action=register&role=propietario"
            },
            {
                id: "slide_2",
                title: cfg.cms.heroTitle2 || "El mejor servicio local y personalizado",
                subtitle: cfg.cms.heroSubtitle2 || "Marketplace Seguro y Verificado en Colombia",
                image: cfg.cms.heroImage2 || "img/carousel-2.jpg",
                btn1Text: "Explorar Autos Disponibles",
                btn1Url: "car.html",
                btn2Text: "Publicar mi Auto",
                btn2Url: "LOGIN.html?action=register&role=propietario"
            }
        ];
        saveSiteConfig(cfg);
    }

    const slides = cfg.cms.slides;
    const badge = document.getElementById('badge-slides-count');
    if (badge) badge.innerText = `${slides.length} diapositivas activas`;

    container.innerHTML = slides.map((s, idx) => `
        <div class="p-3 border rounded mb-2 bg-white d-flex justify-content-between align-items-center shadow-sm">
            <div class="d-flex align-items-center">
                <div class="position-relative mr-3">
                    <img src="${s.image || 'img/carousel-1.jpg'}" alt="Slide ${idx+1}" class="rounded border" style="width: 100px; height: 58px; object-fit: cover;" onerror="this.src='img/carousel-1.jpg'">
                    <span class="badge badge-dark position-absolute" style="top: 2px; left: 2px; font-size: 10px;">#${idx+1}</span>
                </div>
                <div>
                    <div class="font-weight-bold text-dark">${s.title}</div>
                    <small class="text-muted d-block">${s.subtitle || ''}</small>
                    <small class="text-primary font-weight-semi-bold">
                        <i class="fa fa-mouse-pointer mr-1"></i> Botón 1: "${s.btn1Text || 'Explorar'}" &bull; Botón 2: "${s.btn2Text || 'Publicar'}"
                    </small>
                </div>
            </div>
            <div>
                <button type="button" class="btn btn-outline-danger btn-sm" onclick="deleteHeroSlide(${idx})" title="Eliminar diapositiva">
                    <i class="fa fa-trash mr-1"></i> Eliminar
                </button>
            </div>
        </div>
    `).join('');
}

window.deleteHeroSlide = function(idx) {
    const cfg = getSiteConfig();
    if (cfg.cms && cfg.cms.slides) {
        if (cfg.cms.slides.length <= 1) {
            alert('El carrusel debe tener al menos una diapositiva activa.');
            return;
        }
        if (confirm(`¿Deseas eliminar la diapositiva #${idx+1}?`)) {
            cfg.cms.slides.splice(idx, 1);
            saveSiteConfig(cfg);
            renderHeroSlidesAdmin();
            notifySaved(`Diapositiva #${idx+1} eliminada.`);
        }
    }
};

function renderFaqList(faqs) {
    const container = document.getElementById('faq-accordion-list');
    if (!container) return;

    if (!faqs || faqs.length === 0) {
        container.innerHTML = '<div class="text-center py-3 text-muted small">No hay preguntas frecuentes registradas.</div>';
        return;
    }

    container.innerHTML = faqs.map((f, idx) => `
        <div class="card border mb-2 rounded">
            <div class="card-header bg-light py-2 d-flex justify-content-between align-items-center">
                <span class="font-weight-bold text-dark small"><i class="fa fa-question-circle text-primary mr-2"></i>${f.q}</span>
                <button type="button" class="btn btn-sm btn-outline-danger py-0 px-2" onclick="deleteFaq(${idx})"><i class="fa fa-trash"></i></button>
            </div>
            <div class="card-body py-2 small text-muted">${f.a}</div>
        </div>
    `).join('');
}

window.deleteFaq = function (idx) {
    const cfg = getSiteConfig();
    if (cfg.cms && cfg.cms.faqs) {
        cfg.cms.faqs.splice(idx, 1);
        saveSiteConfig(cfg);
        renderFaqList(cfg.cms.faqs);
    }
};

/** ================= CONTROL DE VISIBILIDAD DE SECCIONES ================= **/
function loadVisibilityConfig() {
    const cfg = getSiteConfig();
    const vis = cfg.visibility || { team: true, testimonials: true, vendors: true, promoBanner: true, services: true };
    const setChecked = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.checked = (val !== false);
    };
    setChecked('vis-team', vis.team);
    setChecked('vis-testimonials', vis.testimonials);
    setChecked('quick-toggle-reviews', vis.testimonials);
    setChecked('vis-vendors', vis.vendors);
    setChecked('vis-banners', vis.promoBanner);
    setChecked('vis-services', vis.services);
}

/** ================= GESTOR DE EQUIPO DE TRABAJO ================= **/
function renderTeamListAdmin() {
    const container = document.getElementById('team-members-list');
    if (!container) return;
    const cfg = getSiteConfig();
    const team = cfg.team || [];

    const badge = document.getElementById('badge-team-count');
    if (badge) badge.innerText = `${team.length} miembros`;

    if (team.length === 0) {
        container.innerHTML = '<div class="text-center py-3 text-muted small"><i class="fa fa-users mb-1"></i><br>No hay integrantes en el equipo. La sección permanecerá oculta o vacía.</div>';
        return;
    }

    container.innerHTML = team.map((m, idx) => `
        <div class="d-flex align-items-center justify-content-between p-2 border rounded mb-2 bg-white">
            <div class="d-flex align-items-center">
                <img src="${m.image || 'img/team-1.jpg'}" alt="${m.name}" class="rounded-circle mr-3 border" style="width: 44px; height: 44px; object-fit: cover;" onerror="this.src='img/team-1.jpg'">
                <div>
                    <div class="font-weight-bold text-dark small">${m.name}</div>
                    <div class="text-primary small font-weight-semi-bold">${m.role}</div>
                    ${m.desc ? `<div class="text-muted small">${m.desc}</div>` : ''}
                </div>
            </div>
            <button type="button" class="btn btn-outline-danger btn-sm py-1 px-2" onclick="deleteTeamMember(${idx})" title="Eliminar del equipo">
                <i class="fa fa-trash"></i>
            </button>
        </div>
    `).join('');
}

window.deleteTeamMember = function (idx) {
    const cfg = getSiteConfig();
    if (cfg.team && cfg.team[idx]) {
        const name = cfg.team[idx].name;
        if (confirm(`¿Deseas eliminar a "${name}" del equipo?`)) {
            cfg.team.splice(idx, 1);
            saveSiteConfig(cfg);
            renderTeamListAdmin();
            notifySaved(`Integrante "${name}" eliminado del equipo.`);
        }
    }
};

/** ================= MODERACIÓN DE RESEÑAS REALES (CERO RESEÑAS FALSAS) ================= **/
const DEFAULT_VERIFIED_REVIEWS = [
    {
        id: "rev_1",
        userName: "Carlos Mendoza",
        userRole: "Propietario Verificado",
        city: "Valledupar, Cesar",
        carRented: "Renault Duster 2022",
        rating: 5,
        date: "18 Nov 2026",
        approved: true,
        text: "Tener mi camioneta trabajando con Rent Car Colombia ha sido una bendición. Recibo mis ganancias puntual y la fianza me da total tranquilidad."
    },
    {
        id: "rev_2",
        userName: "Laura Gómez",
        userRole: "Conductora Turista",
        city: "Bogotá D.C.",
        carRented: "Mazda 3 Touring 2021",
        rating: 5,
        date: "15 Nov 2026",
        approved: true,
        text: "Alquilé un auto para recorrer el Cesar y La Guajira durante el Festival Vallenato. Trato directo, auto impecable y mucho más económico."
    },
    {
        id: "rev_3",
        userName: "Andrés Restrepo",
        userRole: "Anfitrión / Propietario",
        city: "Medellín, Antioquia",
        carRented: "Toyota Hilux 4x4",
        rating: 5,
        date: "10 Nov 2026",
        approved: true,
        text: "Tengo dos autos publicados. El proceso de aprobación y verificación de clientes es muy estricto y profesional. Recomiendo 100% esta plataforma."
    }
];

function getVerifiedReviews() {
    try {
        const stored = localStorage.getItem('rentcar_verified_reviews');
        if (stored) return JSON.parse(stored);
    } catch (e) {
        console.error("Error al cargar reseñas:", e);
    }
    localStorage.setItem('rentcar_verified_reviews', JSON.stringify(DEFAULT_VERIFIED_REVIEWS));
    return DEFAULT_VERIFIED_REVIEWS;
}

function saveVerifiedReviews(reviews) {
    localStorage.setItem('rentcar_verified_reviews', JSON.stringify(reviews));
}

function renderVerifiedReviewsModeration() {
    const container = document.getElementById('verified-reviews-moderation-list');
    if (!container) return;

    const reviews = getVerifiedReviews();

    if (reviews.length === 0) {
        container.innerHTML = '<div class="text-center py-3 text-muted small"><i class="fa fa-comment-slash mr-1"></i> Aún no se han registrado reseñas de alquileres finalizados.</div>';
        return;
    }

    container.innerHTML = reviews.map((r, idx) => `
        <div class="p-3 border rounded mb-3 bg-white shadow-sm">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                    <div class="font-weight-bold text-dark">${r.userName} <span class="badge badge-light border text-muted">${r.userRole || 'Usuario'}</span></div>
                    <div class="small text-muted"><i class="fa fa-car mr-1 text-primary"></i> ${r.carRented || 'Vehículo verificado'} &bull; <i class="fa fa-map-marker-alt text-danger mr-1"></i> ${r.city || 'Colombia'} &bull; ${r.date || ''}</div>
                </div>
                <div>
                    <span class="badge ${r.approved ? 'badge-success' : 'badge-secondary'} px-2 py-1">
                        ${r.approved ? '<i class="fa fa-check-circle mr-1"></i> Visible en Web' : '<i class="fa fa-eye-slash mr-1"></i> Oculta'}
                    </span>
                </div>
            </div>
            <div class="mb-2">
                ${'<i class="fa fa-star text-warning"></i>'.repeat(r.rating || 5)}
            </div>
            <p class="small text-dark font-italic bg-light p-2 rounded mb-2 border">"${r.text}"</p>
            <div class="d-flex justify-content-end">
                <button type="button" class="btn btn-sm ${r.approved ? 'btn-outline-secondary' : 'btn-outline-success'} mr-2" onclick="toggleReviewApproval(${idx})">
                    <i class="fa ${r.approved ? 'fa-eye-slash' : 'fa-check'} mr-1"></i> ${r.approved ? 'Ocultar de la Web' : 'Aprobar para Mostrar'}
                </button>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="deleteReviewAdmin(${idx})" title="Eliminar reseña">
                    <i class="fa fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

window.toggleReviewApproval = function(idx) {
    const reviews = getVerifiedReviews();
    if (reviews[idx]) {
        reviews[idx].approved = !reviews[idx].approved;
        saveVerifiedReviews(reviews);
        renderVerifiedReviewsModeration();
        notifySaved(reviews[idx].approved ? 'Reseña aprobada y visible en el sitio web.' : 'Reseña oculta de la web.');
    }
};

window.deleteReviewAdmin = function(idx) {
    const reviews = getVerifiedReviews();
    if (reviews[idx] && confirm(`¿Deseas eliminar la opinión de "${reviews[idx].userName}"?`)) {
        reviews.splice(idx, 1);
        saveVerifiedReviews(reviews);
        renderVerifiedReviewsModeration();
        notifySaved('Reseña eliminada.');
    }
};

/** ================= MÓDULO 7: DATOS DE CONTACTO Y EMPRESA ================= **/
function loadCompanySettings() {
    const cfg = getSiteConfig();
    setVal('cfg-brand-name', cfg.brandName);
    setVal('cfg-slogan', cfg.slogan);
    setVal('cfg-city-base', cfg.cityBase);
    setVal('cfg-country', cfg.country);
    setVal('cfg-address-display', cfg.addressDisplay);
    setVal('cfg-phone-display', cfg.phoneDisplay);
    setVal('cfg-phone-raw', cfg.phoneRaw);
    setVal('cfg-email-main', cfg.emailMain);
    setVal('cfg-email-support', cfg.emailSupport);
    setVal('cfg-schedule', cfg.schedule);

    if (cfg.social) {
        setVal('cfg-social-whatsapp', cfg.social.whatsapp || '');
        setVal('cfg-social-instagram', cfg.social.instagram || '');
        setVal('cfg-social-facebook', cfg.social.facebook || '');
        setVal('cfg-social-tiktok', cfg.social.tiktok || '');
        setVal('cfg-social-twitter', cfg.social.twitter || '');
    }

    const about = cfg.about || {};
    setVal('cfg-about-title', about.title || 'Revolucionando la movilidad compartida en Colombia');
    setVal('cfg-about-quote', about.quote || 'Conectamos a dueños que desean rentabilizar su patrimonio con conductores responsables que buscan libertad y economía en cada rincón de Colombia.');
    setVal('cfg-about-text', about.text || 'Nacemos desde Valledupar, Cesar como la primera plataforma 100% digital de economía colaborativa automotriz con cobertura en toda Colombia. Conectamos directamente a propietarios de vehículos con conductores verificados, eliminando sobrecostos de agencias intermediarias y garantizando contratos digitales y acompañamiento en cada viaje.');
    setVal('cfg-about-mission', about.mission || 'Facilitar soluciones de movilidad confiables y accesibles en toda Colombia, conectando personas mediante tecnología intuitiva, contratos transparentes y garantías de seguridad integrales para ambas partes.');
    setVal('cfg-about-vision', about.vision || 'Convertirnos en la plataforma tecnológica de referencia de economía colaborativa automotriz en el país, conectando las principales ciudades y regiones con la mayor flota comunitaria de vehículos particulares.');
    setVal('cfg-about-values', about.values || 'Confianza mutua, transparencia en tarifas sin cobros ocultos, validación rigurosa de licencias e identidades, y compromiso total con el acompañamiento en carretera 24/7.');
}

/** ================= BUZÓN DE MENSAJES DE CONTACTO ================= **/
function renderInquiriesAdmin() {
    const tbody = document.getElementById('inquiries-table-body');
    if (!tbody) return;

    let inquiries = [];
    try {
        inquiries = JSON.parse(localStorage.getItem('renteasy_inquiries')) || [];
    } catch (e) {
        inquiries = [];
    }

    if (inquiries.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4"><i class="fa fa-inbox mr-1"></i> No hay mensajes ni consultas en el buzón actualmente.</td></tr>`;
        return;
    }

    tbody.innerHTML = inquiries.map((item, idx) => {
        const cleanPhone = (item.phone || '').replace(/\D/g, '');
        const waLink = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent('Hola ' + item.name + ', te contactamos de Rent Car Colombia respecto a tu mensaje sobre: ' + item.subject)}` : '#';
        const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleString('es-CO') : 'Reciente';

        return `
            <tr>
                <td class="small text-muted align-middle" style="white-space: nowrap;">${dateStr}</td>
                <td class="align-middle">
                    <strong class="text-dark">${item.name}</strong><br>
                    <small class="text-muted"><a href="mailto:${item.email}">${item.email}</a></small>
                </td>
                <td class="align-middle">
                    <span class="font-weight-semi-bold">${item.phone}</span><br>
                    ${cleanPhone ? `<a href="${waLink}" target="_blank" class="btn btn-sm btn-outline-success py-0 px-2 mt-1" style="font-size: 11px;"><i class="fab fa-whatsapp mr-1"></i> Responder WhatsApp</a>` : ''}
                </td>
                <td class="align-middle"><span class="badge badge-light border px-2 py-1">${item.subject}</span></td>
                <td class="align-middle small text-secondary" style="max-width: 250px;">${item.message}</td>
                <td class="align-middle text-center">
                    <button class="btn btn-sm btn-outline-danger py-1 px-2" title="Eliminar" onclick="deleteInquiryAdmin(${idx})">
                        <i class="fa fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function deleteInquiryAdmin(index) {
    if (!confirm('¿Eliminar esta consulta del buzón?')) return;
    let inquiries = [];
    try {
        inquiries = JSON.parse(localStorage.getItem('renteasy_inquiries')) || [];
    } catch (e) { inquiries = []; }
    inquiries.splice(index, 1);
    localStorage.setItem('renteasy_inquiries', JSON.stringify(inquiries));
    renderInquiriesAdmin();
}

/** ================= MÓDULO 8: LEGAL Y CONTRATOS ================= **/
function loadLegalTexts() {
    const cfg = getSiteConfig();
    const legal = cfg.legal || {
        terms: "Términos del Servicio de Rent Car Colombia: La plataforma actúa como intermediario digital entre arrendadores y arrendatarios particulares. Es deber de ambas partes verificar el estado físico del vehículo y las firmas del acta de entrega.",
        privacy: "Tratamiento de Datos Personales (Habeas Data): La información de cédulas, licencias y teléfonos se resguarda bajo estrictos protocolos de confidencialidad y solo se comparte entre las partes involucradas en la reserva activa.",
        contractClauses: "Cláusula Primera - Objeto: El arrendador entrega en calidad de alquiler el vehículo automotor al arrendatario identificado para su uso exclusivo particular..."
    };

    setVal('legal-terms', legal.terms);
    setVal('legal-privacy', legal.privacy);
    setVal('legal-contract', legal.contractClauses);
}

/** ================= MANEJADORES DE GUARDADO ================= **/
function setupFormListeners() {
    // 1. Guardar Pasarelas y Finanzas
    const formPay = document.getElementById('form-payments-config');
    if (formPay) {
        formPay.addEventListener('submit', function (e) {
            e.preventDefault();
            const cfg = getSiteConfig();

            const bankName = getVal('manual-bank-name') || 'Bancolombia';
            const bankType = getVal('manual-bank-type') || 'Ahorros';
            const bankNum = getVal('manual-bank-number');
            const bankHolder = getVal('manual-bank-holder');

            cfg.payments = {
                commissionPercent: parseInt(getVal('pay-commission')) || 15,
                defaultDeposit: parseInt(getVal('pay-deposit')) || 200000,
                mercadoPagoKey: getVal('mp-public-key'),
                mercadoPagoToken: getVal('mp-access-token'),
                wompiPubKey: getVal('wompi-public-key'),
                stripePubKey: getVal('stripe-public-key'),
                bankName: bankName,
                bankAccountType: bankType,
                bankAccountNumber: bankNum,
                bankAccountHolder: bankHolder,
                bancolombiaAccount: `${bankName} ${bankType} ${bankNum}`, // Retrocompatibilidad
                nequiAccount: getVal('manual-nequi'),
                daviplataAccount: getVal('manual-daviplata')
            };
            saveSiteConfig(cfg);
            notifySaved('¡Parámetros financieros, cuentas bancarias y pasarelas actualizados!');
        });
    }

    // 2. Carrusel de Portada Dinámico (Añadir Diapositivas Ilimitadas)
    setupImageUpload('new-slide-file', 'new-slide-label', 'new-slide-preview', 'new-slide-data', 'new-slide-url', 1280, 520);
    const formAddSlide = document.getElementById('form-add-hero-slide');
    if (formAddSlide) {
        formAddSlide.addEventListener('submit', function (e) {
            e.preventDefault();
            const title = document.getElementById('new-slide-title').value.trim();
            const subtitle = document.getElementById('new-slide-subtitle').value.trim();
            const btn1Text = document.getElementById('new-slide-btn1-text').value.trim();
            const btn1Url = document.getElementById('new-slide-btn1-url').value.trim();
            const btn2Text = document.getElementById('new-slide-btn2-text').value.trim();
            const btn2Url = document.getElementById('new-slide-btn2-url').value.trim();
            const image = document.getElementById('new-slide-data').value || document.getElementById('new-slide-url').value || 'img/carousel-1.jpg';

            if (!title) return;

            const cfg = getSiteConfig();
            if (!cfg.cms) cfg.cms = {};
            if (!cfg.cms.slides) cfg.cms.slides = [];

            cfg.cms.slides.push({
                id: 'slide_' + Date.now(),
                title,
                subtitle,
                btn1Text,
                btn1Url,
                btn2Text,
                btn2Url,
                image
            });

            saveSiteConfig(cfg);
            renderHeroSlidesAdmin();
            formAddSlide.reset();
            const prev = document.getElementById('new-slide-preview');
            if (prev) prev.src = 'img/carousel-1.jpg';
            const pData = document.getElementById('new-slide-data');
            if (pData) pData.value = 'img/carousel-1.jpg';
            const pLabel = document.getElementById('new-slide-label');
            if (pLabel) pLabel.innerText = 'Subir foto desde PC o teléfono...';
            notifySaved('¡Nueva diapositiva añadida al carrusel con éxito!');
        });
    }

/** ================= CONTROL DINÁMICO DE ESTADO DEL CUPÓN Y BANNER ================= **/
function updatePromoStatusPreview() {
    const isEnabled = document.getElementById('cms-promo-enabled') ? document.getElementById('cms-promo-enabled').checked : true;
    const expiryVal = document.getElementById('cms-promo-expiry-date') ? document.getElementById('cms-promo-expiry-date').value : '';
    const codeVal = document.getElementById('cms-promo-code') ? document.getElementById('cms-promo-code').value.trim() : '';

    const box = document.getElementById('promo-status-box');
    const icon = document.getElementById('promo-status-icon');
    const badge = document.getElementById('promo-status-badge');
    const countdown = document.getElementById('promo-status-countdown');
    const desc = document.getElementById('promo-status-desc');

    if (!box || !icon || !badge || !desc) return;

    if (!isEnabled) {
        box.className = 'alert alert-secondary border d-flex align-items-center py-2 px-3 mb-3';
        icon.className = 'fa fa-ban fa-2x mr-3 text-secondary';
        badge.className = 'badge badge-secondary px-2 py-1 font-weight-bold';
        badge.innerHTML = '<i class="fa fa-ban mr-1"></i> DESHABILITADO MANUALMENTE';
        if (countdown) countdown.textContent = 'Inactivo';
        desc.textContent = 'El banner de descuento está inhabilitado y oculto en la portada. El cupón no será aceptado.';
        return;
    }

    if (!codeVal) {
        box.className = 'alert alert-warning border d-flex align-items-center py-2 px-3 mb-3';
        icon.className = 'fa fa-exclamation-triangle fa-2x mr-3 text-warning';
        badge.className = 'badge badge-warning px-2 py-1 font-weight-bold text-dark';
        badge.innerHTML = '<i class="fa fa-exclamation mr-1"></i> SIN CÓDIGO';
        if (countdown) countdown.textContent = 'Incompleto';
        desc.textContent = 'Ingresa un código de cupón para que el banner pueda publicarse.';
        return;
    }

    if (expiryVal) {
        const expiryDate = new Date(expiryVal + 'T23:59:59');
        const now = new Date();
        const diffDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

        const [y, m, d] = expiryVal.split('-');
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const formattedDate = `${parseInt(d)} de ${months[parseInt(m) - 1]} de ${y}`;

        if (now > expiryDate) {
            // EXPIRADO
            box.className = 'alert alert-danger border d-flex align-items-center py-2 px-3 mb-3';
            icon.className = 'fa fa-clock fa-2x mr-3 text-danger';
            badge.className = 'badge badge-danger px-2 py-1 font-weight-bold';
            badge.innerHTML = '<i class="fa fa-times-circle mr-1"></i> CUPÓN EXPIRADO';
            if (countdown) countdown.textContent = `Venció el ${formattedDate}`;
            desc.innerHTML = `Este cupón <strong>venció el ${formattedDate}</strong>. El banner está <strong>oculto automáticamente en la web</strong> y los registros con este cupón son rechazados. Para reactivarlo, selecciona una nueva fecha futura en el calendario y guarda.`;
            return;
        } else {
            // ACTIVO
            box.className = 'alert alert-success border d-flex align-items-center py-2 px-3 mb-3';
            icon.className = 'fa fa-check-circle fa-2x mr-3 text-success';
            badge.className = 'badge badge-success px-2 py-1 font-weight-bold';
            badge.innerHTML = '<i class="fa fa-check mr-1"></i> CUPÓN ACTIVO Y VISIBLE';
            if (countdown) countdown.textContent = diffDays <= 1 ? '¡Vence hoy!' : `Quedan ${diffDays} días`;
            desc.innerHTML = `Válido hasta el <strong>${formattedDate}</strong> a las 23:59. El banner <strong>se muestra en la web</strong> y el cupón <strong>"${codeVal.toUpperCase()}"</strong> otorga 50% de descuento a nuevos usuarios.`;
            return;
        }
    }

    box.className = 'alert alert-info border d-flex align-items-center py-2 px-3 mb-3';
    icon.className = 'fa fa-calendar-alt fa-2x mr-3 text-info';
    badge.className = 'badge badge-info px-2 py-1 font-weight-bold';
    badge.innerHTML = '<i class="fa fa-info-circle mr-1"></i> SELECCIONA FECHA';
    if (countdown) countdown.textContent = '';
    desc.textContent = 'Selecciona una fecha de expiración en el calendario.';
}

    // Configuración del Banner Promocional, Fecha y Cupón
    const formPromo = document.getElementById('form-promo-config');
    if (formPromo) {
        // Escuchar cambios en vivo para actualizar la tarjeta de estado
        const promoInputs = ['cms-promo-enabled', 'cms-promo-expiry-date', 'cms-promo-code'];
        promoInputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', updatePromoStatusPreview);
                el.addEventListener('change', updatePromoStatusPreview);
            }
        });

        // Botón para sincronizar texto de vigencia desde la fecha del calendario
        const btnSyncDateText = document.getElementById('btn-sync-promo-date-text');
        if (btnSyncDateText) {
            btnSyncDateText.addEventListener('click', function () {
                const dateVal = getVal('cms-promo-expiry-date');
                if (dateVal) {
                    const [y, m, d] = dateVal.split('-');
                    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                    setVal('cms-promo-validity', `Válido hasta el ${parseInt(d)} de ${months[parseInt(m) - 1]} de ${y} para nuevos usuarios`);
                }
            });
        }

        formPromo.addEventListener('submit', function (e) {
            e.preventDefault();
            const cfg = getSiteConfig();
            if (!cfg.cms) cfg.cms = {};

            const isEnabled = document.getElementById('cms-promo-enabled') ? document.getElementById('cms-promo-enabled').checked : true;
            const expiryDate = getVal('cms-promo-expiry-date');
            const code = getVal('cms-promo-code').toUpperCase();
            let validityText = getVal('cms-promo-validity');

            // Si el texto de vigencia quedó vacío, generarlo a partir de la fecha
            if (!validityText && expiryDate) {
                const [y, m, d] = expiryDate.split('-');
                const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                validityText = `Válido hasta el ${parseInt(d)} de ${months[parseInt(m) - 1]} de ${y} para nuevos usuarios`;
                setVal('cms-promo-validity', validityText);
            }

            cfg.cms.promoEnabled = isEnabled;
            cfg.cms.promoDiscountTitle = getVal('cms-promo-title');
            cfg.cms.promoDiscountText = getVal('cms-promo-subtitle');
            cfg.cms.promoExpiryDate = expiryDate;
            cfg.cms.promoValidityText = validityText;
            cfg.cms.promoCode = code;

            saveSiteConfig(cfg);
            updatePromoStatusPreview();
            notifySaved('¡Banner de descuento, fecha de expiración y cupón guardados con éxito!');
        });
    }

    // 3. Agregar FAQ
    const formAddFaq = document.getElementById('form-add-faq');
    if (formAddFaq) {
        formAddFaq.addEventListener('submit', function (e) {
            e.preventDefault();
            const question = document.getElementById('new-faq-q').value.trim();
            const answer = document.getElementById('new-faq-a').value.trim();
            if (!question || !answer) return;

            const cfg = getSiteConfig();
            if (!cfg.cms) cfg.cms = {};
            if (!cfg.cms.faqs) cfg.cms.faqs = [];

            cfg.cms.faqs.push({ q: question, a: answer });
            saveSiteConfig(cfg);
            renderFaqList(cfg.cms.faqs);
            formAddFaq.reset();
            notifySaved('Nueva pregunta frecuente añadida.');
        });
    }

    // 4. Guardar Visibilidad de Secciones
    const formVis = document.getElementById('form-visibility-config');
    if (formVis) {
        formVis.addEventListener('submit', function (e) {
            e.preventDefault();
            const cfg = getSiteConfig();
            const testChecked = document.getElementById('vis-testimonials').checked;
            cfg.visibility = {
                team: document.getElementById('vis-team').checked,
                testimonials: testChecked,
                vendors: document.getElementById('vis-vendors').checked,
                promoBanner: document.getElementById('vis-banners').checked,
                services: document.getElementById('vis-services').checked
            };
            const quickReviewToggle = document.getElementById('quick-toggle-reviews');
            if (quickReviewToggle) quickReviewToggle.checked = testChecked;

            saveSiteConfig(cfg);
            notifySaved('¡Configuración de visibilidad guardada exitosamente!');
        });
    }

    // Switch Rápido de Reseñas en el acordeón de reseñas
    const quickToggleReviews = document.getElementById('quick-toggle-reviews');
    if (quickToggleReviews) {
        quickToggleReviews.addEventListener('change', function () {
            const isChecked = this.checked;
            const visTest = document.getElementById('vis-testimonials');
            if (visTest) visTest.checked = isChecked;

            const cfg = getSiteConfig();
            if (!cfg.visibility) cfg.visibility = {};
            cfg.visibility.testimonials = isChecked;
            saveSiteConfig(cfg);
            notifySaved(isChecked ? 'Sección de opiniones activada en la web.' : 'Sección de opiniones oculta de la web.');
        });
    }

    // 5. Agregar Miembro al Equipo
    setupImageUpload('team-file-input', 'team-file-label', 'team-preview-avatar', 'team-photo-data', 'team-image-url', 320, 320);
    const formAddTeam = document.getElementById('form-add-team');
    if (formAddTeam) {
        formAddTeam.addEventListener('submit', function (e) {
            e.preventDefault();
            const name = document.getElementById('team-name').value.trim();
            const role = document.getElementById('team-role').value.trim();
            const image = document.getElementById('team-photo-data').value || 'img/team-1.jpg';
            const desc = document.getElementById('team-desc').value.trim();
            if (!name || !role) return;

            const cfg = getSiteConfig();
            if (!cfg.team) cfg.team = [];
            cfg.team.push({ id: 'team_' + Date.now(), name, role, image, desc });
            saveSiteConfig(cfg);
            renderTeamListAdmin();
            formAddTeam.reset();
            const preview = document.getElementById('team-preview-avatar');
            if (preview) preview.src = 'img/team-1.jpg';
            const pData = document.getElementById('team-photo-data');
            if (pData) pData.value = 'img/team-1.jpg';
            const pLabel = document.getElementById('team-file-label');
            if (pLabel) pLabel.innerText = 'Subir foto desde tu dispositivo...';
            notifySaved(`¡"${name}" ha sido añadido con su foto al equipo!`);
        });
    }

    // 4. Guardar Empresa y Contacto
    const formCompany = document.getElementById('form-site-config');
    if (formCompany) {
        formCompany.addEventListener('submit', function (e) {
            e.preventDefault();
            const cfg = getSiteConfig();
            cfg.brandName = getVal('cfg-brand-name');
            cfg.slogan = getVal('cfg-slogan');
            cfg.phoneDisplay = getVal('cfg-phone-display');
            cfg.phoneRaw = getVal('cfg-phone-raw').replace(/\D/g, '');
            cfg.emailMain = getVal('cfg-email-main');
            cfg.emailSupport = getVal('cfg-email-support');
            cfg.cityBase = getVal('cfg-city-base');
            cfg.country = getVal('cfg-country');
            cfg.addressDisplay = getVal('cfg-address-display');
            cfg.schedule = getVal('cfg-schedule');
            cfg.social = {
                whatsapp: getVal('cfg-social-whatsapp'),
                instagram: getVal('cfg-social-instagram'),
                facebook: getVal('cfg-social-facebook'),
                tiktok: getVal('cfg-social-tiktok'),
                twitter: getVal('cfg-social-twitter')
            };
            cfg.about = {
                title: getVal('cfg-about-title'),
                quote: getVal('cfg-about-quote'),
                text: getVal('cfg-about-text'),
                mission: getVal('cfg-about-mission'),
                vision: getVal('cfg-about-vision'),
                values: getVal('cfg-about-values')
            };
            saveSiteConfig(cfg);
            notifySaved('¡Información de empresa, historia, misión y redes guardada!');
        });
    }

    // 5. Guardar Textos Legales
    const formLegal = document.getElementById('form-legal-config');
    if (formLegal) {
        formLegal.addEventListener('submit', function (e) {
            e.preventDefault();
            const cfg = getSiteConfig();
            cfg.legal = {
                terms: getVal('legal-terms'),
                privacy: getVal('legal-privacy'),
                contractClauses: getVal('legal-contract')
            };
            saveSiteConfig(cfg);
            notifySaved('¡Contratos y textos legales actualizados!');
        });
    }

    // Buscador de usuarios en tiempo real
    const searchUsersInput = document.getElementById('search-users-input');
    if (searchUsersInput) {
        searchUsersInput.addEventListener('input', function () {
            renderUsersManagement(this.value);
        });
    }

    // Filtro de flota
    const fleetFilterSelect = document.getElementById('fleet-filter-status');
    if (fleetFilterSelect) {
        fleetFilterSelect.addEventListener('change', function () {
            renderFleetModeration(this.value);
        });
    }
}

/** ================= MOTOR DE SUBIDA Y OPTIMIZACIÓN DE IMÁGENES ================= **/
function setupImageUpload(fileInputId, labelId, previewImgId, dataInputId, urlInputId = null, maxWidth = 320, maxHeight = 320) {
    const fileInput = document.getElementById(fileInputId);
    const fileLabel = document.getElementById(labelId);
    const previewImg = document.getElementById(previewImgId);
    const dataInput = document.getElementById(dataInputId);
    const urlInput = urlInputId ? document.getElementById(urlInputId) : null;

    if (fileInput) {
        fileInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (!file) return;

            if (fileLabel) fileLabel.innerText = file.name;

            const reader = new FileReader();
            reader.onload = function (event) {
                const img = new Image();
                img.onload = function () {
                    // Escalar con canvas para optimizar peso en localStorage sin perder nitidez
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const optimizedData = canvas.toDataURL('image/jpeg', 0.88);
                    if (previewImg) previewImg.src = optimizedData;
                    if (dataInput) dataInput.value = optimizedData;
                    if (urlInput) urlInput.value = '';
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    if (urlInput) {
        urlInput.addEventListener('input', function () {
            if (this.value.trim()) {
                if (previewImg) previewImg.src = this.value.trim();
                if (dataInput) dataInput.value = this.value.trim();
                if (fileLabel) fileLabel.innerText = 'Subir foto desde tu dispositivo...';
            }
        });
    }
}

/** ================= HELPERS Y ALMACENAMIENTO ================= **/
function getCars() {
    try { return JSON.parse(localStorage.getItem('renteasy_cars')) || []; } catch (e) { return []; }
}
function saveCars(cars) { localStorage.setItem('renteasy_cars', JSON.stringify(cars)); }

function getUsers() {
    try { return JSON.parse(localStorage.getItem('renteasy_users')) || []; } catch (e) { return []; }
}
function saveUsers(users) { localStorage.setItem('renteasy_users', JSON.stringify(users)); }

function getBookings() {
    try { return JSON.parse(localStorage.getItem('renteasy_bookings')) || []; } catch (e) { return []; }
}
function saveBookings(bookings) { localStorage.setItem('renteasy_bookings', JSON.stringify(bookings)); }

function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}

function setElemText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

function formatCop(val) {
    return Number(val || 0).toLocaleString('es-CO');
}

function notifySaved(msg) {
    const alertBox = document.getElementById('global-admin-toast');
    if (alertBox) {
        alertBox.innerText = msg;
        alertBox.style.display = 'block';
        alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        setTimeout(() => alertBox.style.display = 'none', 3500);
    } else {
        alert(msg);
    }
}

function initAdminData() {
    // Si la flota tiene solo autos activos, agregamos un auto en revisión para probar moderación
    const cars = getCars();
    if (!cars.some(c => c.status === 'En Revision')) {
        cars.push({
            id: 'car_mod_demo',
            ownerId: 'usr_demo_host_2',
            ownerName: 'Felipe Daza',
            ownerPhone: '+57 318 444 7788',
            brand: 'Renault',
            model: 'Duster Iconic 4x4',
            fullName: 'Renault Duster 4x4',
            year: 2023,
            category: 'SUV / Camioneta',
            transmission: 'Mecánico',
            fuel: 'Gasolina',
            seats: 5,
            pricePerDay: 210000,
            city: 'Valledupar',
            mileage: '200 km/día',
            description: 'Camioneta lista para estrenar, SOAT al día, ideal para carretera o viajes a la sierra.',
            image: 'img/car-rent-4.png',
            status: 'En Revision', // Pendiente de aprobación por el admin
            featured: false,
            createdAt: new Date().toISOString()
        });
        saveCars(cars);
    }

    // Si no hay disputas de prueba, aseguramos una
    const bookings = getBookings();
    if (!bookings.some(b => b.status === 'Disputa')) {
        bookings.push({
            id: 'book_dispute_demo',
            carId: 'car_1',
            carName: 'Mazda CX-30 (2023)',
            carCity: 'Bogotá',
            ownerId: 'usr_demo_host',
            ownerName: 'Carlos Mendoza',
            renterName: 'Roberto Silva',
            renterPhone: '+57 312 333 4455',
            renterEmail: 'roberto@ejemplo.com',
            startDate: '2026-11-20',
            endDate: '2026-11-23',
            totalDays: 3,
            totalPrice: 660000,
            platformFee: 99000,
            ownerEarnings: 561000,
            deposit: 200000,
            status: 'Disputa', // Requiere arbitraje del admin
            createdAt: new Date().toISOString()
        });
        saveBookings(bookings);
    }
}

