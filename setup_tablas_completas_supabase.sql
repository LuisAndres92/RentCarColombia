-- =====================================================================
-- RENT CAR COLOMBIA - SCRIPT MAESTRO DE BASE DE DATOS Y TABLAS (SUPABASE)
-- Ejecuta este script en el SQL Editor de Supabase (https://supabase.com/dashboard)
-- Crea y alimenta: perfiles, equipo de trabajo, testimonios, reseñas y almacenamiento.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA: perfiles (USUARIOS REGISTRADOS Y ROLES)
CREATE TABLE IF NOT EXISTS public.perfiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    nombre_completo TEXT NOT NULL,
    telefono TEXT,
    rol TEXT NOT NULL DEFAULT 'conductor' CHECK (rol IN ('conductor', 'propietario', 'admin')),
    ciudad TEXT DEFAULT 'Valledupar',
    avatar_url TEXT DEFAULT 'img/team-1.jpg',
    documento_identidad TEXT,
    licencia_conduccion TEXT,
    identidad_verificada BOOLEAN DEFAULT FALSE,
    calificacion_promedio NUMERIC(3, 2) DEFAULT 5.00,
    banco_nombre TEXT,
    tipo_cuenta TEXT,
    numero_cuenta TEXT,
    titular_cuenta TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asegurar columna avatar_url y eliminar restricción foránea estricta a auth.users
ALTER TABLE public.perfiles DROP CONSTRAINT IF EXISTS perfiles_id_fkey;
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT 'img/team-1.jpg';
ALTER TABLE public.perfiles ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- 2. POBLAR USUARIOS INICIALES / DEMO EN perfiles
INSERT INTO public.perfiles (id, email, nombre_completo, telefono, rol, ciudad, avatar_url, identidad_verificada)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'admin@rentcarcolombia.com', 'Administrador Principal', '3162357871', 'admin', 'Valledupar', 'img/team-1.jpg', TRUE),
    ('b0000000-0000-0000-0000-000000000002', 'propietario@ejemplo.com', 'Carlos Mendoza (Anfitrión)', '3001234567', 'propietario', 'Valledupar', 'img/team-3.jpg', TRUE),
    ('c0000000-0000-0000-0000-000000000003', 'conductor@ejemplo.com', 'Laura Gómez (Conductora)', '3109876543', 'conductor', 'Bogotá', 'img/team-2.jpg', TRUE)
ON CONFLICT (email) DO UPDATE SET
    nombre_completo = EXCLUDED.nombre_completo,
    telefono = EXCLUDED.telefono,
    rol = EXCLUDED.rol,
    ciudad = EXCLUDED.ciudad,
    avatar_url = EXCLUDED.avatar_url,
    identidad_verificada = TRUE;

