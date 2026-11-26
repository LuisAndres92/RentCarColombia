-- =====================================================================
-- RENT CAR COLOMBIA - MIGRACIÓN COMPLETA DE BASE DE DATOS (SUPABASE)
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase:
-- https://supabase.com/dashboard/project/dfgnlpvfwvfqagmwfjmo/sql
-- =====================================================================

-- 1. Ampliar tabla vehiculos con galería múltiple y negociación de tarifa
ALTER TABLE public.vehiculos
  ADD COLUMN IF NOT EXISTS galeria_imagenes jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS negociacion_tarifa jsonb DEFAULT NULL;

-- 2. Tabla de Configuración Global del Sitio (Fianza estándar, Comisión %, CMS, Empresa, Legal)
CREATE TABLE IF NOT EXISTS public.configuracion_sitio (
    id text PRIMARY KEY DEFAULT 'global',
    config jsonb NOT NULL DEFAULT '{}'::jsonb,
    actualizado_en timestamptz DEFAULT now()
);

-- 3. Tabla de Reportes, Quejas y Feedback de Conductores
CREATE TABLE IF NOT EXISTS public.reportes_feedback (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    vehiculo_id text,
    vehiculo_nombre text,
    reporta_nombre text NOT NULL,
    reporta_telefono text,
    motivo text NOT NULL,
    detalle text NOT NULL,
    estado text DEFAULT 'Pendiente',
    creado_en timestamptz DEFAULT now()
);

-- 4. Tabla de Alertas y Mensajes Directos de Administración a Propietarios
CREATE TABLE IF NOT EXISTS public.alertas_propietarios (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    propietario_id text,
    vehiculo_id text,
    vehiculo_nombre text,
    asunto text NOT NULL,
    mensaje text NOT NULL,
    leida boolean DEFAULT false,
    creado_en timestamptz DEFAULT now()
);

-- 5. Habilitar Row Level Security (RLS) y políticas de acceso para la plataforma
ALTER TABLE public.configuracion_sitio ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Gestion total configuracion" ON public.configuracion_sitio;
CREATE POLICY "Gestion total configuracion" ON public.configuracion_sitio FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.reportes_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Gestion total feedback" ON public.reportes_feedback;
CREATE POLICY "Gestion total feedback" ON public.reportes_feedback FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.alertas_propietarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Gestion total alertas" ON public.alertas_propietarios;
CREATE POLICY "Gestion total alertas" ON public.alertas_propietarios FOR ALL USING (true) WITH CHECK (true);

-- 5. Tabla de Logs de Auditoría del Sistema
CREATE TABLE IF NOT EXISTS public.logs_auditoria (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario text,
    rol text,
    modulo text NOT NULL,
    accion text NOT NULL,
    detalle text,
    detalle_cambios jsonb DEFAULT NULL,
    creado_en timestamptz DEFAULT now()
);

ALTER TABLE public.logs_auditoria
  ADD COLUMN IF NOT EXISTS detalle_cambios jsonb DEFAULT NULL;

ALTER TABLE public.logs_auditoria ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Gestion total logs" ON public.logs_auditoria;
CREATE POLICY "Gestion total logs" ON public.logs_auditoria FOR ALL USING (true) WITH CHECK (true);

-- 6. Completar tabla resenas para moderación real y vinculación por vehículo
ALTER TABLE public.resenas
  ADD COLUMN IF NOT EXISTS aprobada boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS vehiculo_nombre text,
  ADD COLUMN IF NOT EXISTS ciudad text,
  ADD COLUMN IF NOT EXISTS rol_autor text DEFAULT 'Conductor';

ALTER TABLE public.resenas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Gestion total resenas" ON public.resenas;
CREATE POLICY "Gestion total resenas" ON public.resenas FOR ALL USING (true) WITH CHECK (true);

-- 7. Asegurar tablas de mensajes de contacto y liquidaciones con RLS
CREATE TABLE IF NOT EXISTS public.mensajes_contacto (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre text NOT NULL,
    email text NOT NULL,
    telefono text,
    motivo text,
    mensaje text NOT NULL,
    estado text DEFAULT 'Pendiente',
    creado_en timestamptz DEFAULT now()
);
ALTER TABLE public.mensajes_contacto ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Gestion total mensajes" ON public.mensajes_contacto;
CREATE POLICY "Gestion total mensajes" ON public.mensajes_contacto FOR ALL USING (true) WITH CHECK (true);

