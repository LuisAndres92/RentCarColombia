/**
 * Rent Car Colombia - Cliente Supabase (PostgreSQL & Storage en la Nube)
 * Conexión centralizada y sincronización en tiempo real con fallback inteligente a localStorage
 */

const SUPABASE_CONFIG = {
    url: "https://dfgnlpvfwvfqagmwfjmo.supabase.co",
    anonKey: "sb_publishable_EbpdhewHpMhjBU-e1F6qBw_zGxAMZ3V"
};

let sbClient = null;

// Inicialización del cliente Supabase
function getSupabaseClient() {
    if (sbClient) return sbClient;
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        try {
            sbClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
            return sbClient;
        } catch (e) {
            console.warn("No fue posible inicializar Supabase Client:", e);
            return null;
        }
    }
    return null;
}

/** ================= 1. VEHÍCULOS / CATÁLOGO ================= **/
async function dbGetVehiculos() {
    const client = getSupabaseClient();
    if (client) {
        try {
            const { data, error } = await client
                .from('vehiculos')
                .select('*')
                .order('creado_en', { ascending: false });

            if (!error && data) {
                // Adaptar nombres de campos al modelo del frontend (incluso si la tabla quedó vacía [])
                const mapped = data.map(v => {
                    const rawCat = v.categoria || v.category || v.tipo || v.type;
                    const cleanCat = (rawCat && rawCat !== 'undefined' && rawCat !== 'null') ? rawCat : 'SUV / Camioneta';
                    const rawPrice = parseFloat(v.precio_por_dia || v.precio || v.pricePerDay || v.price || 200000);
                    const cleanCity = (v.ciudad && v.ciudad !== 'undefined' && v.ciudad !== 'null') ? v.ciudad : (v.city && v.city !== 'undefined' ? v.city : 'Valledupar');
                    const cleanTransmission = (v.transmision && v.transmision !== 'undefined') ? v.transmision : (v.transmission || 'Automático');
                    const cleanFuel = (v.combustible && v.combustible !== 'undefined') ? v.combustible : (v.fuel || 'Gasolina');
                    const cleanSeats = parseInt(v.puestos || v.seats) || 5;
                    const cleanYear = parseInt(v.año || v.anio || v.year) || 2023;
                    const cleanName = v.nombre_completo || v.fullName || `${v.marca || ''} ${v.modelo || ''}`.trim() || 'Auto en Alquiler';

                    return {
                        id: v.id,
                        brand: v.marca || v.brand || 'Vehículo',
                        model: v.modelo || v.model || '',
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
                        mileage: v.kilometraje_limite || v.mileage || '200 km/día',
                        desc: v.descripcion || v.description || '',
                        description: v.descripcion || v.description || '',
                        image: v.imagen_url || v.image || 'img/car-rent-1.png',
                        images: Array.isArray(v.galeria_imagenes) && v.galeria_imagenes.length > 0 ? v.galeria_imagenes : [v.imagen_url || v.image || 'img/car-rent-1.png'],
                        priceNegotiation: (v.negociacion_tarifa && v.negociacion_tarifa.status) ? v.negociacion_tarifa : null,
                        soatOwnerDoc: (v.negociacion_tarifa && v.negociacion_tarifa._soatMeta && v.negociacion_tarifa._soatMeta.ownerDoc) || v.soat_tomador_doc || '',
                        soatPdfPassword: (v.negociacion_tarifa && v.negociacion_tarifa._soatMeta && v.negociacion_tarifa._soatMeta.pdfPwd) || v.soat_pdf_clave || '',
                        status: v.estado || v.status || 'Activo',
                        ownerId: v.propietario_id || v.ownerId,
                        hostType: v.tipo_anfitrion || 'Rentadora Aliada',
                        hasGps: v.tiene_gps !== false,
                        luggage: parseInt(v.capacidad_maletas, 10) || 3,
                        blockedDates: Array.isArray(v.fechas_bloqueadas) ? v.fechas_bloqueadas : [],
                        soatImage: v.soat_imagen || '',
                        policyImage: v.poliza_imagen || '',
                        plate: v.placa || '',
                        soatExpiry: v.soat_vencimiento || '',
                        soatStatus: v.soat_estado || 'Pendiente',
                        platePhoto: v.foto_placa_privada || ''
                    };
                });
                // Sincronizar copia local (incluye lista vacía si se borraron todos en Supabase)
                localStorage.setItem('renteasy_cars', JSON.stringify(mapped));
                localStorage.setItem('rentcar_supabase_cars_synced', '1');
                return mapped;
            }
        } catch (err) {
            console.warn("Fallo temporal en Supabase vehiculos, usando caché local:", err);
        }
    }

    // Fallback a localStorage
    try {
        return JSON.parse(localStorage.getItem('renteasy_cars')) || [];
    } catch (e) {
        return [];
    }
}

