/**
 * Rent Car Colombia - Motor del Superadmin Backoffice
 * Gestión integral: Finanzas, Moderación de Flota, KYC de Usuarios, Disputas, Pasarelas y CMS
 */

// Único vehículo inicial oficial de ejemplo (Base Valledupar)
const SINGLE_SAMPLE_CAR = {
    id: 'car_valledupar_01',
    ownerId: 'usr_admin',
    ownerName: 'Rent Car Colombia',
    ownerPhone: '+57 316 235 7871',
    brand: 'Renault',
    model: 'Duster Iconic 4x4 Turbo',
    fullName: 'Renault Duster 4x4 Turbo',
    name: 'Renault Duster 4x4 Turbo',
    year: 2024,
    category: 'SUV / Camioneta',
    type: 'SUV / Camioneta',
    transmission: 'Automático',
    fuel: 'Gasolina',
    seats: 5,
    price: 220000,
    pricePerDay: 220000,
    city: 'Valledupar',
    mileage: '250 km/día',
    description: 'Camioneta todoterreno 4x4 turbo de demostración. Totalmente equipada, SOAT vigente, seguro todo riesgo y mantenimiento al día en Valledupar.',
    image: 'img/car-rent-1.png',
    status: 'Activo',
    featured: true,
    soat: true,
    soat_vigente: true,
    createdAt: new Date().toISOString()
};

document.addEventListener('DOMContentLoaded', function () {
    // 1. Verificación de Seguridad y Sesión
    const currentAdmin = checkAdminSession();
    if (!currentAdmin) return;

    // Inicializar datos limpios de producción (1 solo auto de ejemplo, 0 reservas de prueba)
    initAdminData();

    // 2. Renderizar todas las vistas del Backoffice con datos reales
    renderFinancialOverview();
    renderFleetModeration();
    renderUsersManagement();
    renderBookingsAndDisputes();
    renderFeedbackAndAlertsAdmin();
    renderAuditLogsAdmin();
    loadPaymentsConfig();
    syncFinancialLabels();
    loadCmsConfig();
    loadVisibilityConfig();
    renderTeamListAdmin();
    renderCommunityTestimonialsAdmin();
    renderVerifiedReviewsModeration();
    loadCompanySettings();
    renderInquiriesAdmin();
    loadLegalTexts();

    // 3. Manejadores de Formularios, Observador Universal de Logs y Acciones
    setupFormListeners();
    initUniversalAdminAuditObserver();

    // 4. Restauración y persistencia de pestaña activa (#fleet, #users, #bookings, #payments, etc.)
    restoreActiveTab();

    // Al cambiar de pestaña en el menú lateral, persistir en sessionStorage, localStorage y URL hash
    $('#admin-pills-tab a[data-toggle="pill"]').on('shown.bs.tab', function (e) {
        const pillId = $(e.target).attr('id');
        const targetHref = $(e.target).attr('href');
        if (pillId) {
            sessionStorage.setItem('renteasy_admin_active_tab', pillId);
            localStorage.setItem('renteasy_admin_active_tab', pillId);
        }
        if (targetHref && targetHref.startsWith('#tab-')) {
            const h = targetHref.replace('#tab-', '');
            if (history.replaceState) {
                history.replaceState(null, null, `#${h}`);
            } else {
                window.location.hash = h;
            }
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('hashchange', restoreActiveTab);

    // 5. Sincronizar en segundo plano con base de datos real en Supabase
    syncLiveDataFromSupabase();

    // 6. Cerrar Sesión (modal unificado sin doble confirmación)
    document.querySelectorAll('.btn-admin-logout').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            const doLogout = async function () {
                if (typeof window.performFullLogout === 'function') {
                    await window.performFullLogout();
                } else {
                    sessionStorage.setItem('renteasy_explicit_logout', 'true');
                    localStorage.removeItem('renteasy_current_user');
                    localStorage.removeItem('renteasy_last_activity');
                    window.location.href = 'LOGIN.html?action=logged_out';
                }
            };
            if (typeof window.openLogoutConfirmModal === 'function') {
                window.openLogoutConfirmModal(doLogout);
            } else {
                doLogout();
            }
        });
    });
});

