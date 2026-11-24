-- =====================================================================
-- RENT CAR COLOMBIA MARKETPLACE - ESQUEMA DE BASE DE DATOS (SUPABASE / POSTGRESQL)
-- Modelo de Marketplace P2P con comisiones y roles (Conductor vs Propietario)
-- =====================================================================

-- 1. EXTENSIÓN PARA UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA DE PERFILES DE USUARIO (Vinculada a auth.users de Supabase)
CREATE TABLE public.perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    nombre_completo TEXT NOT NULL,
    telefono TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('conductor', 'propietario', 'admin')),
    ciudad TEXT DEFAULT 'Valledupar',
    documento_identidad TEXT,
    licencia_conduccion TEXT,
    identidad_verificada BOOLEAN DEFAULT FALSE,
    calificacion_promedio NUMERIC(3, 2) DEFAULT 5.00,
    -- Datos bancarios para transferencias y dispersión del 85% a propietarios
    banco_nombre TEXT, -- Bancolombia, Davivienda, Banco de Bogotá, etc.
    tipo_cuenta TEXT CHECK (tipo_cuenta IN ('Ahorros', 'Corriente', 'Nequi', 'Daviplata')),
    numero_cuenta TEXT,
    titular_cuenta TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA DE VEHÍCULOS PUBLICADOS POR PROPIETARIOS
CREATE TABLE public.vehiculos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    propietario_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    marca TEXT NOT NULL,
    modelo TEXT NOT NULL,
    nombre_completo TEXT NOT NULL,
    año INT NOT NULL CHECK (año >= 2010),
    categoria TEXT NOT NULL CHECK (categoria IN ('Sedán', 'SUV / Camioneta', 'Compacto', 'Pickup', 'Deportivo / Lujo')),
    transmision TEXT NOT NULL CHECK (transmision IN ('Automático', 'Mecánico')),
    combustible TEXT NOT NULL CHECK (combustible IN ('Gasolina', 'Diésel', 'Híbrido', 'Eléctrico')),
    puestos INT DEFAULT 5,
    precio_por_dia NUMERIC(10, 2) NOT NULL, -- En moneda local (COP)
    ciudad TEXT NOT NULL,
    kilometraje_limite TEXT DEFAULT '200 km/día',
    descripcion TEXT,
    imagen_url TEXT DEFAULT 'img/car-rent-1.png',
    soat_vigente BOOLEAN DEFAULT TRUE,
    estado TEXT DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Pausado', 'En Renta', 'En Revision')),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA DE RESERVAS Y LIQUIDACIÓN DE COMISIONES
CREATE TABLE public.reservas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehiculo_id UUID NOT NULL REFERENCES public.vehiculos(id) ON DELETE RESTRICT,
    propietario_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE RESTRICT,
    conductor_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE RESTRICT,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    total_dias INT NOT NULL CHECK (total_dias >= 1),
    tarifa_diaria NUMERIC(10, 2) NOT NULL,
    subtotal_alquiler NUMERIC(10, 2) NOT NULL,
    comision_plataforma_15 NUMERIC(10, 2) NOT NULL, -- Tu ganancia neta (15%)
    ganancia_propietario_85 NUMERIC(10, 2) NOT NULL, -- Transferencia al anfitrión (85%)
    deposito_garantia NUMERIC(10, 2) DEFAULT 200000.00,
    total_cobrado NUMERIC(10, 2) NOT NULL,
    metodo_pago TEXT DEFAULT 'Tarjeta',
    estado_pago TEXT DEFAULT 'Autorizado' CHECK (estado_pago IN ('Pendiente', 'Autorizado', 'Capturado', 'Reembolsado')),
    estado_reserva TEXT DEFAULT 'Pendiente' CHECK (estado_reserva IN ('Pendiente', 'Aceptada', 'Rechazada', 'En Curso', 'Finalizada', 'Cancelada')),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLA DE RESEÑAS Y CALIFICACIONES MUTUAS
CREATE TABLE public.reseñas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reserva_id UUID NOT NULL REFERENCES public.reservas(id) ON DELETE CASCADE,
    autor_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    destinatario_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    calificacion INT CHECK (calificacion BETWEEN 1 AND 5),
    comentario TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. HABILITAR SEGURIDAD POR FILAS (Row Level Security - RLS)
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública para catálogo de autos
CREATE POLICY "Autos activos son visibles para todos" ON public.vehiculos
    FOR SELECT USING (estado = 'Activo');