async function dbUploadDataUrlToStorage(dataUrl, folder = 'vehiculos', filePrefix = 'archivo') {
    if (!dataUrl || !String(dataUrl).startsWith('data:')) return dataUrl || null;
    const client = getSupabaseClient();
    if (!client || !client.storage) return dataUrl;
    try {
        const parts = dataUrl.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
        const ext = mime.includes('pdf') ? 'pdf' : mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
        const bin = atob(parts[1]);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        const blob = new Blob([arr], { type: mime });
        const safePrefix = String(filePrefix || 'archivo').replace(/[^a-zA-Z0-9_-]/g, '');
        const filePath = `${folder}/${safePrefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`;
        const { error } = await client.storage.from('rentcar-archivos').upload(filePath, blob, {
            contentType: mime,
            upsert: true
        });
        if (!error) {
            const pub = client.storage.from('rentcar-archivos').getPublicUrl(filePath);
            if (pub && pub.data && pub.data.publicUrl) {
                return pub.data.publicUrl;
            }
        }
    } catch (e) {
        console.warn('Fallback local (Storage no disponible):', e);
    }
    return dataUrl;
}

async function dbSaveVehiculo(vehiculo) {
    const client = getSupabaseClient();
    if (client) {
        try {
            // Subir imágenes y documentos reales a Supabase Storage si vienen en Base64
            const rawGallery = Array.isArray(vehiculo.images) && vehiculo.images.length > 0 ? vehiculo.images : [vehiculo.image || 'img/car-rent-1.png'];
            const uploadedGallery = [];
            for (let i = 0; i < rawGallery.length; i++) {
                uploadedGallery.push(await dbUploadDataUrlToStorage(rawGallery[i], 'vehiculos', `car_${vehiculo.brand || 'auto'}_${i}`));
            }
            vehiculo.images = uploadedGallery;
            vehiculo.image = uploadedGallery[0] || vehiculo.image;
            if (vehiculo.soatImage) vehiculo.soatImage = await dbUploadDataUrlToStorage(vehiculo.soatImage, 'documentos', `soat_${vehiculo.plate || 'auto'}`);
            if (vehiculo.policyImage) vehiculo.policyImage = await dbUploadDataUrlToStorage(vehiculo.policyImage, 'documentos', `poliza_${vehiculo.plate || 'auto'}`);
            if (vehiculo.platePhoto) vehiculo.platePhoto = await dbUploadDataUrlToStorage(vehiculo.platePhoto, 'verificacion', `placa_${vehiculo.plate || 'auto'}`);

            const row = {
                marca: vehiculo.brand,
                modelo: vehiculo.model,
                nombre_completo: vehiculo.fullName || vehiculo.name || `${vehiculo.brand} ${vehiculo.model}`,
                año: parseInt(vehiculo.year) || 2022,
                categoria: vehiculo.category || vehiculo.type || 'Sedán',
                transmision: vehiculo.transmission || 'Automático',
                combustible: vehiculo.fuel || 'Gasolina',
                puestos: parseInt(vehiculo.seats) || 5,
                precio_por_dia: parseFloat(vehiculo.pricePerDay || vehiculo.price) || 200000,
                ciudad: vehiculo.city || 'Valledupar',
                kilometraje_limite: vehiculo.mileage || '200 km/día',
                descripcion: vehiculo.description || vehiculo.desc || '',
                imagen_url: vehiculo.image || 'img/car-rent-1.png',
                galeria_imagenes: uploadedGallery,
                negociacion_tarifa: (vehiculo.priceNegotiation || vehiculo.soatOwnerDoc || vehiculo.soatPdfPassword)
                    ? Object.assign({}, vehiculo.priceNegotiation || {}, {
                        _soatMeta: {
                            ownerDoc: vehiculo.soatOwnerDoc || '',
                            pdfPwd: vehiculo.soatPdfPassword || ''
                        }
                    })
                    : null,
                propietario_id: vehiculo.ownerId || null,
                estado: vehiculo.status || 'En Revision',
                tipo_anfitrion: vehiculo.hostType || 'Rentadora Aliada',
                tiene_gps: vehiculo.hasGps !== false,
                capacidad_maletas: parseInt(vehiculo.luggage, 10) || 3,
                fechas_bloqueadas: Array.isArray(vehiculo.blockedDates) ? vehiculo.blockedDates : [],
                soat_imagen: vehiculo.soatImage || null,
                poliza_imagen: vehiculo.policyImage || null,
                placa: vehiculo.plate || null,
                soat_vencimiento: vehiculo.soatExpiry || null,
                soat_estado: vehiculo.soatStatus || 'Pendiente',
                foto_placa_privada: vehiculo.platePhoto || null
            };

            const { data, error } = await client.from('vehiculos').insert([row]).select();
            if (!error && data && data[0]) {
                vehiculo.id = data[0].id;
            }
        } catch (err) {
            console.warn("Error guardando vehículo en Supabase:", err);
        }
    }

    // Guardar en copia local
    let cars = [];
    try { cars = JSON.parse(localStorage.getItem('renteasy_cars')) || []; } catch(e) {}
    const existingIdx = cars.findIndex(c => String(c.id) === String(vehiculo.id));
    if (existingIdx !== -1) cars[existingIdx] = vehiculo;
    else cars.unshift(vehiculo);
    localStorage.setItem('renteasy_cars', JSON.stringify(cars));
    return vehiculo;
}

