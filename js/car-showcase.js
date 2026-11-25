/**
 * Rent Car Colombia - Motor Compartido de Tarjetas Premium, Carrusel 2s, Gestos y Modal de Detalles
 */
(function () {
    // 1. Inyectar estilos premium (Hover zoom + destello diagonal + flechas + modal galería)
    function injectShowcaseStyles() {
        if (document.getElementById('rentcar-showcase-styles')) return;
        const style = document.createElement('style');
        style.id = 'rentcar-showcase-styles';
        style.textContent = `
            .rent-card-premium {
                position: relative;
                overflow: hidden;
                padding: 0 !important;
                text-align: left !important;
                background: #ffffff !important;
                transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s ease !important;
                border-radius: 14px !important;
            }
            .rent-card-premium:hover {
                transform: translateY(-6px) scale(1.02);
                box-shadow: 0 18px 36px rgba(28, 30, 50, 0.18) !important;
                background: #ffffff !important;
                z-index: 2;
            }
            /* Destello diagonal luminoso al pasar el cursor */
            .rent-card-premium::after {
                content: "";
                position: absolute;
                top: 0;
                left: -130%;
                width: 75%;
                height: 100%;
                background: linear-gradient(
                    115deg,
                    rgba(255, 255, 255, 0) 0%,
                    rgba(255, 255, 255, 0.12) 38%,
                    rgba(255, 255, 255, 0.42) 50%,
                    rgba(255, 255, 255, 0.12) 62%,
                    rgba(255, 255, 255, 0) 100%
                );
                transform: skewX(-20deg);
                pointer-events: none;
                z-index: 5;
                transition: left 0.75s ease;
            }
            .rent-card-premium:hover::after {
                left: 145%;
            }
            .rent-card-img-wrap {
                position: relative;
                width: 100%;
                height: 250px;
                overflow: hidden;
                background: #0f172a;
                cursor: pointer;
                user-select: none;
            }
            .rent-card-img-wrap img.car-card-slide-img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.55s ease, opacity 0.25s ease;
                display: block;
            }
            .rent-card-premium:hover .rent-card-img-wrap img.car-card-slide-img {
                transform: scale(1.06);
            }
            .car-slide-arrow {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                width: 32px;
                height: 32px;
                border-radius: 50%;
                border: none;
                background: rgba(255, 255, 255, 0.88);
                color: #1C1E32;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 4;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
                transition: background 0.2s ease, transform 0.2s ease;
                font-size: 13px;
                padding: 0;
            }
            .car-slide-arrow:hover {
                background: #F77D0A;
                color: #ffffff;
                transform: translateY(-50%) scale(1.08);
            }
            .car-slide-arrow.prev { left: 10px; }
            .car-slide-arrow.next { right: 10px; }
            .car-slide-dots {
                position: absolute;
                bottom: 8px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: 5px;
                z-index: 4;
                background: rgba(15, 23, 42, 0.45);
                padding: 3px 8px;
                border-radius: 12px;
            }
            .car-slide-dot {
                width: 7px;
                height: 7px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.5);
                transition: background 0.2s ease, transform 0.2s ease;
            }
            .car-slide-dot.active {
                background: #F77D0A;
                transform: scale(1.25);
            }
            .qv-thumb {
                width: 68px;
                height: 48px;
                object-fit: cover;
                border-radius: 6px;
                cursor: pointer;
                border: 2px solid transparent;
                opacity: 0.7;
                transition: all 0.2s ease;
            }
            .qv-thumb.active, .qv-thumb:hover {
                border-color: #F77D0A;
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
    }

    function getCarImages(car) {
        if (car && Array.isArray(car.images) && car.images.length > 0) {
            return car.images.filter(Boolean);
        }
        if (car && car.image) {
            return [car.image];
        }
        return [];
    }

    function getAllShowcaseCars() {
        let cars = [];
        try {
            cars = JSON.parse(localStorage.getItem('renteasy_cars')) || [];
        } catch (e) { cars = []; }
        cars = cars.filter(c => c && c.id !== 'car_mod_demo' && c.ownerName !== 'Felipe Daza' && c.ownerId !== 'usr_demo_host_2');
        if (cars.length === 0) {
            cars = [{
                id: 'car_valledupar_01',
                ownerName: 'Rent Car Colombia',
                brand: 'Renault',
                model: 'Duster Iconic 4x4 Turbo',
                fullName: 'Renault Duster 4x4 Turbo',
                name: 'Renault Duster 4x4 Turbo',
                year: 2024,
                category: 'SUV / Camioneta',
                transmission: 'Automático',
                fuel: 'Gasolina',
                seats: 5,
                mileage: '250 km/día',
                price: 220000,
                pricePerDay: 220000,
                city: 'Valledupar',
                description: 'Camioneta todoterreno 4x4 turbo de demostración. Totalmente equipada, SOAT vigente, seguro todo riesgo y mantenimiento al día en Valledupar.',
                image: 'img/car-rent-1.png',
                images: ['img/car-rent-1.png'],
                status: 'Activo'
            }];
        }
        return cars;
    }

    function getCarRealRatingStats(carId, carName) {
        let reviews = [];
        try {
            reviews = JSON.parse(localStorage.getItem('rentcar_verified_reviews')) || [];
        } catch (e) { reviews = []; }

        const valid = reviews.filter(r =>
            r &&
            r.approved === true &&
            (
                (r.carId && r.carId === carId) ||
                (r.carRented && carName && r.carRented.toLowerCase().includes(carName.toLowerCase()))
            )
        );
        if (valid.length === 0) return null;

        const total = valid.reduce((sum, r) => sum + (Number(r.rating) || 5), 0);
        return {
            avg: (total / valid.length).toFixed(1),
            count: valid.length,
            reviews: valid
        };
    }

    function renderCarCardHTML(car, options = {}) {
        injectShowcaseStyles();
        const images = getCarImages(car);
        const displayName = car.fullName || car.name || `${car.brand || ''} ${car.model || ''}`.trim() || 'Vehículo en Renta';
        const displayPrice = Number(car.pricePerDay || car.price || 220000).toLocaleString('es-CO');
        const displayCat = (car.category && car.category !== 'undefined') ? car.category : (car.type || 'SUV / Camioneta');
        const displayCity = (car.city && car.city !== 'undefined') ? car.city : 'Valledupar';
        const displayTrans = (car.transmission && car.transmission !== 'undefined') ? car.transmission : 'Automático';
        const displayFuel = (car.fuel && car.fuel !== 'undefined') ? car.fuel : 'Gasolina';
        const displaySeats = car.seats || 5;
        const displayYear = car.year || 2024;
        const hasMultiple = images.length > 1;
        const ratingStats = getCarRealRatingStats(car.id, displayName);

        return `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="rent-card-premium mb-4 shadow-sm border bg-white h-100 d-flex flex-column justify-content-between" data-car-id="${car.id}">
                    <div>
                        <div class="rent-card-img-wrap" data-car-id="${car.id}" data-images='${JSON.stringify(images).replace(/'/g, "&apos;")}' data-index="0" onclick="openCarQuickView('${car.id}')">
                            <img class="car-card-slide-img" src="${images[0]}" alt="${displayName}" onerror="this.src='img/car-rent-1.png'">
                            <span class="badge badge-primary position-absolute px-3 py-2" style="top: 12px; left: 12px; font-size: 12px; border-radius: 20px; z-index: 3;">
                                <i class="fa fa-map-marker-alt mr-1"></i> ${displayCity}
                            </span>
                            <span class="badge badge-dark position-absolute px-2 py-1" style="top: 12px; right: 12px; font-size: 11px; z-index: 3;">
                                ${displayCat}
                            </span>
                            ${hasMultiple ? `
                                <button type="button" class="car-slide-arrow prev" aria-label="Anterior" onclick="event.stopPropagation(); stepCardSlide(this, -1);">
                                    <i class="fa fa-chevron-left"></i>
                                </button>
                                <button type="button" class="car-slide-arrow next" aria-label="Siguiente" onclick="event.stopPropagation(); stepCardSlide(this, 1);">
                                    <i class="fa fa-chevron-right"></i>
                                </button>
                                <div class="car-slide-dots">
                                    ${images.map((_, idx) => `<span class="car-slide-dot ${idx === 0 ? 'active' : ''}"></span>`).join('')}
                                </div>
                            ` : ''}
                        </div>
                        <div class="px-3 pt-3 pb-1">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h5 class="text-uppercase font-weight-bold mb-0 text-dark" style="cursor:pointer; font-size: 1.05rem;" onclick="openCarQuickView('${car.id}')">${displayName}</h5>
                                <span class="badge badge-light border text-primary font-weight-bold">${displayYear}</span>
                            </div>
                            ${ratingStats ? `
                                <div class="small font-weight-bold mb-2">
                                    <span class="text-warning"><i class="fa fa-star mr-1"></i>${ratingStats.avg}</span>
                                    <span class="text-muted font-weight-normal ml-1">(${ratingStats.count} ${ratingStats.count === 1 ? 'reseña' : 'reseñas'})</span>
                                </div>
                            ` : ''}
                            <div class="d-flex justify-content-around py-2 px-1 bg-light rounded text-center small mb-2 border">
                                <div><i class="fa fa-cog text-primary"></i> ${displayTrans}</div>
                                <div class="border-left border-right px-2"><i class="fa fa-gas-pump text-primary"></i> ${displayFuel}</div>
                                <div><i class="fa fa-users text-primary"></i> ${displaySeats} Puestos</div>
                            </div>
                        </div>
                    </div>
                    <div class="px-3 pb-3 pt-2 d-flex justify-content-between align-items-center">
                        <div>
                            <span class="small text-muted d-block" style="font-size: 11px;">Tarifa por día</span>
                            <h5 class="text-primary font-weight-bold mb-0">$${displayPrice} <small class="text-muted" style="font-size: 11px;">COP</small></h5>
                        </div>
                        <div class="btn-group">
                            <button type="button" class="btn btn-outline-secondary btn-sm px-2" onclick="openCarQuickView('${car.id}')">Detalles</button>
                            <a class="btn btn-primary btn-sm px-3 font-weight-bold" href="booking.html?id=${car.id}">Rentar</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function updateCardSlideUI(wrap, newIndex) {
        let images = [];
        try { images = JSON.parse(wrap.getAttribute('data-images') || '[]'); } catch (e) { }
        if (!images || images.length === 0) return;

        const total = images.length;
        const safeIdx = ((newIndex % total) + total) % total;
        wrap.setAttribute('data-index', safeIdx);

        const imgEl = wrap.querySelector('img.car-card-slide-img');
        if (imgEl) {
            imgEl.style.opacity = '0.75';
            setTimeout(() => {
                imgEl.src = images[safeIdx];
                imgEl.style.opacity = '1';
            }, 90);
        }

        const dots = wrap.querySelectorAll('.car-slide-dot');
        dots.forEach((d, i) => d.classList.toggle('active', i === safeIdx));
    }

    window.stepCardSlide = function (btnEl, delta) {
        const wrap = btnEl.closest('.rent-card-img-wrap');
        if (!wrap) return;
        const current = parseInt(wrap.getAttribute('data-index') || '0', 10);
        updateCardSlideUI(wrap, current + delta);
    };

    const activeIntervals = [];
    function initCarCardCarousels(rootEl) {
        injectShowcaseStyles();
        // Limpiar intervalos previos para evitar duplicados al re-renderizar en vivo
        while (activeIntervals.length) {
            clearInterval(activeIntervals.pop());
        }

        const scope = rootEl || document;
        const wraps = scope.querySelectorAll('.rent-card-img-wrap');

        wraps.forEach(wrap => {
            let images = [];
            try { images = JSON.parse(wrap.getAttribute('data-images') || '[]'); } catch (e) { }
            if (images.length <= 1) return;

            let paused = false;
            wrap.addEventListener('mouseenter', () => { paused = true; });
            wrap.addEventListener('mouseleave', () => { paused = false; });

            // Gestos táctiles (deslizar con el dedo)
            let touchStartX = 0;
            wrap.addEventListener('touchstart', (e) => {
                paused = true;
                touchStartX = e.changedTouches[0].clientX;
            }, { passive: true });

            wrap.addEventListener('touchend', (e) => {
                const diffX = e.changedTouches[0].clientX - touchStartX;
                if (Math.abs(diffX) > 35) {
                    const current = parseInt(wrap.getAttribute('data-index') || '0', 10);
                    updateCardSlideUI(wrap, current + (diffX < 0 ? 1 : -1));
                }
                setTimeout(() => { paused = false; }, 1500);
            }, { passive: true });

            // Avance automático cada 2 segundos
            const timer = setInterval(() => {
                if (!document.body.contains(wrap)) {
                    clearInterval(timer);
                    return;
                }
                if (!paused) {
                    const current = parseInt(wrap.getAttribute('data-index') || '0', 10);
                    updateCardSlideUI(wrap, current + 1);
                }
            }, 2000);
            activeIntervals.push(timer);
        });
    }

    // ================= MODAL DE DETALLES DEL VEHÍCULO CON GALERÍA GRANDE ================= //
    function ensureQuickViewModal() {
        if (document.getElementById('carQuickViewModal')) return;
        const modalHtml = `
            <div class="modal fade" id="carQuickViewModal" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
                    <div class="modal-content border-0 shadow-lg overflow-hidden" style="border-radius: 14px;">
                        <div class="modal-header bg-dark text-white py-3 px-4 border-0">
                            <div>
                                <h5 class="modal-title font-weight-bold text-white mb-0" id="qv-car-title">Detalle del Vehículo</h5>
                                <small class="text-warning" id="qv-car-subtitle"></small>
                            </div>
                            <button type="button" class="close text-white" data-dismiss="modal" aria-label="Cerrar">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body p-0">
                            <!-- Galería Grande -->
                            <div class="position-relative bg-dark text-center" id="qv-gallery-stage" style="height: 360px; overflow: hidden;">
                                <img id="qv-main-img" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="Vehículo" style="width: 100%; height: 100%; object-fit: cover;">
                                <button type="button" class="car-slide-arrow prev" id="qv-prev-btn" style="width:38px; height:38px;">
                                    <i class="fa fa-chevron-left"></i>
                                </button>
                                <button type="button" class="car-slide-arrow next" id="qv-next-btn" style="width:38px; height:38px;">
                                    <i class="fa fa-chevron-right"></i>
                                </button>
                                <span class="badge badge-dark position-absolute px-3 py-1" id="qv-photo-counter" style="bottom: 12px; right: 14px; font-size: 12px; opacity: 0.85;">1 / 1</span>
                            </div>
                            <!-- Miniaturas -->
                            <div class="d-flex flex-wrap gap-2 px-4 py-2 bg-light border-bottom" id="qv-thumbs-row" style="gap: 8px;"></div>

                            <!-- Especificaciones e Información -->
                            <div class="p-4">
                                <div class="row align-items-center mb-3">
                                    <div class="col-md-7">
                                        <div class="d-flex flex-wrap align-items-center mb-2">
                                            <span class="badge badge-primary mr-2 px-2 py-1" id="qv-city"><i class="fa fa-map-marker-alt mr-1"></i> Valledupar</span>
                                            <span class="badge badge-secondary mr-2 px-2 py-1" id="qv-category">SUV</span>
                                            <span class="badge badge-success px-2 py-1"><i class="fa fa-shield-alt mr-1"></i> SOAT & Seguro Vigente</span>
                                        </div>
                                        <div class="small text-muted" id="qv-owner"></div>
                                    </div>
                                    <div class="col-md-5 text-md-right mt-2 mt-md-0">
                                        <small class="text-muted d-block">Tarifa por día</small>
                                        <h3 class="text-primary font-weight-bold mb-0" id="qv-price">$220.000 COP</h3>
                                    </div>
                                </div>

                                <div class="row text-center bg-light rounded py-3 mx-0 mb-3 border">
                                    <div class="col-3 border-right">
                                        <i class="fa fa-cog text-primary mb-1 d-block"></i>
                                        <small class="text-muted d-block">Transmisión</small>
                                        <strong class="small text-dark" id="qv-trans">Automático</strong>
                                    </div>
                                    <div class="col-3 border-right">
                                        <i class="fa fa-gas-pump text-primary mb-1 d-block"></i>
                                        <small class="text-muted d-block">Combustible</small>
                                        <strong class="small text-dark" id="qv-fuel">Gasolina</strong>
                                    </div>
                                    <div class="col-3 border-right">
                                        <i class="fa fa-users text-primary mb-1 d-block"></i>
                                        <small class="text-muted d-block">Capacidad</small>
                                        <strong class="small text-dark" id="qv-seats">5 Puestos</strong>
                                    </div>
                                    <div class="col-3">
                                        <i class="fa fa-tachometer-alt text-primary mb-1 d-block"></i>
                                        <small class="text-muted d-block">Kilometraje</small>
                                        <strong class="small text-dark" id="qv-mileage">250 km/día</strong>
                                    </div>
                                </div>

                                <p class="text-muted small mb-0" id="qv-desc" style="line-height: 1.6;"></p>

                                <!-- Reseñas reales del vehículo (solo visible si existen) -->
                                <div id="qv-reviews-section" class="mt-3 pt-3 border-top" style="display: none;">
                                    <h6 class="font-weight-bold text-dark mb-2" id="qv-reviews-title"></h6>
                                    <div id="qv-reviews-list"></div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer bg-light d-flex justify-content-between px-4 py-3">
                            <a href="#" id="qv-full-detail-link" class="btn btn-outline-secondary font-weight-semi-bold">
                                <i class="fa fa-external-link-alt mr-1"></i> Ver página completa
                            </a>
                            <div>
                                <button type="button" class="btn btn-light border mr-2" data-dismiss="modal">Cerrar</button>
                                <a href="#" id="qv-rent-btn" class="btn btn-primary px-4 font-weight-bold shadow-sm">
                                    <i class="fa fa-calendar-check mr-2"></i> Rentar este Vehículo
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    let qvImages = [];
    let qvCurrentIdx = 0;

    function updateQuickViewGallery(idx) {
        if (!qvImages.length) return;
        qvCurrentIdx = ((idx % qvImages.length) + qvImages.length) % qvImages.length;
        const mainImg = document.getElementById('qv-main-img');
        const counter = document.getElementById('qv-photo-counter');
        if (mainImg) mainImg.src = qvImages[qvCurrentIdx];
        if (counter) counter.textContent = `${qvCurrentIdx + 1} / ${qvImages.length}`;
        document.querySelectorAll('#qv-thumbs-row .qv-thumb').forEach((t, i) => {
            t.classList.toggle('active', i === qvCurrentIdx);
        });
    }

    window.openCarQuickView = function (carId) {
        injectShowcaseStyles();
        ensureQuickViewModal();

        const cars = getAllShowcaseCars();
        const car = cars.find(c => c.id === carId) || cars[0];
        if (!car) return;

        qvImages = getCarImages(car);
        qvCurrentIdx = 0;

        const displayName = car.fullName || car.name || `${car.brand || ''} ${car.model || ''}`.trim();
        const displayPrice = Number(car.pricePerDay || car.price || 220000).toLocaleString('es-CO');

        document.getElementById('qv-car-title').textContent = `${displayName} (${car.year || 2024})`;
        document.getElementById('qv-car-subtitle').textContent = `${car.brand || ''} • ${car.category || 'SUV / Camioneta'}`;
        document.getElementById('qv-city').innerHTML = `<i class="fa fa-map-marker-alt mr-1"></i> ${car.city || 'Valledupar'}`;
        document.getElementById('qv-category').textContent = car.category || car.type || 'SUV / Camioneta';
        const ownerEl = document.getElementById('qv-owner');
        const ratingStats = getCarRealRatingStats(car.id, displayName);
        if (ownerEl) {
            const parts = [];
            if (car.ownerName && car.ownerName !== 'Anfitrión Verificado') {
                parts.push(`<i class="fa fa-user mr-1 text-primary"></i> Propietario: <strong class="text-dark">${car.ownerName}</strong>`);
            }
            if (ratingStats) {
                parts.push(`<span class="text-warning font-weight-bold"><i class="fa fa-star mr-1"></i>${ratingStats.avg}</span> <span class="text-muted">(${ratingStats.count} ${ratingStats.count === 1 ? 'reseña' : 'reseñas'})</span>`);
            }
            if (parts.length > 0) {
                ownerEl.innerHTML = parts.join(' &bull; ');
                ownerEl.style.display = '';
            } else {
                ownerEl.innerHTML = '';
                ownerEl.style.display = 'none';
            }
        }

        const revSection = document.getElementById('qv-reviews-section');
        const revTitle = document.getElementById('qv-reviews-title');
        const revList = document.getElementById('qv-reviews-list');
        if (revSection && revTitle && revList) {
            if (ratingStats && ratingStats.reviews.length > 0) {
                revSection.style.display = '';
                revTitle.innerHTML = `<i class="fa fa-star text-warning mr-1"></i> Opiniones Reales (${ratingStats.avg} / 5 &bull; ${ratingStats.count})`;
                revList.innerHTML = ratingStats.reviews.slice(0, 3).map(r => `
                    <div class="p-2 bg-light rounded border mb-2 small">
                        <div class="d-flex justify-content-between">
                            <strong class="text-dark">${r.userName || 'Conductor'}</strong>
                            <span class="text-warning">${'<i class="fa fa-star"></i>'.repeat(r.rating || 5)}</span>
                        </div>
                        <div class="text-muted mt-1">"${r.text}"</div>
                    </div>
                `).join('');
            } else {
                revSection.style.display = 'none';
                revList.innerHTML = '';
            }
        }
        document.getElementById('qv-price').textContent = `$${displayPrice} COP`;
        document.getElementById('qv-trans').textContent = car.transmission || 'Automático';
        document.getElementById('qv-fuel').textContent = car.fuel || 'Gasolina';
        document.getElementById('qv-seats').textContent = `${car.seats || 5} Puestos`;
        document.getElementById('qv-mileage').textContent = car.mileage || '250 km/día';
        document.getElementById('qv-desc').textContent = car.description || 'Vehículo en excelentes condiciones mecánicas y estéticas, listo para entregar.';

        document.getElementById('qv-rent-btn').href = `booking.html?id=${car.id}`;
        document.getElementById('qv-full-detail-link').href = `detail.html?id=${car.id}`;

        const prevBtn = document.getElementById('qv-prev-btn');
        const nextBtn = document.getElementById('qv-next-btn');
        const thumbsRow = document.getElementById('qv-thumbs-row');

        if (qvImages.length > 1) {
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';
            thumbsRow.style.display = 'flex';
            thumbsRow.innerHTML = qvImages.map((src, idx) => `
                <img src="${src}" class="qv-thumb ${idx === 0 ? 'active' : ''}" onclick="window._qvSelectThumb(${idx})" onerror="this.src='img/car-rent-1.png'">
            `).join('');
        } else {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
            thumbsRow.style.display = 'none';
            thumbsRow.innerHTML = '';
        }

        prevBtn.onclick = () => updateQuickViewGallery(qvCurrentIdx - 1);
        nextBtn.onclick = () => updateQuickViewGallery(qvCurrentIdx + 1);
        window._qvSelectThumb = (idx) => updateQuickViewGallery(idx);

        // Gestos táctiles dentro del modal
        const stage = document.getElementById('qv-gallery-stage');
        let touchX = 0;
        stage.ontouchstart = (e) => { touchX = e.changedTouches[0].clientX; };
        stage.ontouchend = (e) => {
            const dx = e.changedTouches[0].clientX - touchX;
            if (Math.abs(dx) > 35 && qvImages.length > 1) {
                updateQuickViewGallery(qvCurrentIdx + (dx < 0 ? 1 : -1));
            }
        };

        updateQuickViewGallery(0);
        if (window.jQuery) {
            $('#carQuickViewModal').modal('show');
        }
    };

    window.getCarImages = getCarImages;
    window.getCarRealRatingStats = getCarRealRatingStats;
    window.renderCarCardHTML = renderCarCardHTML;
    window.initCarCardCarousels = initCarCardCarousels;
})();