/** ================= SEGURIDAD Y CONTROL DE ACCESO ================= **/
function checkAdminSession() {
    try {
        const user = JSON.parse(localStorage.getItem('renteasy_current_user'));
        if (!user || user.role !== 'admin') {
            window.location.replace('LOGIN.html?action=logged_out');
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
    const cfg = getSiteConfig();
    const commPct = (cfg.payments && cfg.payments.commissionPercent !== undefined) ? parseFloat(cfg.payments.commissionPercent) : 15;
    const commRatio = commPct / 100;
    const ownerRatio = 1 - commRatio;

    // Cálculos basados en transacciones y reservas reales
    const totalVolume = bookings.reduce((sum, b) => sum + (parseFloat(b.totalPrice) || 0), 0);
    const platformEarnings = bookings.reduce((sum, b) => sum + (parseFloat(b.platformFee) || Math.round((parseFloat(b.totalPrice) || 0) * commRatio)), 0);
    const ownerPayouts = bookings.reduce((sum, b) => sum + (parseFloat(b.ownerEarnings) || Math.round((parseFloat(b.totalPrice) || 0) * ownerRatio)), 0);
    const activeTrips = bookings.filter(b => b.status === 'En Curso' || b.status === 'Aceptada').length;
    const pendingApprovalCars = cars.filter(c => c.status === 'En Revision' || c.status === 'Contraoferta' || (c.priceNegotiation && c.priceNegotiation.status === 'counter_offer')).length;
    const pendingDisputes = bookings.filter(b => b.status === 'Disputa').length;

    let feedbackItems = [];
    try { feedbackItems = JSON.parse(localStorage.getItem('rentcar_feedback')) || []; } catch (e) { feedbackItems = []; }
    const pendingFeedback = feedbackItems.filter(f => f && f.status !== 'Resuelto').length;
    const totalBookingsTabAlerts = pendingDisputes + pendingFeedback;

    // Inyectar en el DOM métricas 100% reales
    setElemText('stat-gmv-volume', `$${formatCop(totalVolume)} COP`);
    setElemText('stat-platform-profit', `$${formatCop(platformEarnings)} COP`);
    setElemText('stat-owner-payouts', `$${formatCop(ownerPayouts)} COP`);
    setElemText('stat-fleet-total', `${cars.length} ${cars.length === 1 ? 'vehículo' : 'vehículos'}`);
    setElemText('stat-active-trips', `${activeTrips} ${activeTrips === 1 ? 'viaje' : 'viajes'}`);
    setElemText('stat-total-users', `${users.length} ${users.length === 1 ? 'usuario' : 'usuarios'}`);

    // Sincronizar etiquetas de comisión y fianza
    syncFinancialLabels();

    // Badges de alerta rápida en el menú lateral
    const badgeCarMod = document.getElementById('badge-cars-pending');
    if (badgeCarMod) {
        badgeCarMod.innerText = pendingApprovalCars;
        badgeCarMod.style.display = pendingApprovalCars > 0 ? 'inline-block' : 'none';
    }

    const badgeDisputes = document.getElementById('badge-disputes-pending');
    if (badgeDisputes) {
        badgeDisputes.innerText = totalBookingsTabAlerts;
        badgeDisputes.style.display = totalBookingsTabAlerts > 0 ? 'inline-block' : 'none';
    }

    // Campanita global del encabezado
    renderAdminNotificationBell({ pendingApprovalCars, pendingDisputes, pendingFeedback });
}

function renderAdminNotificationBell(counts) {
    const badge = document.getElementById('admin-topbar-bell-badge');
    const totalLabel = document.getElementById('admin-bell-total-label');
    const list = document.getElementById('admin-bell-dropdown-list');
    if (!badge || !list) return;

    const total = (counts.pendingApprovalCars || 0) + (counts.pendingDisputes || 0) + (counts.pendingFeedback || 0);
    badge.innerText = total;
    badge.style.display = total > 0 ? 'inline-block' : 'none';
    if (totalLabel) totalLabel.innerText = total;

    if (total === 0) {
        list.innerHTML = `<div class="text-center text-muted py-3"><i class="fa fa-check-circle text-success mr-1"></i> ¡Todo al día! No tienes pendientes.</div>`;
        return;
    }

    let html = '';
    if (counts.pendingFeedback > 0) {
        html += `<a href="javascript:void(0);" class="dropdown-item rounded py-2 d-flex justify-content-between align-items-center" onclick="goToAdminTab('tab-bookings')"><span><i class="fa fa-bullhorn text-danger mr-2"></i>Quejas / Feedback</span><span class="badge badge-danger">${counts.pendingFeedback}</span></a>`;
    }
    if (counts.pendingDisputes > 0) {
        html += `<a href="javascript:void(0);" class="dropdown-item rounded py-2 d-flex justify-content-between align-items-center" onclick="goToAdminTab('tab-bookings')"><span><i class="fa fa-balance-scale text-warning mr-2"></i>Disputas abiertas</span><span class="badge badge-warning text-dark">${counts.pendingDisputes}</span></a>`;
    }
    if (counts.pendingApprovalCars > 0) {
        html += `<a href="javascript:void(0);" class="dropdown-item rounded py-2 d-flex justify-content-between align-items-center" onclick="goToAdminTab('tab-fleet')"><span><i class="fa fa-car text-primary mr-2"></i>Autos / Contraofertas</span><span class="badge badge-primary">${counts.pendingApprovalCars}</span></a>`;
    }
    list.innerHTML = html;
}

/** Sincronización en vivo con base de datos Supabase en segundo plano **/
async function syncLiveDataFromSupabase() {
    if (typeof getSupabaseClient !== 'function') return;
    const client = getSupabaseClient();
    if (!client) return;

    try {
        // 1. Consultar vehículos registrados en Supabase
        const { data: dbCars, error: errCars } = await client.from('vehiculos').select('*').order('creado_en', { ascending: false });
        if (!errCars && dbCars && dbCars.length > 0) {
            const mappedCars = dbCars.map(v => {
                const rawCat = v.categoria || v.category || v.tipo || v.type;
                const cleanCat = (rawCat && rawCat !== 'undefined' && rawCat !== 'null') ? rawCat : 'SUV / Camioneta';
                const rawPrice = parseFloat(v.precio_por_dia || v.precio || 220000);
                const cleanCity = (v.ciudad && v.ciudad !== 'undefined') ? v.ciudad : 'Valledupar';
                const cleanTransmission = (v.transmision && v.transmision !== 'undefined') ? v.transmision : 'Automático';
                const cleanFuel = (v.combustible && v.combustible !== 'undefined') ? v.combustible : 'Gasolina';
                const cleanSeats = parseInt(v.puestos || v.seats) || 5;
                const cleanYear = parseInt(v.año || v.anio || v.year) || 2024;
                const cleanName = v.nombre_completo || `${v.marca || ''} ${v.modelo || ''}`.trim() || 'Vehículo en Alquiler';

                return {
                    id: v.id,
                    brand: v.marca || 'Vehículo',
                    model: v.modelo || '',
                    name: cleanName,
                    fullName: cleanName,
                    year: cleanYear,
                    type: cleanCat,
                    category: cleanCat,
                    transmission: cleanTransmission,
                    fuel: cleanFuel,
                    seats: cleanSeats,
                    price: rawPrice,
                    pricePerDay: rawPrice,
                    city: cleanCity,
                    mileage: v.kilometraje_limite || '250 km/día',
                    description: v.descripcion || '',
                    image: v.imagen_url || 'img/car-rent-1.png',
                    images: Array.isArray(v.galeria_imagenes) && v.galeria_imagenes.length > 0 ? v.galeria_imagenes : [v.imagen_url || 'img/car-rent-1.png'],
                    status: v.estado || 'Activo',
                    ownerId: v.propietario_id,
                    hostType: v.tipo_anfitrion || 'Rentadora Aliada',
                    hasGps: v.tiene_gps !== false,
                    luggage: parseInt(v.capacidad_maletas, 10) || 3,
                    blockedDates: Array.isArray(v.fechas_bloqueadas) ? v.fechas_bloqueadas : [],
                    soatImage: v.soat_imagen || '',
                    policyImage: v.poliza_imagen || '',
                    plate: v.placa || '',
                    soatExpiry: v.soat_vencimiento || '',
                    soatStatus: v.soat_estado || 'Pendiente',
                    platePhoto: v.foto_placa_privada || '',
                    createdAt: v.creado_en
                };
            });
            saveCars(mappedCars);
        }

        // 2. Consultar reservas registradas en Supabase
        const { data: dbBookings, error: errBookings } = await client.from('reservas').select('*').order('creado_en', { ascending: false });
        if (!errBookings && dbBookings) {
            const mappedBookings = dbBookings.map(r => ({
                id: r.id,
                carId: r.vehiculo_id,
                ownerId: r.propietario_id,
                driverId: r.conductor_id,
                startDate: r.fecha_inicio,
                endDate: r.fecha_fin,
                totalDays: r.total_dias,
                dailyRate: parseFloat(r.tarifa_diaria),
                totalPrice: parseFloat(r.total_cobrado || r.subtotal_alquiler || 0),
                platformFee: parseFloat(r.comision_plataforma_15 || 0),
                ownerEarnings: parseFloat(r.ganancia_propietario_85 || 0),
                deposit: parseFloat(r.deposito_garantia || 200000),
                status: r.estado_reserva || 'Pendiente',
                paymentStatus: r.estado_pago || 'Autorizado',
                createdAt: r.creado_en
            }));
            saveBookings(mappedBookings);
        }

        // 3. Consultar perfiles registrados en Supabase
        const { data: dbProfiles, error: errProfiles } = await client.from('perfiles').select('*');
        if (!errProfiles && dbProfiles && dbProfiles.length > 0) {
            const mappedUsers = dbProfiles.map(p => ({
                    id: p.id,
                    name: p.nombre_completo || p.email.split('@')[0],
                    email: p.email,
                    phone: p.telefono || '',
                    role: p.rol || 'conductor',
                    city: p.ciudad || 'Valledupar',
                    verified: p.identidad_verificada || false,
                    banned: false,
                    createdAt: p.creado_en
                }));
            if (mappedUsers.length > 0) {
                saveUsers(mappedUsers);
            }
        }

        // 4. Consultar reportes de feedback, reseñas, mensajes, logs y configuración global en Supabase
        if (typeof dbGetFeedback === 'function') {
            await dbGetFeedback();
        }
        if (typeof dbGetResenas === 'function') {
            await dbGetResenas();
        }
        if (typeof dbGetTestimonios === 'function') {
            await dbGetTestimonios();
        }
        if (typeof dbGetFaqs === 'function') {
            await dbGetFaqs();
        }
        if (typeof dbGetMensajesContacto === 'function') {
            await dbGetMensajesContacto();
        }
        if (typeof dbGetConfig === 'function') {
            await dbGetConfig();
        }
        if (typeof dbGetAuditLogs === 'function') {
            await dbGetAuditLogs();
        }

        // Refrescar vistas con datos en tiempo real de Supabase
        renderFinancialOverview();
        renderFleetModeration();
        renderBookingsAndDisputes();
        renderFeedbackAndAlertsAdmin();
        renderCommunityTestimonialsAdmin();
        renderVerifiedReviewsModeration();
        renderFaqList();
        renderInquiriesAdmin();
        renderAuditLogsAdmin();
        renderUsersManagement();
    } catch (e) {
        console.warn("Sincronización en segundo plano con Supabase:", e);
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

    container.innerHTML = cars.map(car => {
        const neg = car.priceNegotiation || null;
        let negHtml = '';
        if (neg && neg.status === 'admin_proposed') {
            negHtml = `<div class="small text-info mt-1"><i class="fa fa-tag mr-1"></i>Sugerida: <strong>$${formatCop(neg.suggestedPrice)}</strong></div>`;
        } else if (neg && neg.status === 'counter_offer') {
            negHtml = `<div class="small text-warning font-weight-bold mt-1"><i class="fa fa-exchange-alt mr-1"></i>Contraoferta: $${formatCop(neg.counterPrice)}<br><span class="text-muted font-weight-normal">"${neg.ownerNote || ''}"</span></div>`;
        }

        const badgeClass = car.status === 'Activo' ? 'badge-success'
            : car.status === 'En Revision' ? 'badge-warning'
            : car.status === 'Ajuste de Tarifa' ? 'badge-info'
            : car.status === 'Contraoferta' ? 'badge-primary'
            : car.status === 'Rechazado' ? 'badge-danger'
            : 'badge-secondary';

        return `
        <tr>
            <td style="width: 110px;">
                <img src="${car.image}" alt="${car.fullName}" class="rounded border shadow-sm" style="width: 90px; height: 60px; object-fit: cover;" onerror="this.src='img/car-rent-1.png'">
            </td>
            <td>
                <div class="font-weight-bold text-dark">${car.fullName} (${car.year}) ${car.plate ? `<span class="badge badge-dark ml-1">${car.plate}</span>` : ''}</div>
                <small class="text-muted"><i class="fa fa-tag mr-1 text-primary"></i>${car.category} &bull; ${car.transmission} &bull; <i class="fa fa-suitcase text-primary"></i> ${car.luggage || 3}</small>
                <div class="mt-1 d-flex flex-wrap align-items-center" style="gap: 4px;">
                    <span class="badge ${car.hostType === 'Propietario Particular' ? 'badge-info' : 'badge-success'}" style="font-size:10px;">${car.hostType || 'Rentadora Aliada'}</span>
                    ${car.hasGps !== false ? '<span class="badge badge-light border text-dark" style="font-size:10px;">GPS</span>' : ''}
                    ${(() => {
                        const st = car.soatExpiry ? ((new Date(car.soatExpiry + 'T00:00:00') < new Date(new Date().setHours(0,0,0,0))) ? 'Vencido' : (((new Date(car.soatExpiry + 'T00:00:00') - new Date(new Date().setHours(0,0,0,0))) / 86400000 <= 15) ? 'Por vencer' : 'Vigente')) : (car.soatStatus || 'Pendiente');
                        const cls = st === 'Vigente' ? 'badge-success' : st === 'Por vencer' ? 'badge-warning text-dark' : st === 'Vencido' ? 'badge-danger' : 'badge-secondary';
                        return `<span class="badge ${cls}" style="font-size:10px;">SOAT: ${st}${car.soatExpiry ? ` (${car.soatExpiry})` : ''}</span>`;
                    })()}
                    ${car.soatImage ? `<button type="button" class="badge badge-primary border-0" style="font-size:10px;cursor:pointer;" onclick="window.openDocumentPreview(this.dataset.doc)" data-doc="${car.soatImage.replace(/"/g, '&quot;')}">Ver SOAT</button>` : ''}
                    ${car.platePhoto ? `<button type="button" class="badge badge-warning text-dark border-0" style="font-size:10px;cursor:pointer;" onclick="window.openDocumentPreview(this.dataset.doc)" data-doc="${car.platePhoto.replace(/"/g, '&quot;')}">Ver Placa</button>` : ''}
                    ${car.policyImage ? `<button type="button" class="badge badge-dark border-0" style="font-size:10px;cursor:pointer;" onclick="window.openDocumentPreview(this.dataset.doc)" data-doc="${car.policyImage.replace(/"/g, '&quot;')}">Ver Póliza</button>` : ''}
                    ${car.plate ? `<button type="button" class="badge badge-info border-0" style="font-size:10px;cursor:pointer;" onclick="window.verifyPlateInRunt('${car.plate}')" title="Copiar placa y abrir RUNT"><i class="fa fa-search mr-1"></i>RUNT</button>` : ''}
                </div>
            </td>
            <td>
                <div class="small font-weight-semi-bold">${car.ownerName || 'Propietario'}</div>
                <small class="text-muted"><i class="fa fa-phone mr-1"></i>${car.ownerPhone || 'Sin teléfono'}</small>
            </td>
            <td>
                <span class="badge badge-light border text-dark font-weight-bold"><i class="fa fa-map-marker-alt text-primary mr-1"></i>${car.city}</span>
            </td>
            <td class="font-weight-bold text-primary">
                $${formatCop(car.pricePerDay)} <small class="text-muted">COP/día</small>
                ${negHtml}
            </td>
            <td>
                <span class="badge ${badgeClass} px-2 py-1">${car.status}</span>
                ${car.featured ? '<span class="badge badge-primary ml-1" title="Destacado en portada"><i class="fa fa-star"></i> Destacado</span>' : ''}
            </td>
            <td>
                <div class="btn-group btn-group-sm flex-wrap">
                    ${neg && neg.status === 'counter_offer' ? `
                        <button type="button" class="btn btn-success" title="Aceptar contraoferta del dueño" onclick="acceptCounterOffer('${car.id}')">
                            <i class="fa fa-check-double"></i> Aceptar $${formatCop(neg.counterPrice)}
                        </button>
                    ` : (car.status !== 'Activo' ? `
                        <button type="button" class="btn btn-success" title="Aprobar para catálogo" onclick="approveCar('${car.id}')">
                            <i class="fa fa-check"></i> Aprobar
                        </button>
                    ` : `
                        <button type="button" class="btn btn-outline-secondary" title="Pausar publicación" onclick="pauseCar('${car.id}')">
                            <i class="fa fa-pause"></i>
                        </button>
                    `)}
                    <button type="button" class="btn btn-outline-info" title="Sugerir ajuste de tarifa al propietario" onclick="openSuggestPriceModal('${car.id}')">
                        <i class="fa fa-tag"></i> Tarifa
                    </button>
                    <button type="button" class="btn btn-outline-success" title="Enviar alerta / WhatsApp al propietario" onclick="openOwnerAlertModal('${car.id}')">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                    ${car.status === 'En Revision' ? `
                        <button type="button" class="btn btn-danger" title="Rechazar publicación" onclick="rejectCarPrompt('${car.id}')">
                            <i class="fa fa-times"></i>
                        </button>
                    ` : ''}
                    <button type="button" class="btn ${car.featured ? 'btn-warning' : 'btn-outline-warning'}" title="${car.featured ? 'Quitar de destacados' : 'Destacar en portada'}" onclick="toggleFeatureCar('${car.id}')">
                        <i class="fa fa-star"></i>
                    </button>
                    <button type="button" class="btn btn-outline-danger" title="Eliminar definitivamente" onclick="deleteCarAdmin('${car.id}')">
                        <i class="fa fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

async function syncCarStatusSupabase(carId, status) {
    try {
        if (typeof getSupabaseClient === 'function') {
            const client = getSupabaseClient();
            if (client) {
                await client.from('vehiculos').update({ estado: status }).eq('id', carId);
            }
        }
    } catch (e) { console.warn('Supabase sync car status:', e); }
}

function recordAdminLog(modulo, accion, detalle = '', cambios = null) {
    let user = null;
    try { user = JSON.parse(localStorage.getItem('renteasy_current_user')); } catch (e) { }
    const entry = {
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        usuario: user ? (user.name || user.email || 'Administrador') : 'Administrador',
        rol: user ? (user.role || 'admin') : 'admin',
        modulo: modulo || 'Admin',
        accion: accion || 'Modificación',
        detalle: detalle || '',
        detalle_cambios: (Array.isArray(cambios) && cambios.length > 0) ? cambios : null,
        creado_en: new Date().toISOString()
    };

    try {
        let logs = JSON.parse(localStorage.getItem('rentcar_audit_logs')) || [];
        logs.unshift(entry);
        if (logs.length > 500) logs = logs.slice(0, 500);
        localStorage.setItem('rentcar_audit_logs', JSON.stringify(logs));
    } catch (e) { }

    if (typeof getSupabaseClient === 'function') {
        try {
            const client = getSupabaseClient();
            if (client) {
                const payload = {
                    usuario: entry.usuario,
                    rol: entry.rol,
                    modulo: entry.modulo,
                    accion: entry.accion,
                    detalle: entry.detalle,
                    detalle_cambios: entry.detalle_cambios,
                    creado_en: entry.creado_en
                };
                client.from('logs_auditoria').insert([payload]).then(({ error }) => {
                    if (error) {
                        // Respaldo automático si aún no se ha ejecutado el ALTER TABLE de detalle_cambios
                        const fallbackPayload = {
                            usuario: entry.usuario,
                            rol: entry.rol,
                            modulo: entry.modulo,
                            accion: entry.accion,
                            detalle: entry.detalle,
                            creado_en: entry.creado_en
                        };
                        client.from('logs_auditoria').insert([fallbackPayload]).then(() => {}).catch(() => {});
                    }
                }).catch(() => {});
            }
        } catch (e) { }
    }

    renderAuditLogsAdmin();
}

function initUniversalAdminAuditObserver() {
    const tabContent = document.getElementById('admin-tabContent');
    if (!tabContent) return;

    const getPaneModule = (el) => {
        const pane = el.closest('.tab-pane');
        if (!pane) return 'Admin';
        const map = {
            'tab-overview': 'Resumen',
            'tab-fleet': 'Flota',
            'tab-users': 'KYC',
            'tab-bookings': 'Reservas',
            'tab-payments': 'Finanzas',
            'tab-cms': 'CMS',
            'tab-company': 'Empresa',
            'tab-legal': 'Legal',
            'tab-logs': 'Auditoría'
        };
        return map[pane.id] || 'Admin';
    };

    const getFieldLabel = (el) => {
        const group = el.closest('.form-group, .custom-control, .mb-3, .col-md-6, .col-md-4, .col-md-12');
        const lbl = group ? group.querySelector('label, strong, h6') : null;
        if (lbl && lbl.innerText.trim()) return lbl.innerText.replace(/\*/g, '').trim();
        return el.placeholder || el.id || 'Campo';
    };

    const snapshotFields = (scope) => {
        (scope || tabContent).querySelectorAll('input, textarea, select').forEach(el => {
            if (el.type === 'hidden' || el.type === 'file' || el.type === 'password') return;
            if (el.id === 'logs-search-input' || el.id === 'logs-module-filter' || el.id === 'logs-date-from' || el.id === 'logs-date-to' || el.id === 'search-users-input' || el.id === 'fleet-filter-status') return;
            el.dataset.auditLastVal = (el.type === 'checkbox') ? (el.checked ? 'Activado' : 'Desactivado') : String(el.value || '');
        });
    };

    // Tomar foto inicial de todos los campos tras cargar configuraciones
    setTimeout(() => snapshotFields(tabContent), 250);

    tabContent.addEventListener('focusin', function (e) {
        const el = e.target;
        if (!el || !el.matches('input, textarea, select')) return;
        if (el.type === 'hidden' || el.type === 'file' || el.type === 'password') return;
        if (el.dataset.auditLastVal === undefined) {
            el.dataset.auditLastVal = (el.type === 'checkbox') ? (el.checked ? 'Activado' : 'Desactivado') : String(el.value || '');
        }
    });

    // Solo interruptores INDEPENDIENTES (fuera de <form>, ej. quick-toggle-reviews) registran al cambiar
    tabContent.addEventListener('change', function (e) {
        const target = e.target;
        if (!target || target.type !== 'checkbox') return;
        if (target.closest('form')) return; // Los de dentro de un <form> se registran en 1 solo log al guardar el formulario

        const labelEl = target.closest('.custom-control, .form-check, .d-flex')?.querySelector('label, strong, h6');
        const controlName = labelEl ? labelEl.innerText.trim() : (target.id || 'Interruptor');
        const stateText = target.checked ? 'Activado' : 'Desactivado';
        const prevText = target.checked ? 'Desactivado' : 'Activado';
        target.dataset.auditLastVal = stateText;
        // Sincronizar también el snapshot del checkbox hermano si existe (ej. vis-testimonials)
        const visTest = document.getElementById('vis-testimonials');
        if (target.id === 'quick-toggle-reviews' && visTest) {
            visTest.dataset.auditLastVal = stateText;
        }
        recordAdminLog(
            getPaneModule(target),
            `${stateText}: ${controlName}`,
            `Control cambiado de ${prevText} a ${stateText}`,
            [{ field: controlName, before: prevText, after: stateText }]
        );
    });

    // Al guardar cualquier formulario de configuración/edición, capturar TODOS los campos (incl. switches) en 1 solo log
    const addForms = new Set(['form-add-hero-slide', 'form-add-team', 'form-add-faq']);
    tabContent.addEventListener('submit', function (e) {
        const form = e.target;
        if (!form || form.tagName !== 'FORM' || addForms.has(form.id)) return;

        const changes = [];
        form.querySelectorAll('input, textarea, select').forEach(el => {
            if (el.type === 'hidden' || el.type === 'file' || el.type === 'password') return;
            const prev = el.dataset.auditLastVal !== undefined ? el.dataset.auditLastVal : '';
            const curr = (el.type === 'checkbox') ? (el.checked ? 'Activado' : 'Desactivado') : String(el.value || '');
            if (prev !== curr) {
                changes.push({
                    field: getFieldLabel(el),
                    before: prev,
                    after: curr
                });
                el.dataset.auditLastVal = curr;
            }
        });

        if (changes.length > 0) {
            const mod = getPaneModule(form);
            const summary = changes.map(c => `${c.field}: ${c.before} → ${c.after}`).join(' | ');
            const actionTitle = changes.length === 1
                ? `${changes[0].after === 'Activado' || changes[0].after === 'Desactivado' ? changes[0].after : 'Editado'}: ${changes[0].field}`
                : `${changes.length} cambios guardados en ${mod}`;
            recordAdminLog(mod, actionTitle, summary.length > 180 ? `${changes.length} campos modificados (clic para comparar Antes / Después)` : summary, changes);
        }
    });

    // Refrescar tabla de logs al abrir la pestaña Logs & Auditoría
    const logsPill = document.getElementById('tab-logs-pill');
    if (logsPill) {
        $(logsPill).on('shown.bs.tab', function () {
            renderAuditLogsAdmin();
        });
    }
}

window.approveCar = function (carId) {
    const cars = getCars();
    const car = cars.find(c => c.id === carId);
    if (car) {
        const prev = car.status || 'En Revision';
        car.status = 'Activo';
        saveCars(cars);
        syncCarStatusSupabase(carId, 'Activo');
        recordAdminLog('Flota', 'Vehículo aprobado', `${car.fullName} (${car.city || ''})`, [{ field: `Estado de ${car.fullName}`, before: prev, after: 'Activo' }]);
        renderFleetModeration(document.getElementById('fleet-filter-status')?.value || 'all');
        renderFinancialOverview();
        notifySaved(`Vehículo "${car.fullName}" APROBADO. Ya es visible en el catálogo.`);
    }
};

window.pauseCar = function (carId) {
    const cars = getCars();
    const car = cars.find(c => c.id === carId);
    if (car) {
        const prev = car.status || 'Activo';
        car.status = prev === 'Activo' ? 'Pausado' : 'Activo';
        saveCars(cars);
        syncCarStatusSupabase(carId, car.status);
        recordAdminLog('Flota', `Vehículo ${car.status.toLowerCase()}`, `${car.fullName}`, [{ field: `Estado de ${car.fullName}`, before: prev, after: car.status }]);
        renderFleetModeration(document.getElementById('fleet-filter-status')?.value || 'all');
        renderFinancialOverview();
        notifySaved(`Vehículo "${car.fullName}" cambiado a estado: ${car.status}.`);
    }
};

window.rejectCarPrompt = function (carId) {
    const reason = prompt('Indica el motivo del rechazo para notificar al propietario (ej. Fotos borrosas, SOAT vencido):', 'Documentación incompleta o fotos no legibles.');
    if (reason) {
        const cars = getCars();
        const car = cars.find(c => c.id === carId);
        if (car) {
            const prev = car.status || 'En Revision';
            car.status = 'Rechazado';
            car.rejectReason = reason;
            saveCars(cars);
            syncCarStatusSupabase(carId, 'Rechazado');
            recordAdminLog('Flota', 'Vehículo rechazado', `${car.fullName} — Motivo: ${reason}`, [{ field: `Estado de ${car.fullName}`, before: prev, after: `Rechazado (${reason})` }]);
            renderFleetModeration(document.getElementById('fleet-filter-status')?.value || 'all');
            renderFinancialOverview();
            notifySaved(`Vehículo rechazado con la nota: "${reason}".`);
        }
    }
};

window.toggleFeatureCar = function (carId) {
    const cars = getCars();
    const car = cars.find(c => c.id === carId);
    if (car) {
        const prev = !!car.featured;
        car.featured = !prev;
        saveCars(cars);
        recordAdminLog('Flota', car.featured ? 'Vehículo destacado' : 'Vehículo quitado de destacados', `${car.fullName}`, [{ field: `Destacado: ${car.fullName}`, before: prev ? 'Sí' : 'No', after: car.featured ? 'Sí' : 'No' }]);
        renderFleetModeration(document.getElementById('fleet-filter-status')?.value || 'all');
        notifySaved(car.featured ? `"${car.fullName}" marcado como Destacado.` : `"${car.fullName}" quitado de Destacados.`);
    }
};

window.verifyPlateInRunt = function (plate) {
    const clean = String(plate || '').trim().toUpperCase();
    if (clean && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(clean).catch(() => {});
    }
    notifySaved(`Placa "${clean}" copiada al portapapeles. Abriendo consulta oficial del RUNT...`);
    window.open('https://www.runt.gov.co/consultaCiudadana/#/consultaVehiculo', '_blank');
};

window.deleteCarAdmin = function (carId) {
    const doDelete = async function () {
        let cars = getCars();
        const target = cars.find(c => c.id === carId);
        cars = cars.filter(c => c.id !== carId);
        saveCars(cars);
        try {
            if (typeof getSupabaseClient === 'function') {
                const client = getSupabaseClient();
                if (client) await client.from('vehiculos').delete().eq('id', carId);
            }
        } catch (e) { console.warn('Supabase delete car:', e); }
        recordAdminLog('Flota', 'Vehículo eliminado', target ? target.fullName : carId, [{ field: 'Vehículo en catálogo', before: target ? target.fullName : carId, after: '(Eliminado)' }]);
        renderFleetModeration(document.getElementById('fleet-filter-status')?.value || 'all');
        renderFinancialOverview();
        notifySaved('Vehículo eliminado de la plataforma.');
    };
    if (typeof window.openAppConfirmModal === 'function') {
        window.openAppConfirmModal({ title: 'Eliminar vehículo', message: '¿Deseas eliminar permanentemente este auto de la plataforma?', confirmText: 'Eliminar', onConfirm: doDelete });
    } else {
        doDelete();
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

window.toggleVerifyUser = async function (userId) {
    const users = getUsers();
    const u = users.find(item => item.id === userId);
    if (u) {
        u.verified = !u.verified;
        saveUsers(users);
        try {
            if (typeof getSupabaseClient === 'function') {
                const client = getSupabaseClient();
                if (client) await client.from('perfiles').update({ identidad_verificada: u.verified }).eq('id', userId);
            }
        } catch (e) { console.warn('Supabase verify user:', e); }
        recordAdminLog('KYC', u.verified ? 'Identidad verificada' : 'Verificación removida', `${u.name} (${u.email})`);
        renderUsersManagement(document.getElementById('search-users-input')?.value || '');
        notifySaved(u.verified ? `Identidad de ${u.name} VERIFICADA.` : `Verificación removida para ${u.name}.`);
    }
};

window.toggleBanUser = function (userId) {
    const users = getUsers();
    const u = users.find(item => item.id === userId);
    if (u) {
        u.banned = !u.banned;
        saveUsers(users);
        recordAdminLog('KYC', u.banned ? 'Usuario bloqueado' : 'Usuario desbloqueado', `${u.name} (${u.email})`);
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
                            <a class="dropdown-item text-success" href="javascript:void(0);" onclick="changeBookingStatusAdmin('${b.id}', 'Completada')"><i class="fa fa-check mr-2"></i> Marcar Completada</a>
                            <a class="dropdown-item text-warning" href="javascript:void(0);" onclick="changeBookingStatusAdmin('${b.id}', 'Disputa')"><i class="fa fa-exclamation-triangle mr-2"></i> Abrir Disputa</a>
                            <a class="dropdown-item text-danger" href="javascript:void(0);" onclick="changeBookingStatusAdmin('${b.id}', 'Cancelada')"><i class="fa fa-ban mr-2"></i> Cancelar Viaje</a>
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
    const cfg = getSiteConfig();
    const defaultDep = (cfg.payments && cfg.payments.defaultDeposit !== undefined) ? Number(cfg.payments.defaultDeposit) : 200000;
    if (b) {
        const dep = Number(b.deposit || defaultDep);
        if (winner === 'conductor') {
            b.status = 'Completada';
            b.disputeResolution = `Fianza de $${formatCop(dep)} reembolsada al conductor.`;
            alert(`Disputa resuelta: Depósito de garantía ($${formatCop(dep)} COP) liberado a favor del conductor (${b.renterName}).`);
        } else {
            b.status = 'Completada';
            b.disputeResolution = `Fianza de $${formatCop(dep)} transferida al propietario por daños reportados.`;
            alert(`Disputa resuelta: Depósito de garantía ($${formatCop(dep)} COP) transferido al propietario (${b.ownerName}).`);
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

/** ================= NEGOCIACIÓN DE TARIFAS, FEEDBACK Y ALERTAS A PROPIETARIOS ================= **/
function getOwnerContactInfo(car) {
    const users = getUsers();
    const owner = users.find(u => u.id === car.ownerId) || {};
    const rawPhone = (car.ownerPhone || owner.phone || '573162357871').replace(/\D/g, '');
    const waPhone = rawPhone.startsWith('57') ? rawPhone : (rawPhone.length === 10 ? '57' + rawPhone : rawPhone);
    const email = car.ownerEmail || owner.email || '';
    return { waPhone, email, name: car.ownerName || owner.name || 'Propietario' };
}

window.openSuggestPriceModal = function (carId) {
    const cars = getCars();
    const car = cars.find(c => c.id === carId);
    if (!car) return;

    document.getElementById('sp-car-id').value = car.id;
    document.getElementById('sp-car-name').innerText = `${car.fullName} (${car.year})`;
    document.getElementById('sp-owner-name').innerText = car.ownerName || 'Propietario';
    document.getElementById('sp-current-price').innerText = `$${formatCop(car.pricePerDay)} COP/día`;
    document.getElementById('sp-suggested-price').value = car.priceNegotiation?.suggestedPrice || Math.round((car.pricePerDay || 200000) * 0.85 / 5000) * 5000;
    document.getElementById('sp-note').value = car.priceNegotiation?.adminNote || '';
    document.getElementById('sp-notify-actions').style.display = 'none';

    $('#modalSuggestPrice').modal('show');
};

window.acceptCounterOffer = function (carId) {
    const cars = getCars();
    const car = cars.find(c => c.id === carId);
    if (!car || !car.priceNegotiation || !car.priceNegotiation.counterPrice) return;

    const newPrice = Number(car.priceNegotiation.counterPrice);
    car.pricePerDay = newPrice;
    car.price = newPrice;
    car.status = 'Activo';
    car.priceNegotiation.status = 'accepted';
    car.priceNegotiation.resolvedAt = new Date().toISOString();
    saveCars(cars);
    if (typeof dbUpdateVehiculoFields === 'function') {
        dbUpdateVehiculoFields(carId, { precio_por_dia: newPrice, estado: 'Activo', negociacion_tarifa: car.priceNegotiation });
    }
    renderFleetModeration(document.getElementById('fleet-filter-status')?.value || 'all');
    renderFinancialOverview();
    notifySaved(`Contraoferta aceptada ($${formatCop(newPrice)} COP/día). "${car.fullName}" ya está Activo.`);
};

let currentFeedbackFilter = 'pending';

window.setFeedbackFilter = function (filterMode, btnEl) {
    currentFeedbackFilter = filterMode || 'pending';
    const group = document.getElementById('feedback-filter-group');
    if (group) {
        group.querySelectorAll('button').forEach(b => {
            b.classList.remove('btn-primary', 'active');
            b.classList.add('btn-outline-secondary');
        });
        if (btnEl) {
            btnEl.classList.remove('btn-outline-secondary');
            btnEl.classList.add('btn-primary', 'active');
        }
    }
    renderFeedbackAndAlertsAdmin();
};

window.openOwnerAlertModal = function (preselectCarId = '', feedbackId = '') {
    const select = document.getElementById('oa-car-select');
    const cars = getCars();
    if (select) {
        select.innerHTML = cars.map(c => `<option value="${c.id}" ${c.id === preselectCarId ? 'selected' : ''}>${c.fullName} — ${c.ownerName || 'Propietario'}</option>`).join('');
    }

    const subjSelect = document.getElementById('oa-subject-select');
    const subjCustom = document.getElementById('oa-subject-custom');
    const msgBox = document.getElementById('oa-message');

    let fbItem = null;
    if (feedbackId) {
        try {
            const items = JSON.parse(localStorage.getItem('rentcar_feedback')) || [];
            fbItem = items.find(i => i && i.id === feedbackId);
        } catch (e) { }
    }

    if (fbItem && subjSelect) {
        const hasOpt = Array.from(subjSelect.options).some(o => o.value === fbItem.subject);
        if (hasOpt) {
            subjSelect.value = fbItem.subject;
            if (subjCustom) { subjCustom.style.display = 'none'; subjCustom.value = ''; }
        } else {
            subjSelect.value = '__custom__';
            if (subjCustom) { subjCustom.style.display = 'block'; subjCustom.value = fbItem.subject || ''; }
        }
        if (msgBox) {
            msgBox.value = `Hola, recibimos un reporte sobre "${fbItem.subject}": "${fbItem.message}". Por favor ayúdanos a revisarlo para mantener la calidad en Rent Car Colombia.`;
        }
    } else if (subjSelect) {
        subjSelect.selectedIndex = 0;
        if (subjCustom) { subjCustom.style.display = 'none'; subjCustom.value = ''; }
        if (msgBox) msgBox.value = '';
    }

    document.getElementById('oa-notify-actions').style.display = 'none';
    $('#modalOwnerAlert').modal('show');
};

function renderFeedbackAndAlertsAdmin() {
    const tbody = document.getElementById('feedback-alerts-list');
    if (!tbody) return;

    let allItems = [];
    try { allItems = JSON.parse(localStorage.getItem('rentcar_feedback')) || []; } catch (e) { allItems = []; }

    const items = allItems.filter(f => {
        if (!f) return false;
        const st = f.status || 'Pendiente';
        if (currentFeedbackFilter === 'pending') return st !== 'Resuelto';
        if (currentFeedbackFilter === 'resolved') return st === 'Resuelto';
        return true;
    });

    if (items.length === 0) {
        const emptyMsg = currentFeedbackFilter === 'pending'
            ? 'No hay quejas ni reportes pendientes en este momento.'
            : currentFeedbackFilter === 'resolved'
            ? 'No hay reportes en el historial de resueltos.'
            : 'No hay quejas ni reportes de feedback registrados.';
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">${emptyMsg}</td></tr>`;
        return;
    }

    tbody.innerHTML = items.map(f => {
        const st = f.status || 'Pendiente';
        const badgeCls = st === 'Resuelto' ? 'badge-success' : st === 'En Seguimiento' ? 'badge-info' : 'badge-warning';
        return `
        <tr>
            <td class="small text-muted">${f.createdAt ? new Date(f.createdAt).toLocaleDateString('es-CO') : 'Reciente'}</td>
            <td class="font-weight-bold text-dark">${f.carName || 'General'}</td>
            <td>
                <div class="small font-weight-bold">${f.reporterName || 'Usuario'}</div>
                <small class="text-muted">${f.reporterPhone || ''}</small>
            </td>
            <td class="small">
                <strong class="text-danger">${f.subject || 'Novedad'}</strong><br>
                <span class="text-muted">${f.message || ''}</span>
            </td>
            <td>
                <span class="badge ${badgeCls} px-2 py-1">${st}</span>
            </td>
            <td>
                <div class="btn-group btn-group-sm flex-wrap">
                    <button type="button" class="btn btn-outline-success" title="Avisar al propietario con el asunto del reporte" onclick="openOwnerAlertModal('${f.carId || ''}', '${f.id}')"><i class="fab fa-whatsapp"></i> Avisar Dueño</button>
                    ${st === 'Pendiente' ? `<button type="button" class="btn btn-outline-info" title="Marcar En Seguimiento" onclick="updateFeedbackStatusAdmin('${f.id}', 'En Seguimiento')"><i class="fa fa-eye"></i></button>` : ''}
                    ${st !== 'Resuelto' ? `<button type="button" class="btn btn-outline-primary" title="Marcar Resuelto (mover a Resueltos)" onclick="updateFeedbackStatusAdmin('${f.id}', 'Resuelto')"><i class="fa fa-check"></i></button>` : ''}
                    ${st === 'Resuelto' ? `<button type="button" class="btn btn-outline-danger" title="Eliminar definitivamente" onclick="deleteFeedbackAdmin('${f.id}')"><i class="fa fa-trash"></i></button>` : ''}
                </div>
            </td>
        </tr>`;
    }).join('');
}

window.updateFeedbackStatusAdmin = function (feedbackId, newStatus) {
    let items = [];
    try { items = JSON.parse(localStorage.getItem('rentcar_feedback')) || []; } catch (e) { items = []; }
    const item = items.find(i => i && i.id === feedbackId);
    if (item) {
        const prev = item.status || 'Pendiente';
        item.status = newStatus;
        localStorage.setItem('rentcar_feedback', JSON.stringify(items));
        if (typeof dbResolveFeedback === 'function') dbResolveFeedback(feedbackId, newStatus);
        recordAdminLog('Feedback', `Estado cambiado a ${newStatus}`, `${item.carName || ''} - ${item.subject || ''}`, [{ field: `Reporte: ${item.subject}`, before: prev, after: newStatus }]);
        renderFeedbackAndAlertsAdmin();
        renderFinancialOverview();
        notifySaved(`Reporte actualizado a estado: ${newStatus}.`);
    }
};

window.deleteFeedbackAdmin = function (feedbackId) {
    const doDelete = function () {
        let items = [];
        try { items = JSON.parse(localStorage.getItem('rentcar_feedback')) || []; } catch (e) { items = []; }
        const removed = items.find(i => i && i.id === feedbackId);
        items = items.filter(i => i && i.id !== feedbackId);
        localStorage.setItem('rentcar_feedback', JSON.stringify(items));
        if (typeof dbDeleteFeedback === 'function') dbDeleteFeedback(feedbackId);
        if (removed) recordAdminLog('Feedback', 'Reporte eliminado', `${removed.carName || ''} - ${removed.subject || ''}`, [{ field: `Reporte (${removed.carName || 'General'})`, before: `${removed.subject}: ${removed.message}`, after: '(Eliminado)' }]);
        renderFeedbackAndAlertsAdmin();
        renderFinancialOverview();
        notifySaved('Reporte eliminado del historial.');
    };
    if (typeof window.openAppConfirmModal === 'function') {
        window.openAppConfirmModal({ title: 'Eliminar reporte', message: '¿Eliminar permanentemente este reporte resuelto?', confirmText: 'Eliminar', onConfirm: doDelete });
    } else {
        doDelete();
    }
};

/** ================= MÓDULO 9: LOGS Y AUDITORÍA DEL SISTEMA ================= **/
function renderAuditLogsAdmin() {
    const tbody = document.getElementById('audit-logs-list');
    if (!tbody) return;

    let logs = [];
    try { logs = JSON.parse(localStorage.getItem('rentcar_audit_logs')) || []; } catch (e) { logs = []; }

    const q = (document.getElementById('logs-search-input')?.value || '').trim().toLowerCase();
    const mod = document.getElementById('logs-module-filter')?.value || 'all';
    const dFrom = document.getElementById('logs-date-from')?.value || '';
    const dTo = document.getElementById('logs-date-to')?.value || '';

    const filtered = logs.filter(l => {
        if (!l) return false;
        if (mod !== 'all' && l.modulo !== mod) return false;
        if (q) {
            const hay = `${l.usuario || ''} ${l.modulo || ''} ${l.accion || ''} ${l.detalle || ''}`.toLowerCase();
            if (!hay.includes(q)) return false;
        }
        if (dFrom && l.creado_en && l.creado_en.slice(0, 10) < dFrom) return false;
        if (dTo && l.creado_en && l.creado_en.slice(0, 10) > dTo) return false;
        return true;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No hay registros de auditoría que coincidan con el filtro.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.slice(0, 200).map(l => {
        const dt = l.creado_en ? new Date(l.creado_en).toLocaleString('es-CO') : '';
        const hasDiff = Array.isArray(l.detalle_cambios) && l.detalle_cambios.length > 0;
        return `
            <tr style="cursor: pointer;" onclick="openAuditLogDetail('${l.id}')" title="Clic para ver detalle completo">
                <td class="small text-muted" style="white-space: nowrap;">${dt}</td>
                <td class="small">
                    <strong class="text-dark">${l.usuario || 'Sistema'}</strong>
                    <span class="badge badge-light border ml-1 text-uppercase" style="font-size: 10px;">${l.rol || ''}</span>
                </td>
                <td><span class="badge badge-primary px-2 py-1">${l.modulo || 'Sistema'}</span></td>
                <td class="small font-weight-bold text-dark">
                    ${l.accion || ''}
                    ${hasDiff ? `<span class="badge badge-warning text-dark ml-1"><i class="fa fa-exchange-alt mr-1"></i>Antes / Después</span>` : ''}
                </td>
                <td class="small text-muted">
                    ${l.detalle || ''}
                    <span class="text-primary font-weight-bold ml-1"><i class="fa fa-search-plus"></i></span>
                </td>
            </tr>
        `;
    }).join('');
}

function escapeHtmlSafe(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function buildWordDiffHtml(beforeStr, afterStr) {
    const a = String(beforeStr || '').split(/(\s+)/);
    const b = String(afterStr || '').split(/(\s+)/);

    // Si son textos muy extensos (>350 tokens), comparar directo por bloque para máxima fluidez
    if (a.length > 350 || b.length > 350) {
        return {
            beforeHtml: `<del style="background:#FEE2E2; color:#991B1B; text-decoration:line-through; padding:2px 4px; border-radius:3px;">${escapeHtmlSafe(beforeStr || '(Vacío)')}</del>`,
            afterHtml: `<ins style="background:#BBF7D0; color:#065F46; text-decoration:none; font-weight:600; padding:2px 4px; border-radius:3px;">${escapeHtmlSafe(afterStr || '(Vacío)')}</ins>`
        };
    }

    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));
    for (let i = m - 1; i >= 0; i--) {
        for (let j = n - 1; j >= 0; j--) {
            dp[i][j] = (a[i] === b[j]) ? (dp[i + 1][j + 1] + 1) : Math.max(dp[i + 1][j], dp[i][j + 1]);
        }
    }

    let beforeParts = [];
    let afterParts = [];
    let i = 0, j = 0;
    while (i < m && j < n) {
        if (a[i] === b[j]) {
            const esc = escapeHtmlSafe(a[i]);
            beforeParts.push(esc);
            afterParts.push(esc);
            i++; j++;
        } else if (dp[i + 1][j] >= dp[i][j + 1]) {
            const tok = escapeHtmlSafe(a[i]);
            beforeParts.push(a[i].trim() ? `<del style="background:#FEE2E2; color:#991B1B; text-decoration:line-through; padding:0 2px; border-radius:2px;">${tok}</del>` : tok);
            i++;
        } else {
            const tok = escapeHtmlSafe(b[j]);
            afterParts.push(b[j].trim() ? `<ins style="background:#BBF7D0; color:#065F46; text-decoration:none; font-weight:600; padding:0 2px; border-radius:2px;">${tok}</ins>` : tok);
            j++;
        }
    }
    while (i < m) {
        const tok = escapeHtmlSafe(a[i]);
        beforeParts.push(a[i].trim() ? `<del style="background:#FEE2E2; color:#991B1B; text-decoration:line-through; padding:0 2px; border-radius:2px;">${tok}</del>` : tok);
        i++;
    }
    while (j < n) {
        const tok = escapeHtmlSafe(b[j]);
        afterParts.push(b[j].trim() ? `<ins style="background:#BBF7D0; color:#065F46; text-decoration:none; font-weight:600; padding:0 2px; border-radius:2px;">${tok}</ins>` : tok);
        j++;
    }

    return {
        beforeHtml: beforeParts.join('') || '<span class="text-muted font-italic">(Vacío)</span>',
        afterHtml: afterParts.join('') || '<span class="text-muted font-italic">(Vacío)</span>'
    };
}

window.openAuditLogDetail = function (logId) {
    let logs = [];
    try { logs = JSON.parse(localStorage.getItem('rentcar_audit_logs')) || []; } catch (e) { logs = []; }
    const l = logs.find(item => item && String(item.id) === String(logId));
    if (!l) return;

    const dt = l.creado_en ? new Date(l.creado_en).toLocaleString('es-CO') : '';
    document.getElementById('log-detail-meta').innerText = `${dt} • ${l.usuario || 'Sistema'} (${l.rol || ''})`;
    document.getElementById('log-detail-module').innerText = l.modulo || 'Sistema';
    document.getElementById('log-detail-action').innerText = l.accion || '';
    document.getElementById('log-detail-summary').innerText = l.detalle || 'Sin descripción adicional.';

    const container = document.getElementById('log-detail-diff-container');
    if (Array.isArray(l.detalle_cambios) && l.detalle_cambios.length > 0) {
        container.innerHTML = l.detalle_cambios.map(c => {
            const diff = buildWordDiffHtml(c.before, c.after);
            return `
                <div class="card border mb-3">
                    <div class="card-header bg-light py-2 font-weight-bold small text-dark">
                        <i class="fa fa-edit text-primary mr-1"></i> ${escapeHtmlSafe(c.field)}
                    </div>
                    <div class="card-body p-3">
                        <div class="mb-2">
                            <span class="badge badge-danger mb-1">Texto Original (Antes)</span>
                            <div class="p-2 rounded border small" style="background: #FEF2F2; color: #7F1D1D; white-space: pre-wrap; line-height: 1.6;">${diff.beforeHtml}</div>
                        </div>
                        <div>
                            <span class="badge badge-success mb-1">Texto Nuevo (Después)</span>
                            <div class="p-2 rounded border small" style="background: #ECFDF5; color: #064E3B; white-space: pre-wrap; line-height: 1.6;">${diff.afterHtml}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        container.innerHTML = `<div class="text-muted small text-center py-2">Este evento no modificó campos de texto.</div>`;
    }

    $('#modalAuditLogDetail').modal('show');
};

window.clearLogsFilters = function () {
    setVal('logs-search-input', '');
    setVal('logs-module-filter', 'all');
    setVal('logs-date-from', '');
    setVal('logs-date-to', '');
    renderAuditLogsAdmin();
};

// Sincronización en vivo de alertas y pendientes cuando llegan desde otras pestañas
window.addEventListener('storage', function (e) {
    if (e.key === 'rentcar_feedback' || e.key === 'renteasy_cars' || e.key === 'renteasy_bookings' || e.key === 'rentcar_audit_logs') {
        renderFinancialOverview();
        renderFleetModeration(document.getElementById('fleet-filter-status')?.value || 'all');
        renderBookingsAndDisputes();
        renderFeedbackAndAlertsAdmin();
        renderAuditLogsAdmin();
    }
});

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

    syncFinancialLabels();
}

function syncFinancialLabels() {
    const cfg = getSiteConfig();
    const payments = cfg.payments || {};
    const comm = (payments.commissionPercent !== undefined && payments.commissionPercent !== '') ? Number(payments.commissionPercent) : 15;
    const ownerPct = Math.max(0, 100 - comm);
    const deposit = (payments.defaultDeposit !== undefined && payments.defaultDeposit !== '') ? Number(payments.defaultDeposit) : 200000;

    setElemText('label-platform-commission', `Ingresos Plataforma (${comm}%)`);
    setElemText('label-owner-payout-pct', `Liquidaciones a Dueños (${ownerPct}%)`);

    const commTitle = document.getElementById('overview-commission-title');
    if (commTitle) {
        commTitle.innerHTML = `<i class="fa fa-check-circle text-success mr-2"></i>Comisión Automática del ${comm}%`;
    }
    const commDesc = document.getElementById('overview-commission-desc');
    if (commDesc) {
        commDesc.innerText = `Cada vez que un cliente reserva, la plataforma retiene el ${comm}% de comisión de servicio y dispersa el ${ownerPct}% al anfitrión.`;
    }
    const depTitle = document.getElementById('overview-deposit-title');
    if (depTitle) {
        depTitle.innerHTML = `<i class="fa fa-lock text-warning mr-2"></i>Custodia de Fianza ($${formatCop(deposit)})`;
    }
    const bookingsBadge = document.getElementById('bookings-standard-deposit-badge');
    if (bookingsBadge) {
        bookingsBadge.innerHTML = `<i class="fa fa-shield-alt mr-1"></i> Fianza Estándar: $${formatCop(deposit)} COP`;
    }
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
    renderCommunityTestimonialsAdmin();
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
        const doDelete = function () {
            cfg.cms.slides.splice(idx, 1);
            saveSiteConfig(cfg);
            renderHeroSlidesAdmin();
            notifySaved(`Diapositiva #${idx+1} eliminada.`);
        };
        if (typeof window.openAppConfirmModal === 'function') {
            window.openAppConfirmModal({ title: 'Eliminar diapositiva', message: `¿Deseas eliminar la diapositiva #${idx+1}?`, confirmText: 'Eliminar', onConfirm: doDelete });
        } else {
            doDelete();
        }
    }
};

function getFaqsAdminList() {
    const synced = localStorage.getItem('rentcar_supabase_faqs_synced') === '1';
    try {
        const stored = JSON.parse(localStorage.getItem('rentcar_faqs_db'));
        if (Array.isArray(stored) && (stored.length > 0 || synced)) {
            return stored;
        }
    } catch (e) { }
    const cfg = getSiteConfig();
    return (cfg.cms && Array.isArray(cfg.cms.faqs)) ? cfg.cms.faqs.map(f => ({
        q: f.q, a: f.a, category: f.category || 'General', visible: f.visible !== false
    })) : [];
}

function saveFaqsAdminList(list) {
    localStorage.setItem('rentcar_faqs_db', JSON.stringify(list));
    if (typeof window.broadcastLiveSync === 'function') window.broadcastLiveSync('faqs_updated');
}

function renderFaqList(faqsOverride) {
    const container = document.getElementById('faq-accordion-list');
    if (!container) return;

    const faqs = Array.isArray(faqsOverride) && localStorage.getItem('rentcar_faqs_db') === null
        ? faqsOverride
        : getFaqsAdminList();

    if (!faqs || faqs.length === 0) {
        container.innerHTML = '<div class="text-center py-3 text-muted small">No hay preguntas frecuentes registradas.</div>';
        return;
    }

    container.innerHTML = faqs.map((f, idx) => {
        const isVis = f.visible !== false;
        const cat = f.category || 'General';
        return `
        <div class="card border mb-2 rounded ${isVis ? '' : 'bg-light'}">
            <div class="card-header bg-light py-2 d-flex justify-content-between align-items-center flex-wrap" style="gap: 8px;">
                <div class="d-flex align-items-center">
                    <span class="badge badge-info mr-2">${cat}</span>
                    <span class="font-weight-bold text-dark small"><i class="fa fa-question-circle text-primary mr-1"></i>${f.q}</span>
                </div>
                <div class="d-flex align-items-center" style="gap: 6px;">
                    <span class="badge ${isVis ? 'badge-success' : 'badge-secondary'}">${isVis ? 'Visible' : 'Oculta'}</span>
                    <button type="button" class="btn btn-sm ${isVis ? 'btn-outline-secondary' : 'btn-outline-success'} py-0 px-2" onclick="toggleFaqVisibility(${idx})" title="${isVis ? 'Ocultar de la web' : 'Mostrar en la web'}">
                        <i class="fa ${isVis ? 'fa-eye-slash' : 'fa-eye'}"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-primary py-0 px-2" onclick="openEditFaqModal(${idx})" title="Editar pregunta y respuesta">
                        <i class="fa fa-edit"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger py-0 px-2" onclick="deleteFaq(${idx})" title="Eliminar FAQ">
                        <i class="fa fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="card-body py-2 small text-muted">${f.a}</div>
        </div>`;
    }).join('');
}

window.toggleFaqVisibility = async function (idx) {
    const list = getFaqsAdminList();
    if (!list[idx]) return;
    const prev = list[idx].visible !== false;
    list[idx].visible = !prev;
    saveFaqsAdminList(list);
    if (typeof dbUpdateFaq === 'function' && list[idx].id) {
        await dbUpdateFaq(list[idx]);
    }
    recordAdminLog('CMS', list[idx].visible ? 'FAQ activada en portada' : 'FAQ oculta en portada', list[idx].q, [
        { field: `FAQ: ${list[idx].q}`, before: prev ? 'Visible' : 'Oculta', after: list[idx].visible ? 'Visible' : 'Oculta' }
    ]);
    renderFaqList();
    notifySaved(list[idx].visible ? 'Pregunta frecuente visible en la web.' : 'Pregunta frecuente oculta de la web.');
};

window.openEditFaqModal = function (idx) {
    const list = getFaqsAdminList();
    const faq = list[idx];
    if (!faq) return;

    let modalEl = document.getElementById('modalAdminEditFaq');
    if (!modalEl) {
        const wrap = document.createElement('div');
        wrap.innerHTML = `
            <div class="modal fade" id="modalAdminEditFaq" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered" role="document">
                    <div class="modal-content border-0 shadow-lg" style="border-radius: 12px; overflow: hidden;">
                        <div class="modal-header text-white" style="background: #1C1E32;">
                            <h5 class="modal-title font-weight-bold text-white"><i class="fa fa-edit text-primary mr-2"></i>Editar Pregunta Frecuente</h5>
                            <button type="button" class="close text-white" data-dismiss="modal" aria-label="Cerrar"><span aria-hidden="true">&times;</span></button>
                        </div>
                        <form id="form-admin-edit-faq">
                            <div class="modal-body p-4">
                                <input type="hidden" id="edit-faq-idx">
                                <div class="form-group">
                                    <label class="small font-weight-bold">Categoría</label>
                                    <select id="edit-faq-category" class="form-control form-control-sm">
                                        <option value="Conductores">Conductores</option>
                                        <option value="Propietarios">Propietarios</option>
                                        <option value="Pagos y Garantía">Pagos y Garantía</option>
                                        <option value="Seguridad">Seguridad</option>
                                        <option value="General">General</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="small font-weight-bold">Pregunta *</label>
                                    <input type="text" id="edit-faq-q" class="form-control" required>
                                </div>
                                <div class="form-group">
                                    <label class="small font-weight-bold">Respuesta *</label>
                                    <textarea id="edit-faq-a" class="form-control" rows="4" required></textarea>
                                </div>
                                <div class="custom-control custom-switch">
                                    <input type="checkbox" class="custom-control-input" id="edit-faq-visible">
                                    <label class="custom-control-label small font-weight-bold" for="edit-faq-visible">Mostrar en el sitio web</label>
                                </div>
                            </div>
                            <div class="modal-footer bg-light">
                                <button type="button" class="btn btn-secondary btn-sm" data-dismiss="modal">Cancelar</button>
                                <button type="submit" class="btn btn-primary btn-sm font-weight-bold px-4"><i class="fa fa-save mr-1"></i> Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(wrap.firstElementChild);
        modalEl = document.getElementById('modalAdminEditFaq');

        document.getElementById('form-admin-edit-faq').addEventListener('submit', async function (e) {
            e.preventDefault();
            const i = parseInt(document.getElementById('edit-faq-idx').value, 10);
            const curr = getFaqsAdminList();
            if (!curr[i]) return;

            const oldItem = { ...curr[i] };
            const newQ = document.getElementById('edit-faq-q').value.trim();
            const newA = document.getElementById('edit-faq-a').value.trim();
            const newCat = document.getElementById('edit-faq-category').value;
            const newVis = document.getElementById('edit-faq-visible').checked;
            if (!newQ || !newA) return;

            curr[i].q = newQ;
            curr[i].a = newA;
            curr[i].category = newCat;
            curr[i].visible = newVis;
            saveFaqsAdminList(curr);

            if (typeof dbUpdateFaq === 'function' && curr[i].id) {
                await dbUpdateFaq(curr[i]);
            }

            const diffs = [];
            if (oldItem.q !== newQ) diffs.push({ field: 'Pregunta FAQ', before: oldItem.q, after: newQ });
            if (oldItem.a !== newA) diffs.push({ field: 'Respuesta FAQ', before: oldItem.a, after: newA });
            if ((oldItem.category || 'General') !== newCat) diffs.push({ field: 'Categoría FAQ', before: oldItem.category || 'General', after: newCat });
            if ((oldItem.visible !== false) !== newVis) diffs.push({ field: 'Visibilidad FAQ', before: oldItem.visible !== false ? 'Visible' : 'Oculta', after: newVis ? 'Visible' : 'Oculta' });
            if (diffs.length > 0) {
                recordAdminLog('CMS', 'Pregunta frecuente editada', newQ, diffs);
            }

            $('#modalAdminEditFaq').modal('hide');
            renderFaqList();
            notifySaved('Pregunta frecuente actualizada en la base de datos.');
        });
    }

    document.getElementById('edit-faq-idx').value = String(idx);
    document.getElementById('edit-faq-category').value = faq.category || 'General';
    document.getElementById('edit-faq-q').value = faq.q || '';
    document.getElementById('edit-faq-a').value = faq.a || '';
    document.getElementById('edit-faq-visible').checked = (faq.visible !== false);
    $('#modalAdminEditFaq').modal('show');
};

window.deleteFaq = function (idx) {
    const list = getFaqsAdminList();
    const target = list[idx];
    if (!target) return;
    const doDelete = async function () {
        const curr = getFaqsAdminList();
        const removed = curr.splice(idx, 1)[0];
        saveFaqsAdminList(curr);
        if (typeof dbDeleteFaq === 'function' && removed && removed.id) {
            await dbDeleteFaq(removed.id);
        }
        if (removed) {
            recordAdminLog('CMS', 'Pregunta frecuente eliminada', removed.q, [
                { field: 'Pregunta frecuente', before: removed.q, after: '(Eliminada)' }
            ]);
        }
        renderFaqList();
        notifySaved('Pregunta frecuente eliminada.');
    };
    if (typeof window.openAppConfirmModal === 'function') {
        window.openAppConfirmModal({ title: 'Eliminar pregunta frecuente', message: `¿Deseas eliminar la pregunta "${target.q}"?`, confirmText: 'Eliminar', onConfirm: doDelete });
    } else {
        doDelete();
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
        const doDelete = function () {
            cfg.team.splice(idx, 1);
            saveSiteConfig(cfg);
            renderTeamListAdmin();
            notifySaved(`Integrante "${name}" eliminado del equipo.`);
        };
        if (typeof window.openAppConfirmModal === 'function') {
            window.openAppConfirmModal({ title: 'Eliminar integrante', message: `¿Deseas eliminar a "${name}" del equipo?`, confirmText: 'Eliminar', onConfirm: doDelete });
        } else {
            doDelete();
        }
    }
};

/** ================= MODERACIÓN DE RESEÑAS REALES (CERO RESEÑAS FALSAS) ================= **/
function getVerifiedReviews() {
    try {
        const stored = localStorage.getItem('rentcar_verified_reviews');
        if (stored) {
            return JSON.parse(stored) || [];
        }
    } catch (e) {
        console.error("Error al cargar reseñas:", e);
    }
    return [];
}

function getCommunityTestimonials() {
    try {
        return JSON.parse(localStorage.getItem('rentcar_community_testimonials')) || [];
    } catch (e) {
        return [];
    }
}

function saveCommunityTestimonials(list) {
    localStorage.setItem('rentcar_community_testimonials', JSON.stringify(list));
    if (typeof window.broadcastLiveSync === 'function') window.broadcastLiveSync('testimonials_updated');
}

function renderCommunityTestimonialsAdmin() {
    const container = document.getElementById('community-testimonials-admin-list');
    if (!container) return;

    const list = getCommunityTestimonials();
    if (list.length === 0) {
        container.innerHTML = '<div class="text-center py-3 text-muted small border rounded bg-light"><i class="fa fa-comment-slash mr-1"></i> No hay testimonios de comunidad en la base de datos.</div>';
        return;
    }

    container.innerHTML = list.map((t, idx) => {
        const tName = t.name || t.authorName || 'Usuario';
        const tRole = t.roleOrCity || t.authorRole || 'Comunidad';
        const tPhoto = t.photo || t.avatar || 'img/testimonial-1.jpg';
        const tText = t.text || t.quote || '';
        return `
        <div class="p-3 border rounded mb-2 bg-white shadow-sm">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <div class="d-flex align-items-center">
                    <img src="${tPhoto}" alt="${tName}" class="rounded-circle mr-2" style="width:38px;height:38px;object-fit:cover;" onerror="this.src='img/testimonial-1.jpg'">
                    <div>
                        <div class="font-weight-bold text-dark">${tName} <span class="badge badge-light border text-muted">${tRole}</span></div>
                    </div>
                </div>
                <span class="badge ${t.verified !== false ? 'badge-success' : 'badge-secondary'} px-2 py-1">
                    ${t.verified !== false ? '<i class="fa fa-check-circle mr-1"></i> Visible en Portada' : '<i class="fa fa-eye-slash mr-1"></i> Oculto'}
                </span>
            </div>
            <p class="small text-dark font-italic bg-light p-2 rounded mb-2 border">"${tText}"</p>
            <div class="d-flex justify-content-end">
                <button type="button" class="btn btn-sm ${t.verified !== false ? 'btn-outline-secondary' : 'btn-outline-success'} mr-2" onclick="toggleTestimonialVerified(${idx})">
                    <i class="fa ${t.verified !== false ? 'fa-eye-slash' : 'fa-check'} mr-1"></i> ${t.verified !== false ? 'Ocultar de Portada' : 'Mostrar en Portada'}
                </button>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="deleteTestimonialAdmin(${idx})" title="Eliminar testimonio">
                    <i class="fa fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    }).join('');
}

window.toggleTestimonialVerified = function (idx) {
    const list = getCommunityTestimonials();
    if (!list[idx]) return;
    list[idx].verified = !(list[idx].verified !== false);
    saveCommunityTestimonials(list);
    if (typeof dbUpdateTestimonioVerified === 'function' && list[idx].id) {
        dbUpdateTestimonioVerified(list[idx].id, list[idx].verified);
    }
    const tName = list[idx].name || list[idx].authorName || 'Usuario';
    const tRole = list[idx].roleOrCity || list[idx].authorRole || '';
    if (typeof window.logSystemEvent === 'function') {
        window.logSystemEvent('Testimonios', list[idx].verified ? 'Testimonio activado en portada' : 'Testimonio oculto en portada', `${tName} (${tRole})`);
    }
    renderCommunityTestimonialsAdmin();
    renderAuditLogsAdmin();
    notifySaved(list[idx].verified ? 'Testimonio visible en portada.' : 'Testimonio oculto de portada.');
};

window.deleteTestimonialAdmin = function (idx) {
    const list = getCommunityTestimonials();
    if (!list[idx]) return;
    const tName = list[idx].name || list[idx].authorName || 'Usuario';
    const tText = list[idx].text || list[idx].quote || '';
    const doDelete = function () {
        const curr = getCommunityTestimonials();
        const target = curr[idx];
        if (!target) return;
        curr.splice(idx, 1);
        saveCommunityTestimonials(curr);
        if (typeof dbDeleteTestimonio === 'function' && target.id) {
            dbDeleteTestimonio(target.id);
        }
        if (typeof window.logSystemEvent === 'function') {
            window.logSystemEvent('Testimonios', 'Testimonio de comunidad eliminado', `${tName} — "${tText.slice(0, 60)}"`);
        }
        renderCommunityTestimonialsAdmin();
        renderAuditLogsAdmin();
        notifySaved('Testimonio eliminado de la base de datos.');
    };
    if (typeof window.openAppConfirmModal === 'function') {
        window.openAppConfirmModal({ title: 'Eliminar testimonio', message: `¿Deseas eliminar el testimonio de comunidad de "${tName}"?`, confirmText: 'Eliminar', onConfirm: doDelete });
    } else {
        doDelete();
    }
};

function saveVerifiedReviews(reviews) {
    localStorage.setItem('rentcar_verified_reviews', JSON.stringify(reviews));
    if (typeof window.broadcastLiveSync === 'function') window.broadcastLiveSync('reviews_updated');
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
        if (typeof dbUpdateResenaApproval === 'function' && reviews[idx].id) {
            dbUpdateResenaApproval(reviews[idx].id, reviews[idx].approved);
        }
        if (typeof window.logSystemEvent === 'function') {
            window.logSystemEvent('Reseñas', reviews[idx].approved ? 'Reseña aprobada' : 'Reseña oculta', `${reviews[idx].userName} — ${reviews[idx].carRented || ''}`);
        }
        renderVerifiedReviewsModeration();
        renderAuditLogsAdmin();
        notifySaved(reviews[idx].approved ? 'Reseña aprobada y visible en el sitio web.' : 'Reseña oculta de la web.');
    }
};

window.deleteReviewAdmin = function(idx) {
    const reviews = getVerifiedReviews();
    if (!reviews[idx]) return;
    const targetName = reviews[idx].userName;
    const doDelete = function () {
        const curr = getVerifiedReviews();
        const target = curr[idx];
        if (!target) return;
        curr.splice(idx, 1);
        saveVerifiedReviews(curr);
        if (typeof dbDeleteResena === 'function' && target.id) {
            dbDeleteResena(target.id);
        }
        if (typeof window.logSystemEvent === 'function') {
            window.logSystemEvent('Reseñas', 'Reseña eliminada', `${target.userName} — ${target.carRented || ''}`);
        }
        renderVerifiedReviewsModeration();
        renderAuditLogsAdmin();
        notifySaved('Reseña eliminada.');
    };
    if (typeof window.openAppConfirmModal === 'function') {
        window.openAppConfirmModal({ title: 'Eliminar reseña', message: `¿Deseas eliminar la opinión de "${targetName}"?`, confirmText: 'Eliminar', onConfirm: doDelete });
    } else {
        doDelete();
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

window.deleteInquiryAdmin = function (index) {
    const doDelete = function () {
        let inquiries = [];
        try {
            inquiries = JSON.parse(localStorage.getItem('renteasy_inquiries')) || [];
        } catch (e) { inquiries = []; }
        const removed = inquiries[index];
        inquiries.splice(index, 1);
        localStorage.setItem('renteasy_inquiries', JSON.stringify(inquiries));
        if (typeof dbDeleteMensajeContacto === 'function' && removed && removed.id) {
            dbDeleteMensajeContacto(removed.id);
        }
        if (typeof window.logSystemEvent === 'function' && removed) {
            window.logSystemEvent('Contacto', 'Mensaje de contacto eliminado', `${removed.name} (${removed.email})`);
        }
        renderInquiriesAdmin();
        renderAuditLogsAdmin();
        notifySaved('Consulta eliminada del buzón.');
    };
    if (typeof window.openAppConfirmModal === 'function') {
        window.openAppConfirmModal({ title: 'Eliminar consulta', message: '¿Eliminar esta consulta del buzón?', confirmText: 'Eliminar', onConfirm: doDelete });
    } else {
        doDelete();
    }
};

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

            const parsedComm = parseFloat(getVal('pay-commission'));
            const parsedDep = parseInt(getVal('pay-deposit').replace(/\D/g, ''), 10);

            cfg.payments = {
                commissionPercent: !isNaN(parsedComm) ? parsedComm : 15,
                defaultDeposit: !isNaN(parsedDep) ? parsedDep : 200000,
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
            loadPaymentsConfig();
            syncFinancialLabels();
            renderFinancialOverview();
            renderBookingsAndDisputes();
            notifySaved(`¡Parámetros actualizados! Fianza estándar: $${formatCop(cfg.payments.defaultDeposit)} COP | Comisión: ${cfg.payments.commissionPercent}%`);
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
            recordAdminLog('CMS', 'Diapositiva añadida al carrusel', title);
            notifySaved('¡Nueva diapositiva añadida al carrusel con éxito!');
        });
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
        formAddFaq.addEventListener('submit', async function (e) {
            e.preventDefault();
            const question = document.getElementById('new-faq-q').value.trim();
            const answer = document.getElementById('new-faq-a').value.trim();
            const categoryEl = document.getElementById('new-faq-category');
            const category = categoryEl ? categoryEl.value : 'General';
            if (!question || !answer) return;

            const list = getFaqsAdminList();
            let newFaq = { q: question, a: answer, category: category, order: list.length + 1, visible: true };
            if (typeof dbSaveFaq === 'function') {
                newFaq = await dbSaveFaq(newFaq);
            }
            list.push(newFaq);
            saveFaqsAdminList(list);
            renderFaqList();
            formAddFaq.reset();
            recordAdminLog('CMS', 'Pregunta frecuente añadida', question, [
                { field: `Nueva FAQ (${category})`, before: '(Sin registro)', after: `${question} — ${answer}` }
            ]);
            notifySaved('Nueva pregunta frecuente guardada en la base de datos.');
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
            recordAdminLog('CMS', 'Integrante añadido al equipo', `${name} (${role})`);
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

    // 6. Formulario de Sugerencia de Tarifa al Propietario
    const formSuggestPrice = document.getElementById('form-suggest-price');
    if (formSuggestPrice) {
        formSuggestPrice.addEventListener('submit', function (e) {
            e.preventDefault();
            const carId = document.getElementById('sp-car-id').value;
            const suggestedPrice = parseInt(document.getElementById('sp-suggested-price').value, 10);
            const note = document.getElementById('sp-note').value.trim();

            const cars = getCars();
            const car = cars.find(c => c.id === carId);
            if (!car || !suggestedPrice) return;

            car.status = 'Ajuste de Tarifa';
            car.priceNegotiation = {
                status: 'admin_proposed',
                originalPrice: car.pricePerDay,
                suggestedPrice: suggestedPrice,
                adminNote: note,
                updatedAt: new Date().toISOString()
            };
            saveCars(cars);
            if (typeof dbUpdateVehiculoFields === 'function') {
                dbUpdateVehiculoFields(carId, { estado: 'Ajuste de Tarifa', negociacion_tarifa: car.priceNegotiation });
            }
            if (typeof window.logSystemEvent === 'function') {
                window.logSystemEvent('Tarifas', 'Sugerencia de tarifa enviada', `${car.fullName} — $${suggestedPrice}/día`);
            }
            renderAuditLogsAdmin();
            renderFleetModeration(document.getElementById('fleet-filter-status')?.value || 'all');
            renderFinancialOverview();

            const owner = getOwnerContactInfo(car);
            const panelUrl = `${window.location.origin}${window.location.pathname.replace('admin.html', 'dashboard-propietario.html')}`;
            const waMsg = `Hola ${owner.name}, te saludamos de *Rent Car Colombia*. Revisamos tu *${car.fullName}* y te enviamos una sugerencia de tarifa diaria de *$${formatCop(suggestedPrice)} COP* (${note}). Puedes aceptarla o enviarnos una contraoferta aquí: ${panelUrl}`;
            document.getElementById('sp-wa-btn').href = `https://wa.me/${owner.waPhone}?text=${encodeURIComponent(waMsg)}`;
            document.getElementById('sp-mail-btn').href = owner.email
                ? `mailto:${owner.email}?subject=${encodeURIComponent('Sugerencia de tarifa para tu ' + car.fullName)}&body=${encodeURIComponent(waMsg)}`
                : '#';
            document.getElementById('sp-notify-actions').style.display = 'block';
            notifySaved('Propuesta de tarifa enviada al panel del propietario.');
        });
    }

    // 7. Formulario de Alerta / Feedback Directo al Propietario
    const oaSubjSelect = document.getElementById('oa-subject-select');
    const oaSubjCustom = document.getElementById('oa-subject-custom');
    if (oaSubjSelect && oaSubjCustom) {
        oaSubjSelect.addEventListener('change', function () {
            oaSubjCustom.style.display = this.value === '__custom__' ? 'block' : 'none';
            if (this.value === '__custom__') oaSubjCustom.focus();
        });
    }

    const formOwnerAlert = document.getElementById('form-owner-alert');
    if (formOwnerAlert) {
        formOwnerAlert.addEventListener('submit', function (e) {
            e.preventDefault();
            const carId = document.getElementById('oa-car-select').value;
            const selVal = document.getElementById('oa-subject-select').value;
            const customVal = document.getElementById('oa-subject-custom').value.trim();
            const subject = selVal === '__custom__' ? customVal : selVal;
            const message = document.getElementById('oa-message').value.trim();

            const cars = getCars();
            const car = cars.find(c => c.id === carId);
            if (!car || !subject || !message) {
                alert('Por favor completa el asunto y el mensaje para el propietario.');
                return;
            }

            let alerts = [];
            try { alerts = JSON.parse(localStorage.getItem('rentcar_owner_alerts')) || []; } catch (err) { alerts = []; }
            const newAlert = {
                id: 'alert_' + Date.now(),
                ownerId: car.ownerId,
                carId: car.id,
                carName: car.fullName,
                subject: subject,
                message: message,
                read: false,
                createdAt: new Date().toISOString()
            };
            if (typeof dbSaveOwnerAlert === 'function') {
                dbSaveOwnerAlert(newAlert);
            }
            alerts.unshift(newAlert);
            localStorage.setItem('rentcar_owner_alerts', JSON.stringify(alerts));
            if (typeof window.broadcastLiveSync === 'function') window.broadcastLiveSync('owner_alert');
            if (typeof window.logSystemEvent === 'function') window.logSystemEvent('Alertas', 'Alerta enviada al propietario', `${car.fullName} — ${subject}`);
            renderAuditLogsAdmin();

            const owner = getOwnerContactInfo(car);
            const panelUrl = `${window.location.origin}${window.location.pathname.replace('admin.html', 'dashboard-propietario.html')}`;
            const waMsg = `Hola ${owner.name}, mensaje de administración de *Rent Car Colombia* sobre tu *${car.fullName}* (${subject}): ${message}. Revisa tu panel: ${panelUrl}`;
            document.getElementById('oa-wa-btn').href = `https://wa.me/${owner.waPhone}?text=${encodeURIComponent(waMsg)}`;
            document.getElementById('oa-mail-btn').href = owner.email
                ? `mailto:${owner.email}?subject=${encodeURIComponent(subject + ' - ' + car.fullName)}&body=${encodeURIComponent(waMsg)}`
                : '#';
            document.getElementById('oa-notify-actions').style.display = 'block';
            notifySaved('Alerta enviada al panel del propietario.');
        });
    }

    // 8. Filtros y Depuración Protegida de Logs de Auditoría
    ['logs-search-input', 'logs-module-filter', 'logs-date-from', 'logs-date-to'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', renderAuditLogsAdmin);
            el.addEventListener('change', renderAuditLogsAdmin);
        }
    });

    const formPurgeLogs = document.getElementById('form-purge-logs');
    if (formPurgeLogs) {
        formPurgeLogs.addEventListener('submit', async function (e) {
            e.preventDefault();
            const dFrom = document.getElementById('purge-date-from').value;
            const dTo = document.getElementById('purge-date-to').value;
            const pwd = document.getElementById('purge-admin-password').value;

            // Validar contraseña contra la cuenta Superadmin registrada
            const users = getUsers();
            const adminAcc = users.find(u => u.role === 'admin' || u.id === 'usr_admin') || { password: 'admin' };
            const validPwd = adminAcc.password || 'admin';

            if (pwd !== validPwd) {
                alert('Contraseña de Superadmin incorrecta. No se eliminó ningún registro.');
                return;
            }

            let logs = [];
            try { logs = JSON.parse(localStorage.getItem('rentcar_audit_logs')) || []; } catch (err) { logs = []; }
            const beforeCount = logs.length;
            logs = logs.filter(l => {
                const day = (l.creado_en || '').slice(0, 10);
                if (!day) return true;
                return day < dFrom || day > dTo;
            });
            const removedCount = beforeCount - logs.length;
            localStorage.setItem('rentcar_audit_logs', JSON.stringify(logs));

            if (typeof dbDeleteAuditLogsByDateRange === 'function') {
                await dbDeleteAuditLogsByDateRange(`${dFrom}T00:00:00.000Z`, `${dTo}T23:59:59.999Z`);
            }
            if (typeof window.logSystemEvent === 'function') {
                await window.logSystemEvent('Auditoría', 'Depuración de logs por fecha', `Eliminados ${removedCount} registros entre ${dFrom} y ${dTo}`);
            }

            formPurgeLogs.reset();
            $('#modalPurgeLogs').modal('hide');
            renderAuditLogsAdmin();
            notifySaved(`Depuración completada: ${removedCount} registros eliminados entre ${dFrom} y ${dTo}.`);
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
    try {
        const raw = JSON.parse(localStorage.getItem('renteasy_cars')) || [];
        const clean = raw.filter(c => c && c.id !== 'car_mod_demo' && c.ownerName !== 'Felipe Daza' && c.ownerId !== 'usr_demo_host_2');
        return clean.length > 0 ? clean : [SINGLE_SAMPLE_CAR];
    } catch (e) {
        return [SINGLE_SAMPLE_CAR];
    }
}
function saveCars(cars) {
    const clean = (cars || []).filter(c => c && c.id !== 'car_mod_demo' && c.ownerName !== 'Felipe Daza' && c.ownerId !== 'usr_demo_host_2');
    localStorage.setItem('renteasy_cars', JSON.stringify(clean.length > 0 ? clean : [SINGLE_SAMPLE_CAR]));
    if (typeof window.broadcastLiveSync === 'function') window.broadcastLiveSync('cars_updated');
}

function getUsers() {
    try {
        const raw = JSON.parse(localStorage.getItem('renteasy_users')) || [];
        return raw.filter(u => u && u.id !== 'usr_demo_host' && u.id !== 'usr_demo_client');
    } catch (e) {
        return [];
    }
}
function saveUsers(users) {
    const clean = (users || []).filter(u => u && u.id !== 'usr_demo_host' && u.id !== 'usr_demo_client');
    localStorage.setItem('renteasy_users', JSON.stringify(clean));
}

function getBookings() {
    try {
        const raw = JSON.parse(localStorage.getItem('renteasy_bookings')) || [];
        return raw.filter(b => b && b.id !== 'book_101' && b.id !== 'book_dispute_demo' && b.renterName !== 'Laura Gómez' && b.renterName !== 'Roberto Silva');
    } catch (e) {
        return [];
    }
}
function saveBookings(bookings) {
    const clean = (bookings || []).filter(b => b && b.id !== 'book_101' && b.id !== 'book_dispute_demo' && b.renterName !== 'Laura Gómez' && b.renterName !== 'Roberto Silva');
    localStorage.setItem('renteasy_bookings', JSON.stringify(clean));
}

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
    // 1. Limpieza rigurosa de vehículos demo: garantiza exactamente 1 auto de ejemplo oficial
    let cars = [];
    try {
        cars = JSON.parse(localStorage.getItem('renteasy_cars')) || [];
    } catch (e) {
        cars = [];
    }
    cars = cars.filter(c => c && c.id !== 'car_mod_demo' && c.ownerName !== 'Felipe Daza' && c.ownerId !== 'usr_demo_host_2');
    if (!Array.isArray(cars) || cars.length === 0) {
        cars = [SINGLE_SAMPLE_CAR];
    }
    saveCars(cars);

    // 2. Limpieza de reservas ficticias: estado limpio para reservas reales de clientes
    let bookings = [];
    try {
        bookings = JSON.parse(localStorage.getItem('renteasy_bookings')) || [];
    } catch (e) {
        bookings = [];
    }
    bookings = bookings.filter(b => b && b.id !== 'book_101' && b.id !== 'book_dispute_demo' && b.renterName !== 'Laura Gómez' && b.renterName !== 'Roberto Silva');
    saveBookings(bookings);

    // 3. Limpieza de usuarios demo
    let users = [];
    try {
        users = JSON.parse(localStorage.getItem('renteasy_users')) || [];
    } catch (e) {
        users = [];
    }
    users = users.filter(u => u && u.id !== 'usr_demo_host' && u.id !== 'usr_demo_client');
    if (!users.some(u => u.role === 'admin' || u.id === 'usr_admin')) {
        users.unshift({
            id: 'usr_admin',
            name: 'Administrador Principal',
            email: 'admin@rentcarcolombia.com',
            phone: '+57 316 235 7871',
            role: 'admin',
            city: 'Valledupar',
            verified: true,
            banned: false
        });
    }
    saveUsers(users);
}

/** ================= NAVEGACIÓN Y ACCESOS RÁPIDOS CONSISTENTES ================= **/
function restoreActiveTab() {
    let targetPillId = null;
    const rawHash = (window.location.hash || '').replace('#', '').trim();
    if (rawHash) {
        const cleanName = rawHash.replace('tab-', '');
        const byHash = document.getElementById(`tab-${cleanName}-pill`);
        if (byHash) targetPillId = `tab-${cleanName}-pill`;
    }
    if (!targetPillId) {
        const savedPill = sessionStorage.getItem('renteasy_admin_active_tab') || localStorage.getItem('renteasy_admin_active_tab');
        if (savedPill && document.getElementById(savedPill)) {
            targetPillId = savedPill;
        }
    }
    if (targetPillId) {
        const pill = document.getElementById(targetPillId);
        if (pill) {
            $(pill).tab('show');
            const h = targetPillId.replace('-pill', '').replace('tab-', '');
            if (history.replaceState) {
                history.replaceState(null, null, `#${h}`);
            }
        }
    }
}

function goToAdminTab(tabId, subAction) {
    const pill = document.getElementById(`${tabId}-pill`);
    if (pill) {
        $(pill).tab('show');
        sessionStorage.setItem('renteasy_admin_active_tab', `${tabId}-pill`);
        localStorage.setItem('renteasy_admin_active_tab', `${tabId}-pill`);
        const hash = tabId.replace('tab-', '');
        if (history.replaceState) {
            history.replaceState(null, null, `#${hash}`);
        } else {
            window.location.hash = hash;
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (typeof subAction === 'function') {
        setTimeout(subAction, 120);
    }
}

function quickAccessFleet(filter = 'En Revision') {
    goToAdminTab('tab-fleet', function () {
        const filterSelect = document.getElementById('fleet-filter-status');
        const cars = getCars();
        const hasPending = cars.some(c => c.status === filter);
        const targetVal = hasPending ? filter : 'all';
        if (filterSelect) {
            filterSelect.value = targetVal;
        }
        renderFleetModeration(targetVal);
        if (!hasPending) {
            notifySaved('No hay vehículos pendientes por revisar. Mostrando flota activa.');
        }
    });
}

function quickAccessUsers() {
    goToAdminTab('tab-users', function () {
        const searchInput = document.getElementById('search-users-input');
        if (searchInput) {
            searchInput.value = '';
            renderUsersManagement('');
        }
    });
}

function quickAccessDisputes() {
    goToAdminTab('tab-bookings', function () {
        renderBookingsAndDisputes();
    });
}

function quickAccessPayments() {
    goToAdminTab('tab-payments', function () {
        loadPaymentsConfig();
    });
}

window.restoreActiveTab = restoreActiveTab;
window.goToAdminTab = goToAdminTab;
window.quickAccessFleet = quickAccessFleet;
window.quickAccessUsers = quickAccessUsers;
window.quickAccessDisputes = quickAccessDisputes;
window.quickAccessPayments = quickAccessPayments;