async function dbUpdateVehiculo(vehiculo) {
    const client = getSupabaseClient();
    if (client && vehiculo && vehiculo.id) {
        try {
            const rawGallery = Array.isArray(vehiculo.images) && vehiculo.images.length > 0 ? vehiculo.images : [vehiculo.image || 'img/car-rent-1.png'];
            const uploadedGallery = [];
            for (let i = 0; i < rawGallery.length; i++) {
                uploadedGallery.push(await dbUploadDataUrlToStorage(rawGallery[i], 'vehiculos', `car_${vehiculo.brand || 'auto'}_${i}`));
            }
            vehiculo.images = uploadedGallery;
            vehiculo.image = uploadedGallery[0] || vehiculo.image;
            if (vehiculo.soatImage) vehiculo.soatImage = await dbUploadDataUrlToStorage(vehiculo.soatImage, 'documentos', `soat_${vehiculo.plate || 'auto'}`);
            if (vehiculo.policyImage) vehiculo.policyImage = await dbUploadDataUrlToStorage(vehiculo.policyImage, 'documentos', `poliza_${vehiculo.plate || 'auto'}`);
            if (vehiculo.platePhoto) vehiculo.platePhoto = await dbUploadDataUrlToStorage(vehiculo.platePhoto, 'verificacion', `placa_${vehiculo.plate || 'auto'}`);

            const row = {
                marca: vehiculo.brand,
                modelo: vehiculo.model,
                nombre_completo: vehiculo.fullName || vehiculo.name || `${vehiculo.brand} ${vehiculo.model}`,
                año: parseInt(vehiculo.year) || 2022,
                categoria: vehiculo.category || vehiculo.type || 'Sedán',
                transmision: vehiculo.transmission || 'Automático',
                combustible: vehiculo.fuel || 'Gasolina',
                puestos: parseInt(vehiculo.seats) || 5,
                precio_por_dia: parseFloat(vehiculo.pricePerDay || vehiculo.price) || 200000,
                ciudad: vehiculo.city || 'Valledupar',
                kilometraje_limite: vehiculo.mileage || '200 km/día',
                descripcion: vehiculo.description || vehiculo.desc || '',
                imagen_url: vehiculo.image || 'img/car-rent-1.png',
                galeria_imagenes: uploadedGallery,
                estado: vehiculo.status || 'Activo',
                tipo_anfitrion: vehiculo.hostType || 'Rentadora Aliada',
                tiene_gps: vehiculo.hasGps !== false,
                capacidad_maletas: parseInt(vehiculo.luggage, 10) || 3,
                fechas_bloqueadas: Array.isArray(vehiculo.blockedDates) ? vehiculo.blockedDates : [],
                soat_imagen: vehiculo.soatImage || null,
                poliza_imagen: vehiculo.policyImage || null,
                placa: vehiculo.plate || null,
                soat_vencimiento: vehiculo.soatExpiry || null,
                soat_estado: vehiculo.soatStatus || 'Pendiente',
                foto_placa_privada: vehiculo.platePhoto || null,
                negociacion_tarifa: (vehiculo.priceNegotiation || vehiculo.soatOwnerDoc || vehiculo.soatPdfPassword)
                    ? Object.assign({}, vehiculo.priceNegotiation || {}, {
                        _soatMeta: {
                            ownerDoc: vehiculo.soatOwnerDoc || '',
                            pdfPwd: vehiculo.soatPdfPassword || ''
                        }
                    })
                    : null
            };
            await client.from('vehiculos').update(row).eq('id', vehiculo.id);
        } catch (err) {
            console.warn("Error actualizando vehículo en Supabase:", err);
        }
    }
    return vehiculo;
}

async function dbDeleteVehiculo(id) {
    const client = getSupabaseClient();
    if (client && id) {
        try {
            await client.from('vehiculos').delete().eq('id', id);
        } catch (err) {
            console.warn("Error eliminando vehículo en Supabase:", err);
        }
    }
}

