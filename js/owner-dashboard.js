/**
 * Rent-Easy Marketplace - Panel de Control del Propietario (Host)
 * Gestión de vehículos, solicitudes de alquiler y cálculo de comisiones (15% plataforma / 85% anfitrión)
 */

document.addEventListener('DOMContentLoaded', function () {
    // 1. Validar y cargar sesión del propietario
    const currentUser = getOrSetHostSession();
    if (!currentUser) return; // Se redirige automáticamente al login si no está autenticado
    const navUserName = document.getElementById('nav-user-name');
    if (navUserName) navUserName.innerText = currentUser.name || 'Propietario';

    // 2. Inicializar base de datos local si no existe
    initDefaultCars();
    initDefaultBookings();

    // 3. Renderizar vista inicial
    renderOwnerAlertsAndProposals();
    renderDashboardStats();
    renderOwnerCars();
    renderBookingRequests();
    renderWalletStats();
    setupWorkflowModals();
    setupMarketPriceHint();
    attachColombiaCityAutocomplete(document.getElementById('car-city'));
    attachBrandAndModelAutocomplete(document.getElementById('car-brand'), document.getElementById('car-model'));
    bindSmartVehicleSpecs({
        brandEl: document.getElementById('car-brand'),
        modelEl: document.getElementById('car-model'),
        categoryEl: document.getElementById('car-category'),
        seatsEl: document.getElementById('car-seats'),
        luggageEl: document.getElementById('car-luggage')
    });
    attachClearButtonToFields(['car-brand', 'car-model', 'car-price', 'car-city', 'car-mileage']);

    let uploadedSoatImg = '';
    let uploadedPolicyImg = '';
    let detectedSoatPlate = '';
    let detectedSoatExpiry = '';
    function processDocFile(file, callback) {
        if (!file) return;
        const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '');
        if (isPdf) {
            if (file.size > 4 * 1024 * 1024) {
                alert('El archivo PDF supera el límite de 4 MB. Por favor comprímelo o sube una imagen.');
                return;
            }
            const reader = new FileReader();
            reader.onload = function (ev) { callback(ev.target.result); };
            reader.readAsDataURL(file);
            return;
        }
        const reader = new FileReader();
        reader.onload = function (ev) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement('canvas');
                const MAX = 900;
                let w = img.width;
                let h = img.height;
                if (w > h && w > MAX) { h = Math.round((h * MAX) / w); w = MAX; }
                else if (h >= w && h > MAX) { w = Math.round((w * MAX) / h); h = MAX; }
                canvas.width = w;
                canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                callback(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = function () { callback(ev.target.result); };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    }

    function renderDocPreviewHtml(dataUrl, labelText, allowOpenLink) {
        if (!dataUrl) return '<span class="text-muted">Sin archivo adjunto</span>';
        const isPdf = String(dataUrl).startsWith('data:application/pdf');
        const thumb = isPdf
            ? '<div class="rounded border d-flex align-items-center justify-content-center bg-white mr-2" style="width:48px;height:36px;"><i class="fa fa-file-pdf text-danger fa-lg"></i></div>'
            : `<img src="${dataUrl}" class="rounded border mr-2" style="width:48px;height:36px;object-fit:cover;cursor:pointer;">`;
        const openBtn = allowOpenLink
            ? `<button type="button" class="btn btn-link btn-sm p-0 small text-primary font-weight-bold" onclick="window.openDocumentPreview(this.dataset.doc)" data-doc="${dataUrl.replace(/"/g, '&quot;')}">${isPdf ? 'Abrir PDF' : 'Ver imagen'}</button>`
            : '';
        return `<div class="d-flex align-items-center mt-1">${thumb}<div><span class="text-success font-weight-bold d-block"><i class="fa fa-check-circle mr-1"></i>${labelText}</span>${openBtn}</div></div>`;
    }

    function computeSoatStatus(expiryStr) {
        if (!expiryStr) return 'Pendiente';
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const exp = new Date(expiryStr + 'T00:00:00');
        if (isNaN(exp.getTime())) return 'Pendiente';
        const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return 'Vencido';
        if (diffDays <= 15) return 'Por vencer';
        return 'Vigente';
    }

    function extractPlateFromText(rawText) {
        if (!rawText) return '';
        const upper = String(rawText).toUpperCase();
        // 1. Buscar primero junto a la palabra PLACA (ej. PLACA: LQL58H o PLACA KLM 123)
        const nearLabel = upper.match(/PLACA[\s:.\-#]*([A-Z]{3})[\s\-]*(\d{3}|\d{2}[A-Z])/);
        if (nearLabel) return `${nearLabel[1]}${nearLabel[2]}`;
        // 2. Placa carro Colombia (ABC123) o moto (ABC12D)
        const carMatch = upper.match(/(?:^|[^A-Z0-9])([A-Z]{3})[\s\-]?(\d{3})(?:[^A-Z0-9]|$)/);
        if (carMatch) return `${carMatch[1]}${carMatch[2]}`;
        const motoMatch = upper.match(/(?:^|[^A-Z0-9])([A-Z]{3})[\s\-]?(\d{2}[A-Z])(?:[^A-Z0-9]|$)/);
        if (motoMatch) return `${motoMatch[1]}${motoMatch[2]}`;
        return '';
    }

    function parseSoatTextAndFill(rawText) {
        if (!rawText) return;
        const upper = String(rawText).toUpperCase();
        // 1. Detectar placa colombiana (ABC123 o ABC12D)
        const foundPlate = extractPlateFromText(upper);
        const plateInput = document.getElementById('car-plate');
        if (foundPlate) {
            detectedSoatPlate = foundPlate;
            if (plateInput && !plateInput.value.trim()) {
                plateInput.value = foundPlate;
            }
        }

        // 2. Detectar fechas (DD/MM/YYYY, YYYY/MM/DD, YYYY-MM-DD, DD-MM-YYYY) y tomar la fecha futura más lejana (fin de vigencia)
        const dates = [];
        const dmy = upper.matchAll(/\b(\d{2})[\/\-](\d{2})[\/\-](20\d{2})\b/g);
        for (const m of dmy) {
            const iso = `${m[3]}-${m[2]}-${m[1]}`;
            if (!isNaN(Date.parse(iso))) dates.push(iso);
        }
        const ymd = upper.matchAll(/\b(20\d{2})[\/\-](\d{2})[\/\-](\d{2})\b/g);
        for (const m of ymd) {
            const iso = `${m[1]}-${m[2]}-${m[3]}`;
            if (!isNaN(Date.parse(iso))) dates.push(iso);
        }

        const hint = document.getElementById('car-soat-ocr-hint');
        const expiryInput = document.getElementById('car-soat-expiry');
        if (dates.length > 0 && expiryInput) {
            dates.sort();
            const latest = dates[dates.length - 1];
            detectedSoatExpiry = latest;
            expiryInput.value = latest;
            const st = computeSoatStatus(latest);
            if (hint) {
                hint.innerHTML = `<i class="fa fa-magic mr-1"></i>Detectado del SOAT: <strong>${st}</strong> (vence ${latest})${foundPlate ? ` &bull; Placa <strong>${foundPlate}</strong>` : ''}`;
            }
        } else if (hint) {
            hint.textContent = foundPlate
                ? `Placa detectada en SOAT: ${foundPlate}. Ingresa manualmente la fecha de vencimiento.`
                : 'Verifica o ingresa manualmente la fecha de vencimiento del SOAT.';
        }
    }

    async function ensureTesseractLoaded() {
        if (window.Tesseract) return true;
        try {
            await new Promise((res, rej) => {
                const s = document.createElement('script');
                s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js';
                s.onload = res;
                s.onerror = rej;
                document.head.appendChild(s);
            });
            return !!window.Tesseract;
        } catch (e) {
            return false;
        }
    }

    async function detectPlateInVehiclePhotos(galleryUrls) {
        const list = (galleryUrls || []).filter(src => src && String(src).startsWith('data:image'));
        if (list.length === 0) return '';
        const ok = await ensureTesseractLoaded();
        if (!ok) return '';
        for (let i = 0; i < Math.min(3, list.length); i++) {
            try {
                const res = await window.Tesseract.recognize(list[i], 'eng');
                const found = extractPlateFromText(res?.data?.text || '');
                if (found) return found;
            } catch (_) { }
        }
        return '';
    }

    async function extractPdfTextWithOptionalPassword(buf, password) {
        const opts = password ? { data: buf.slice(0), password } : { data: buf.slice(0) };
        const pdf = await window.pdfjsLib.getDocument(opts).promise;
        let fullText = '';
        for (let p = 1; p <= Math.min(2, pdf.numPages); p++) {
            const page = await pdf.getPage(p);
            const tc = await page.getTextContent();
            fullText += ' ' + tc.items.map(it => it.str).join(' ');
        }
        // Si el PDF es escaneado (sin texto seleccionable), aplicar OCR sobre la página 1
        if (fullText.trim().length < 25) {
            try {
                const page1 = await pdf.getPage(1);
                const viewport = page1.getViewport({ scale: 1.8 });
                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                await page1.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
                const ok = await ensureTesseractLoaded();
                if (ok && window.Tesseract) {
                    const ocr = await window.Tesseract.recognize(canvas.toDataURL('image/jpeg', 0.9), 'spa');
                    if (ocr?.data?.text) fullText += ' ' + ocr.data.text;
                }
            } catch (_) { }
        }
        return fullText;
    }

    function askPdfPasswordModal(onSubmitPwd, onCancel) {
        let mEl = document.getElementById('modalPdfPasswordPrompt');
        if (!mEl) {
            const w = document.createElement('div');
            w.innerHTML = `
                <div class="modal fade" id="modalPdfPasswordPrompt" tabindex="-1" role="dialog" aria-hidden="true" style="z-index:10080;">
                    <div class="modal-dialog modal-dialog-centered modal-sm" role="document" style="max-width:410px;">
                        <div class="modal-content border-0 shadow-lg" style="border-radius:14px;overflow:hidden;">
                            <div class="modal-header text-white" style="background:#1C1E32;">
                                <h6 class="modal-title font-weight-bold text-white"><i class="fa fa-lock text-primary mr-2"></i>PDF Protegido con Contraseña</h6>
                                <button type="button" class="close text-white" data-dismiss="modal"><span>&times;</span></button>
                            </div>
                            <form id="form-pdf-password-unlock">
                                <div class="modal-body p-4">
                                    <p class="small text-muted mb-3">Las aseguradoras suelen proteger el PDF del SOAT con tu <strong>número de cédula/NIT</strong> o la <strong>placa del vehículo</strong>. Ingrésala para leer los datos automáticamente:</p>
                                    <input type="text" id="pdf-unlock-password-input" class="form-control text-uppercase mb-2" style="text-transform: uppercase;" placeholder="Ej. Tu cédula o placa" required>
                                    <small id="pdf-unlock-error" class="text-danger d-none">Contraseña incorrecta, intenta nuevamente o ingrésalo manual.</small>
                                </div>
                                <div class="modal-footer bg-light">
                                    <button type="button" class="btn btn-light border btn-sm" data-dismiss="modal">Ingresar fecha manual</button>
                                    <button type="submit" class="btn btn-primary btn-sm font-weight-bold">Desbloquear y Leer</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>`;
            document.body.appendChild(w.firstElementChild);
            mEl = document.getElementById('modalPdfPasswordPrompt');
        }
        const inp = document.getElementById('pdf-unlock-password-input');
        const errEl = document.getElementById('pdf-unlock-error');
        inp.value = '';
        inp.oninput = function () { this.value = this.value.toUpperCase(); };
        errEl.classList.add('d-none');

        const form = document.getElementById('form-pdf-password-unlock');
        form.onsubmit = async function (e) {
            e.preventDefault();
            const raw = inp.value.trim();
            const variants = Array.from(new Set([raw, raw.toUpperCase(), raw.toLowerCase()].filter(Boolean)));
            let ok = false;
            for (const v of variants) {
                if (await onSubmitPwd(v)) {
                    ok = true;
                    break;
                }
            }
            if (ok) {
                $('#modalPdfPasswordPrompt').modal('hide');
            } else {
                errEl.classList.remove('d-none');
            }
        };
        $('#modalPdfPasswordPrompt').off('hidden.bs.modal.pdf').on('hidden.bs.modal.pdf', function () {
            if (typeof onCancel === 'function') onCancel();
        });
        $('#modalPdfPasswordPrompt').modal('show');
    }

    async function analyzeSoatDocument(file, dataUrl) {
        const hint = document.getElementById('car-soat-ocr-hint');
        if (hint) hint.innerHTML = '<i class="fa fa-spinner fa-spin mr-1"></i>Analizando documento SOAT automáticamente...';
        try {
            const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '');
            if (isPdf && window.pdfjsLib) {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                const buf = await file.arrayBuffer();
                try {
                    const fullText = await extractPdfTextWithOptionalPassword(buf, null);
                    parseSoatTextAndFill(fullText);
                    return;
                } catch (pdfErr) {
                    if (pdfErr && (pdfErr.name === 'PasswordException' || String(pdfErr.message || '').toLowerCase().includes('password'))) {
                        // Intentar automáticamente claves comunes (placa escrita o teléfono/documento del usuario)
                        const plateVal = (document.getElementById('car-plate')?.value || '').trim();
                        const candidates = [plateVal.toUpperCase(), plateVal.toLowerCase(), currentUser.phone, currentUser.documentNumber].filter(Boolean);
                        for (const cand of candidates) {
                            try {
                                const unlockedText = await extractPdfTextWithOptionalPassword(buf, cand);
                                parseSoatTextAndFill(unlockedText);
                                return;
                            } catch (_) { }
                        }
                        // Si ninguna coincide, pedir la clave en un modal elegante
                        let unlocked = false;
                        askPdfPasswordModal(
                            async (pwd) => {
                                try {
                                    const txt = await extractPdfTextWithOptionalPassword(buf, pwd);
                                    unlocked = true;
                                    parseSoatTextAndFill(txt);
                                    if (!detectedSoatPlate) {
                                        const platePwd = extractPlateFromText(pwd);
                                        if (platePwd) detectedSoatPlate = platePwd;
                                    }
                                    return true;
                                } catch (_) { return false; }
                            },
                            () => {
                                if (!unlocked && hint) hint.textContent = 'PDF protegido: ingresa manualmente la placa y fecha de vencimiento.';
                            }
                        );
                        return;
                    }
                    throw pdfErr;
                }
            }
            // OCR para imágenes con Tesseract.js bajo demanda
            if (!isPdf) {
                if (!window.Tesseract) {
                    await new Promise((res, rej) => {
                        const s = document.createElement('script');
                        s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js';
                        s.onload = res;
                        s.onerror = rej;
                        document.head.appendChild(s);
                    });
                }
                if (window.Tesseract) {
                    const result = await window.Tesseract.recognize(dataUrl, 'spa');
                    parseSoatTextAndFill(result?.data?.text || '');
                    return;
                }
            }
        } catch (err) {
            console.warn('Lectura automática SOAT:', err);
        }
        if (hint && hint.textContent.includes('Analizando')) {
            hint.textContent = 'Verifica o ingresa la fecha de vencimiento del SOAT.';
        }
    }

    const bindDocUpload = (inputId, statusId, setter, isSoat) => {
        const el = document.getElementById(inputId);
        const st = document.getElementById(statusId);
        if (!el) return;
        el.addEventListener('change', function (e) {
            const file = e.target.files && e.target.files[0];
            if (!file) {
                setter('');
                if (st) st.textContent = 'Obligatorio (imagen o PDF) para publicar';
                return;
            }
            processDocFile(file, function (dataUrl) {
                setter(dataUrl);
                if (st) st.innerHTML = renderDocPreviewHtml(dataUrl, 'Documento cargado', true);
                if (isSoat) analyzeSoatDocument(file, dataUrl);
            });
        });
    };
    bindDocUpload('car-soat-file', 'car-soat-status', v => { uploadedSoatImg = v; }, true);
    bindDocUpload('car-policy-file', 'car-policy-status', v => { uploadedPolicyImg = v; }, false);

    // 3b. Sincronizar en tiempo real con Supabase (vehículos, reservas y alertas del propietario)
    (async function syncOwnerLiveDataFromSupabase() {
        try {
            if (typeof dbGetVehiculos === 'function') await dbGetVehiculos();
            if (typeof dbGetReservas === 'function') await dbGetReservas();
            if (typeof dbGetOwnerAlerts === 'function') await dbGetOwnerAlerts();
            renderOwnerAlertsAndProposals();
            renderDashboardStats();
            renderOwnerCars();
            renderBookingRequests();
            renderWalletStats();
            const editCarId = new URLSearchParams(window.location.search).get('editCar');
            if (editCarId && typeof window.openEditCarModal === 'function') {
                window.openEditCarModal(editCarId);
                if (window.history && window.history.replaceState) {
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            }
        } catch (e) {
            console.warn('Sincronización propietario Supabase:', e);
        }
    })();

    // 4. Manejo de cambio de imagen en tiempo real
    const customUrl = document.getElementById('car-custom-url');
    const imgPreview = document.getElementById('car-img-preview');
    const imgEmptyPlaceholder = document.getElementById('car-img-empty-placeholder');
    const carFileInput = document.getElementById('car-photo-file');
    const carFileLabel = document.getElementById('car-photo-label');
    const carRealData = document.getElementById('car-real-photo-data');
    const galleryListEl = document.getElementById('car-gallery-preview-list');
    const btnAddGalleryUrl = document.getElementById('btn-add-gallery-url');

    let ownerGalleryImages = [];

    function renderOwnerGalleryPreview() {
        const primarySrc = ownerGalleryImages[0] || (customUrl && customUrl.value.trim()) || '';
        if (imgPreview) {
            if (primarySrc) {
                imgPreview.src = primarySrc;
                imgPreview.style.display = 'block';
                if (imgEmptyPlaceholder) imgEmptyPlaceholder.style.display = 'none';
            } else {
                imgPreview.removeAttribute('src');
                imgPreview.style.display = 'none';
                if (imgEmptyPlaceholder) imgEmptyPlaceholder.style.display = 'block';
            }
        }
        if (carRealData) {
            carRealData.value = ownerGalleryImages[0] || '';
        }
        if (!galleryListEl) return;
        if (ownerGalleryImages.length === 0) {
            galleryListEl.innerHTML = '';
            return;
        }
        galleryListEl.innerHTML = ownerGalleryImages.map((src, idx) => `
            <div class="position-relative border rounded p-1 bg-white shadow-sm" style="width: 96px;">
                <img src="${src}" class="rounded" style="width: 86px; height: 60px; object-fit: cover;">
                ${idx === 0
                    ? '<span class="badge badge-primary d-block mt-1" style="font-size: 10px;">Principal</span>'
                    : `<button type="button" class="btn btn-link btn-sm p-0 d-block w-100 text-center" style="font-size: 10px;" onclick="window._setPrimaryGalleryImg(${idx})">Hacer principal</button>`}
                <button type="button" class="btn btn-danger btn-sm position-absolute" style="top: -6px; right: -6px; width: 20px; height: 20px; padding: 0; line-height: 1; border-radius: 50%;" onclick="window._removeGalleryImg(${idx})" title="Quitar foto">&times;</button>
            </div>
        `).join('');
    }

    window._setPrimaryGalleryImg = function (idx) {
        if (idx > 0 && ownerGalleryImages[idx]) {
            const chosen = ownerGalleryImages.splice(idx, 1)[0];
            ownerGalleryImages.unshift(chosen);
            renderOwnerGalleryPreview();
        }
    };

    window._removeGalleryImg = function (idx) {
        ownerGalleryImages.splice(idx, 1);
        renderOwnerGalleryPreview();
    };

    if (carFileInput) {
        carFileInput.addEventListener('change', function (e) {
            const files = Array.from(e.target.files || []);
            if (files.length === 0) return;

            if (carFileLabel) carFileLabel.innerText = files.length === 1 ? files[0].name : `${files.length} fotos seleccionadas`;

            files.slice(0, 6 - ownerGalleryImages.length).forEach(file => {
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
                        canvas.getContext('2d').drawImage(img, 0, 0, width, height);

                        const optimizedData = canvas.toDataURL('image/jpeg', 0.85);
                        if (ownerGalleryImages.length < 6) {
                            ownerGalleryImages.push(optimizedData);
                            renderOwnerGalleryPreview();
                        }
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            });
        });
    }

    if (btnAddGalleryUrl && customUrl) {
        btnAddGalleryUrl.addEventListener('click', function () {
            const url = customUrl.value.trim();
            if (!url) return;
            if (ownerGalleryImages.length >= 6) {
                alert('Puedes agregar máximo 6 fotografías por vehículo.');
                return;
            }
            ownerGalleryImages.push(url);
            customUrl.value = '';
            renderOwnerGalleryPreview();
        });
    }

    if (customUrl && imgPreview) {
        customUrl.addEventListener('input', function () {
            if (ownerGalleryImages.length === 0) {
                renderOwnerGalleryPreview();
            }
        });
    }

    // 5. Publicar Nuevo Vehículo
    const publishForm = document.getElementById('form-publish-car');
    if (publishForm) {
        publishForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const typedUrl = customUrl ? customUrl.value.trim() : '';
            if (ownerGalleryImages.length === 0 && !typedUrl) {
                alert('Por favor sube al menos una fotografía de tu vehículo (o agrega un enlace URL) para elegir la imagen principal.');
                return;
            }
            if (!uploadedSoatImg) {
                alert('Por ley en Colombia, debes adjuntar la foto o PDF del SOAT vigente antes de publicar el vehículo.');
                return;
            }

            const submitBtn = publishForm.querySelector('button[type="submit"]');
            const origSubmitHtml = submitBtn ? submitBtn.innerHTML : '';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin mr-2"></i> Verificando placa, fotos y SOAT...';
            }

            const restorePublishBtn = () => {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = origSubmitHtml;
                }
            };

            const brand = document.getElementById('car-brand').value.trim();
            const model = document.getElementById('car-model').value.trim();
            const year = parseInt(document.getElementById('car-year').value);
            const plate = (document.getElementById('car-plate')?.value || '').replace(/[\s\-]/g, '').trim().toUpperCase();
            if (!plate || plate.length < 5) {
                restorePublishBtn();
                alert('Por favor ingresa una placa válida del vehículo.');
                document.getElementById('car-plate')?.focus();
                return;
            }

            // 1. Validación cruzada: Placa digitada vs Placa detectada en el archivo del SOAT
            if (detectedSoatPlate && detectedSoatPlate !== plate) {
                restorePublishBtn();
                alert(`La placa ingresada (${plate}) NO coincide con la placa detectada en el archivo del SOAT (${detectedSoatPlate}).\n\nPor favor sube el SOAT correspondiente a este vehículo o corrige la placa.`);
                document.getElementById('car-plate')?.focus();
                return;
            }

            // 2. Validación rápida por OCR de placas visibles en las fotografías del vehículo
            const finalGallery = ownerGalleryImages.length > 0 ? ownerGalleryImages.slice() : [typedUrl];
            const photoPlate = await detectPlateInVehiclePhotos(finalGallery);
            if (photoPlate && photoPlate !== plate) {
                restorePublishBtn();
                alert(`La placa detectada en las fotografías del vehículo (${photoPlate}) NO coincide con la placa ingresada (${plate}).\n\nAsegúrate de subir fotos reales de este mismo vehículo y su SOAT correspondiente.`);
                return;
            }
            if (photoPlate && detectedSoatPlate && photoPlate !== detectedSoatPlate) {
                restorePublishBtn();
                alert(`La placa visible en las fotos (${photoPlate}) no coincide con la del SOAT (${detectedSoatPlate}). Verifica tus archivos.`);
                return;
            }
            const soatExpiry = document.getElementById('car-soat-expiry')?.value || '';
            const soatStatus = computeSoatStatus(soatExpiry);
            const category = document.getElementById('car-category').value;
            const transmission = document.getElementById('car-transmission').value;
            const fuel = document.getElementById('car-fuel').value;
            const seats = parseInt(document.getElementById('car-seats').value);
            const luggage = parseInt(document.getElementById('car-luggage')?.value || '3', 10) || 3;
            const hostType = document.getElementById('car-host-type')?.value || 'Rentadora Aliada';
            const hasGps = (document.getElementById('car-has-gps')?.value !== 'false');
            const price = parseInt(document.getElementById('car-price').value);
            const city = document.getElementById('car-city').value;
            const mileage = document.getElementById('car-mileage').value.trim();
            const description = document.getElementById('car-description').value.trim();

            const finalGalleryChecked = finalGallery;
            const image = finalGalleryChecked[0];

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
                luggage: luggage,
                hostType: hostType,
                hasGps: hasGps,
                soatImage: uploadedSoatImg || '',
                policyImage: uploadedPolicyImg || '',
                plate: plate,
                soatExpiry: soatExpiry,
                soatStatus: soatStatus,
                blockedDates: [],
                pricePerDay: price,
                city: city,
                mileage: mileage,
                description: description || 'Vehículo en óptimas condiciones mecánicas y estéticas para alquiler.',
                image: image,
                images: finalGallery,
                status: 'En Revision', // Requiere validación de documentos por Admin antes de publicarse
                createdAt: new Date().toISOString()
            };

            const cars = getAllCars();
            cars.unshift(newCar);
            localStorage.setItem('renteasy_cars', JSON.stringify(cars));
            if (typeof dbSaveVehiculo === 'function') {
                dbSaveVehiculo(newCar);
            }
            if (typeof window.logSystemEvent === 'function') {
                window.logSystemEvent('Flota', 'Vehículo enviado a revisión por propietario', `${newCar.fullName} (${plate || 'Sin placa'}) — SOAT: ${soatStatus}`);
            }
            if (typeof window.broadcastLiveSync === 'function') window.broadcastLiveSync('cars_updated');

            restorePublishBtn();
            alert(`¡Vehículo "${newCar.fullName}" (${plate}) enviado a revisión!\n\nNuestro equipo administrativo validará tu SOAT y Póliza para activarlo en el catálogo público.`);

            // Limpiar formulario y volver a la lista
            publishForm.reset();
            ownerGalleryImages = [];
            uploadedSoatImg = '';
            uploadedPolicyImg = '';
            detectedSoatPlate = '';
            detectedSoatExpiry = '';
            const stSoat = document.getElementById('car-soat-status');
            const stPol = document.getElementById('car-policy-status');
            if (stSoat) stSoat.textContent = 'Obligatorio para publicar el vehículo';
            if (stPol) stPol.textContent = 'Obligatorio para publicar el vehículo';
            renderOwnerGalleryPreview();
            if (carFileLabel) carFileLabel.innerText = 'Elegir una o varias fotos de tu vehículo...';
            $('#tab-cars-btn').tab('show');

            renderDashboardStats();
            renderOwnerCars();
        });
    }

    // 6. Cerrar Sesión (gestionado por el modal unificado en main.js / config.js)

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
                    <div class="position-relative" style="cursor: pointer;" onclick="openEditCarModal('${car.id}')" title="Clic para editar datos y fotos">
                        <img src="${car.image}" alt="${car.fullName}" class="car-manage-img" onerror="this.src='img/car-rent-1.png'">
                        <span class="position-absolute badge-status ${car.status === 'Activo' ? 'badge-active' : 'badge-rented'}" style="top: 12px; right: 12px;">
                            ${car.status}
                        </span>
                        <span class="position-absolute badge badge-dark px-2 py-1" style="bottom: 10px; left: 10px;">
                            <i class="fa fa-map-marker-alt text-primary mr-1"></i> ${car.city}
                        </span>
                    </div>
                    <div class="p-3">
                        <h5 class="font-weight-bold text-dark mb-1" style="cursor: pointer;" onclick="openEditCarModal('${car.id}')">${car.fullName}</h5>
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

                        <div class="d-flex justify-content-between pt-2 border-top" style="gap: 4px;">
                            <button class="btn btn-sm btn-primary font-weight-bold" onclick="openEditCarModal('${car.id}')" title="Editar datos y fotos">
                                <i class="fa fa-edit mr-1"></i> Editar
                            </button>
                            <button class="btn btn-sm btn-outline-warning text-dark font-weight-bold" onclick="openBlockDatesModal('${car.id}')" title="Bloquear fechas ocupadas">
                                <i class="fa fa-calendar-times mr-1"></i> Fechas
                            </button>
                            <button class="btn btn-sm btn-outline-secondary" onclick="toggleCarStatus('${car.id}')" title="${car.status === 'Activo' ? 'Pausar' : 'Activar'}">
                                <i class="fa fa-power-off"></i>
                            </button>
                            <a href="detail.html?id=${car.id}" class="btn btn-sm btn-outline-primary" target="_blank" title="Vista previa">
                                <i class="fa fa-eye"></i>
                            </a>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteCar('${car.id}')" title="Eliminar vehículo">
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

    function attachInputClearButton(inputEl) {
        if (!inputEl || inputEl.dataset.clearBound) return;
        inputEl.dataset.clearBound = '1';

        let wrap = inputEl.parentNode;
        const insideInputGroup = wrap.classList && wrap.classList.contains('input-group');
        if (!wrap.classList || !wrap.classList.contains('rc-ac-wrap')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'rc-ac-wrap';
            wrapper.style.cssText = insideInputGroup
                ? 'position:relative; flex:1 1 auto; width:1%; min-width:0;'
                : 'position:relative; width:100%;';
            inputEl.parentNode.insertBefore(wrapper, inputEl);
            wrapper.appendChild(inputEl);
            if (insideInputGroup) {
                inputEl.style.borderTopLeftRadius = '0';
                inputEl.style.borderBottomLeftRadius = '0';
            }
            wrap = wrapper;
        }

        const isNum = inputEl.type === 'number';
        inputEl.style.paddingRight = isNum ? '44px' : '32px';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'rc-clear-btn';
        btn.setAttribute('aria-label', 'Limpiar campo');
        btn.setAttribute('title', 'Limpiar');
        btn.innerHTML = '&times;';
        btn.style.cssText = `position:absolute; right:${isNum ? '24px' : '8px'}; top:50%; transform:translateY(-50%); width:20px; height:20px; border:none; border-radius:50%; background:rgba(28,30,50,0.08); color:#6c757d; font-size:14px; line-height:18px; text-align:center; padding:0; cursor:pointer; display:none; z-index:5; transition:all 0.15s ease;`;
        wrap.appendChild(btn);

        const syncVisibility = () => {
            btn.style.display = (inputEl.value && inputEl.value.length > 0) ? 'inline-block' : 'none';
        };

        btn.addEventListener('mouseenter', () => {
            btn.style.background = '#F77D0A';
            btn.style.color = '#fff';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.background = 'rgba(28,30,50,0.08)';
            btn.style.color = '#6c757d';
        });
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            inputEl.value = '';
            syncVisibility();
            inputEl.focus();
            inputEl.dispatchEvent(new Event('input', { bubbles: true }));
            inputEl.dispatchEvent(new Event('change', { bubbles: true }));
        });

        inputEl.addEventListener('input', syncVisibility);
        inputEl.addEventListener('change', syncVisibility);
        inputEl._syncClearBtn = syncVisibility;
        syncVisibility();
    }

    function attachClearButtonToFields(ids) {
        (ids || []).forEach(id => {
            const el = document.getElementById(id);
            if (el) attachInputClearButton(el);
        });
    }

    function attachTypeaheadAutocomplete(inputEl, getItemsFn) {
        if (!inputEl || inputEl.dataset.acBound) return;
        inputEl.dataset.acBound = '1';
        inputEl.setAttribute('autocomplete', 'off');

        // Envolver exactamente el input para que el menú quede pegado sin separación
        let wrap = inputEl.parentNode;
        if (!wrap.classList || !wrap.classList.contains('rc-ac-wrap')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'rc-ac-wrap';
            wrapper.style.cssText = 'position:relative; width:100%;';
            inputEl.parentNode.insertBefore(wrapper, inputEl);
            wrapper.appendChild(inputEl);
            wrap = wrapper;
        }

        const listBox = document.createElement('div');
        listBox.className = 'list-group shadow';
        listBox.style.cssText = 'position:absolute; left:0; right:0; top:100%; margin-top:1px; z-index:10085; max-height:210px; overflow-y:auto; display:none; border-radius:0 0 8px 8px; background:#fff;';
        wrap.appendChild(listBox);

        const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        inputEl.addEventListener('input', function () {
            const q = norm(this.value.trim());
            if (!q) {
                listBox.style.display = 'none';
                listBox.innerHTML = '';
                return;
            }
            const tokens = q.split(/\s+/).filter(Boolean);
            const items = typeof getItemsFn === 'function' ? getItemsFn() : [];
            const starts = items.filter(item => norm(item).startsWith(q));
            const tokenMatches = items.filter(item => {
                const n = norm(item);
                return !n.startsWith(q) && tokens.every(tok => n.includes(tok));
            });
            const matches = starts.concat(tokenMatches).slice(0, 15);

            if (matches.length === 0) {
                listBox.style.display = 'none';
                listBox.innerHTML = '';
                return;
            }
            listBox.innerHTML = matches.map(item =>
                `<button type="button" class="list-group-item list-group-item-action py-2 px-3 small text-left">${item}</button>`
            ).join('');
            listBox.style.display = 'block';
        });

        listBox.addEventListener('mousedown', function (e) {
            const btn = e.target.closest('button');
            if (!btn) return;
            e.preventDefault();
            inputEl.value = btn.textContent;
            listBox.style.display = 'none';
            inputEl.dispatchEvent(new Event('change', { bubbles: true }));
        });

        inputEl.addEventListener('blur', function () {
            setTimeout(() => { listBox.style.display = 'none'; }, 150);
        });
    }

    function attachColombiaCityAutocomplete(inputEl) {
        const cities = [
            'Valledupar', 'Bogotá D.C.', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
            'Santa Marta', 'Bucaramanga', 'Pereira', 'Manizales', 'Armenia', 'Cúcuta',
            'Ibagué', 'Villavicencio', 'Neiva', 'Pasto', 'Montería', 'Sincelejo',
            'Riohacha', 'Popayán', 'Tunja', 'Florencia', 'Yopal', 'Quibdó',
            'San Andrés', 'Leticia', 'Mocoa', 'Arauca', 'San José del Guaviare',
            'Palmira', 'Buenaventura', 'Envigado', 'Itagüí', 'Bello', 'Rionegro',
            'Soacha', 'Chía', 'Zipaquirá', 'Floridablanca', 'Girón', 'Piedecuesta',
            'Dosquebradas', 'Tuluá', 'Buga', 'Cartago', 'Soledad', 'Barrancabermeja',
            'Apartadó', 'Turbo', 'Magangué', 'Lorica', 'Maicao', 'Aguachica',
            'Codazzi', 'Bosconia', 'Ocaña', 'Sogamoso', 'Duitama', 'Fusagasugá',
            'Girardot', 'Espinal', 'Pitalito', 'Ipiales', 'Tumaco', 'Sabanalarga'
        ];
        attachTypeaheadAutocomplete(inputEl, () => cities);
    }

    function attachBrandAndModelAutocomplete(brandEl, modelEl) {
        const catalog = window.CAR_CATALOG_BY_BRAND || {};
        const brands = Object.keys(catalog);
        const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        attachTypeaheadAutocomplete(brandEl, () => brands);
        attachTypeaheadAutocomplete(modelEl, () => {
            const entered = norm(brandEl ? brandEl.value.trim() : '');
            if (entered) {
                const matchedKey = brands.find(b => norm(b) === entered || norm(b).includes(entered));
                if (matchedKey) return catalog[matchedKey];
            }
            return Object.values(catalog).flat();
        });
    }

    function bindSmartVehicleSpecs({ brandEl, modelEl, categoryEl, seatsEl, luggageEl }) {
        if (!brandEl || !modelEl || !categoryEl || !seatsEl || modelEl.dataset.specsBound) return;
        modelEl.dataset.specsBound = '1';

        let hintEl = categoryEl.parentNode.querySelector('.rc-spec-hint');
        if (!hintEl) {
            hintEl = document.createElement('small');
            hintEl.className = 'rc-spec-hint text-info font-weight-bold d-block mt-1';
            categoryEl.parentNode.appendChild(hintEl);
        }

        function syncLuggage() {
            if (luggageEl && typeof window.getLuggageByCategory === 'function') {
                luggageEl.value = String(window.getLuggageByCategory(categoryEl.value));
            }
        }

        function applySpecs(forceAdjustSeats) {
            const spec = typeof window.detectVehicleSpecs === 'function'
                ? window.detectVehicleSpecs(brandEl.value, modelEl.value)
                : null;
            if (spec) {
                const allowed = Array.isArray(spec.categories) ? spec.categories : [spec.defaultCategory];
                Array.from(categoryEl.options).forEach(opt => {
                    opt.disabled = !allowed.includes(opt.value);
                });
                if (!allowed.includes(categoryEl.value) || forceAdjustSeats) {
                    categoryEl.value = spec.defaultCategory || allowed[0];
                    categoryEl.dispatchEvent(new Event('change', { bubbles: true }));
                }
                seatsEl.max = String(spec.maxSeats);
                seatsEl.min = '2';
                const currentSeats = parseInt(seatsEl.value, 10);
                if (forceAdjustSeats || isNaN(currentSeats) || currentSeats > spec.maxSeats || currentSeats < 2) {
                    seatsEl.value = String(spec.defaultSeats);
                }
                if (forceAdjustSeats) syncLuggage();
                const allowedLabel = allowed.length > 1 ? `Elige: ${allowed.join(' o ')}` : allowed[0];
                hintEl.innerHTML = `<i class="fa fa-lock mr-1"></i> ${allowedLabel} &bull; Máx. ${spec.maxSeats} pasajeros`;
                hintEl.style.display = 'block';
            } else {
                Array.from(categoryEl.options).forEach(opt => { opt.disabled = false; });
                seatsEl.max = '15';
                seatsEl.min = '2';
                hintEl.textContent = '';
                hintEl.style.display = 'none';
            }
        }

        categoryEl.addEventListener('change', syncLuggage);
        modelEl.addEventListener('change', () => applySpecs(true));
        modelEl.addEventListener('input', () => applySpecs(true));
        brandEl.addEventListener('change', () => applySpecs(false));

        seatsEl.addEventListener('input', function () {
            const spec = typeof window.detectVehicleSpecs === 'function'
                ? window.detectVehicleSpecs(brandEl.value, modelEl.value)
                : null;
            const val = parseInt(this.value, 10);
            if (spec && !isNaN(val) && val > spec.maxSeats) {
                this.value = String(spec.maxSeats);
                alert(`El modelo "${modelEl.value.trim()}" admite máximo ${spec.maxSeats} pasajeros (incluyendo el conductor).`);
            }
        });
    }

    window.openBlockDatesModal = function (carId) {
        const cars = getAllCars();
        const car = cars.find(c => String(c.id) === String(carId));
        if (!car) return;

        let modalEl = document.getElementById('modalBlockCarDates');
        if (!modalEl) {
            const wrap = document.createElement('div');
            wrap.innerHTML = `
                <div class="modal fade" id="modalBlockCarDates" tabindex="-1" role="dialog" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered" role="document">
                        <div class="modal-content border-0 shadow-lg" style="border-radius: 12px; overflow: hidden;">
                            <div class="modal-header text-white" style="background: #1C1E32;">
                                <h5 class="modal-title font-weight-bold text-white"><i class="fa fa-calendar-times text-primary mr-2"></i>Bloquear Fechas Ocupadas</h5>
                                <button type="button" class="close text-white" data-dismiss="modal" aria-label="Cerrar"><span aria-hidden="true">&times;</span></button>
                            </div>
                            <div class="modal-body p-4">
                                <p class="small text-muted mb-3">Bloquea los días en que este vehículo ya esté alquilado por fuera o en mantenimiento para evitar reservas duplicadas en <strong id="block-dates-car-name"></strong>.</p>
                                <form id="form-add-blocked-range" class="p-3 bg-light border rounded mb-3">
                                    <input type="hidden" id="block-dates-car-id">
                                    <div class="form-row">
                                        <div class="col-md-5 form-group mb-2">
                                            <label class="small font-weight-bold">Desde *</label>
                                            <input type="date" id="block-start-date" class="form-control form-control-sm" required>
                                        </div>
                                        <div class="col-md-5 form-group mb-2">
                                            <label class="small font-weight-bold">Hasta *</label>
                                            <input type="date" id="block-end-date" class="form-control form-control-sm" required>
                                        </div>
                                        <div class="col-md-2 form-group mb-2 d-flex align-items-end">
                                            <button type="submit" class="btn btn-primary btn-sm btn-block font-weight-bold"><i class="fa fa-plus"></i></button>
                                        </div>
                                    </div>
                                    <input type="text" id="block-reason" class="form-control form-control-sm" placeholder="Motivo (Ej. Alquilado en agencia / Mantenimiento)">
                                </form>
                                <div class="small font-weight-bold text-uppercase text-muted mb-2">Rangos bloqueados actualmente:</div>
                                <div id="blocked-ranges-list"></div>
                            </div>
                        </div>
                    </div>
                </div>`;
            document.body.appendChild(wrap.firstElementChild);
            modalEl = document.getElementById('modalBlockCarDates');

            document.getElementById('form-add-blocked-range').addEventListener('submit', async function (e) {
                e.preventDefault();
                const cid = document.getElementById('block-dates-car-id').value;
                const start = document.getElementById('block-start-date').value;
                const end = document.getElementById('block-end-date').value;
                const reason = document.getElementById('block-reason').value.trim() || 'Ocupado / No disponible';
                if (!start || !end || end < start) {
                    alert('La fecha final debe ser igual o posterior a la fecha inicial.');
                    return;
                }
                const list = getAllCars();
                const idx = list.findIndex(c => String(c.id) === String(cid));
                if (idx === -1) return;
                if (!Array.isArray(list[idx].blockedDates)) list[idx].blockedDates = [];
                list[idx].blockedDates.push({ start, end, reason });
                localStorage.setItem('renteasy_cars', JSON.stringify(list));
                if (typeof dbUpdateVehiculo === 'function') await dbUpdateVehiculo(list[idx]);
                if (typeof window.broadcastLiveSync === 'function') window.broadcastLiveSync('cars_updated');
                document.getElementById('form-add-blocked-range').reset();
                renderBlockedRanges(list[idx]);
            });
        }

        function renderBlockedRanges(targetCar) {
            const box = document.getElementById('blocked-ranges-list');
            const ranges = Array.isArray(targetCar.blockedDates) ? targetCar.blockedDates : [];
            if (ranges.length === 0) {
                box.innerHTML = '<div class="text-center py-2 text-muted small border rounded">No hay fechas bloqueadas manualmente.</div>';
                return;
            }
            box.innerHTML = ranges.map((r, i) => `
                <div class="d-flex justify-content-between align-items-center p-2 border rounded mb-1 bg-white small">
                    <div>
                        <strong class="text-dark">${r.start} &rarr; ${r.end}</strong>
                        <div class="text-muted" style="font-size: 11px;">${r.reason || 'Ocupado'}</div>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-danger py-0 px-2" onclick="window._removeBlockedRange('${targetCar.id}', ${i})"><i class="fa fa-trash"></i></button>
                </div>
            `).join('');
        }

        window._removeBlockedRange = async function (cid, idx) {
            const list = getAllCars();
            const c = list.find(item => String(item.id) === String(cid));
            if (!c || !Array.isArray(c.blockedDates)) return;
            c.blockedDates.splice(idx, 1);
            localStorage.setItem('renteasy_cars', JSON.stringify(list));
            if (typeof dbUpdateVehiculo === 'function') await dbUpdateVehiculo(c);
            if (typeof window.broadcastLiveSync === 'function') window.broadcastLiveSync('cars_updated');
            renderBlockedRanges(c);
        };

        document.getElementById('block-dates-car-id').value = car.id;
        document.getElementById('block-dates-car-name').textContent = car.fullName;
        renderBlockedRanges(car);
        $('#modalBlockCarDates').modal('show');
    };

    window.toggleCarStatus = function (carId) {
        const cars = getAllCars();
        const car = cars.find(c => c.id === carId);
        if (car) {
            car.status = car.status === 'Activo' ? 'Pausado' : 'Activo';
            localStorage.setItem('renteasy_cars', JSON.stringify(cars));
            if (typeof dbUpdateVehiculo === 'function') dbUpdateVehiculo(car);
            if (typeof window.broadcastLiveSync === 'function') window.broadcastLiveSync('cars_updated');
            renderOwnerCars();
        }
    };

    window.openEditCarModal = function (carId) {
        const cars = getAllCars();
        const car = cars.find(c => String(c.id) === String(carId));
        if (!car) return;

        let modalEl = document.getElementById('modalEditOwnerCar');
        if (!modalEl) {
            const wrap = document.createElement('div');
            wrap.innerHTML = `
                <div class="modal fade" id="modalEditOwnerCar" tabindex="-1" role="dialog" aria-hidden="true">
                    <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
                        <div class="modal-content border-0 shadow-lg" style="border-radius: 14px; overflow: hidden;">
                            <div class="modal-header text-white" style="background: #1C1E32;">
                                <h5 class="modal-title font-weight-bold text-white"><i class="fa fa-edit text-primary mr-2"></i>Editar Vehículo y Fotos</h5>
                                <button type="button" class="close text-white" data-dismiss="modal" aria-label="Cerrar"><span aria-hidden="true">&times;</span></button>
                            </div>
                            <form id="form-edit-owner-car">
                                <div class="modal-body p-4" style="max-height: 75vh; overflow-y: auto;">
                                    <input type="hidden" id="edit-car-id">
                                    <div class="row">
                                        <div class="col-md-4 form-group">
                                            <label class="small font-weight-bold">Marca *</label>
                                            <input type="text" id="edit-car-brand" class="form-control" required>
                                        </div>
                                        <div class="col-md-4 form-group">
                                            <label class="small font-weight-bold">Modelo *</label>
                                            <input type="text" id="edit-car-model" class="form-control" required>
                                        </div>
                                        <div class="col-md-4 form-group">
                                            <label class="small font-weight-bold">Año *</label>
                                            <input type="number" id="edit-car-year" class="form-control" min="1990" max="2030" required>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-3 form-group">
                                            <label class="small font-weight-bold">Categoría</label>
                                            <select id="edit-car-category" class="form-control">
                                                <option value="Sedán">Sedán</option>
                                                <option value="SUV / Camioneta">SUV / Camioneta</option>
                                                <option value="Compacto">Compacto</option>
                                                <option value="Pickup">Pickup 4x4</option>
                                                <option value="Deportivo / Lujo">Deportivo / Lujo</option>
                                            </select>
                                        </div>
                                        <div class="col-md-3 form-group">
                                            <label class="small font-weight-bold">Transmisión</label>
                                            <select id="edit-car-transmission" class="form-control">
                                                <option value="Automático">Automático</option>
                                                <option value="Mecánico">Mecánico</option>
                                            </select>
                                        </div>
                                        <div class="col-md-3 form-group">
                                            <label class="small font-weight-bold">Combustible</label>
                                            <select id="edit-car-fuel" class="form-control">
                                                <option value="Gasolina">Gasolina</option>
                                                <option value="Diésel">Diésel</option>
                                                <option value="Híbrido">Híbrido</option>
                                                <option value="Eléctrico">Eléctrico</option>
                                            </select>
                                        </div>
                                        <div class="col-md-3 form-group">
                                            <label class="small font-weight-bold">Puestos</label>
                                            <input type="number" id="edit-car-seats" class="form-control" min="2" max="15" required>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-4 form-group">
                                            <label class="small font-weight-bold">Capacidad de Maletas</label>
                                            <input type="number" id="edit-car-luggage" class="form-control" min="1" max="12" required>
                                        </div>
                                        <div class="col-md-4 form-group">
                                            <label class="small font-weight-bold">Tipo de Anfitrión</label>
                                            <select id="edit-car-host-type" class="form-control">
                                                <option value="Rentadora Aliada">Rentadora Aliada / Agencia</option>
                                                <option value="Propietario Particular">Propietario Particular</option>
                                            </select>
                                        </div>
                                        <div class="col-md-4 form-group">
                                            <label class="small font-weight-bold">¿Cuenta con GPS activo?</label>
                                            <select id="edit-car-has-gps" class="form-control">
                                                <option value="true">Sí — Rastreo GPS Activo</option>
                                                <option value="false">No — Sin GPS instalado</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-4 form-group">
                                            <label class="small font-weight-bold">Precio Diario (COP) *</label>
                                            <input type="number" id="edit-car-price" class="form-control" min="30000" step="1000" required>
                                        </div>
                                        <div class="col-md-4 form-group">
                                            <label class="small font-weight-bold">Ciudad</label>
                                            <input type="text" id="edit-car-city" class="form-control" autocomplete="off" placeholder="Escribe la ciudad" required>
                                        </div>
                                        <div class="col-md-4 form-group">
                                            <label class="small font-weight-bold">Kilometraje Límite</label>
                                            <input type="text" id="edit-car-mileage" class="form-control" placeholder="Ej. 250 km/día">
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-4 form-group">
                                            <label class="small font-weight-bold">Estado</label>
                                            <select id="edit-car-status" class="form-control">
                                                <option value="Activo">Activo (Visible)</option>
                                                <option value="Pausado">Pausado (Oculto)</option>
                                                <option value="En Renta">En Renta</option>
                                            </select>
                                        </div>
                                        <div class="col-md-8 form-group">
                                            <label class="small font-weight-bold">Descripción</label>
                                            <textarea id="edit-car-description" class="form-control" rows="2"></textarea>
                                        </div>
                                    </div>
                                    <hr>
                                    <div class="form-group mb-2">
                                        <label class="small font-weight-bold d-block"><i class="fa fa-images text-primary mr-1"></i> Galería de Fotos del Vehículo</label>
                                        <div id="edit-car-gallery-list" class="d-flex flex-wrap mb-2" style="gap: 10px;"></div>
                                        <div class="row align-items-center mt-2">
                                            <div class="col-md-6 mb-2">
                                                <input type="file" id="edit-car-photo-file" accept="image/*" multiple class="form-control-file small">
                                                <small class="text-muted">Subir nuevas fotos desde tu dispositivo</small>
                                            </div>
                                            <div class="col-md-6 mb-2">
                                                <div class="input-group input-group-sm">
                                                    <input type="url" id="edit-car-photo-url" class="form-control" placeholder="https://... URL de foto">
                                                    <div class="input-group-append">
                                                        <button type="button" id="btn-edit-add-photo-url" class="btn btn-outline-primary">Agregar URL</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <hr>
                                    <div class="row p-2 bg-light border rounded">
                                        <div class="col-12 mb-1 small font-weight-bold text-dark"><i class="fa fa-shield-alt text-primary mr-1"></i> Documentos de Respaldo (SOAT y Póliza)</div>
                                        <div class="col-md-6 mb-2">
                                            <label class="small font-weight-semi-bold mb-1">Actualizar SOAT Vigente (Imagen o PDF)</label>
                                            <input type="file" id="edit-car-soat-file" accept="image/*,application/pdf,.pdf" class="form-control-file small">
                                            <small id="edit-car-soat-status" class="text-muted"></small>
                                        </div>
                                        <div class="col-md-6 mb-2">
                                            <label class="small font-weight-semi-bold mb-1">Actualizar Póliza de Seguro (Imagen o PDF)</label>
                                            <input type="file" id="edit-car-policy-file" accept="image/*,application/pdf,.pdf" class="form-control-file small">
                                            <small id="edit-car-policy-status" class="text-muted"></small>
                                        </div>
                                    </div>
                                </div>
                                <div class="modal-footer bg-light">
                                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancelar</button>
                                    <button type="submit" class="btn btn-primary font-weight-bold px-4"><i class="fa fa-save mr-1"></i> Guardar Cambios</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>`;
            document.body.appendChild(wrap.firstElementChild);
            modalEl = document.getElementById('modalEditOwnerCar');
            attachColombiaCityAutocomplete(document.getElementById('edit-car-city'));
            attachBrandAndModelAutocomplete(document.getElementById('edit-car-brand'), document.getElementById('edit-car-model'));
            bindSmartVehicleSpecs({
                brandEl: document.getElementById('edit-car-brand'),
                modelEl: document.getElementById('edit-car-model'),
                categoryEl: document.getElementById('edit-car-category'),
                seatsEl: document.getElementById('edit-car-seats'),
                luggageEl: document.getElementById('edit-car-luggage')
            });
            attachClearButtonToFields(['edit-car-brand', 'edit-car-model', 'edit-car-price', 'edit-car-city', 'edit-car-mileage']);

            const bindEditDoc = (inputId, statusId, key) => {
                const el = document.getElementById(inputId);
                const st = document.getElementById(statusId);
                if (!el) return;
                el.addEventListener('change', function (evt) {
                    const f = evt.target.files && evt.target.files[0];
                    if (!f) return;
                    processDocFile(f, function (dataUrl) {
                        window[key] = dataUrl;
                        if (st) st.innerHTML = renderDocPreviewHtml(dataUrl, 'Nuevo documento listo para guardar', true);
                    });
                });
            };
            bindEditDoc('edit-car-soat-file', 'edit-car-soat-status', '_editingSoatImg');
            bindEditDoc('edit-car-policy-file', 'edit-car-policy-status', '_editingPolicyImg');

            document.getElementById('edit-car-photo-file').addEventListener('change', function (evt) {
                const files = Array.from(evt.target.files || []);
                files.forEach(file => {
                    if (file.size > 4 * 1024 * 1024) return;
                    const reader = new FileReader();
                    reader.onload = function (r) {
                        window._editingCarGallery.push(r.target.result);
                        renderEditGallery();
                    };
                    reader.readAsDataURL(file);
                });
                evt.target.value = '';
            });

            document.getElementById('btn-edit-add-photo-url').addEventListener('click', function () {
                const urlInput = document.getElementById('edit-car-photo-url');
                const val = urlInput.value.trim();
                if (val) {
                    window._editingCarGallery.push(val);
                    urlInput.value = '';
                    renderEditGallery();
                }
            });

            document.getElementById('form-edit-owner-car').addEventListener('submit', async function (e) {
                e.preventDefault();
                const id = document.getElementById('edit-car-id').value;
                const all = getAllCars();
                const idx = all.findIndex(c => String(c.id) === String(id));
                if (idx === -1) return;

                const brand = document.getElementById('edit-car-brand').value.trim();
                const model = document.getElementById('edit-car-model').value.trim();
                const gallery = window._editingCarGallery.length > 0 ? window._editingCarGallery.slice() : [all[idx].image || 'img/car-rent-1.png'];

                all[idx].brand = brand;
                all[idx].model = model;
                all[idx].fullName = `${brand} ${model}`.trim();
                all[idx].name = all[idx].fullName;
                all[idx].year = parseInt(document.getElementById('edit-car-year').value) || 2024;
                all[idx].category = document.getElementById('edit-car-category').value;
                all[idx].type = all[idx].category;
                all[idx].transmission = document.getElementById('edit-car-transmission').value;
                all[idx].fuel = document.getElementById('edit-car-fuel').value;
                all[idx].seats = parseInt(document.getElementById('edit-car-seats').value) || 5;
                all[idx].luggage = parseInt(document.getElementById('edit-car-luggage').value) || 3;
                all[idx].hostType = document.getElementById('edit-car-host-type').value || 'Rentadora Aliada';
                all[idx].hasGps = (document.getElementById('edit-car-has-gps').value !== 'false');
                if (window._editingSoatImg) all[idx].soatImage = window._editingSoatImg;
                if (window._editingPolicyImg) all[idx].policyImage = window._editingPolicyImg;
                all[idx].pricePerDay = parseFloat(document.getElementById('edit-car-price').value) || 200000;
                all[idx].price = all[idx].pricePerDay;
                all[idx].city = document.getElementById('edit-car-city').value.trim() || 'Valledupar';
                all[idx].mileage = document.getElementById('edit-car-mileage').value.trim() || '250 km/día';
                all[idx].status = document.getElementById('edit-car-status').value;
                all[idx].description = document.getElementById('edit-car-description').value.trim();
                all[idx].desc = all[idx].description;
                all[idx].images = gallery;
                all[idx].image = gallery[0];

                localStorage.setItem('renteasy_cars', JSON.stringify(all));
                if (typeof dbUpdateVehiculo === 'function') {
                    await dbUpdateVehiculo(all[idx]);
                }
                if (typeof window.logSystemEvent === 'function') {
                    window.logSystemEvent('Flota', 'Vehículo actualizado por propietario', `${all[idx].fullName} ($${all[idx].pricePerDay}/día, ${gallery.length} fotos)`);
                }
                if (typeof window.broadcastLiveSync === 'function') window.broadcastLiveSync('cars_updated');

                $('#modalEditOwnerCar').modal('hide');
                renderDashboardStats();
                renderOwnerCars();
                alert('¡Vehículo actualizado correctamente!');
            });
        }

        function renderEditGallery() {
            const box = document.getElementById('edit-car-gallery-list');
            if (!box) return;
            box.innerHTML = window._editingCarGallery.map((src, i) => `
                <div class="border rounded p-1 bg-light text-center position-relative" style="width: 105px;">
                    <img src="${src}" class="rounded" style="width: 95px; height: 65px; object-fit: cover;" onerror="this.src='img/car-rent-1.png'">
                    <div class="mt-1 d-flex justify-content-between align-items-center">
                        ${i === 0
                            ? '<span class="badge badge-primary" style="font-size: 9px;">Principal</span>'
                            : `<button type="button" class="btn btn-link btn-sm p-0" style="font-size: 10px;" onclick="window._editSetPrimaryImg(${i})">Principal</button>`}
                        <button type="button" class="btn btn-link text-danger btn-sm p-0" style="font-size: 11px;" onclick="window._editRemoveImg(${i})" title="Quitar foto"><i class="fa fa-times"></i></button>
                    </div>
                </div>
            `).join('');
        }

        window._editSetPrimaryImg = function (i) {
            const item = window._editingCarGallery.splice(i, 1)[0];
            if (item) window._editingCarGallery.unshift(item);
            renderEditGallery();
        };
        window._editRemoveImg = function (i) {
            if (window._editingCarGallery.length <= 1) {
                alert('El vehículo debe conservar al menos una foto.');
                return;
            }
            window._editingCarGallery.splice(i, 1);
            renderEditGallery();
        };

        window._editingCarGallery = Array.isArray(car.images) && car.images.length > 0 ? car.images.slice() : [car.image || 'img/car-rent-1.png'];
        document.getElementById('edit-car-id').value = car.id;
        document.getElementById('edit-car-brand').value = car.brand || '';
        document.getElementById('edit-car-model').value = car.model || '';
        document.getElementById('edit-car-year').value = car.year || 2024;
        document.getElementById('edit-car-category').value = car.category || 'SUV / Camioneta';
        document.getElementById('edit-car-transmission').value = car.transmission || 'Automático';
        document.getElementById('edit-car-fuel').value = car.fuel || 'Gasolina';
        document.getElementById('edit-car-seats').value = car.seats || 5;
        document.getElementById('edit-car-luggage').value = car.luggage || (typeof window.getLuggageByCategory === 'function' ? window.getLuggageByCategory(car.category) : 3);
        document.getElementById('edit-car-host-type').value = car.hostType || 'Rentadora Aliada';
        document.getElementById('edit-car-has-gps').value = (car.hasGps === false) ? 'false' : 'true';
        window._editingSoatImg = '';
        window._editingPolicyImg = '';
        const soatSt = document.getElementById('edit-car-soat-status');
        const polSt = document.getElementById('edit-car-policy-status');
        const soatInp = document.getElementById('edit-car-soat-file');
        const polInp = document.getElementById('edit-car-policy-file');
        if (soatInp) soatInp.value = '';
        if (polInp) polInp.value = '';
        if (soatSt) soatSt.innerHTML = renderDocPreviewHtml(car.soatImage, 'SOAT cargado', true);
        if (polSt) polSt.innerHTML = renderDocPreviewHtml(car.policyImage, 'Póliza cargada', true);
        document.getElementById('edit-car-price').value = car.pricePerDay || car.price || 200000;
        document.getElementById('edit-car-city').value = car.city || 'Valledupar';
        document.getElementById('edit-car-mileage').value = car.mileage || '250 km/día';
        document.getElementById('edit-car-status').value = car.status || 'Activo';
        document.getElementById('edit-car-description').value = car.description || car.desc || '';
        ['edit-car-brand', 'edit-car-model', 'edit-car-price', 'edit-car-city', 'edit-car-mileage'].forEach(fid => {
            const fel = document.getElementById(fid);
            if (fel && typeof fel._syncClearBtn === 'function') fel._syncClearBtn();
        });
        renderEditGallery();

        $('#modalEditOwnerCar').modal('show');
    };

    window.deleteCar = function (carId) {
        const doDelete = async function () {
            let cars = getAllCars();
            const target = cars.find(c => String(c.id) === String(carId));
            cars = cars.filter(c => String(c.id) !== String(carId));
            localStorage.setItem('renteasy_cars', JSON.stringify(cars));
            if (typeof dbDeleteVehiculo === 'function') {
                await dbDeleteVehiculo(carId);
            }
            if (typeof window.logSystemEvent === 'function' && target) {
                window.logSystemEvent('Flota', 'Vehículo eliminado por propietario', target.fullName || carId);
            }
            if (typeof window.broadcastLiveSync === 'function') window.broadcastLiveSync('cars_updated');
            renderDashboardStats();
            renderOwnerCars();
            alert('Vehículo eliminado permanentemente.');
        };
        if (typeof window.openAppConfirmModal === 'function') {
            window.openAppConfirmModal({ title: 'Eliminar vehículo', message: '¿Estás seguro de que deseas eliminar este vehículo de tu catálogo?', confirmText: 'Eliminar', onConfirm: doDelete });
        } else {
            doDelete();
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
        // Verificar inactividad primero (30 minutos)
        const storedLast = parseInt(localStorage.getItem('renteasy_last_activity'), 10);
        if (storedLast && (Date.now() - storedLast) >= 30 * 60 * 1000) {
            localStorage.removeItem('renteasy_current_user');
            localStorage.removeItem('renteasy_last_activity');
            window.location.replace('LOGIN.html?reason=timeout&redirect=dashboard-propietario.html');
            return null;
        }

        let user = null;
        try {
            user = JSON.parse(localStorage.getItem('renteasy_current_user'));
        } catch (e) {}

        if (!user || !user.email) {
            alert('Para acceder al Panel de Anfitrión y publicar vehículos, debes iniciar sesión o registrarte.');
            window.location.replace('LOGIN.html?action=register&role=propietario&redirect=dashboard-propietario.html');
            return null;
        }

        // Si es conductor, promover su rol automáticamente a propietario
        if (user.role !== 'admin' && user.role !== 'propietario') {
            user.role = 'propietario';
            localStorage.setItem('renteasy_current_user', JSON.stringify(user));
            localStorage.setItem('renteasy_pending_role', 'propietario');
            if (typeof getSupabaseClient === 'function') {
                const client = getSupabaseClient();
                if (client) {
                    client.from('perfiles').update({ rol: 'propietario' }).eq('id', user.id).catch(() => {});
                }
            }
        }

        return user;
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

    function initDefaultBookings() {
        if (!localStorage.getItem('renteasy_bookings')) {
            localStorage.setItem('renteasy_bookings', JSON.stringify([]));
        }
    }

    // ================= GUÍA DE PRECIO DE MERCADO AL PUBLICAR ================= //
    function setupMarketPriceHint() {
        const catSelect = document.getElementById('car-category');
        const hintEl = document.getElementById('market-price-hint');
        if (!catSelect || !hintEl) return;

        const ranges = {
            'Compacto': '$110.000 – $160.000 COP/día',
            'Hatchback / Compacto': '$110.000 – $160.000 COP/día',
            'Sedán': '$140.000 – $200.000 COP/día',
            'SUV / Camioneta': '$190.000 – $280.000 COP/día',
            'Pickup': '$260.000 – $360.000 COP/día',
            'Van / Familiar': '$240.000 – $340.000 COP/día',
            'Deportivo / Lujo': '$350.000 – $650.000 COP/día'
        };

        const updateHint = () => {
            const val = catSelect.value;
            const range = ranges[val] || '$140.000 – $240.000 COP/día';
            hintEl.innerHTML = `<i class="fa fa-lightbulb mr-1"></i> Sugerencia de mercado (${val}): <strong>${range}</strong>`;
        };
        catSelect.addEventListener('change', updateHint);
        updateHint();
    }

    // ================= BANDEJA DE ALERTAS Y PROPUESTAS DE TARIFA DEL ADMIN ================= //
    function renderOwnerAlertsAndProposals() {
        const banner = document.getElementById('owner-alerts-banner');
        if (!banner) return;

        const allCars = getAllCars();
        const myCars = currentUser.role === 'admin' ? allCars : allCars.filter(c => c.ownerId === currentUser.id);
        const proposals = myCars.filter(c => c.priceNegotiation && c.priceNegotiation.status === 'admin_proposed');

        let alerts = [];
        try { alerts = JSON.parse(localStorage.getItem('rentcar_owner_alerts')) || []; } catch (e) { alerts = []; }
        const myAlerts = alerts.filter(a => !a.read && (currentUser.role === 'admin' || a.ownerId === currentUser.id));

        if (proposals.length === 0 && myAlerts.length === 0) {
            banner.innerHTML = '';
            return;
        }

        let html = '';
        proposals.forEach(car => {
            const neg = car.priceNegotiation;
            html += `
                <div class="alert alert-warning border-warning shadow-sm mb-3 p-3">
                    <div class="d-flex flex-wrap justify-content-between align-items-center">
                        <div class="mb-2 mb-md-0">
                            <h6 class="font-weight-bold text-dark mb-1"><i class="fa fa-tag text-primary mr-2"></i>Propuesta de Ajuste de Tarifa — ${car.fullName}</h6>
                            <div class="small text-dark">
                                Tarifa publicada: <del class="text-muted">$${formatCurrency(car.pricePerDay)} COP</del> &rarr;
                                Tarifa sugerida: <strong class="text-success">$${formatCurrency(neg.suggestedPrice)} COP/día</strong>
                            </div>
                            <div class="small text-muted mt-1"><i class="fa fa-comment-alt mr-1"></i> "${neg.adminNote || ''}"</div>
                        </div>
                        <div class="btn-group btn-group-sm">
                            <button type="button" class="btn btn-success font-weight-bold" onclick="acceptSuggestedPriceOwner('${car.id}')">
                                <i class="fa fa-check mr-1"></i> Aceptar $${formatCurrency(neg.suggestedPrice)}
                            </button>
                            <button type="button" class="btn btn-outline-dark font-weight-bold" onclick="openCounterOfferModal('${car.id}')">
                                <i class="fa fa-exchange-alt mr-1"></i> Contraoferta
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        myAlerts.forEach(a => {
            html += `
                <div class="alert alert-info border-info shadow-sm mb-3 p-3 d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="font-weight-bold text-dark mb-1"><i class="fa fa-bell text-warning mr-2"></i>Mensaje de Administración (${a.carName || 'Plataforma'}): ${a.subject}</h6>
                        <p class="small text-dark mb-0">${a.message}</p>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-primary ml-3 font-weight-bold" onclick="markOwnerAlertRead('${a.id}')">
                        <i class="fa fa-check mr-1"></i> Entendido
                    </button>
                </div>
            `;
        });

        banner.innerHTML = html;
    }

    window.acceptSuggestedPriceOwner = function (carId) {
        const cars = getAllCars();
        const car = cars.find(c => c.id === carId);
        if (!car || !car.priceNegotiation) return;

        const newPrice = Number(car.priceNegotiation.suggestedPrice);
        car.pricePerDay = newPrice;
        car.price = newPrice;
        car.status = 'Activo';
        car.priceNegotiation.status = 'accepted';
        car.priceNegotiation.resolvedAt = new Date().toISOString();
        localStorage.setItem('renteasy_cars', JSON.stringify(cars));
        if (typeof dbUpdateVehiculoFields === 'function') {
            dbUpdateVehiculoFields(carId, {
                precio_por_dia: newPrice,
                estado: 'Activo',
                negociacion_tarifa: car.priceNegotiation
            });
        }
        if (typeof window.logSystemEvent === 'function') {
            window.logSystemEvent('Tarifas', 'Propietario aceptó tarifa sugerida', `${car.fullName} — $${newPrice}/día`);
        }
        if (typeof window.broadcastLiveSync === 'function') window.broadcastLiveSync('cars_updated');

        renderOwnerAlertsAndProposals();
        renderOwnerCars();
        renderDashboardStats();
        alert(`¡Tarifa actualizada a $${formatCurrency(newPrice)} COP/día! Tu ${car.fullName} ya está Activo en el catálogo.`);
    };

    window.openCounterOfferModal = function (carId) {
        const cars = getAllCars();
        const car = cars.find(c => c.id === carId);
        if (!car || !car.priceNegotiation) return;

        document.getElementById('co-car-id').value = car.id;
        document.getElementById('co-car-name').innerText = `${car.fullName} (${car.year})`;
        document.getElementById('co-admin-price').innerText = `$${formatCurrency(car.priceNegotiation.suggestedPrice)} COP/día`;
        document.getElementById('co-counter-price').value = car.pricePerDay || car.priceNegotiation.suggestedPrice;
        document.getElementById('co-owner-note').value = '';
        $('#modalOwnerCounterOffer').modal('show');
    };

    const formCounterOffer = document.getElementById('form-owner-counter-offer');
    if (formCounterOffer) {
        formCounterOffer.addEventListener('submit', function (e) {
            e.preventDefault();
            const carId = document.getElementById('co-car-id').value;
            const counterPrice = parseInt(document.getElementById('co-counter-price').value, 10);
            const ownerNote = document.getElementById('co-owner-note').value.trim();

            const cars = getAllCars();
            const car = cars.find(c => c.id === carId);
            if (!car || !counterPrice) return;

            car.status = 'Contraoferta';
            car.priceNegotiation = Object.assign({}, car.priceNegotiation, {
                status: 'counter_offer',
                counterPrice: counterPrice,
                ownerNote: ownerNote,
                updatedAt: new Date().toISOString()
            });
            localStorage.setItem('renteasy_cars', JSON.stringify(cars));
            if (typeof dbUpdateVehiculoFields === 'function') {
                dbUpdateVehiculoFields(carId, {
                    estado: 'Contraoferta',
                    negociacion_tarifa: car.priceNegotiation
                });
            }
            if (typeof window.logSystemEvent === 'function') {
                window.logSystemEvent('Tarifas', 'Propietario envió contraoferta', `${car.fullName} — $${counterPrice}/día`);
            }
            if (typeof window.broadcastLiveSync === 'function') window.broadcastLiveSync('cars_updated');

            $('#modalOwnerCounterOffer').modal('hide');
            renderOwnerAlertsAndProposals();
            renderOwnerCars();
            alert(`Contraoferta de $${formatCurrency(counterPrice)} COP/día enviada al Administrador para su revisión.`);
        });
    }

    window.markOwnerAlertRead = function (alertId) {
        let alerts = [];
        try { alerts = JSON.parse(localStorage.getItem('rentcar_owner_alerts')) || []; } catch (e) { alerts = []; }
        const item = alerts.find(a => a.id === alertId);
        if (item) {
            item.read = true;
            localStorage.setItem('rentcar_owner_alerts', JSON.stringify(alerts));
            if (typeof dbMarkOwnerAlertRead === 'function') dbMarkOwnerAlertRead(alertId);
            renderOwnerAlertsAndProposals();
        }
    };

    // Sincronizar alertas y vehículos desde Supabase en segundo plano
    if (typeof dbGetVehiculos === 'function') {
        dbGetVehiculos().then(() => { renderOwnerAlertsAndProposals(); renderOwnerCars(); renderDashboardStats(); }).catch(() => { });
    }
    if (typeof dbGetOwnerAlerts === 'function') {
        dbGetOwnerAlerts().then(() => { renderOwnerAlertsAndProposals(); }).catch(() => { });
    }

    // Sincronización en tiempo real si el admin envía una propuesta o alerta desde otra pestaña
    window.addEventListener('storage', function (e) {
        if (e.key === 'renteasy_cars' || e.key === 'rentcar_owner_alerts') {
            renderOwnerAlertsAndProposals();
            renderOwnerCars();
            renderDashboardStats();
        }
    });
});
