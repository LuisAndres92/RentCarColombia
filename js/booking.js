/**
 * Rent Car Colombia - Lógica de Reserva, Checkout y Contrato Digital
 * Sincronizado dinámicamente con comisiones, fianza, cuentas bancarias y cupones promocionales
 */

document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const carId = urlParams.get('id');
    const paramStart = urlParams.get('start');
    const paramEnd = urlParams.get('end');
    const paramCoupon = urlParams.get('coupon');

    // Cargar configuración global del sitio (pagos, comisiones, cuentas y cupones)
    const siteConfig = typeof getSiteConfig === 'function' ? getSiteConfig() : (window.DEFAULT_CONFIG || {});
    const paymentsCfg = siteConfig.payments || siteConfig.payment || {
        commissionPercent: 15,
        defaultDeposit: 200000,
        bankName: "Bancolombia",
        bankAccountType: "Ahorros",
        bankAccountNumber: "542-000000-00",
        bankAccountHolder: "Rent Car Colombia",
        nequiAccount: "3162357871",
        daviplataAccount: "3162357871"
    };

    const commissionPercent = Number(paymentsCfg.commissionPercent || 15);
    const defaultDeposit = Number(paymentsCfg.defaultDeposit || 200000);

    const allCars = getStoredCars();
    let car = allCars.find(c => c.id === carId) || allCars[0];

    // Control de acceso: Para rentar un vehículo se DEBE contar con una sesión activa
    const currentUser = getCurrentUser();
    if (!currentUser || (!currentUser.email && !currentUser.name && !currentUser.id)) {
        alert('Para rentar un vehículo en Rent Car Colombia debes iniciar sesión o crear tu cuenta de conductor.');
        const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.replace(`LOGIN.html?action=register&role=conductor&redirect=${returnUrl}`);
        return;
    }

    // Referencias DOM Vehículo
    const bookTitle = document.getElementById('book-car-title');
    const bookPrice = document.getElementById('book-car-price');
    const bookImg = document.getElementById('book-car-img');
    const bookCity = document.getElementById('book-car-city');
    const bookOwner = document.getElementById('book-car-owner');

    // Referencias DOM Conductor
    const inputName = document.getElementById('book-renter-name');
    const inputEmail = document.getElementById('book-renter-email');
    const inputPhone = document.getElementById('book-renter-phone');
    const inputLicense = document.getElementById('book-renter-license');

    // Pre-llenar datos del conductor si ya ha iniciado sesión
    if (currentUser) {
        if (inputName && !inputName.value) inputName.value = currentUser.name || '';
        if (inputEmail && !inputEmail.value) inputEmail.value = currentUser.email || '';
        if (inputPhone && !inputPhone.value) inputPhone.value = currentUser.phone || '';
    }

    // Fechas
    const inputStart = document.getElementById('book-start-date');
    const inputEnd = document.getElementById('book-end-date');

    // Resumen Financiero
    const summaryDays = document.getElementById('summary-days');
    const summarySubtotal = document.getElementById('summary-subtotal');
    const rowDiscount = document.getElementById('row-discount');
    const summaryDiscountName = document.getElementById('summary-discount-name');
    const summaryDiscountVal = document.getElementById('summary-discount-val');
    const summaryFeeLabel = document.getElementById('summary-fee-label');
    const summaryFee = document.getElementById('summary-fee');
    const summaryDeposit = document.getElementById('summary-deposit');
    const summaryTotal = document.getElementById('summary-total');

    // Cupón en Checkout
    const inputCoupon = document.getElementById('checkout-coupon-code');
    const btnApplyCoupon = document.getElementById('btn-apply-checkout-coupon');
    const couponFeedback = document.getElementById('checkout-coupon-feedback');

    // Métodos de Pago
    const payWompi = document.getElementById('pay-wompi');
    const payTransfer = document.getElementById('pay-transfer');
    const transferDetailsBox = document.getElementById('transfer-details-box');
    const fileReceipt = document.getElementById('book-receipt-file');
    const labelReceipt = document.getElementById('book-receipt-label');
    const previewContainer = document.getElementById('receipt-preview-container');
    const previewImg = document.getElementById('receipt-preview-img');
    let receiptBase64 = null;

    // Estado del cupón aplicado
    let activeAppliedCoupon = null; // { code, discountPercent, formattedExpiry }

    // Rellenar datos del vehículo
    if (car) {
        if (bookTitle) bookTitle.innerText = `${car.fullName} (${car.year})`;
        if (bookPrice) bookPrice.innerText = `$${formatPrice(car.pricePerDay)} COP / día`;
        if (bookImg) {
            bookImg.src = car.image;
            bookImg.onerror = function () { this.src = 'img/car-rent-1.png'; };
        }
        if (bookCity) bookCity.innerText = car.city;
        if (bookOwner) bookOwner.innerText = car.ownerName || 'Anfitrión Verificado';
    }

    // Rellenar cuentas de transferencia bancaria
    const elNequi = document.getElementById('pay-val-nequi');
    const elDaviplata = document.getElementById('pay-val-daviplata');
    const elBankName = document.getElementById('pay-val-bank-name');
    const elBankType = document.getElementById('pay-val-bank-type');
    const elBankNum = document.getElementById('pay-val-bank-num');
    const elBankHolder = document.getElementById('pay-val-bank-holder');

    if (elNequi) elNequi.innerText = paymentsCfg.nequiAccount || '3162357871';
    if (elDaviplata) elDaviplata.innerText = paymentsCfg.daviplataAccount || '3162357871';
    if (elBankName) elBankName.innerText = paymentsCfg.bankName || 'Bancolombia';
    if (elBankType) elBankType.innerText = paymentsCfg.bankAccountType || 'Ahorros';
    if (elBankNum) elBankNum.innerText = paymentsCfg.bankAccountNumber || '542-000000-00';
    if (elBankHolder) elBankHolder.innerText = paymentsCfg.bankAccountHolder || 'Rent Car Colombia';

    // Manejo de botones "Copiar" cuentas bancarias
    document.querySelectorAll('.btn-copy-account').forEach(btn => {
        btn.addEventListener('click', function () {
            const targetSel = this.getAttribute('data-copy-target');
            const targetEl = document.querySelector(targetSel);
            if (targetEl) {
                const text = targetEl.innerText.trim();
                navigator.clipboard.writeText(text).then(() => {
                    const original = this.innerText;
                    this.innerText = '¡Copiado!';
                    this.classList.replace('btn-outline-secondary', 'btn-success');
                    setTimeout(() => {
                        this.innerText = original;
                        this.classList.replace('btn-success', 'btn-outline-secondary');
                    }, 2000);
                });
            }
        });
    });

    // Toggle de Métodos de Pago
    function updatePaymentMethodVisibility() {
        if (payTransfer && payTransfer.checked) {
            if (transferDetailsBox) transferDetailsBox.style.display = 'block';
        } else {
            if (transferDetailsBox) transferDetailsBox.style.display = 'none';
        }
    }
    if (payWompi) payWompi.addEventListener('change', updatePaymentMethodVisibility);
    if (payTransfer) payTransfer.addEventListener('change', updatePaymentMethodVisibility);
    updatePaymentMethodVisibility();

    // Subida y compresión de comprobante
    if (fileReceipt) {
        fileReceipt.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (!file) return;

            if (labelReceipt) labelReceipt.innerText = file.name;

            const reader = new FileReader();
            reader.onload = function (event) {
                const img = new Image();
                img.onload = function () {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 700;
                    let width = img.width;
                    let height = img.height;

                    if (width > MAX_WIDTH) {
                        height = Math.round((height * MAX_WIDTH) / width);
                        width = MAX_WIDTH;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    receiptBase64 = canvas.toDataURL('image/jpeg', 0.8);

                    if (previewImg) previewImg.src = receiptBase64;
                    if (previewContainer) previewContainer.style.display = 'block';
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // Auto-completar datos si el usuario está logueado
    if (currentUser) {
        if (inputName && !inputName.value) inputName.value = currentUser.name || '';
        if (inputEmail && !inputEmail.value) inputEmail.value = currentUser.email || '';
        if (inputPhone && !inputPhone.value) inputPhone.value = currentUser.phone || '';
        if (inputLicense && !inputLicense.value && currentUser.license) inputLicense.value = currentUser.license;

        // Auto-aplicar cupón guardado en perfil del usuario
        if (currentUser.appliedCoupon) {
            applyCoupon(currentUser.appliedCoupon, false);
        }
    }

    // Si viene cupón en la URL
    if (paramCoupon) {
        applyCoupon(paramCoupon, true);
    }

    // Fechas por defecto
    const today = new Date().toISOString().split('T')[0];
    const threeDaysLater = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];
    if (inputStart) inputStart.value = paramStart || today;
    if (inputEnd) inputEnd.value = paramEnd || threeDaysLater;

    // Función de aplicación y validación de cupón
    function applyCoupon(code, alertOnError) {
        if (!code || !code.trim()) {
            activeAppliedCoupon = null;
            if (couponFeedback) { couponFeedback.style.display = 'none'; couponFeedback.innerHTML = ''; }
            recalculateTotal();
            return;
        }

        const cleanCode = code.trim().toUpperCase();
        if (inputCoupon) inputCoupon.value = cleanCode;

        if (typeof checkCouponStatus === 'function') {
            const status = checkCouponStatus(cleanCode);

            if (status.valid) {
                activeAppliedCoupon = {
                    code: cleanCode,
                    discountPercent: status.discountPercent || 50,
                    formattedExpiry: status.formattedExpiry
                };
                if (couponFeedback) {
                    couponFeedback.style.display = 'block';
                    couponFeedback.innerHTML = `
                        <div class="text-success font-weight-bold">
                            <i class="fa fa-check-circle mr-1"></i> ¡Cupón <strong>${cleanCode}</strong> aplicado! 50% de descuento en el alquiler${status.formattedExpiry ? ' (Vence ' + status.formattedExpiry + ')' : ''}.
                        </div>
                    `;
                }
            } else {
                activeAppliedCoupon = null;
                if (couponFeedback) {
                    couponFeedback.style.display = 'block';
                    const icon = status.status === 'expired' ? 'fa-clock text-danger' : 'fa-exclamation-triangle text-warning';
                    couponFeedback.innerHTML = `
                        <div class="text-danger font-weight-bold">
                            <i class="fa ${icon} mr-1"></i> ${status.message || 'Cupón no válido.'}
                        </div>
                    `;
                }
                if (alertOnError) {
                    alert(status.message || 'El cupón no es válido o ha expirado.');
                }
            }
        }
        recalculateTotal();
    }

    if (btnApplyCoupon && inputCoupon) {
        btnApplyCoupon.addEventListener('click', function () {
            applyCoupon(inputCoupon.value, true);
        });
        inputCoupon.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyCoupon(inputCoupon.value, true);
            }
        });
    }

    // Cálculo financiero dinámico
    function recalculateTotal() {
        if (!car) return;
        const d1 = new Date(inputStart.value || today);
        const d2 = new Date(inputEnd.value || threeDaysLater);

        let diff = d2.getTime() - d1.getTime();
        let days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (days < 1 || isNaN(days)) days = 1;

        const subtotal = days * car.pricePerDay;
        let discount = 0;

        if (activeAppliedCoupon) {
            discount = Math.round(subtotal * (activeAppliedCoupon.discountPercent / 100));
            if (rowDiscount) {
                rowDiscount.classList.remove('d-none');
                rowDiscount.classList.add('d-flex');
                if (summaryDiscountName) summaryDiscountName.innerText = activeAppliedCoupon.code;
                if (summaryDiscountVal) summaryDiscountVal.innerText = `-$${formatPrice(discount)} COP`;
            }
        } else {
            if (rowDiscount) {
                rowDiscount.classList.add('d-none');
                rowDiscount.classList.remove('d-flex');
            }
        }

        const netRental = subtotal - discount;
        const platformFee = Math.round(netRental * (commissionPercent / 100));
        const deposit = defaultDeposit;
        const total = netRental + platformFee + deposit;
        const ownerEarnings = Math.round(subtotal * (1 - (commissionPercent / 100)));

        if (summaryDays) summaryDays.innerText = `${days} ${days === 1 ? 'día' : 'días'}`;
        if (summarySubtotal) summarySubtotal.innerText = `$${formatPrice(subtotal)} COP`;
        if (summaryFeeLabel) summaryFeeLabel.innerText = `Tarifa de servicio Rent Car Colombia (${commissionPercent}%):`;
        if (summaryFee) summaryFee.innerText = `$${formatPrice(platformFee)} COP`;
        if (summaryDeposit) summaryDeposit.innerText = `$${formatPrice(deposit)} COP`;
        if (summaryTotal) summaryTotal.innerText = `$${formatPrice(total)} COP`;

        return {
            days,
            subtotal,
            discount,
            netRental,
            platformFee,
            commissionPercent,
            deposit,
            total,
            ownerEarnings
        };
    }

    if (inputStart) inputStart.addEventListener('change', recalculateTotal);
    if (inputEnd) inputEnd.addEventListener('change', recalculateTotal);
    recalculateTotal();

    // Bloquear reserva si el usuario logueado es el propietario del vehículo
    const isOwnCar = car && typeof window.isMyOwnCar === 'function' && window.isMyOwnCar(car);
    const formBooking = document.getElementById('form-booking');
    if (isOwnCar && formBooking) {
        const notice = document.createElement('div');
        notice.className = 'alert alert-warning border-warning shadow-sm mb-4';
        notice.innerHTML = `
            <h6 class="font-weight-bold mb-1"><i class="fa fa-exclamation-triangle mr-2"></i>Este vehículo es de tu propiedad</h6>
            <p class="small mb-2">No puedes reservar ni alquilar tu propio vehículo. Si deseas modificar sus datos, tarifa o fotos, hazlo desde tu panel.</p>
            <a href="dashboard-propietario.html?editCar=${car.id}" class="btn btn-dark btn-sm font-weight-bold">
                <i class="fa fa-edit mr-1"></i> Ir a Editar mi Vehículo
            </a>
        `;
        formBooking.parentNode.insertBefore(notice, formBooking);
        const submitBtn = formBooking.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa fa-ban mr-2"></i> No puedes reservar tu propio vehículo';
        }
    }

    // Procesar reserva
    if (formBooking) {
        formBooking.addEventListener('submit', function (e) {
            e.preventDefault();

            if (isOwnCar) {
                alert('No puedes reservar tu propio vehículo.');
                return;
            }

            const calc = recalculateTotal();

            const renterName = inputName.value.trim();
            const renterEmail = inputEmail.value.trim();
            const renterPhone = inputPhone.value.trim();
            const renterLicense = inputLicense.value.trim();

            if (!renterName || !renterEmail || !renterPhone || !renterLicense) {
                alert('Por favor completa todos los datos obligatorios del conductor.');
                return;
            }

            const termsCheck = document.getElementById('book-terms-agree');
            if (termsCheck && !termsCheck.checked) {
                alert('Debes aceptar el Contrato Digital de Alquiler para continuar.');
                return;
            }

            const selectedPaymentMethod = payTransfer && payTransfer.checked ? 'transfer' : 'wompi';

            // Si es transferencia y no adjuntó comprobante, confirmamos si desea continuar
            if (selectedPaymentMethod === 'transfer' && !receiptBase64) {
                const confirmNoReceipt = confirm('¿Deseas enviar la reserva sin adjuntar el comprobante ahora? Podrás enviarlo luego al anfitrión por WhatsApp.');
                if (!confirmNoReceipt) return;
            }

            // Generar código de reserva único
            const bookingId = 'RC-' + Math.floor(100000 + Math.random() * 900000);

            // Crear objeto de reserva completo
            const newBooking = {
                id: bookingId,
                carId: car.id,
                carName: `${car.fullName} (${car.year})`,
                carImage: car.image,
                carCity: car.city,
                ownerId: car.ownerId,
                ownerName: car.ownerName || 'Anfitrión Verificado',
                ownerPhone: car.ownerPhone || '3162357871',
                renterName: renterName,
                renterEmail: renterEmail,
                renterPhone: renterPhone,
                renterLicense: renterLicense,
                startDate: inputStart.value,
                endDate: inputEnd.value,
                totalDays: calc.days,
                dailyRate: car.pricePerDay,
                subtotal: calc.subtotal,
                couponApplied: activeAppliedCoupon ? activeAppliedCoupon.code : null,
                discountAmount: calc.discount,
                netRental: calc.netRental,
                platformFee: calc.platformFee,
                platformFeePercent: calc.commissionPercent,
                ownerEarnings: calc.ownerEarnings,
                deposit: calc.deposit,
                totalPrice: calc.total,
                paymentMethod: selectedPaymentMethod,
                paymentReceipt: receiptBase64,
                paymentStatus: selectedPaymentMethod === 'wompi' ? 'Aprobado (Pasarela Wompi)' : (receiptBase64 ? 'Comprobante Adjunto (Pendiente Verificación)' : 'Pendiente de Pago'),
                status: 'Pendiente', // 'Pendiente', 'Aceptada', 'En Curso', 'Finalizada', 'Rechazada'
                contractAccepted: true,
                contractDate: new Date().toISOString(),
                createdAt: new Date().toISOString()
            };

            const bookings = getStoredBookings();
            bookings.unshift(newBooking);
            localStorage.setItem('renteasy_bookings', JSON.stringify(bookings));

            // Si el usuario no tenía sesión iniciada, creamos su perfil de conductor automáticamente
            if (!currentUser) {
                const autoUser = {
                    id: 'usr_' + Date.now(),
                    name: renterName,
                    email: renterEmail,
                    phone: renterPhone,
                    role: 'conductor',
                    city: car ? car.city : 'Valledupar',
                    avatar: 'img/team-1.jpg',
                    loggedAt: new Date().toISOString()
                };
                localStorage.setItem('renteasy_current_user', JSON.stringify(autoUser));
                localStorage.setItem('renteasy_last_activity', Date.now().toString());

                let usersList = [];
                try { usersList = JSON.parse(localStorage.getItem('renteasy_users')) || []; } catch(e){}
                if (!usersList.some(u => (u.email || '').toLowerCase() === renterEmail.toLowerCase())) {
                    usersList.push(autoUser);
                    localStorage.setItem('renteasy_users', JSON.stringify(usersList));
                }

                if (typeof window.initUserNavbar === 'function') {
                    window.initUserNavbar();
                }
            }

            // Sincronizar en tiempo real con Supabase en la nube
            if (typeof dbSaveReserva === 'function') {
                dbSaveReserva(newBooking).catch(err => console.warn("Sincronización Supabase:", err));
            }

            // Mostrar modal de confirmación con voucher
            showSuccessModal(newBooking);
        });
    }

    function showSuccessModal(b) {
        const modalHtml = `
            <div class="modal fade show" id="successModal" tabindex="-1" style="display: block; background: rgba(0,0,0,0.7); z-index: 1050;" aria-modal="true" role="dialog">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content text-center p-4 border-0 rounded-lg shadow-lg">
                        <div class="modal-body p-2">
                            <div class="mb-3 text-success" style="font-size: 55px;">
                                <i class="fa fa-check-circle"></i>
                            </div>
                            <h3 class="font-weight-bold text-dark mb-1">¡Solicitud de Reserva Registrada!</h3>
                            <p class="text-muted mb-3">
                                Hemos notificado a <strong>${b.ownerName}</strong> sobre tu reserva del <strong>${b.carName}</strong> en <strong>${b.carCity}</strong>.
                            </p>

                            <!-- Voucher Digital -->
                            <div class="bg-light p-3 rounded text-left small mb-3 border">
                                <div class="d-flex justify-content-between mb-2 pb-2 border-bottom">
                                    <span class="text-muted">Código de Reserva:</span>
                                    <strong class="text-primary" style="font-size: 1.1rem;">#${b.id}</strong>
                                </div>
                                <div class="row">
                                    <div class="col-sm-6 mb-1">
                                        <span class="text-muted">Fechas del viaje:</span><br>
                                        <strong>${b.startDate} al ${b.endDate} (${b.totalDays} ${b.totalDays === 1 ? 'día' : 'días'})</strong>
                                    </div>
                                    <div class="col-sm-6 mb-1">
                                        <span class="text-muted">Método de Pago:</span><br>
                                        <strong>${b.paymentMethod === 'wompi' ? 'Pasarela Digital Wompi / PSE' : 'Transferencia Directa Bancaria'}</strong>
                                    </div>
                                </div>
                                <hr class="my-2">
                                <div class="d-flex justify-content-between mb-1">
                                    <span>Subtotal Alquiler:</span>
                                    <span>$${formatPrice(b.subtotal)} COP</span>
                                </div>
                                ${b.discountAmount > 0 ? `
                                <div class="d-flex justify-content-between mb-1 text-success font-weight-bold">
                                    <span><i class="fa fa-tag mr-1"></i> Descuento Cupón (${b.couponApplied}):</span>
                                    <span>-$${formatPrice(b.discountAmount)} COP</span>
                                </div>
                                ` : ''}
                                <div class="d-flex justify-content-between mb-1">
                                    <span>Tarifa de servicio Rent Car Colombia (${b.platformFeePercent}%):</span>
                                    <span>$${formatPrice(b.platformFee)} COP</span>
                                </div>
                                <div class="d-flex justify-content-between mb-1">
                                    <span>Depósito de fianza en custodia:</span>
                                    <span>$${formatPrice(b.deposit)} COP</span>
                                </div>
                                <div class="d-flex justify-content-between mt-2 pt-2 border-top font-weight-bold" style="font-size: 1.15rem;">
                                    <span class="text-dark">Total Liquidado:</span>
                                    <span class="text-primary">$${formatPrice(b.totalPrice)} COP</span>
                                </div>
                            </div>

                            <div class="alert alert-info border small py-2 mb-4 text-left">
                                <i class="fa fa-shield-alt mr-1"></i> <strong>Garantía de Seguridad:</strong> El anfitrión dispone de hasta 24 horas para aprobar la entrega. La fianza de $${formatPrice(b.deposit)} COP se mantendrá en custodia y se liberará íntegramente tras finalizar el viaje.
                            </div>

                            <div class="row">
                                <div class="col-md-6 mb-2">
                                    <a href="https://wa.me/573162357871?text=${encodeURIComponent('Hola Rent Car Colombia, acabo de solicitar la reserva #' + b.id + ' para el vehículo ' + b.carName + ' en ' + b.carCity + '. Solicito acompañamiento.')}" target="_blank" class="btn btn-success btn-block font-weight-bold py-2">
                                        <i class="fab fa-whatsapp mr-1"></i> Notificar por WhatsApp
                                    </a>
                                </div>
                                <div class="col-md-6 mb-2">
                                    <a href="car.html" class="btn btn-primary btn-block font-weight-bold py-2">
                                        <i class="fa fa-car mr-1"></i> Volver a Explorar Autos
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    function getStoredCars() {
        try {
            return JSON.parse(localStorage.getItem('renteasy_cars')) || [];
        } catch (e) {
            return [];
        }
    }

    function getStoredBookings() {
        try {
            return JSON.parse(localStorage.getItem('renteasy_bookings')) || [];
        } catch (e) {
            return [];
        }
    }

    function getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem('renteasy_current_user')) || null;
        } catch (e) {
            return null;
        }
    }

    function formatPrice(val) {
        return Number(val || 0).toLocaleString('es-CO');
    }
});