/** ================= 2. RESERVAS ================= **/
async function dbGetReservas() {
    const client = getSupabaseClient();
    if (client) {
        try {
            const { data, error } = await client
                .from('reservas')
                .select('*')
                .order('creado_en', { ascending: false });

            if (!error && data) {
                let carsCache = [];
                let usersCache = [];
                try { carsCache = JSON.parse(localStorage.getItem('renteasy_cars')) || []; } catch (_) { }
                try { usersCache = JSON.parse(localStorage.getItem('renteasy_users')) || []; } catch (_) { }

                const mapped = data.map(r => {
                    const carObj = carsCache.find(c => String(c.id) === String(r.vehiculo_id)) || {};
                    const driverObj = usersCache.find(u => String(u.id) === String(r.conductor_id)) || {};
                    const ownerObj = usersCache.find(u => String(u.id) === String(r.propietario_id)) || {};
                    const fee15 = parseFloat(r.comision_plataforma_15) || 0;
                    const earn85 = parseFloat(r.ganancia_propietario_85) || 0;
                    const tot = parseFloat(r.total_cobrado) || 0;
                    return {
                        id: r.id,
                        carId: r.vehiculo_id,
                        carName: carObj.fullName ? `${carObj.fullName} (${carObj.year || ''})`.trim() : (carObj.name || 'Vehículo'),
                        carImage: carObj.image || 'img/car-rent-1.png',
                        carCity: carObj.city || 'Colombia',
                        ownerId: r.propietario_id,
                        ownerName: carObj.ownerName || ownerObj.name || 'Anfitrión',
                        ownerPhone: carObj.ownerPhone || ownerObj.phone || '',
                        driverId: r.conductor_id,
                        renterName: driverObj.name || 'Conductor',
                        renterEmail: driverObj.email || '',
                        renterPhone: driverObj.phone || '',
                        startDate: r.fecha_inicio,
                        endDate: r.fecha_fin,
                        totalDays: r.total_dias,
                        dailyRate: parseFloat(r.tarifa_diaria) || 0,
                        subtotal: parseFloat(r.subtotal_alquiler) || 0,
                        commission15: fee15,
                        platformFee: fee15,
                        ownerEarning85: earn85,
                        ownerEarnings: earn85,
                        deposit: parseFloat(r.deposito_garantia) || 200000,
                        totalPaid: tot,
                        totalPrice: tot,
                        paymentMethod: r.metodo_pago,
                        paymentStatus: r.estado_pago,
                        status: r.estado_reserva,
                        extraDriverName: r.conductor_adicional_nombre || '',
                        extraDriverLicense: r.conductor_adicional_licencia || '',
                        driverIdImg: r.conductor_cedula_img || '',
                        driverLicenseImg: r.conductor_licencia_img || '',
                        createdAt: r.creado_en
                    };
                });
                localStorage.setItem('renteasy_bookings', JSON.stringify(mapped));
                return mapped;
            }
        } catch (err) {
            console.warn("Fallo temporal reservas Supabase:", err);
        }
    }

    try {
        return JSON.parse(localStorage.getItem('renteasy_bookings')) || [];
    } catch (e) {
        return [];
    }
}

async function dbSaveReserva(reserva) {
    const client = getSupabaseClient();
    const isUuid = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v || ''));
    if (client) {
        try {
            if (reserva.driverIdImg) reserva.driverIdImg = await dbUploadDataUrlToStorage(reserva.driverIdImg, 'kyc', 'cedula');
            if (reserva.driverLicenseImg) reserva.driverLicenseImg = await dbUploadDataUrlToStorage(reserva.driverLicenseImg, 'kyc', 'licencia');

            // Asegurar UUID válido para conductor_id en perfiles
            let conductorUuid = isUuid(reserva.driverId) ? reserva.driverId : null;
            if (!conductorUuid && reserva.renterEmail) {
                const { data: prof } = await client.from('perfiles').select('id').eq('email', reserva.renterEmail).maybeSingle();
                if (prof && prof.id) {
                    conductorUuid = prof.id;
                } else {
                    const { data: createdProf } = await client.from('perfiles').upsert([{
                        email: reserva.renterEmail,
                        nombre_completo: reserva.renterName || reserva.renterEmail.split('@')[0],
                        telefono: reserva.renterPhone || '',
                        rol: 'conductor'
                    }], { onConflict: 'email' }).select('id');
                    if (createdProf && createdProf[0]) conductorUuid = createdProf[0].id;
                }
            }

            // Asegurar UUID válido para propietario_id desde vehiculos si hace falta
            let ownerUuid = isUuid(reserva.ownerId) ? reserva.ownerId : null;
            if (!ownerUuid && isUuid(reserva.carId)) {
                const { data: veh } = await client.from('vehiculos').select('propietario_id').eq('id', reserva.carId).maybeSingle();
                if (veh && veh.propietario_id) ownerUuid = veh.propietario_id;
            }

            // Normalizar estado_pago al CHECK constraint ('Pendiente', 'Autorizado', 'Capturado', 'Reembolsado')
            const rawPay = String(reserva.paymentStatus || '').toLowerCase();
            const safePayStatus = rawPay.includes('autoriz') || rawPay.includes('aprob') || reserva.paymentMethod === 'wompi'
                ? 'Autorizado'
                : (rawPay.includes('captur') ? 'Capturado' : (rawPay.includes('reembols') ? 'Reembolsado' : 'Pendiente'));

            const row = {
                vehiculo_id: reserva.carId,
                propietario_id: ownerUuid || reserva.ownerId,
                conductor_id: conductorUuid || reserva.driverId,
                fecha_inicio: reserva.startDate,
                fecha_fin: reserva.endDate,
                total_dias: parseInt(reserva.totalDays, 10) || 1,
                tarifa_diaria: parseFloat(reserva.dailyRate) || 0,
                subtotal_alquiler: parseFloat(reserva.subtotal) || 0,
                comision_plataforma_15: parseFloat(reserva.commission15 ?? reserva.platformFee) || 0,
                ganancia_propietario_85: parseFloat(reserva.ownerEarning85 ?? reserva.ownerEarnings) || 0,
                deposito_garantia: parseFloat(reserva.deposit) || 200000,
                total_cobrado: parseFloat(reserva.totalPaid ?? reserva.totalPrice) || 0,
                metodo_pago: reserva.paymentMethod === 'wompi' ? 'Tarjeta / Wompi' : (reserva.paymentMethod || 'Transferencia'),
                estado_pago: safePayStatus,
                estado_reserva: reserva.status || 'Pendiente',
                conductor_adicional_nombre: reserva.extraDriverName || null,
                conductor_adicional_licencia: reserva.extraDriverLicense || null,
                conductor_cedula_img: reserva.driverIdImg || null,
                conductor_licencia_img: reserva.driverLicenseImg || null
            };

            const { data, error } = await client.from('reservas').insert([row]).select();
            if (error) {
                console.warn('Error insertando reserva en Supabase:', error);
            } else if (data && data[0]) {
                reserva.id = data[0].id;
            }
        } catch (err) {
            console.warn("Error guardando reserva en Supabase:", err);
        }
    }

    let bookings = [];
    try { bookings = JSON.parse(localStorage.getItem('renteasy_bookings')) || []; } catch(e) {}
    if (!bookings.some(b => String(b.id) === String(reserva.id))) {
        bookings.unshift(reserva);
        localStorage.setItem('renteasy_bookings', JSON.stringify(bookings));
    }
    return reserva;
}