-- 3. TABLA: equipo_trabajo (EQUIPO HUMANO MOSTRADO EN team.html Y NOSOTROS)
CREATE TABLE IF NOT EXISTS public.equipo_trabajo (
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

-- POBLAR MIEMBROS DEL EQUIPO DE TRABAJO
INSERT INTO public.equipo_trabajo (nombre, cargo, descripcion, foto_url, telefono, whatsapp, email, orden, activo)
VALUES
    ('Andrés Rodríguez', 'Dirección de Operaciones', 'Lidera la expansión de la red de anfitriones y la calidad del servicio en cada ciudad de Colombia.', 'img/team-1.jpg', '+57 316 235 7871', '573162357871', 'operaciones@rentcarcolombia.com', 1, TRUE),
    ('Camila Valencia', 'Validación y Seguridad KYC', 'Responsable del filtro riguroso de licencias, antecedentes judiciales y pólizas vehiculares.', 'img/team-2.jpg', '+57 316 235 7871', '573162357871', 'seguridad@rentcarcolombia.com', 2, TRUE),
    ('Mateo Gómez', 'Soporte y Asistencia en Carretera 24/7', 'Acompaña a conductores y propietarios durante cualquier incidencia mecánica o vial en carretera.', 'img/team-3.jpg', '+57 316 235 7871', '573162357871', 'soporte@rentcarcolombia.com', 3, TRUE),
    ('Daniela Morales', 'Relación con Propietarios', 'Asesora a los anfitriones para optimizar sus ganancias, tarifas por temporada y cuidado de sus flotas.', 'img/team-4.jpg', '+57 316 235 7871', '573162357871', 'anfitriones@rentcarcolombia.com', 4, TRUE)
ON CONFLICT DO NOTHING;

-- 4. TABLA: testimonios (OPINIONES Y TESTIMONIOS GENERALES DE testimonial.html)
CREATE TABLE IF NOT EXISTS public.testimonios (
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

-- POBLAR TESTIMONIOS REALES DE CLIENTES Y ANFITRIONES
INSERT INTO public.testimonios (nombre_cliente, rol_o_ciudad, foto_url, calificacion, comentario, vehiculo_alquilado, verificado)
VALUES
    ('Carlos Mendoza', 'Propietario en Valledupar', 'img/testimonial-1.jpg', 5, 'Tener mi camioneta trabajando con Rent Car Colombia ha sido una bendición. Recibo mis ganancias puntual cada semana y el depósito de garantía me da total tranquilidad.', 'Toyota Corolla Cross', TRUE),
    ('Laura Gómez', 'Conductora Turista de Bogotá', 'img/testimonial-2.jpg', 5, 'Alquilé un auto para recorrer el Cesar y La Guajira durante el Festival Vallenato. Trato directo, auto impecable con aire frío y mucho más económico que una agencia tradicional.', 'Renault Duster 4x4', TRUE),
    ('Andrés Restrepo', 'Empresario / Anfitrión en Medellín', 'img/testimonial-3.jpg', 5, 'Tengo dos autos publicados. El proceso de aprobación y verificación de clientes con antecedentes es muy estricto y profesional. Recomiendo 100% esta plataforma.', 'Mazda CX-30', TRUE),
    ('Diana Paternina', 'Conductora en Barranquilla', 'img/testimonial-4.jpg', 5, 'Excelente atención al cliente por WhatsApp. Reservé un sedán para un viaje de negocios y todo estuvo listo y limpio a mi llegada al aeropuerto. La mejor opción en Colombia.', 'Chevrolet Onix Turbo', TRUE)
ON CONFLICT DO NOTHING;

-- 5. TABLA: resenas (CALIFICACIONES ESPECÍFICAS DE AUTOS AL FINALIZAR RESERVAS)
CREATE TABLE IF NOT EXISTS public.resenas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehiculo_id UUID REFERENCES public.vehiculos(id) ON DELETE CASCADE,
    autor_nombre TEXT NOT NULL,
    autor_avatar TEXT DEFAULT 'img/team-1.jpg',
    calificacion INT CHECK (calificacion BETWEEN 1 AND 5),
    comentario TEXT NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. HABILITAR PERMISOS TOTALES DE LECTURA Y ESCRITURA PÚBLICA (API REST)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- Políticas de lectura pública
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipo_trabajo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resenas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Perfiles públicos son legibles" ON public.perfiles;
CREATE POLICY "Perfiles públicos son legibles" ON public.perfiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Cualquiera puede registrar su perfil" ON public.perfiles;
CREATE POLICY "Cualquiera puede registrar su perfil" ON public.perfiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Equipo visible para todos" ON public.equipo_trabajo;
CREATE POLICY "Equipo visible para todos" ON public.equipo_trabajo FOR SELECT USING (true);

DROP POLICY IF EXISTS "Testimonios visibles para todos" ON public.testimonios;
CREATE POLICY "Testimonios visibles para todos" ON public.testimonios FOR SELECT USING (true);

DROP POLICY IF EXISTS "Resenas visibles para todos" ON public.resenas;
CREATE POLICY "Resenas visibles para todos" ON public.resenas FOR SELECT USING (true);

-- =====================================================================
-- INFORMACIÓN SOBRE ALMACENAMIENTO DE FOTOS (STORAGE BUCKETS):
-- Para subir fotos reales de vehículos y usuarios a la nube de Supabase:
-- 1. Ve a "Storage" en el menú izquierdo de Supabase.
-- 2. Crea 2 Buckets con visibilidad PÚBLICA (Public Bucket):
--    - vehiculos  (para fotos de los autos publicados)
--    - avatars    (para fotos de perfil de los usuarios)
-- 3. Crea 1 Bucket con visibilidad PRIVADA (Private Bucket):
--    - documentos (para fotos de cédulas y licencias de conducción)
-- =====================================================================
