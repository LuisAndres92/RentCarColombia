/**
 * Rent-Easy Marketplace - Lógica de Catálogo y Detalle de Vehículos
 * Conecta los vehículos guardados en el almacenamiento local / base de datos
 */

document.addEventListener('DOMContentLoaded', async function () {
    // Sincronizar catálogo con Supabase en la nube si está disponible
    if (typeof dbGetVehiculos === 'function') {
        try {
            await dbGetVehiculos();
        } catch (e) {
            console.warn("Sincronización inicial Supabase:", e);
        }
    }

    // Inicializar carros demo si no existen
    initDefaultCars();

    const isCarCatalogPage = document.getElementById('cars-catalog-container');
    const isCarDetailPage = document.getElementById('car-detail-container');

    if (isCarCatalogPage) {
        initCarCatalog();
    }

    if (isCarDetailPage) {
        initCarDetail();
    }
});

/** ================= CATÁLOGO DE VEHÍCULOS (car.html) ================= **/
function initCarCatalog() {
    const container = document.getElementById('cars-catalog-container');
    const filterCity = document.getElementById('filter-city');
    const filterCategory = document.getElementById('filter-category');
    const filterTransmission = document.getElementById('filter-transmission');
    const filterSearchBtn = document.getElementById('btn-apply-filters');
    const counterBadge = document.getElementById('catalog-results-count');

    const urlParams = new URLSearchParams(window.location.search);
    const paramBrand = urlParams.get('brand');
    const paramModel = urlParams.get('model');
    const paramCategory = urlParams.get('category');

    if (paramCategory && filterCategory) {
        // Seleccionar si coincide con alguna opción
        for (let i = 0; i < filterCategory.options.length; i++) {
            if (filterCategory.options[i].value.toLowerCase().includes(paramCategory.toLowerCase()) ||
                paramCategory.toLowerCase().includes(filterCategory.options[i].value.toLowerCase())) {
                filterCategory.selectedIndex = i;
                break;
            }
        }
    }

    function renderCatalog() {
        const allCars = getStoredCars().filter(c => c.status === 'Activo');
        
        const cityVal = filterCity ? filterCity.value : 'all';
        const categoryVal = (filterCategory && filterCategory.value !== 'all') ? filterCategory.value : (paramCategory || 'all');
        const transVal = filterTransmission ? filterTransmission.value : 'all';

        const filtered = allCars.filter(car => {
            const matchCity = (cityVal === 'all' || !cityVal) ? true : car.city.toLowerCase() === cityVal.toLowerCase();
            const matchCategory = (categoryVal === 'all' || !categoryVal) ? true : car.category.toLowerCase().includes(categoryVal.toLowerCase());
            const matchTrans = (transVal === 'all' || !transVal) ? true : car.transmission.toLowerCase() === transVal.toLowerCase();
            const matchBrand = (!paramBrand || !paramBrand.trim()) ? true : (car.brand && car.brand.toLowerCase() === paramBrand.toLowerCase().trim());
            const matchModel = (!paramModel || !paramModel.trim()) ? true : (car.model && car.model.toLowerCase().includes(paramModel.toLowerCase().trim()));
            return matchCity && matchCategory && matchTrans && matchBrand && matchModel;
        });

        if (counterBadge) {
            counterBadge.innerText = `${filtered.length} vehículos disponibles`;
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="bg-light p-5 rounded-lg border">
                        <i class="fa fa-search text-muted mb-3" style="font-size: 40px;"></i>
                        <h4>No encontramos vehículos con esos filtros</h4>
                        <p class="text-muted">Prueba seleccionando otra ciudad o categoría para ver opciones disponibles.</p>
                        <button class="btn btn-primary" onclick="resetFilters()">Restablecer Filtros</button>
                    </div>
                </div>
            `;
            return;
        }

        if (typeof window.renderCarCardHTML === 'function') {
            container.innerHTML = filtered.map(car => window.renderCarCardHTML(car, { showOwner: true })).join('');
            if (typeof window.initCarCardCarousels === 'function') {
                window.initCarCardCarousels(container);
            }
            return;
        }

        container.innerHTML = filtered.map(car => {
            const displayCategory = (car.category && car.category !== 'undefined' && car.category !== 'null') ? car.category : 
                                   (car.type && car.type !== 'undefined' && car.type !== 'null' ? car.type : 'SUV / Camioneta');
            const displayCity = (car.city && car.city !== 'undefined' && car.city !== 'null') ? car.city : 'Valledupar';
            const displayPrice = car.pricePerDay || car.price || 200000;
            const displayTransmission = (car.transmission && car.transmission !== 'undefined') ? car.transmission : 'Automático';
            const displayFuel = (car.fuel && car.fuel !== 'undefined') ? car.fuel : 'Gasolina';
            const displaySeats = car.seats || 5;
            const displayYear = car.year || 2023;
            const displayName = car.fullName || car.name || `${car.brand || ''} ${car.model || ''}`.trim() || 'Vehículo en Renta';

            return `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="rent-item mb-4 shadow-sm border rounded-lg overflow-hidden bg-white" style="transition: transform 0.25s ease;">
                    <div class="position-relative">
                        <img class="img-fluid w-100" src="${car.image || 'img/car-rent-1.png'}" alt="${displayName}" style="height: 220px; object-fit: cover;" onerror="this.src='img/car-rent-1.png'">
                        <span class="badge badge-primary position-absolute px-3 py-2" style="top: 12px; left: 12px; font-size: 13px; border-radius: 20px;">
                            <i class="fa fa-map-marker-alt mr-1"></i> ${displayCity}
                        </span>
                        <span class="badge badge-dark position-absolute px-2 py-1" style="top: 12px; right: 12px; font-size: 11px;">
                            ${displayCategory}
                        </span>
                    </div>

                    <div class="p-4">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h5 class="text-uppercase font-weight-bold mb-0 text-dark">${displayName}</h5>
                            <span class="badge badge-light border text-primary font-weight-bold">${displayYear}</span>
                        </div>

                        <!-- Badge del Propietario -->
                        <div class="small text-muted mb-3">
                            <i class="fa fa-user-check text-success mr-1"></i> Publicado por: <strong class="text-dark">${car.ownerName || 'Anfitrión Verificado'}</strong>
                            <span class="text-warning ml-1"><i class="fa fa-star"></i> 4.9</span>
                        </div>

                        <!-- Especificaciones -->
                        <div class="mb-2 d-flex flex-wrap" style="gap: 4px;">
                            <span class="badge ${car.hostType === 'Propietario Particular' ? 'badge-info' : 'badge-success'} px-2 py-1" style="font-size: 10px;">
                                <i class="fa fa-check-circle mr-1"></i>${car.hostType === 'Propietario Particular' ? 'Anfitrión Certificado' : 'Rentadora Verificada'}
                            </span>
                            <span class="badge badge-light border text-dark" style="font-size: 10px;">
                                <i class="fa fa-satellite-dish ${car.hasGps !== false ? 'text-primary' : 'text-muted'} mr-1"></i>${car.hasGps !== false ? 'GPS Activo' : 'Sin GPS'}
                            </span>
                            ${car.policyImage
                                ? '<span class="badge badge-primary" style="font-size: 10px;"><i class="fa fa-shield-alt mr-1"></i>Todo Riesgo</span>'
                                : '<span class="badge badge-light border text-muted" style="font-size: 10px;">Solo SOAT</span>'}
                        </div>
                        <div class="d-flex justify-content-around py-2 px-1 bg-light rounded text-center small mb-3 border">
                            <div class="px-1">
                                <i class="fa fa-cog text-primary"></i>
                                <div class="font-weight-semi-bold">${displayTransmission}</div>
                            </div>
                            <div class="px-1 border-left border-right">
                                <i class="fa fa-gas-pump text-primary"></i>
                                <div class="font-weight-semi-bold">${displayFuel}</div>
                            </div>
                            <div class="px-1 border-right">
                                <i class="fa fa-users text-primary"></i>
                                <div class="font-weight-semi-bold">${displaySeats}</div>
                            </div>
                            <div class="px-1">
                                <i class="fa fa-suitcase text-primary"></i>
                                <div class="font-weight-semi-bold">${car.luggage || 3}</div>
                            </div>
                        </div>

                        <!-- Precios y Acciones -->
                        <div class="d-flex justify-content-between align-items-center pt-2">
                            <div>
                                <span class="small text-muted d-block">Tarifa por día</span>
                                <h5 class="text-primary font-weight-bold mb-0">$${formatPrice(displayPrice)} <small class="text-muted" style="font-size: 11px;">COP</small></h5>
                            </div>
                            <div class="btn-group">
                                <a class="btn btn-outline-secondary btn-sm px-2" href="detail.html?id=${car.id}">Detalles</a>
                                ${(typeof window.isMyOwnCar === 'function' && window.isMyOwnCar(car))
                                    ? `<a class="btn btn-dark btn-sm px-3 font-weight-bold" href="dashboard-propietario.html?editCar=${car.id}" title="Tu vehículo"><i class="fa fa-edit mr-1"></i> Editar</a>`
                                    : `<a class="btn btn-primary btn-sm px-3 font-weight-bold" href="booking.html?id=${car.id}">Rentar</a>`}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    }

    if (filterSearchBtn) {
        filterSearchBtn.addEventListener('click', function(e) {
            e.preventDefault();
            renderCatalog();
        });
    }

    if (filterCity) filterCity.addEventListener('change', renderCatalog);
    if (filterCategory) filterCategory.addEventListener('change', renderCatalog);
    if (filterTransmission) filterTransmission.addEventListener('change', renderCatalog);

    window.resetFilters = function() {
        if (filterCity) filterCity.value = 'all';
        if (filterCategory) filterCategory.value = 'all';
        if (filterTransmission) filterTransmission.value = 'all';
        renderCatalog();
    };

    renderCatalog();
}

/** ================= DETALLE DEL VEHÍCULO (detail.html) ================= **/
function initCarDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const carId = urlParams.get('id');
    const allCars = getStoredCars();

    // Buscar auto seleccionado o tomar el primero
    let car = allCars.find(c => c.id === carId);
    if (!car && allCars.length > 0) {
        car = allCars[0];
    }
    if (!car) return;

    // Llenar datos principales en el DOM
    setElemText('detail-title', car.fullName);
    setElemText('detail-year', car.year);
    setElemText('detail-city', car.city);
    setElemText('detail-category', car.category);
    setElemText('detail-trans', car.transmission);
    setElemText('detail-fuel', car.fuel);
    setElemText('detail-seats', `${car.seats} Pasajeros`);
    setElemText('detail-luggage', `${car.luggage || 3} Maletas`);
    setElemText('detail-gps', car.hasGps !== false ? 'GPS Activo' : 'Sin GPS');
    setElemText('detail-mileage', car.mileage || '200 km/día');
    setElemText('detail-description', car.description || 'Vehículo verificado en excelentes condiciones.');
    setElemText('detail-owner-name', car.ownerName || 'Anfitrión Certificado');
    const hostBadgeEl = document.getElementById('detail-host-badge');
    if (hostBadgeEl) {
        const covBadge = car.policyImage
            ? '<span class="badge badge-primary px-2 py-1 ml-1"><i class="fa fa-shield-alt mr-1"></i>Todo Riesgo Verificado</span>'
            : '<span class="badge badge-light border text-muted px-2 py-1 ml-1">Solo SOAT (Sin Todo Riesgo)</span>';
        hostBadgeEl.innerHTML = `<span class="badge ${car.hostType === 'Propietario Particular' ? 'badge-info' : 'badge-success'} px-2 py-1"><i class="fa fa-check-circle mr-1"></i>${car.hostType === 'Propietario Particular' ? 'Anfitrión Certificado' : 'Rentadora Verificada'}</span>${covBadge}`;
    }
    setElemText('detail-price-day', `$${formatPrice(car.pricePerDay)} COP`);

    const mainImg = document.getElementById('detail-main-img');
    if (mainImg) {
        mainImg.src = car.image;
        mainImg.onerror = function() { this.src = 'img/car-rent-1.png'; };
    }

    // Calculadora dinámica de precio en la barra lateral
    const inputStart = document.getElementById('calc-start-date');
    const inputEnd = document.getElementById('calc-end-date');
    const btnBookNow = document.getElementById('btn-go-booking');

    function updatePriceEstimate() {
        const d1 = inputStart && inputStart.value ? new Date(inputStart.value) : new Date();
        const d2 = inputEnd && inputEnd.value ? new Date(inputEnd.value) : new Date(Date.now() + 86400000 * 3);

        let diffTime = d2.getTime() - d1.getTime();
        let days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (days < 1 || isNaN(days)) days = 1;

        const subtotal = days * car.pricePerDay;
        const platformFee = Math.round(subtotal * 0.15); // 15% seguro y servicio
        const total = subtotal + platformFee;

        setElemText('calc-days-label', `${days} ${days === 1 ? 'día' : 'días'}`);
        setElemText('calc-subtotal', `$${formatPrice(subtotal)} COP`);
        setElemText('calc-fee', `$${formatPrice(platformFee)} COP`);
        setElemText('calc-total', `$${formatPrice(total)} COP`);

        if (btnBookNow) {
            const avail = (typeof window.isCarDateRangeAvailable === 'function' && inputStart && inputEnd)
                ? window.isCarDateRangeAvailable(car, inputStart.value, inputEnd.value)
                : { available: true };
            let availWarn = document.getElementById('detail-date-conflict-warn');
            if (!avail.available) {
                if (!availWarn) {
                    availWarn = document.createElement('div');
                    availWarn.id = 'detail-date-conflict-warn';
                    availWarn.className = 'alert alert-danger small py-2 px-3 mt-2 mb-2';
                    btnBookNow.parentNode.insertBefore(availWarn, btnBookNow);
                }
                availWarn.innerHTML = `<i class="fa fa-calendar-times mr-1"></i> <strong>No disponible</strong> (${avail.conflictStart} al ${avail.conflictEnd}): ${avail.reason}. Elige otras fechas.`;
                availWarn.style.display = 'block';
                btnBookNow.className = 'btn btn-secondary btn-block btn-lg font-weight-bold disabled';
                btnBookNow.href = 'javascript:void(0)';
                btnBookNow.onclick = (e) => { e.preventDefault(); alert('Las fechas seleccionadas ya están ocupadas. Elige otro rango.'); };
                return;
            }
            if (availWarn) availWarn.style.display = 'none';
            btnBookNow.onclick = null;

            if (typeof window.isMyOwnCar === 'function' && window.isMyOwnCar(car)) {
                btnBookNow.href = `dashboard-propietario.html?editCar=${car.id}`;
                btnBookNow.className = 'btn btn-dark btn-block btn-lg font-weight-bold shadow-sm';
                btnBookNow.innerHTML = '<i class="fa fa-edit mr-2"></i> Gestionar / Editar mi Auto';
            } else {
                btnBookNow.className = 'btn btn-primary btn-block btn-lg font-weight-bold shadow-sm';
                btnBookNow.innerHTML = '<i class="fa fa-calendar-check mr-2"></i> Solicitar Reserva';
                btnBookNow.href = `booking.html?id=${car.id}&days=${days}&start=${inputStart ? inputStart.value : ''}&end=${inputEnd ? inputEnd.value : ''}`;
            }
        }
    }

    if (inputStart) inputStart.addEventListener('change', updatePriceEstimate);
    if (inputEnd) inputEnd.addEventListener('change', updatePriceEstimate);

    // Fechas por defecto: hoy + 3 días
    const today = new Date().toISOString().split('T')[0];
    const threeDaysLater = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];
    if (inputStart) inputStart.value = today;
    if (inputEnd) inputEnd.value = threeDaysLater;
    updatePriceEstimate();

    // Formulario de Feedback / Reporte de Novedad
    const formFeedback = document.getElementById('form-report-feedback');
    if (formFeedback) {
        formFeedback.addEventListener('submit', async function (e) {
            e.preventDefault();
            let items = [];
            try { items = JSON.parse(localStorage.getItem('rentcar_feedback')) || []; } catch (err) { items = []; }
            const newItem = {
                id: 'fb_' + Date.now(),
                carId: car.id,
                carName: car.fullName || car.name || 'Vehículo',
                reporterName: document.getElementById('fb-name').value.trim(),
                reporterPhone: document.getElementById('fb-phone').value.trim(),
                subject: document.getElementById('fb-subject').value,
                message: document.getElementById('fb-message').value.trim(),
                status: 'Pendiente',
                createdAt: new Date().toISOString()
            };
            if (typeof dbSaveFeedback === 'function') {
                await dbSaveFeedback(newItem);
            }
            if (typeof window.logSystemEvent === 'function') {
                window.logSystemEvent('Feedback', 'Nuevo reporte enviado', `${newItem.carName} — ${newItem.subject}`);
            }
            items.unshift(newItem);
            localStorage.setItem('rentcar_feedback', JSON.stringify(items));
            if (typeof window.broadcastLiveSync === 'function') window.broadcastLiveSync('feedback_updated');
            formFeedback.reset();
            $('#modalReportFeedback').modal('hide');
            alert('¡Gracias! Tu reporte fue enviado y guardado para el Administrador de Rent Car Colombia.');
        });
    }
}

/** ================= HELPERS GENERALES ================= **/
function getStoredCars() {
    try {
        const stored = JSON.parse(localStorage.getItem('renteasy_cars'));
        if (stored && Array.isArray(stored) && stored.length > 0) return stored;
    } catch (e) {}
    return [];
}

function formatPrice(val) {
    return Number(val || 0).toLocaleString('es-CO');
}

function setElemText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

function initDefaultCars() {
    if (!localStorage.getItem('renteasy_cars')) {
        const initialCars = [
            {
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
                createdAt: new Date().toISOString()
            }
        ];
        localStorage.setItem('renteasy_cars', JSON.stringify(initialCars));
    }
}