async function dbUpdateReservaEstado(id, nuevoEstado) {
    const client = getSupabaseClient();
    if (client) {
        try {
            await client.from('reservas').update({ estado_reserva: nuevoEstado }).eq('id', id);
        } catch (err) {
            console.warn("Error actualizando reserva en Supabase:", err);
        }
    }

    let bookings = [];
    try { bookings = JSON.parse(localStorage.getItem('renteasy_bookings')) || []; } catch(e) {}
    const b = bookings.find(item => item.id == id);
    if (b) {
        b.status = nuevoEstado;
        localStorage.setItem('renteasy_bookings', JSON.stringify(bookings));
    }
}

/** ================= 3. MENSAJES DE CONTACTO ================= **/
async function dbSaveMensajeContacto(msg) {
    const client = getSupabaseClient();
    if (client) {
        try {
            await client.from('mensajes_contacto').insert([{
                nombre: msg.name,
                email: msg.email,
                telefono: msg.phone,
                motivo: msg.subject,
                mensaje: msg.message,
                estado: msg.status || 'Pendiente'
            }]);
        } catch (err) {
            console.warn("Error guardando mensaje en Supabase:", err);
        }
    }

    let inquiries = [];
    try { inquiries = JSON.parse(localStorage.getItem('renteasy_inquiries')) || []; } catch(e) {}
    inquiries.unshift(msg);
    localStorage.setItem('renteasy_inquiries', JSON.stringify(inquiries));
}

/** ================= 4. LIQUIDACIONES / RETIROS ================= **/
async function dbSaveLiquidacion(liq) {
    const client = getSupabaseClient();
    if (client) {
        try {
            await client.from('liquidaciones_payouts').insert([{
                propietario_id: liq.ownerId,
                monto: parseFloat(liq.amount),
                banco_destino: liq.bank,
                tipo_cuenta: liq.accountType,
                numero_cuenta: liq.accountNumber,
                titular: liq.holderName,
                estado: liq.status || 'Pendiente'
            }]);
        } catch (err) {
            console.warn("Error guardando liquidación en Supabase:", err);
        }
    }

    let payouts = [];
    try { payouts = JSON.parse(localStorage.getItem('renteasy_payouts')) || []; } catch(e) {}
    payouts.unshift(liq);
    localStorage.setItem('renteasy_payouts', JSON.stringify(payouts));
}

/** ================= 5. ACTAS DE ENTREGA (CHECK-IN / CHECK-OUT) ================= **/
async function dbSaveActaEntrega(acta) {
    const client = getSupabaseClient();
    if (client) {
        try {
            await client.from('actas_entrega').insert([{
                reserva_id: acta.bookingId,
                tipo: acta.type,
                kilometraje: parseInt(acta.odometer),
                nivel_gasolina: acta.fuel,
                observaciones: acta.notes,
                fotos_adjuntas: acta.photos || []
            }]);
        } catch (err) {
            console.warn("Error guardando acta en Supabase:", err);
        }
    }

    let actas = [];
    try { actas = JSON.parse(localStorage.getItem('renteasy_actas')) || []; } catch(e) {}
    actas.unshift(acta);
    localStorage.setItem('renteasy_actas', JSON.stringify(actas));
}

/** ================= 6. SEMBRAR AUTO INICIAL DE EJEMPLO SI LA TABLA ESTÁ VACÍA ================= **/
async function seedInitialCarsIfEmpty() {
    const client = getSupabaseClient();
    if (!client) return;

    try {
        const { count, error } = await client.from('vehiculos').select('*', { count: 'exact', head: true });
        if (!error && (count === 0 || count === null)) {
            console.log("Sembrando único vehículo inicial de ejemplo en Supabase...");
            const defaultCars = [
                {
                    marca: "Renault",
                    modelo: "Duster Iconic 4x4 Turbo",
                    nombre_completo: "Renault Duster 4x4 Turbo",
                    año: 2024,
                    categoria: "SUV / Camioneta",
                    transmision: "Automático",
                    combustible: "Gasolina",
                    puestos: 5,
                    precio_por_dia: 220000,
                    ciudad: "Valledupar",
                    kilometraje_limite: "250 km/día",
                    descripcion: "Camioneta todoterreno 4x4 turbo de demostración. Totalmente equipada, SOAT vigente, seguro todo riesgo y mantenimiento al día en Valledupar.",
                    imagen_url: "img/car-rent-1.png",
                    estado: "Activo",
                    soat_vigente: true
                }
            ];

            await client.from('vehiculos').insert(defaultCars);
            console.log("Vehículo inicial de ejemplo sembrado en Supabase.");
        }
    } catch (e) {
        console.warn("Verificación de flota inicial:", e);
    }
}

