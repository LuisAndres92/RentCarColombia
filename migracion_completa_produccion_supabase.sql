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

-- 6. Verificación rápida de tablas creadas
SELECT 'vehiculos' AS tabla, count(*) AS registros FROM public.vehiculos
UNION ALL
SELECT 'configuracion_sitio', count(*) FROM public.configuracion_sitio
UNION ALL
SELECT 'reportes_feedback', count(*) FROM public.reportes_feedback
UNION ALL
SELECT 'alertas_propietarios', count(*) FROM public.alertas_propietarios;
