/**
 * Rent-Easy Marketplace - Panel de Control del Propietario (Host)
 * Gestión de vehículos, solicitudes de alquiler y cálculo de comisiones (15% plataforma / 85% anfitrión)
 */

document.addEventListener('DOMContentLoaded', function () {
    // 1. Validar y cargar sesión del propietario
    const currentUser = getOrSetHostSession();
    document.getElementById('nav-user-name').innerText = currentUser.name || 'Propietario';

    // 2. Inicializar base de datos local si no existe
    initDefaultCars();
    initDefaultBookings();

    // 3. Renderizar vista inicial
    renderDashboardStats();
    renderOwnerCars();
    renderBookingRequests();
    renderWalletStats();
    setupWorkflowModals();

    // 4. Manejo de cambio de imagen en tiempo real
    const selectImg = document.getElementById('car-template-img');
    const customUrl = document.getElementById('car-custom-url');
    const imgPreview = document.getElementById('car-img-preview');
    const carFileInput = document.getElementById('car-photo-file');
    const carFileLabel = document.getElementById('car-photo-label');
    const carRealData = document.getElementById('car-real-photo-data');

    if (carFileInput) {
        carFileInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (!file) return;

            if (carFileLabel) carFileLabel.innerText = file.name;

            const reader = new FileReader();
            reader.onload = function (event) {
                const img = new Image();
                img.onload = function () {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 640;
                    const MAX_HEIGHT = 440;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height = Math.round((height * MAX_WIDTH) / width);
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width = Math.round((width * MAX_HEIGHT) / height);
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const optimizedData = canvas.toDataURL('image/jpeg', 0.85);
                    if (imgPreview) imgPreview.src = optimizedData;
                    if (carRealData) carRealData.value = optimizedData;
                    if (customUrl) customUrl.value = '';
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    if (selectImg && imgPreview) {
        selectImg.addEventListener('change', function () {
            if (!customUrl.value.trim() && (!carRealData || !carRealData.value)) {
                imgPreview.src = this.value;
            }
        });
    }

    if (customUrl && imgPreview) {
        customUrl.addEventListener('input', function () {
            if (this.value.trim()) {
                imgPreview.src = this.value.trim();
                if (carRealData) carRealData.value = '';
                if (carFileLabel) carFileLabel.innerText = 'Elegir foto de tu vehículo...';
            } else if (carRealData && carRealData.value) {
                imgPreview.src = carRealData.value;
            } else {
                imgPreview.src = selectImg.value;
            }
        });
    }

    // 5. Publicar Nuevo Vehículo
    const publishForm = document.getElementById('form-publish-car');
    if (publishForm) {
        publishForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const brand = document.getElementById('car-brand').value.trim();
            const model = document.getElementById('car-model').value.trim();
            const year = parseInt(document.getElementById('car-year').value);
            const category = document.getElementById('car-category').value;
            const transmission = document.getElementById('car-transmission').value;
            const fuel = document.getElementById('car-fuel').value;
            const seats = parseInt(document.getElementById('car-seats').value);
            const price = parseInt(document.getElementById('car-price').value);
            const city = document.getElementById('car-city').value;
            const mileage = document.getElementById('car-mileage').value.trim();
            const description = document.getElementById('car-description').value.trim();
            
            const image = (carRealData && carRealData.value) ? carRealData.value : (customUrl.value.trim() ? customUrl.value.trim() : selectImg.value);

            const newCar = {
                id: 'car_' + Date.now(),
                ownerId: currentUser.id,
                ownerName: currentUser.name,
                ownerPhone: currentUser.phone || '+57 316 235 7871',
                brand: brand,
                model: model,
                fullName: `${brand} ${model}`,
                year: year,
                category: category,
                transmission: transmission,
                fuel: fuel,
                seats: seats,
                pricePerDay: price,
                city: city,
                mileage: mileage,
                description: description || 'Vehículo en óptimas condiciones mecánicas y estéticas para alquiler.',
                image: image,
                status: 'Activo', // 'Activo', 'En Renta', 'Pausado'
                createdAt: new Date().toISOString()
            };

            const cars = getAllCars();
            cars.unshift(newCar);
            localStorage.setItem('renteasy_cars', JSON.stringify(cars));

            alert(`¡Excelente! Tu vehículo "${newCar.fullName}" ha sido enviado a revisión en Rent Car Colombia. Una vez validado por el administrador, se publicará en el catálogo.`);

            // Limpiar formulario y volver a la lista
            publishForm.reset();
            if (carRealData) carRealData.value = '';
            if (carFileLabel) carFileLabel.innerText = 'Elegir foto de tu vehículo...';
            imgPreview.src = 'img/car-rent-1.png';
            $('#tab-cars-btn').tab('show');

            renderDashboardStats();
            renderOwnerCars();
        });
    }

    // 6. Cerrar Sesión
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', function (e) {
            e.preventDefault();
            localStorage.removeItem('renteasy_current_user');
            window.location.href = 'LOGIN.html';
        });
    }

    // ================= FUNCIONES DE RENDERIZADO ================= //

    function renderOwnerCars() {
        const grid = document.getElementById('cars-grid');
        if (!grid) return;

        const cars = getAllCars().filter(c => c.ownerId === currentUser.id);

        if (cars.length === 0) {
            grid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="bg-white p-5 rounded-lg shadow-sm">
                        <i class="fa fa-car-side text-muted mb-3" style="font-size: 50px;"></i>
                        <h4 class="text-dark">Aún no has publicado ningún vehículo</h4>
                        <p class="text-muted">Comienza a ganar dinero poniendo a trabajar tu auto en los días que no lo usas.</p>
                        <button class="btn btn-primary font-weight-bold px-4 py-2 mt-2" onclick="$('#tab-publish-btn').tab('show');">
                            <i class="fa fa-plus-circle mr-1"></i> Publicar mi Primer Auto
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        grid.innerHTML = cars.map(car => `
            <div class="col-lg-4 col-md-6">
                <div class="car-manage-card">
                    <div class="position-relative">
                        <img src="${car.image}" alt="${car.fullName}" class="car-manage-img" onerror="this.src='img/car-rent-1.png'">
                        <span class="position-absolute badge-status ${car.status === 'Activo' ? 'badge-active' : 'badge-rented'}" style="top: 12px; right: 12px;">
                            ${car.status}
                        </span>
                        <span class="position-absolute badge badge-dark px-2 py-1" style="bottom: 10px; left: 10px;">
                            <i class="fa fa-map-marker-alt text-primary mr-1"></i> ${car.city}
                        </span>
                    </div>
                    <div class="p-3">
                        <h5 class="font-weight-bold text-dark mb-1">${car.fullName}</h5>
                        <p class="small text-muted mb-3"><i class="fa fa-tag mr-1 text-primary"></i> ${car.category} &bull; Modelo ${car.year}</p>
                        
                        <div class="d-flex justify-content-between align-items-center bg-light p-2 rounded mb-3 text-center small">
                            <div>
                                <i class="fa fa-cog text-primary"></i>
                                <span class="d-block text-muted font-weight-semi-bold">${car.transmission}</span>
                            </div>
                            <div class="border-left border-right px-2">
                                <i class="fa fa-gas-pump text-primary"></i>
                                <span class="d-block text-muted font-weight-semi-bold">${car.fuel}</span>
                            </div>
                            <div>
                                <i class="fa fa-user-friends text-primary"></i>
                                <span class="d-block text-muted font-weight-semi-bold">${car.seats} puestos</span>
                            </div>
                        </div>

                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <span class="text-muted small">Precio diario:</span>
                                <h6 class="text-primary font-weight-bold mb-0">$${formatCurrency(car.pricePerDay)} COP</h6>
                            </div>
                            <div class="text-right">
                                <span class="text-muted small">Tu ingreso neto (85%):</span>
                                <h6 class="text-success font-weight-bold mb-0">$${formatCurrency(Math.round(car.pricePerDay * 0.85))} COP</h6>
                            </div>
                        </div>

                        <div class="d-flex justify-content-between pt-2 border-top">
                            <button class="btn btn-sm btn-outline-secondary" onclick="toggleCarStatus('${car.id}')">
                                <i class="fa fa-power-off mr-1"></i> ${car.status === 'Activo' ? 'Pausar' : 'Activar'}
                            </button>
                            <a href="detail.html?id=${car.id}" class="btn btn-sm btn-outline-primary" target="_blank">
                                <i class="fa fa-eye mr-1"></i> Vista previa
                            </a>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteCar('${car.id}')">
                                <i class="fa fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function renderBookingRequests() {
        const tbody = document.getElementById('requests-tbody');
        const badgePending = document.getElementById('badge-pending-count');
        if (!tbody) return;

        const allBookings = getAllBookings();
        // Mostrar solicitudes asignadas al anfitrión actual o de demostración
        const bookings = allBookings.filter(b => b.ownerId === currentUser.id || !b.ownerId || b.ownerId === 'usr_demo_host');
        const pendingCount = bookings.filter(b => b.status === 'Pendiente').length;
        if (badgePending) badgePending.innerText = pendingCount;

        if (bookings.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4 text-muted">
                        <i class="fa fa-inbox mb-2" style="font-size: 28px;"></i><br>
                        No tienes solicitudes de alquiler por el momento.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = bookings.map(b => {
            const cleanPhone = (b.renterPhone || '').replace(/\D/g, '');
            const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('57') ? cleanPhone : '57' + cleanPhone}?text=${encodeURIComponent('Hola ' + b.renterName + ', te contacto desde Rent Car Colombia respecto a tu reserva #' + b.id + ' para el vehículo ' + b.carName + '.')}` : '#';

            let statusBadge = '';
            if (b.status === 'Pendiente') statusBadge = '<span class="badge badge-warning px-2 py-1"><i class="fa fa-clock mr-1"></i> Pendiente</span>';
            else if (b.status === 'Aceptada') statusBadge = '<span class="badge badge-info px-2 py-1"><i class="fa fa-check-circle mr-1"></i> Lista para Entrega</span>';
            else if (b.status === 'En Curso') statusBadge = '<span class="badge badge-primary px-2 py-1"><i class="fa fa-car mr-1"></i> Viaje Activo</span>';
            else if (b.status === 'Finalizada') statusBadge = '<span class="badge badge-success px-2 py-1"><i class="fa fa-check-double mr-1"></i> Finalizada</span>';
            else if (b.status === 'Rechazada') statusBadge = '<span class="badge badge-danger px-2 py-1"><i class="fa fa-times mr-1"></i> Rechazada</span>';
            else statusBadge = `<span class="badge badge-secondary px-2 py-1">${b.status}</span>`;

            // Pago
            let payBadge = '';
            if (b.paymentMethod === 'wompi') {
                payBadge = '<span class="badge badge-success small mb-1"><i class="fa fa-credit-card mr-1"></i> Wompi PSE</span>';
            } else {
                payBadge = '<span class="badge badge-info small mb-1"><i class="fa fa-university mr-1"></i> Transferencia</span>';
            }

            const receiptBtn = b.paymentReceipt ? `
                <button type="button" class="btn btn-xs btn-outline-primary py-0 px-2 d-block mt-1 font-weight-bold" onclick="viewReceiptModal('${b.id}')">
                    <i class="fa fa-receipt mr-1"></i> Ver Comprobante
                </button>
            ` : '';

            // Acciones según estado
            let actionHtml = '';
            if (b.status === 'Pendiente') {
                actionHtml = `
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-success font-weight-bold" onclick="updateBookingStatus('${b.id}', 'Aceptada')">
                            <i class="fa fa-check mr-1"></i> Aceptar
                        </button>
                        <button class="btn btn-outline-danger" onclick="updateBookingStatus('${b.id}', 'Rechazada')">
                            <i class="fa fa-times"></i>
                        </button>
                    </div>
                `;
            } else if (b.status === 'Aceptada') {
                actionHtml = `
                    <button class="btn btn-sm btn-primary font-weight-bold shadow-sm" onclick="openCheckInModal('${b.id}')">
                        <i class="fa fa-key mr-1"></i> Entregar (Check-in)
                    </button>
                `;
            } else if (b.status === 'En Curso') {
                actionHtml = `
                    <button class="btn btn-sm btn-success font-weight-bold shadow-sm" onclick="openCheckOutModal('${b.id}')">
                        <i class="fa fa-flag-checkered mr-1"></i> Recibir (Check-out)
                    </button>
                `;
            } else if (b.status === 'Finalizada') {
                actionHtml = `
                    <button class="btn btn-sm btn-outline-secondary font-weight-bold" onclick="viewActaModal('${b.id}')">
                        <i class="fa fa-file-contract mr-1"></i> Ver Acta Digital
                    </button>
                `;
            } else {
                actionHtml = '<span class="small text-muted font-italic">Cerrada</span>';
            }

            return `
                <tr>
                    <td>
                        <div class="font-weight-bold text-dark">${b.renterName}</div>
                        <div class="small text-muted mb-1">
                            <i class="fa fa-id-badge text-primary mr-1"></i> Lic: ${b.renterLicense || 'Verificada'}
                        </div>
                        ${cleanPhone ? `
                            <a href="${waLink}" target="_blank" class="btn btn-xs btn-outline-success py-0 px-2 font-weight-bold">
                                <i class="fab fa-whatsapp mr-1"></i> Chat WhatsApp
                            </a>
                        ` : ''}
                    </td>
                    <td>
                        <div class="font-weight-bold text-dark">${b.carName}</div>
                        <small class="badge badge-light border"><i class="fa fa-map-marker-alt text-primary mr-1"></i> ${b.carCity}</small>
                        <small class="text-muted d-block font-italic">ID: #${b.id.substring(0, 10)}</small>
                    </td>
                    <td>
                        <div class="small font-weight-bold">${b.startDate} al ${b.endDate}</div>
                        <small class="text-primary font-weight-bold">${b.totalDays} ${b.totalDays === 1 ? 'día' : 'días'}</small>
                    </td>
                    <td>
                        <div class="font-weight-bold text-dark mb-1">$${formatCurrency(b.totalPrice)} COP</div>
                        ${payBadge}
                        ${receiptBtn}
                    </td>
                    <td>
                        <h6 class="text-success font-weight-bold mb-0">$${formatCurrency(b.ownerEarnings || Math.round(b.subtotal * 0.85))} COP</h6>
                        <small class="text-muted">(85% neto del alquiler)</small>
                    </td>
                    <td>
                        ${statusBadge}
                    </td>
                    <td class="text-right">
                        ${actionHtml}
                    </td>
                </tr>
            `;
        }).join('');
    }

    function renderDashboardStats() {
        const cars = getAllCars().filter(c => c.ownerId === currentUser.id);
        const allBookings = getAllBookings();
        const bookings = allBookings.filter(b => b.ownerId === currentUser.id || !b.ownerId || b.ownerId === 'usr_demo_host');

        const totalCarsEl = document.getElementById('stat-total-cars');
        const activeRentalsEl = document.getElementById('stat-active-rentals');
        const earningsEl = document.getElementById('stat-earnings');

        if (totalCarsEl) totalCarsEl.innerText = cars.length;
        
        const activeRentals = bookings.filter(b => b.status === 'Aceptada' || b.status === 'En Curso').length;
        if (activeRentalsEl) activeRentalsEl.innerText = activeRentals;

        // Calcular ganancias de reservas aceptadas, en curso o finalizadas
        const totalEarnings = bookings
            .filter(b => b.status === 'Aceptada' || b.status === 'En Curso' || b.status === 'Finalizada')
            .reduce((sum, b) => sum + (b.ownerEarnings || Math.round(b.subtotal * 0.85)), 0);

        if (earningsEl) earningsEl.innerText = `$${formatCurrency(totalEarnings)} COP`;
    }

    // ================= MÓDULO DE BILLETERA Y RETIROS ================= //
    function renderWalletStats() {
        const allBookings = getAllBookings();
        const bookings = allBookings.filter(b => b.ownerId === currentUser.id || !b.ownerId || b.ownerId === 'usr_demo_host');

        // Ganancias completadas
        const completedEarnings = bookings
            .filter(b => b.status === 'Finalizada' || b.status === 'En Curso')
            .reduce((sum, b) => sum + (b.ownerEarnings || Math.round(b.subtotal * 0.85)), 0);

        // Retiros ya solicitados o pagados
        const payouts = getPayouts().filter(p => p.ownerId === currentUser.id || p.ownerId === 'usr_demo_host');
        const withdrawnTotal = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);

        const availableBalance = Math.max(0, completedEarnings - withdrawnTotal);

        const balanceEl = document.getElementById('wallet-available-balance');
        const maxHintEl = document.getElementById('withdraw-max-hint');
        const inputAmount = document.getElementById('withdraw-amount');

        if (balanceEl) balanceEl.innerText = `$${formatCurrency(availableBalance)} COP`;
        if (maxHintEl) maxHintEl.innerText = `Monto máximo disponible: $${formatCurrency(availableBalance)} COP`;
        if (inputAmount) inputAmount.max = availableBalance;

        // Renderizar tabla de retiros
        const payoutsTbody = document.getElementById('wallet-payouts-tbody');
        if (payoutsTbody) {
            if (payouts.length === 0) {
                payoutsTbody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-muted">No has realizado solicitudes de retiro aún.</td></tr>`;
            } else {
                payoutsTbody.innerHTML = payouts.map(p => `
                    <tr>
                        <td>${new Date(p.createdAt).toLocaleDateString('es-CO')}</td>
                        <td class="font-weight-bold">#${p.id.toUpperCase()}</td>
                        <td class="font-weight-bold text-success">$${formatCurrency(p.amount)} COP</td>
                        <td>${p.destinationType} (${p.accountNumber})</td>
                        <td>
                            <span class="badge ${p.status === 'Transferido' ? 'badge-success' : 'badge-warning'} px-2 py-1">
                                ${p.status}
                            </span>
                        </td>
                    </tr>
                `).join('');
            }
        }
    }

    // ================= WORKFLOW DE ACTA DE ENTREGA (CHECK-IN) Y DEVOLUCIÓN (CHECK-OUT) ================= //
    let checkinPhotoBase64 = null;

    function setupWorkflowModals() {
        // Manejo de foto del odómetro en check-in
        const checkinPhotoInput = document.getElementById('checkin-photo-file');
        const checkinPhotoLabel = document.getElementById('checkin-photo-label');
        if (checkinPhotoInput) {
            checkinPhotoInput.addEventListener('change', function (e) {
                const file = e.target.files[0];
                if (!file) return;
                if (checkinPhotoLabel) checkinPhotoLabel.innerText = file.name;

                const reader = new FileReader();
                reader.onload = function (event) {
                    const img = new Image();
                    img.onload = function () {
                        const canvas = document.createElement('canvas');
                        const MAX_W = 600;
                        let w = img.width;
                        let h = img.height;
                        if (w > MAX_W) {
                            h = Math.round((h * MAX_W) / w);
                            w = MAX_W;
                        }
                        canvas.width = w;
                        canvas.height = h;
                        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                        checkinPhotoBase64 = canvas.toDataURL('image/jpeg', 0.8);
                        const hidden = document.getElementById('checkin-photo-data');
                        if (hidden) hidden.value = checkinPhotoBase64;
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            });
        }

        // Envío de Formulario de Check-in
        const formCheckin = document.getElementById('form-checkin');
        if (formCheckin) {
            formCheckin.addEventListener('submit', function (e) {
                e.preventDefault();
                const bookingId = document.getElementById('checkin-booking-id').value;
                const mileage = parseInt(document.getElementById('checkin-mileage').value);
                const fuel = document.getElementById('checkin-fuel').value;
                const notes = document.getElementById('checkin-notes').value.trim();

                const bookings = getAllBookings();
                const b = bookings.find(item => item.id === bookingId);
                if (!b) return;

                b.checkIn = {
                    date: new Date().toISOString(),
                    initialMileage: mileage,
                    initialFuel: fuel,
                    notes: notes || 'Vehículo entregado en perfecto estado.',
                    photo: checkinPhotoBase64 || null
                };
                b.status = 'En Curso';

                // Marcar el auto en renta
                const cars = getAllCars();
                const car = cars.find(c => c.id === b.carId);
                if (car) {
                    car.status = 'En Renta';
                    localStorage.setItem('renteasy_cars', JSON.stringify(cars));
                }

                localStorage.setItem('renteasy_bookings', JSON.stringify(bookings));
                $('#modalCheckIn').modal('hide');
                formCheckin.reset();
                checkinPhotoBase64 = null;

                renderDashboardStats();
                renderOwnerCars();
                renderBookingRequests();
                renderWalletStats();

                alert(`¡Acta de entrega firmada con éxito! El auto ${b.carName} ha sido entregado a ${b.renterName} y se encuentra en viaje activo.`);
            });
        }

        // Envío de Formulario de Check-out
        const formCheckout = document.getElementById('form-checkout');
        if (formCheckout) {
            formCheckout.addEventListener('submit', function (e) {
                e.preventDefault();
                const bookingId = document.getElementById('checkout-booking-id').value;
                const mileage = parseInt(document.getElementById('checkout-mileage').value);
                const fuel = document.getElementById('checkout-fuel').value;
                const notes = document.getElementById('checkout-notes').value.trim();
                const depositAction = document.getElementById('checkout-deposit-action').value;

                const bookings = getAllBookings();
                const b = bookings.find(item => item.id === bookingId);
                if (!b) return;

                const initialKm = b.checkIn ? b.checkIn.initialMileage : mileage;
                const distanceKm = Math.max(0, mileage - initialKm);

                b.checkOut = {
                    date: new Date().toISOString(),
                    finalMileage: mileage,
                    totalKmTravelled: distanceKm,
                    finalFuel: fuel,
                    notes: notes || 'Vehículo devuelto conforme.',
                    depositAction: depositAction,
                    depositStatus: depositAction === 'liberar' ? 'Liberada 100%' : 'Retenida en Revisión'
                };
                b.status = 'Finalizada';

                // Regresar el auto a disponible
                const cars = getAllCars();
                const car = cars.find(c => c.id === b.carId);
                if (car) {
                    car.status = 'Activo';
                    localStorage.setItem('renteasy_cars', JSON.stringify(cars));
                }

                localStorage.setItem('renteasy_bookings', JSON.stringify(bookings));
                $('#modalCheckOut').modal('hide');
                formCheckout.reset();

                renderDashboardStats();
                renderOwnerCars();
                renderBookingRequests();
                renderWalletStats();

                alert(`¡Alquiler #${b.id} finalizado con éxito! Se registraron ${distanceKm} km recorridos. Tu ganancia de $${formatCurrency(b.ownerEarnings)} COP ha sido acreditada a tu saldo disponible.`);
            });
        }

        // Envío de Formulario de Retiro de Fondos
        const formWithdrawal = document.getElementById('form-withdrawal');
        if (formWithdrawal) {
            formWithdrawal.addEventListener('submit', function (e) {
                e.preventDefault();
                const amount = parseInt(document.getElementById('withdraw-amount').value);
                const destType = document.getElementById('withdraw-destination-type').value;
                const accNum = document.getElementById('withdraw-account-number').value.trim();
                const accHolder = document.getElementById('withdraw-account-holder').value.trim();

                const allBookings = getAllBookings();
                const bookings = allBookings.filter(b => b.ownerId === currentUser.id || !b.ownerId || b.ownerId === 'usr_demo_host');
                const completedEarnings = bookings
                    .filter(b => b.status === 'Finalizada' || b.status === 'En Curso')
                    .reduce((sum, b) => sum + (b.ownerEarnings || Math.round(b.subtotal * 0.85)), 0);

                const payouts = getPayouts().filter(p => p.ownerId === currentUser.id || p.ownerId === 'usr_demo_host');
                const withdrawnTotal = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);
                const availableBalance = Math.max(0, completedEarnings - withdrawnTotal);

                if (amount > availableBalance) {
                    alert(`El monto ingresado ($${formatCurrency(amount)} COP) supera tu saldo disponible ($${formatCurrency(availableBalance)} COP).`);
                    return;
                }

                const newPayout = {
                    id: 'pay_' + Date.now(),
                    ownerId: currentUser.id,
                    ownerName: currentUser.name,
                    amount: amount,
                    destinationType: destType,
                    accountNumber: accNum,
                    accountHolder: accHolder,
                    status: 'En Proceso', // 'En Proceso', 'Transferido'
                    createdAt: new Date().toISOString()
                };

                const allPayouts = getPayouts();
                allPayouts.unshift(newPayout);
                savePayouts(allPayouts);

                $('#modalWithdrawal').modal('hide');
                formWithdrawal.reset();
                renderWalletStats();

                alert(`¡Solicitud de retiro por $${formatCurrency(amount)} COP recibida! Se transferirá a tu cuenta ${destType} en las próximas 24 horas.`);
            });
        }
    }

    // ================= HELPERS GLOBALES ================= //

    window.toggleCarStatus = function (carId) {
        const cars = getAllCars();
        const car = cars.find(c => c.id === carId);
        if (car) {
            car.status = car.status === 'Activo' ? 'Pausado' : 'Activo';
            localStorage.setItem('renteasy_cars', JSON.stringify(cars));
            renderOwnerCars();
        }
    };

    window.deleteCar = function (carId) {
        if (confirm('¿Estás seguro de que deseas eliminar este vehículo de tu catálogo?')) {
            let cars = getAllCars();
            cars = cars.filter(c => c.id !== carId);
            localStorage.setItem('renteasy_cars', JSON.stringify(cars));
            renderDashboardStats();
            renderOwnerCars();
        }
    };

    window.updateBookingStatus = function (bookingId, newStatus) {
        const bookings = getAllBookings();
        const b = bookings.find(item => item.id === bookingId);
        if (b) {
            b.status = newStatus;
            localStorage.setItem('renteasy_bookings', JSON.stringify(bookings));
            
            // Si se acepta la reserva, el auto pasa a estado 'En Renta'
            if (newStatus === 'Aceptada') {
                const cars = getAllCars();
                const car = cars.find(c => c.id === b.carId);
                if (car) {
                    car.status = 'En Renta';
                    localStorage.setItem('renteasy_cars', JSON.stringify(cars));
                }
            }
            
            renderDashboardStats();
            renderOwnerCars();
            renderBookingRequests();
            renderWalletStats();
        }
    };

    window.openCheckInModal = function (bookingId) {
        const bookings = getAllBookings();
        const b = bookings.find(item => item.id === bookingId);
        if (!b) return;

        document.getElementById('checkin-booking-id').value = b.id;
        document.getElementById('checkin-header-info').innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="font-weight-bold text-dark"><i class="fa fa-car text-primary mr-1"></i> ${b.carName}</span>
                <span class="badge badge-primary">#${b.id.toUpperCase()}</span>
            </div>
            <div class="small text-muted">
                <strong>Conductor:</strong> ${b.renterName} &bull; <strong>Tel:</strong> ${b.renterPhone}<br>
                <strong>Fechas:</strong> ${b.startDate} al ${b.endDate} (${b.totalDays} días)
            </div>
        `;
        $('#modalCheckIn').modal('show');
    };

    window.openCheckOutModal = function (bookingId) {
        const bookings = getAllBookings();
        const b = bookings.find(item => item.id === bookingId);
        if (!b) return;

        document.getElementById('checkout-booking-id').value = b.id;
        const initialKm = b.checkIn ? b.checkIn.initialMileage : 'No registrado';
        const initialFuel = b.checkIn ? b.checkIn.initialFuel : 'No registrado';

        document.getElementById('checkout-initial-compare').innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-1 font-weight-bold">
                <span>Vehículo: ${b.carName}</span>
                <span>Conductor: ${b.renterName}</span>
            </div>
            <hr class="my-1">
            <div class="row">
                <div class="col-6"><strong>Km de salida (Check-in):</strong> ${initialKm} km</div>
                <div class="col-6"><strong>Gasolina de salida:</strong> ${initialFuel}</div>
            </div>
        `;

        const inputFinalKm = document.getElementById('checkout-mileage');
        const diffLabel = document.getElementById('checkout-km-diff');
        if (inputFinalKm) {
            inputFinalKm.min = typeof initialKm === 'number' ? initialKm : 0;
            inputFinalKm.addEventListener('input', function () {
                const final = parseInt(this.value);
                if (!isNaN(final) && typeof initialKm === 'number') {
                    const diff = Math.max(0, final - initialKm);
                    if (diffLabel) diffLabel.innerText = `Distancia recorrida en el viaje: ${diff} km`;
                }
            });
        }

        $('#modalCheckOut').modal('show');
    };

    window.viewReceiptModal = function (bookingId) {
        const bookings = getAllBookings();
        const b = bookings.find(item => item.id === bookingId);
        if (!b) return;

        const imgEl = document.getElementById('view-receipt-img');
        const detailsEl = document.getElementById('view-receipt-details');

        if (b.paymentReceipt) {
            imgEl.src = b.paymentReceipt;
            imgEl.style.display = 'inline-block';
        } else {
            imgEl.style.display = 'none';
        }

        detailsEl.innerHTML = `
            <div class="d-flex justify-content-between mb-1">
                <span>Reserva:</span> <strong>#${b.id.toUpperCase()}</strong>
            </div>
            <div class="d-flex justify-content-between mb-1">
                <span>Conductor:</span> <strong>${b.renterName}</strong>
            </div>
            <div class="d-flex justify-content-between mb-1">
                <span>Monto pagado:</span> <strong class="text-primary">$${formatCurrency(b.totalPrice)} COP</strong>
            </div>
            <div class="d-flex justify-content-between">
                <span>Método:</span> <strong>${b.paymentMethod === 'wompi' ? 'Wompi PSE / Tarjeta' : 'Transferencia Bancaria'}</strong>
            </div>
        `;

        $('#modalViewReceipt').modal('show');
    };

    window.viewActaModal = function (bookingId) {
        const bookings = getAllBookings();
        const b = bookings.find(item => item.id === bookingId);
        if (!b) return;

        const content = document.getElementById('view-acta-content');
        if (!content) return;

        const ci = b.checkIn || {};
        const co = b.checkOut || {};

        content.innerHTML = `
            <div class="border rounded p-3 bg-light mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                    <h6 class="font-weight-bold text-primary mb-0">${b.carName}</h6>
                    <span class="badge badge-success px-2 py-1">Alquiler Finalizado</span>
                </div>
                <div class="row small">
                    <div class="col-md-6 mb-1"><strong>Código de Reserva:</strong> #${b.id.toUpperCase()}</div>
                    <div class="col-md-6 mb-1"><strong>Conductor:</strong> ${b.renterName} (${b.renterPhone})</div>
                    <div class="col-md-6 mb-1"><strong>Fechas:</strong> ${b.startDate} al ${b.endDate}</div>
                    <div class="col-md-6 mb-1"><strong>Total Liquidado:</strong> $${formatCurrency(b.totalPrice)} COP</div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-6 mb-3">
                    <div class="card border rounded h-100">
                        <div class="card-header bg-white font-weight-bold py-2 small text-dark">
                            <i class="fa fa-key text-primary mr-1"></i> Acta de Entrega (Check-in)
                        </div>
                        <div class="card-body p-3 small">
                            <div class="mb-1"><strong>Fecha:</strong> ${ci.date ? new Date(ci.date).toLocaleString('es-CO') : 'N/A'}</div>
                            <div class="mb-1"><strong>Kilometraje inicial:</strong> ${ci.initialMileage || 'N/A'} km</div>
                            <div class="mb-1"><strong>Gasolina inicial:</strong> ${ci.initialFuel || 'N/A'}</div>
                            <div class="mb-2"><strong>Notas de entrega:</strong> ${ci.notes || 'Sin novedades'}</div>
                            ${ci.photo ? `<img src="${ci.photo}" alt="Odómetro inicial" class="img-thumbnail mt-2" style="max-height: 120px;">` : ''}
                        </div>
                    </div>
                </div>

                <div class="col-md-6 mb-3">
                    <div class="card border rounded h-100">
                        <div class="card-header bg-white font-weight-bold py-2 small text-dark">
                            <i class="fa fa-flag-checkered text-success mr-1"></i> Acta de Devolución (Check-out)
                        </div>
                        <div class="card-body p-3 small">
                            <div class="mb-1"><strong>Fecha:</strong> ${co.date ? new Date(co.date).toLocaleString('es-CO') : 'N/A'}</div>
                            <div class="mb-1"><strong>Kilometraje final:</strong> ${co.finalMileage || 'N/A'} km</div>
                            <div class="mb-1"><strong>Distancia recorrida:</strong> <span class="text-primary font-weight-bold">${co.totalKmTravelled || 0} km</span></div>
                            <div class="mb-1"><strong>Gasolina final:</strong> ${co.finalFuel || 'N/A'}</div>
                            <div class="mb-1"><strong>Estado fianza:</strong> <span class="badge badge-success">${co.depositStatus || 'Liberada'}</span></div>
                            <div><strong>Notas de devolución:</strong> ${co.notes || 'Conforme'}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        $('#modalViewActa').modal('show');
    };

    function getPayouts() {
        try {
            return JSON.parse(localStorage.getItem('renteasy_payouts')) || [];
        } catch (e) {
            return [];
        }
    }

    function savePayouts(p) {
        localStorage.setItem('renteasy_payouts', JSON.stringify(p));
    }

    function getAllCars() {
        try {
            return JSON.parse(localStorage.getItem('renteasy_cars')) || [];
        } catch (e) {
            return [];
        }
    }

    function getAllBookings() {
        try {
            return JSON.parse(localStorage.getItem('renteasy_bookings')) || [];
        } catch (e) {
            return [];
        }
    }

    function formatCurrency(amount) {
        return Number(amount || 0).toLocaleString('es-CO');
    }

    function getOrSetHostSession() {
        let user = null;
        try {
            user = JSON.parse(localStorage.getItem('renteasy_current_user'));
        } catch (e) {}

        if (!user || user.role !== 'propietario') {
            // Usuario anfitrión por defecto para pruebas
            user = {
                id: 'usr_demo_host',
                name: 'Carlos Mendoza',
                email: 'propietario@ejemplo.com',
                phone: '+57 316 235 7871',
                role: 'propietario',
                city: 'Bogotá'
            };
            localStorage.setItem('renteasy_current_user', JSON.stringify(user));
        }
        return user;
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

    function initDefaultBookings() {
        if (!localStorage.getItem('renteasy_bookings')) {
            const initialBookings = [
                {
                    id: 'book_101',
                    carId: 'car_1',
                    carName: 'Mazda CX-30 (2023)',
                    carCity: 'Bogotá',
                    ownerId: 'usr_demo_host',
                    renterName: 'Laura Gómez',
                    renterPhone: '+57 311 987 6543',
                    renterEmail: 'conductor@ejemplo.com',
                    startDate: '2026-11-28',
                    endDate: '2026-12-01',
                    totalDays: 3,
                    dailyRate: 220000,
                    totalPrice: 660000,
                    platformFee: 99000, // 15%
                    ownerEarnings: 561000, // 85%
                    status: 'Pendiente',
                    createdAt: new Date().toISOString()
                }
            ];
            localStorage.setItem('renteasy_bookings', JSON.stringify(initialBookings));
        }
    }
});