/** ================= 7. CONFIGURACIÓN GLOBAL, FEEDBACK Y ALERTAS (SUPABASE) ================= **/
async function dbSaveConfig(configObj) {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
        await client.from('configuracion_sitio').upsert({
            id: 'global',
            config: configObj,
            actualizado_en: new Date().toISOString()
        });
        return true;
    } catch (e) {
        console.warn("Error guardando configuración en Supabase:", e);
        return false;
    }
}

async function dbGetConfig() {
    const client = getSupabaseClient();
    if (!client) return null;
    try {
        const { data, error } = await client.from('configuracion_sitio').select('config').eq('id', 'global').single();
        if (!error && data && data.config) {
            localStorage.setItem('rentcar_global_config', JSON.stringify(data.config));
            return data.config;
        }
    } catch (e) {
        console.warn("Cargando config desde Supabase:", e.message || e);
    }
    return null;
}

async function dbUpdateVehiculoFields(carId, fields) {
    const client = getSupabaseClient();
    if (!client || !carId) return false;
    try {
        await client.from('vehiculos').update(fields).eq('id', carId);
        return true;
    } catch (e) {
        console.warn("Error actualizando vehículo en Supabase:", e);
        return false;
    }
}

async function dbSaveFeedback(item) {
    const client = getSupabaseClient();
    if (client) {
        try {
            const { data, error } = await client.from('reportes_feedback').insert([{
                vehiculo_id: item.carId || null,
                vehiculo_nombre: item.carName || 'General',
                reporta_nombre: item.reporterName || 'Usuario',
                reporta_telefono: item.reporterPhone || '',
                motivo: item.subject || 'Feedback',
                detalle: item.message || '',
                estado: item.status || 'Pendiente'
            }]).select();
            if (!error && data && data[0]) item.id = data[0].id;
        } catch (e) {
            console.warn("Error guardando feedback en Supabase:", e);
        }
    }
    return item;
}

async function dbGetFeedback() {
    const client = getSupabaseClient();
    if (client) {
        try {
            const { data, error } = await client.from('reportes_feedback').select('*').order('creado_en', { ascending: false });
            if (!error && data) {
                const mapped = data.map(f => ({
                    id: f.id,
                    carId: f.vehiculo_id,
                    carName: f.vehiculo_nombre,
                    reporterName: f.reporta_nombre,
                    reporterPhone: f.reporta_telefono,
                    subject: f.motivo,
                    message: f.detalle,
                    status: f.estado || 'Pendiente',
                    createdAt: f.creado_en
                }));
                localStorage.setItem('rentcar_feedback', JSON.stringify(mapped));
                return mapped;
            }
        } catch (e) {
            console.warn("Cargando feedback desde Supabase:", e);
        }
    }
    try { return JSON.parse(localStorage.getItem('rentcar_feedback')) || []; } catch (e) { return []; }
}

async function dbResolveFeedback(id, newStatus = 'Resuelto') {
    const client = getSupabaseClient();
    if (client && id) {
        try { await client.from('reportes_feedback').update({ estado: newStatus }).eq('id', id); } catch (e) { }
    }
}

async function dbDeleteFeedback(id) {
    const client = getSupabaseClient();
    if (client && id) {
        try { await client.from('reportes_feedback').delete().eq('id', id); } catch (e) { }
    }
}

async function dbSaveOwnerAlert(alertItem) {
    const client = getSupabaseClient();
    if (client) {
        try {
            const { data, error } = await client.from('alertas_propietarios').insert([{
                propietario_id: alertItem.ownerId || null,
                vehiculo_id: alertItem.carId || null,
                vehiculo_nombre: alertItem.carName || '',
                asunto: alertItem.subject || '',
                mensaje: alertItem.message || '',
                leida: false
            }]).select();
            if (!error && data && data[0]) alertItem.id = data[0].id;
        } catch (e) {
            console.warn("Error guardando alerta en Supabase:", e);
        }
    }
    return alertItem;
}

async function dbGetOwnerAlerts() {
    const client = getSupabaseClient();
    if (client) {
        try {
            const { data, error } = await client.from('alertas_propietarios').select('*').order('creado_en', { ascending: false });
            if (!error && data) {
                const mapped = data.map(a => ({
                    id: a.id,
                    ownerId: a.propietario_id,
                    carId: a.vehiculo_id,
                    carName: a.vehiculo_nombre,
                    subject: a.asunto,
                    message: a.mensaje,
                    read: !!a.leida,
                    createdAt: a.creado_en
                }));
                localStorage.setItem('rentcar_owner_alerts', JSON.stringify(mapped));
                return mapped;
            }
        } catch (e) {
            console.warn("Cargando alertas desde Supabase:", e);
        }
    }
    try { return JSON.parse(localStorage.getItem('rentcar_owner_alerts')) || []; } catch (e) { return []; }
}

