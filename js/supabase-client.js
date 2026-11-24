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

            if (!error && data && data.length > 0) {
                // Adaptar nombres de campos al modelo del frontend
                const mapped = data.map(v => ({
                    id: v.id,
                    brand: v.marca,
                    model: v.modelo,
                    name: v.nombre_completo,
                    year: v.año,
                    type: v.categoria,
                    transmission: v.transmision,
                    fuel: v.combustible,
                    seats: v.puestos,
                    price: parseFloat(v.precio_por_dia),
                    city: v.ciudad,
                    mileage: v.kilometraje_limite,
                    desc: v.descripcion,
                    image: v.imagen_url || 'img/car-rent-1.png',
                    status: v.estado,
                    ownerId: v.propietario_id
                }));
                // Sincronizar copia local
                localStorage.setItem('renteasy_cars', JSON.stringify(mapped));
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

async function dbSaveVehiculo(vehiculo) {
    const client = getSupabaseClient();
    if (client) {
        try {
            const row = {
                marca: vehiculo.brand,
                modelo: vehiculo.model,
                nombre_completo: vehiculo.name || `${vehiculo.brand} ${vehiculo.model}`,
                año: parseInt(vehiculo.year) || 2022,
                categoria: vehiculo.type || 'Sedán',
                transmision: vehiculo.transmission || 'Automático',
                combustible: vehiculo.fuel || 'Gasolina',
                puestos: parseInt(vehiculo.seats) || 5,
                precio_por_dia: parseFloat(vehiculo.price) || 200000,
                ciudad: vehiculo.city || 'Valledupar',
                kilometraje_limite: vehiculo.mileage || '200 km/día',
                descripcion: vehiculo.desc || '',
                imagen_url: vehiculo.image || 'img/car-rent-1.png',
                estado: vehiculo.status || 'Activo'
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
    cars.unshift(vehiculo);
    localStorage.setItem('renteasy_cars', JSON.stringify(cars));
    return vehiculo;
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
                const mapped = data.map(r => ({
                    id: r.id,
                    carId: r.vehiculo_id,
                    ownerId: r.propietario_id,
                    driverId: r.conductor_id,
                    startDate: r.fecha_inicio,
                    endDate: r.fecha_fin,
                    totalDays: r.total_dias,
                    dailyRate: parseFloat(r.tarifa_diaria),
                    subtotal: parseFloat(r.subtotal_alquiler),
                    commission15: parseFloat(r.comision_plataforma_15),
                    ownerEarning85: parseFloat(r.ganancia_propietario_85),
                    deposit: parseFloat(r.deposito_garantia),
                    totalPaid: parseFloat(r.total_cobrado),
                    paymentMethod: r.metodo_pago,
                    paymentStatus: r.estado_pago,
                    status: r.estado_reserva,
                    createdAt: r.creado_en
                }));
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
    if (client) {
        try {
            const row = {
                vehiculo_id: reserva.carId,
                propietario_id: reserva.ownerId,
                conductor_id: reserva.driverId,
                fecha_inicio: reserva.startDate,
                fecha_fin: reserva.endDate,
                total_dias: parseInt(reserva.totalDays) || 1,
                tarifa_diaria: parseFloat(reserva.dailyRate) || 0,
                subtotal_alquiler: parseFloat(reserva.subtotal) || 0,
                comision_plataforma_15: parseFloat(reserva.commission15) || 0,
                ganancia_propietario_85: parseFloat(reserva.ownerEarning85) || 0,
                deposito_garantia: parseFloat(reserva.deposit) || 200000,
                total_cobrado: parseFloat(reserva.totalPaid) || 0,
                metodo_pago: reserva.paymentMethod || 'PSE / Wompi',
                estado_pago: reserva.paymentStatus || 'Autorizado',
                estado_reserva: reserva.status || 'Pendiente'
            };

            const { data, error } = await client.from('reservas').insert([row]).select();
            if (!error && data && data[0]) {
                reserva.id = data[0].id;
            }
        } catch (err) {
            console.warn("Error guardando reserva en Supabase:", err);
        }
    }

    let bookings = [];
    try { bookings = JSON.parse(localStorage.getItem('renteasy_bookings')) || []; } catch(e) {}
    bookings.unshift(reserva);
    localStorage.setItem('renteasy_bookings', JSON.stringify(bookings));
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

/** ================= 6. SEMBRAR AUTOS INICIALES SI LA TABLA ESTÁ VACÍA ================= **/
async function seedInitialCarsIfEmpty() {
    const client = getSupabaseClient();
    if (!client) return;

    try {
        const { count, error } = await client.from('vehiculos').select('*', { count: 'exact', head: true });
        if (!error && (count === 0 || count === null)) {
            console.log("Sembrando flota inicial de vehículos en Supabase...");
            const defaultCars = [
                {
                    marca: "Toyota",
                    modelo: "Corolla Cross",
                    nombre_completo: "Toyota Corolla Cross XEI Híbrida",
                    año: 2023,
                    categoria: "SUV / Camioneta",
                    transmision: "Automático",
                    combustible: "Híbrido",
                    puestos: 5,
                    precio_por_dia: 280000,
                    ciudad: "Valledupar",
                    kilometraje_limite: "250 km/día",
                    descripcion: "Excelente camioneta híbrida, confort total y mínimo consumo para ciudad o carretera.",
                    imagen_url: "img/car-rent-1.png",
                    estado: "Activo"
                },
                {
                    marca: "Mazda",
                    modelo: "CX-30",
                    nombre_completo: "Mazda CX-30 Grand Touring",
                    año: 2022,
                    categoria: "SUV / Camioneta",
                    transmision: "Automático",
                    combustible: "Gasolina",
                    puestos: 5,
                    precio_por_dia: 250000,
                    ciudad: "Valledupar",
                    kilometraje_limite: "200 km/día",
                    descripcion: "Diseño elegante, sonido Bose, acabados en cuero y seguridad activa i-Activsense.",
                    imagen_url: "img/car-rent-2.png",
                    estado: "Activo"
                },
                {
                    marca: "Renault",
                    modelo: "Duster",
                    nombre_completo: "Renault Duster 4x4 Turbo",
                    año: 2023,
                    categoria: "SUV / Camioneta",
                    transmision: "Mecánico",
                    combustible: "Gasolina",
                    puestos: 5,
                    precio_por_dia: 220000,
                    ciudad: "Valledupar",
                    kilometraje_limite: "200 km/día",
                    descripcion: "Capacidad todoterreno, excelente espacio de baúl, ideal para turismo en el Cesar y Guajira.",
                    imagen_url: "img/car-rent-3.png",
                    estado: "Activo"
                },
                {
                    marca: "Chevrolet",
                    modelo: "Onix Sedan",
                    nombre_completo: "Chevrolet Onix Turbo Premier",
                    año: 2022,
                    categoria: "Sedán",
                    transmision: "Automático",
                    combustible: "Gasolina",
                    puestos: 5,
                    precio_por_dia: 160000,
                    ciudad: "Valledupar",
                    kilometraje_limite: "200 km/día",
                    descripcion: "Motor turbo eficiente, conectividad Wi-Fi y 6 airbags de seguridad.",
                    imagen_url: "img/car-rent-4.png",
                    estado: "Activo"
                },
                {
                    marca: "Nissan",
                    modelo: "Frontier",
                    nombre_completo: "Nissan Frontier Doble Cabina 4x4",
                    año: 2021,
                    categoria: "Pickup",
                    transmision: "Mecánico",
                    combustible: "Diésel",
                    puestos: 5,
                    precio_por_dia: 320000,
                    ciudad: "Valledupar",
                    kilometraje_limite: "250 km/día",
                    descripcion: "Fuerza, tracción 4x4 y platón de carga para proyectos, fincas o viajes exigentes.",
                    imagen_url: "img/car-rent-5.png",
                    estado: "Activo"
                },
                {
                    marca: "Kia",
                    modelo: "Picanto",
                    nombre_completo: "Kia Picanto GT Line",
                    año: 2023,
                    categoria: "Compacto",
                    transmision: "Mecánico",
                    combustible: "Gasolina",
                    puestos: 5,
                    precio_por_dia: 130000,
                    ciudad: "Valledupar",
                    kilometraje_limite: "200 km/día",
                    descripcion: "El más económico para movilidad urbana, fácil de estacionar y aire acondicionado potente.",
                    imagen_url: "img/car-rent-6.png",
                    estado: "Activo"
                }
            ];

            await client.from('vehiculos').insert(defaultCars);
            console.log("Flota inicial sembrada con éxito en Supabase.");
        }
    } catch (e) {
        console.warn("Verificación de flota inicial:", e);
    }
}
