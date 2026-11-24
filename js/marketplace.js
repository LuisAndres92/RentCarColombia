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

        container.innerHTML = filtered.map(car => `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="rent-item mb-4 shadow-sm border rounded-lg overflow-hidden bg-white" style="transition: transform 0.25s ease;">
                    <div class="position-relative">
                        <img class="img-fluid w-100" src="${car.image}" alt="${car.fullName || car.name}" style="height: 220px; object-fit: cover;" onerror="this.src='img/car-rent-1.png'">
                        <span class="badge badge-primary position-absolute px-3 py-2" style="top: 12px; left: 12px; font-size: 13px; border-radius: 20px;">
                            <i class="fa fa-map-marker-alt mr-1"></i> ${car.city || 'Colombia'}
                        </span>
                        <span class="badge badge-dark position-absolute px-2 py-1" style="top: 12px; right: 12px; font-size: 11px;">
                            ${car.category || car.type || 'Sedán'}
                        </span>
                    </div>

                    <div class="p-4">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h5 class="text-uppercase font-weight-bold mb-0 text-dark">${car.fullName || car.name}</h5>
                            <span class="badge badge-light border text-primary font-weight-bold">${car.year}</span>
                        </div>

                        <!-- Badge del Propietario -->
                        <div class="small text-muted mb-3">
                            <i class="fa fa-user-check text-success mr-1"></i> Publicado por: <strong class="text-dark">${car.ownerName || 'Anfitrión Verificado'}</strong>
                            <span class="text-warning ml-1"><i class="fa fa-star"></i> 4.9</span>
                        </div>

                        <!-- Especificaciones -->
                        <div class="d-flex justify-content-around py-2 px-1 bg-light rounded text-center small mb-3 border">
                            <div class="px-1">
                                <i class="fa fa-cog text-primary"></i>
                                <div class="font-weight-semi-bold">${car.transmission}</div>
                            </div>
                            <div class="px-1 border-left border-right">
                                <i class="fa fa-gas-pump text-primary"></i>
                                <div class="font-weight-semi-bold">${car.fuel}</div>
                            </div>
                            <div class="px-1">
                                <i class="fa fa-users text-primary"></i>
                                <div class="font-weight-semi-bold">${car.seats} Puestos</div>
                            </div>
                        </div>

                        <!-- Precios y Acciones -->
                        <div class="d-flex justify-content-between align-items-center pt-2">
                            <div>
                                <span class="small text-muted d-block">Tarifa por día</span>
                                <h5 class="text-primary font-weight-bold mb-0">$${formatPrice(car.pricePerDay)} <small class="text-muted" style="font-size: 11px;">COP</small></h5>
                            </div>
                            <div class="btn-group">
                                <a class="btn btn-outline-secondary btn-sm px-2" href="detail.html?id=${car.id}">Detalles</a>
                                <a class="btn btn-primary btn-sm px-3 font-weight-bold" href="booking.html?id=${car.id}">Rentar</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
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
    setElemText('detail-mileage', car.mileage || '200 km/día');
    setElemText('detail-description', car.description || 'Vehículo verificado en excelentes condiciones.');
    setElemText('detail-owner-name', car.ownerName || 'Anfitrión Certificado');
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
            btnBookNow.href = `booking.html?id=${car.id}&days=${days}&start=${inputStart ? inputStart.value : ''}&end=${inputEnd ? inputEnd.value : ''}`;
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
                id: 'car_1',
                ownerId: 'usr_demo_host',
                ownerName: 'Carlos Mendoza',
                ownerPhone: '+57 316 235 7871',
                brand: 'Mazda',
                model: 'CX-30 Touring',
                fullName: 'Mazda CX-30',
                year: 2023,
                category: 'SUV / Camioneta',
                transmission: 'Automático',
                fuel: 'Gasolina',
                seats: 5,
                pricePerDay: 220000,
                city: 'Bogotá',
                mileage: '250 km/día',
                description: 'Excelente camioneta familiar, bajo consumo, cámara de reversa y conectividad Apple CarPlay / Android Auto.',
                image: 'img/car-rent-1.png',
                status: 'Activo',
                createdAt: new Date().toISOString()
            },
            {
                id: 'car_2',
                ownerId: 'usr_demo_host',
                ownerName: 'Carlos Mendoza',
                ownerPhone: '+57 316 235 7871',
                brand: 'Toyota',
                model: 'Corolla Cross Híbrido',
                fullName: 'Toyota Corolla Cross',
                year: 2024,
                category: 'SUV / Camioneta',
                transmission: 'Automático',
                fuel: 'Híbrido',
                seats: 5,
                pricePerDay: 260000,
                city: 'Medellín',
                mileage: 'Ilimitado',
                description: 'Sin pico y placa por ser híbrido. Máximo confort, seguridad Toyota Safety Sense y baúl espacioso.',
                image: 'img/car-rent-2.png',
                status: 'Activo',
                createdAt: new Date().toISOString()
            },
            {
                id: 'car_3',
                ownerId: 'usr_other_host',
                ownerName: 'Mariana Silva',
                ownerPhone: '+57 310 555 8899',
                brand: 'Chevrolet',
                model: 'Onix RS Turbo',
                fullName: 'Chevrolet Onix Turbo',
                year: 2023,
                category: 'Compacto',
                transmission: 'Mecánico',
                fuel: 'Gasolina',
                seats: 5,
                pricePerDay: 150000,
                city: 'Cali',
                mileage: '200 km/día',
                description: 'Económico en combustible, perfecto para ciudad y carretera, aire acondicionado y pantalla táctil.',
                image: 'img/car-rent-3.png',
                status: 'Activo',
                createdAt: new Date().toISOString()
            }
        ];
        localStorage.setItem('renteasy_cars', JSON.stringify(initialCars));
    }
}