async function dbMarkOwnerAlertRead(id) {
    const client = getSupabaseClient();
    if (client && id) {
        try { await client.from('alertas_propietarios').update({ leida: true }).eq('id', id); } catch (e) { }
    }
}

/** ================= 8. LOGS DE AUDITORÍA DEL SISTEMA ================= **/
async function logSystemEvent(modulo, accion, detalle = '') {
    let user = null;
    try { user = JSON.parse(localStorage.getItem('renteasy_current_user')); } catch (e) { }
    const entry = {
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        usuario: user ? `${user.name || user.email}` : 'Visitante / Sistema',
        rol: user ? (user.role || 'usuario') : 'publico',
        modulo: modulo || 'Sistema',
        accion: accion || 'Actividad',
        detalle: detalle || '',
        creado_en: new Date().toISOString()
    };

    try {
        let logs = JSON.parse(localStorage.getItem('rentcar_audit_logs')) || [];
        logs.unshift(entry);
        if (logs.length > 500) logs = logs.slice(0, 500);
        localStorage.setItem('rentcar_audit_logs', JSON.stringify(logs));
    } catch (e) { }

    const client = getSupabaseClient();
    if (client) {
        try {
            const { error } = await client.from('logs_auditoria').insert([{
                usuario: entry.usuario,
                rol: entry.rol,
                modulo: entry.modulo,
                accion: entry.accion,
                detalle: entry.detalle,
                detalle_cambios: entry.detalle_cambios || null,
                creado_en: entry.creado_en
            }]);
            if (error) {
                await client.from('logs_auditoria').insert([{
                    usuario: entry.usuario,
                    rol: entry.rol,
                    modulo: entry.modulo,
                    accion: entry.accion,
                    detalle: entry.detalle,
                    creado_en: entry.creado_en
                }]);
            }
        } catch (e) { }
    }
}
window.logSystemEvent = logSystemEvent;

async function dbGetAuditLogs() {
    const client = getSupabaseClient();
    if (client) {
        try {
            const { data, error } = await client.from('logs_auditoria').select('*').order('creado_en', { ascending: false }).limit(500);
            if (!error && data) {
                localStorage.setItem('rentcar_audit_logs', JSON.stringify(data));
                return data;
            }
        } catch (e) { }
    }
    try { return JSON.parse(localStorage.getItem('rentcar_audit_logs')) || []; } catch (e) { return []; }
}

async function dbDeleteAuditLogsByDateRange(fromIso, toIso) {
    const client = getSupabaseClient();
    if (client) {
        try {
            let query = client.from('logs_auditoria').delete();
            if (fromIso) query = query.gte('creado_en', fromIso);
            if (toIso) query = query.lte('creado_en', toIso);
            await query;
        } catch (e) {
            console.warn("Error depurando logs en Supabase:", e);
        }
    }
}

/** ================= 9. RESEÑAS REALES Y MENSAJES DE CONTACTO ================= **/
async function dbGetResenas() {
    const client = getSupabaseClient();
    if (client) {
        try {
            const { data, error } = await client.from('resenas').select('*').order('creado_en', { ascending: false });
            if (!error && data) {
                const mapped = data.map(r => ({
                    id: r.id,
                    carId: r.vehiculo_id || '',
                    carRented: r.vehiculo_nombre || '',
                    userName: r.autor_nombre || 'Conductor',
                    userRole: r.rol_autor || 'Conductor',
                    city: r.ciudad || 'Colombia',
                    rating: parseInt(r.calificacion, 10) || 5,
                    text: r.comentario || '',
                    approved: r.aprobada !== false,
                    date: r.creado_en ? new Date(r.creado_en).toLocaleDateString('es-CO') : ''
                }));
                localStorage.setItem('rentcar_verified_reviews', JSON.stringify(mapped));
                return mapped;
            }
        } catch (e) {
            console.warn("Cargando reseñas desde Supabase:", e);
        }
    }
    try { return JSON.parse(localStorage.getItem('rentcar_verified_reviews')) || []; } catch (e) { return []; }
}

async function dbSaveResena(rev) {
    const client = getSupabaseClient();
    if (client) {
        try {
            const { data, error } = await client.from('resenas').insert([{
                vehiculo_id: rev.carId || null,
                vehiculo_nombre: rev.carRented || '',
                autor_nombre: rev.userName || 'Conductor',
                rol_autor: rev.userRole || 'Conductor',
                ciudad: rev.city || 'Colombia',
                calificacion: parseInt(rev.rating, 10) || 5,
                comentario: rev.text || '',
                aprobada: rev.approved !== false
            }]).select();
            if (!error && data && data[0]) rev.id = data[0].id;
        } catch (e) { console.warn("Error guardando reseña:", e); }
    }
    return rev;
}

async function dbUpdateResenaApproval(id, approved) {
    const client = getSupabaseClient();
    if (client && id) {
        try { await client.from('resenas').update({ aprobada: !!approved }).eq('id', id); } catch (e) { }
    }
}