-- Políticas para propietarios (Gestionar sólo sus propios vehículos)
CREATE POLICY "Propietarios pueden modificar sus propios autos" ON public.vehiculos
    FOR ALL USING (auth.uid() = propietario_id);

-- Políticas para reservas (Solo conductor y propietario involucrados pueden ver la reserva)
CREATE POLICY "Conductor y Propietario pueden ver sus reservas" ON public.reservas
    FOR SELECT USING (auth.uid() = conductor_id OR auth.uid() = propietario_id);

CREATE POLICY "Conductores pueden crear solicitudes de reserva" ON public.reservas
    FOR INSERT WITH CHECK (auth.uid() = conductor_id);

CREATE POLICY "Propietarios pueden aceptar o rechazar reservas" ON public.reservas
    FOR UPDATE USING (auth.uid() = propietario_id);

-- 7. TABLA DE ACTAS DIGITALES DE ENTREGA Y DEVOLUCIÓN (CHECK-IN & CHECK-OUT)
CREATE TABLE public.actas_entrega (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reserva_id UUID NOT NULL REFERENCES public.reservas(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('Entrega', 'Devolucion')),
    kilometraje INT NOT NULL,
    nivel_gasolina TEXT NOT NULL CHECK (nivel_gasolina IN ('Lleno', '3/4', '1/2', '1/4', 'Reserva')),
    observaciones TEXT,
    fotos_adjuntas JSONB DEFAULT '[]'::jsonb,
    firmado_por UUID REFERENCES public.perfiles(id),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TABLA DE SOLICITUDES DE RETIRO Y LIQUIDACIONES (BILLETERA DE PROPIETARIOS)
CREATE TABLE public.liquidaciones_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    propietario_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE RESTRICT,
    monto NUMERIC(10, 2) NOT NULL CHECK (monto > 0),
    banco_destino TEXT NOT NULL,
    tipo_cuenta TEXT NOT NULL,
    numero_cuenta TEXT NOT NULL,
    titular TEXT NOT NULL,
    estado TEXT DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Transferido', 'Rechazado')),
    referencia_bancaria TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    procesado_en TIMESTAMP WITH TIME ZONE
);

-- 9. TABLA DE MENSAJES DE CONTACTO Y SOPORTE (CONTACT.HTML)
CREATE TABLE public.mensajes_contacto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    email TEXT NOT NULL,
    telefono TEXT NOT NULL,
    motivo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    estado TEXT DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Respondido', 'Archivado')),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. TABLA DE CONFIGURACIÓN MAESTRA DEL SITIO (CMS Y PARÁMETROS GLOBALES)
CREATE TABLE public.configuracion_sitio (
    id INT PRIMARY KEY DEFAULT 1,
    datos JSONB NOT NULL,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. TABLA DE EQUIPO DE TRABAJO (TALENTO HUMANO Y SOPORTE)
CREATE TABLE public.equipo_trabajo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    cargo TEXT NOT NULL,
    descripcion TEXT,
    foto_url TEXT NOT NULL DEFAULT 'img/team-1.jpg',
    telefono TEXT,
    whatsapp TEXT,
    email TEXT,
    orden INT DEFAULT 1,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. TABLA DE TESTIMONIOS Y OPINIONES (TESTIMONIAL.HTML & INDEX.HTML)
CREATE TABLE public.testimonios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_cliente TEXT NOT NULL,
    rol_o_ciudad TEXT NOT NULL,
    foto_url TEXT DEFAULT 'img/testimonial-1.jpg',
    calificacion INT DEFAULT 5 CHECK (calificacion BETWEEN 1 AND 5),
    comentario TEXT NOT NULL,
    vehiculo_alquilado TEXT,
    verificado BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. ALMACENAMIENTO DE ARCHIVOS Y FOTOS (SUPABASE STORAGE BUCKETS)
-- - Bucket 'vehiculos' (Público): Para almacenar fotos en alta resolución de los autos publicados.
-- - Bucket 'avatars' (Público): Para almacenar fotos de perfil de usuarios y colaboradores.
-- - Bucket 'documentos' (Privado): Para resguardar licencias de conducir y documentos de identidad.