-- Sembrar reseñas iniciales de ejemplo en public.resenas (solo si la tabla está vacía) para que puedas controlarlas o borrarlas desde Supabase
INSERT INTO public.resenas (vehiculo_nombre, autor_nombre, rol_autor, ciudad, calificacion, comentario, aprobada)
SELECT 'Renault Duster 4x4 Turbo', 'Carlos Mendoza', 'Propietario Verificado', 'Valledupar, Cesar', 5, 'Excelente camioneta para viajar por el Cesar y La Guajira. Entrega puntual y en perfecto estado.', true
WHERE NOT EXISTS (SELECT 1 FROM public.resenas);

INSERT INTO public.resenas (vehiculo_nombre, autor_nombre, rol_autor, ciudad, calificacion, comentario, aprobada)
SELECT 'Renault Duster 4x4 Turbo', 'Laura Gómez', 'Conductora Turista', 'Bogotá D.C.', 5, 'Trato directo con el dueño, vehículo impecable y tarifa mucho mejor que una agencia tradicional.', true
WHERE (SELECT count(*) FROM public.resenas) = 1;

-- 9. Asegurar tabla testimonios (Opiniones de la Comunidad en Portada, separada de resenas por vehículo)
CREATE TABLE IF NOT EXISTS public.testimonios (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre_cliente text NOT NULL,
    rol_o_ciudad text NOT NULL,
    foto_url text DEFAULT 'img/testimonial-1.jpg',
    calificacion int DEFAULT 5,
    comentario text NOT NULL,
    vehiculo_alquilado text,
    verificado boolean DEFAULT true,
    creado_en timestamptz DEFAULT now()
);
ALTER TABLE public.testimonios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Gestion total testimonios" ON public.testimonios;
CREATE POLICY "Gestion total testimonios" ON public.testimonios FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.testimonios (nombre_cliente, rol_o_ciudad, foto_url, calificacion, comentario, vehiculo_alquilado, verificado)
SELECT 'Carlos Mendoza', 'Propietario en Valledupar', 'img/testimonial-1.jpg', 5, 'Tener mi camioneta trabajando con Rent Car Colombia ha sido una bendición. Recibo mis ganancias puntual y la fianza me da total tranquilidad.', 'Renault Duster 4x4 Turbo', true
WHERE NOT EXISTS (SELECT 1 FROM public.testimonios);

INSERT INTO public.testimonios (nombre_cliente, rol_o_ciudad, foto_url, calificacion, comentario, vehiculo_alquilado, verificado)
SELECT 'Laura Gómez', 'Conductora Turista', 'img/testimonial-2.jpg', 5, 'Alquilé un auto para recorrer el Cesar y La Guajira durante el Festival Vallenato. Trato directo, auto impecable y mucho más económico.', 'Renault Duster 4x4 Turbo', true
WHERE (SELECT count(*) FROM public.testimonios) = 1;

INSERT INTO public.testimonios (nombre_cliente, rol_o_ciudad, foto_url, calificacion, comentario, vehiculo_alquilado, verificado)
SELECT 'Andrés Restrepo', 'Empresario / Propietario', 'img/testimonial-3.jpg', 5, 'Tengo dos autos publicados. El proceso de aprobación y verificación de clientes es muy estricto y profesional. Recomiendo 100% esta plataforma.', 'Mazda CX-30', true
WHERE (SELECT count(*) FROM public.testimonios) = 2;

INSERT INTO public.testimonios (nombre_cliente, rol_o_ciudad, foto_url, calificacion, comentario, vehiculo_alquilado, verificado)
SELECT 'Diana Paternina', 'Conductora Frecuente', 'img/testimonial-4.jpg', 5, 'Excelente atención al cliente por WhatsApp. Reservé un sedán para un viaje de negocios y todo estuvo listo a mi llegada. La mejor opción en Colombia.', 'Chevrolet Onix', true
WHERE (SELECT count(*) FROM public.testimonios) = 3;

-- 10. Asignar el vehículo de ejemplo (sin dueño) a propietario@ejemplo.com
UPDATE public.vehiculos
SET propietario_id = (
    SELECT id FROM public.perfiles WHERE email = 'propietario@ejemplo.com' LIMIT 1
)
WHERE propietario_id IS NULL
  AND EXISTS (SELECT 1 FROM public.perfiles WHERE email = 'propietario@ejemplo.com');