async function dbDeleteResena(id) {
    const client = getSupabaseClient();
    if (client && id) {
        try { await client.from('resenas').delete().eq('id', id); } catch (e) { }
    }
}

async function dbGetMensajesContacto() {
    const client = getSupabaseClient();
    if (client) {
        try {
            const { data, error } = await client.from('mensajes_contacto').select('*').order('creado_en', { ascending: false });
            if (!error && data) {
                const mapped = data.map(m => ({
                    id: m.id,
                    name: m.nombre,
                    email: m.email,
                    phone: m.telefono,
                    subject: m.motivo,
                    message: m.mensaje,
                    status: m.estado || 'Pendiente',
                    createdAt: m.creado_en
                }));
                localStorage.setItem('renteasy_inquiries', JSON.stringify(mapped));
                return mapped;
            }
        } catch (e) { console.warn("Cargando mensajes de contacto:", e); }
    }
    try { return JSON.parse(localStorage.getItem('renteasy_inquiries')) || []; } catch (e) { return []; }
}

async function dbDeleteMensajeContacto(id) {
    const client = getSupabaseClient();
    if (client && id) {
        try { await client.from('mensajes_contacto').delete().eq('id', id); } catch (e) { }
    }
}

/** ================= 10. TESTIMONIOS DE COMUNIDAD (PORTADA) ================= **/
async function dbGetTestimonios() {
    const client = getSupabaseClient();
    if (client) {
        try {
            const { data, error } = await client.from('testimonios').select('*').order('creado_en', { ascending: false });
            if (!error && data) {
                const mapped = data.map(t => ({
                    id: t.id,
                    name: t.nombre_cliente,
                    roleOrCity: t.rol_o_ciudad,
                    photo: t.foto_url || 'img/testimonial-1.jpg',
                    rating: parseInt(t.calificacion, 10) || 5,
                    text: t.comentario,
                    car: t.vehiculo_alquilado || '',
                    verified: t.verificado !== false,
                    createdAt: t.creado_en
                }));
                localStorage.setItem('rentcar_community_testimonials', JSON.stringify(mapped));
                return mapped;
            }
        } catch (e) { console.warn("Cargando testimonios desde Supabase:", e); }
    }
    try { return JSON.parse(localStorage.getItem('rentcar_community_testimonials')) || []; } catch (e) { return []; }
}

async function dbUpdateTestimonioVerified(id, verified) {
    const client = getSupabaseClient();
    if (client && id) {
        try { await client.from('testimonios').update({ verificado: !!verified }).eq('id', id); } catch (e) { }
    }
}

async function dbDeleteTestimonio(id) {
    const client = getSupabaseClient();
    if (client && id) {
        try { await client.from('testimonios').delete().eq('id', id); } catch (e) { }
    }
}

/** ================= 11. PREGUNTAS FRECUENTES (FAQS DINÁMICAS) ================= **/
async function dbGetFaqs() {
    const client = getSupabaseClient();
    if (client) {
        try {
            const { data, error } = await client
                .from('preguntas_frecuentes')
                .select('*')
                .order('orden', { ascending: true })
                .order('creado_en', { ascending: true });
            if (!error && data) {
                const mapped = data.map(f => ({
                    id: f.id,
                    q: f.pregunta,
                    a: f.respuesta,
                    category: f.categoria || 'General',
                    order: parseInt(f.orden, 10) || 0,
                    visible: f.visible !== false
                }));
                localStorage.setItem('rentcar_faqs_db', JSON.stringify(mapped));
                localStorage.setItem('rentcar_supabase_faqs_synced', '1');
                return mapped;
            }
        } catch (e) {
            console.warn("Cargando FAQs desde Supabase:", e);
        }
    }
    try { return JSON.parse(localStorage.getItem('rentcar_faqs_db')) || []; } catch (e) { return []; }
}

async function dbSaveFaq(faq) {
    const client = getSupabaseClient();
    if (client && faq) {
        try {
            const { data, error } = await client.from('preguntas_frecuentes').insert([{
                pregunta: faq.q,
                respuesta: faq.a,
                categoria: faq.category || 'General',
                orden: parseInt(faq.order, 10) || 0,
                visible: faq.visible !== false
            }]).select();
            if (!error && data && data[0]) faq.id = data[0].id;
        } catch (e) {
            console.warn("Error guardando FAQ en Supabase:", e);
        }
    }
    return faq;
}

async function dbUpdateFaq(faq) {
    const client = getSupabaseClient();
    if (client && faq && faq.id) {
        try {
            await client.from('preguntas_frecuentes').update({
                pregunta: faq.q,
                respuesta: faq.a,
                categoria: faq.category || 'General',
                orden: parseInt(faq.order, 10) || 0,
                visible: faq.visible !== false
            }).eq('id', faq.id);
        } catch (e) {
            console.warn("Error actualizando FAQ en Supabase:", e);
        }
    }
    return faq;
}

async function dbDeleteFaq(id) {
    const client = getSupabaseClient();
    if (client && id) {
        try { await client.from('preguntas_frecuentes').delete().eq('id', id); } catch (e) { }
    }
}