-- 11. Asegurar tabla preguntas_frecuentes (FAQs dinámicas modificables y con visibilidad)
CREATE TABLE IF NOT EXISTS public.preguntas_frecuentes (
    id uuid primary key default gen_random_uuid(),
    pregunta text not null,
    respuesta text not null,
    categoria text default 'General',
    orden integer default 0,
    visible boolean default true,
    creado_en timestamptz default now()
);
ALTER TABLE public.preguntas_frecuentes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Gestion total preguntas_frecuentes" ON public.preguntas_frecuentes;
CREATE POLICY "Gestion total preguntas_frecuentes" ON public.preguntas_frecuentes FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.preguntas_frecuentes (pregunta, respuesta, categoria, orden, visible)
SELECT v.pregunta, v.respuesta, v.categoria, v.orden, true
FROM (VALUES
    ('¿Qué requisitos necesito para alquilar un auto?', 'Ser mayor de 21 años, contar con cédula de ciudadanía original (o pasaporte vigente para extranjeros) y licencia de conducción vigente en buen estado. A diferencia de las agencias tradicionales, no exigimos tarjeta de crédito obligatoria.', 'Conductores', 1),
    ('¿Cómo y cuándo recibo mis ganancias como propietario?', 'Recibes el 85% neto del valor del alquiler mediante transferencia bancaria o Nequi una vez finalizado el viaje y confirmada la entrega del vehículo sin novedades (la plataforma retiene el 15% por servicio, contrato digital y soporte).', 'Propietarios', 2),
    ('¿Qué cubre el depósito de garantía (fianza)?', 'Respalda posibles infracciones o fotomultas ocurridas durante el viaje, combustible faltante, entregas tardías o daños estéticos leves. Si el vehículo regresa en las mismas condiciones del acta de entrega, la fianza se libera al 100%.', 'Pagos y Garantía', 3),
    ('¿Puedo alquilar un vehículo si soy extranjero o turista en Colombia?', 'Sí. Debes presentar tu pasaporte original vigente con el sello de ingreso al país y la licencia de conducción vigente de tu país de origen (válida durante el tiempo de tu permiso turístico; si está en otro alfabeto, se recomienda Permiso Internacional).', 'Conductores', 4),
    ('¿Qué métodos de pago aceptan para reservar y cubrir la fianza?', 'Puedes pagar de forma segura mediante Wompi (PSE, Nequi, tarjetas débito o crédito) o transferencia bancaria directa. El pago y la custodia de la fianza quedan registrados en tu reserva sin bloqueos abusivos de cupo.', 'Pagos y Garantía', 5),
    ('¿Los vehículos tienen seguro y qué ocurre en caso de accidente o falla mecánica?', 'Todos los vehículos publicados deben contar con SOAT vigente y póliza de respaldo verificada. Al recibir el auto se firma un Acta Digital de Entrega con registro fotográfico y cuentas con acompañamiento 24/7 ante cualquier eventualidad en carretera.', 'Seguridad', 6),
    ('¿Cómo funciona el kilometraje incluido y la política de combustible?', 'Cada propietario define el límite diario de su vehículo (generalmente entre 200 y 250 km/día o ilimitado negociable), visible antes de reservar. El auto se entrega y debe devolverse con el mismo nivel de combustible registrado en el acta inicial.', 'Conductores', 7),
    ('¿Puede conducir otra persona adicional al titular de la reserva?', 'Sí, siempre que el conductor adicional sea notificado y validado antes de la entrega con su documento de identidad y licencia vigente para quedar cubierto en el contrato digital.', 'Conductores', 8),
    ('¿Quién asume las multas de tránsito o fotomultas durante el alquiler?', 'El arrendatario asume cualquier comparendo o fotomulta registrada dentro de las fechas y horas exactas de su contrato. En caso de notificación posterior, se presenta el soporte oficial de tránsito para su descuento o cobro.', 'Seguridad', 9),
    ('¿Puedo cancelar o reprogramar mi reserva?', 'Sí. Si solicitas la cancelación o cambio de fechas con anticipación antes de la hora de entrega, gestionamos la reprogramación (sujeta a disponibilidad del anfitrión) o la devolución según las políticas vigentes del servicio.', 'Pagos y Garantía', 10)
) AS v(pregunta, respuesta, categoria, orden)
WHERE NOT EXISTS (SELECT 1 FROM public.preguntas_frecuentes);

-- 12. Verificación rápida de tablas
SELECT 'vehiculos' AS tabla, count(*) AS registros FROM public.vehiculos
UNION ALL
SELECT 'testimonios', count(*) FROM public.testimonios
UNION ALL
SELECT 'preguntas_frecuentes', count(*) FROM public.preguntas_frecuentes
UNION ALL
SELECT 'resenas', count(*) FROM public.resenas
UNION ALL
SELECT 'mensajes_contacto', count(*) FROM public.mensajes_contacto
UNION ALL
SELECT 'configuracion_sitio', count(*) FROM public.configuracion_sitio
UNION ALL
SELECT 'reportes_feedback', count(*) FROM public.reportes_feedback
UNION ALL
SELECT 'alertas_propietarios', count(*) FROM public.alertas_propietarios
UNION ALL
SELECT 'logs_auditoria', count(*) FROM public.logs_auditoria;
