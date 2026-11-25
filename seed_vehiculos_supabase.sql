-- =====================================================================
-- RENT CAR COLOMBIA - SEMBRAR VEHÍCULO INICIAL OFICIAL EN SUPABASE
-- Ejecutar en el SQL Editor de Supabase
-- =====================================================================

-- 1. Permitir que propietario_id sea opcional para vehículos iniciales de la plataforma y flexibilizar perfiles
ALTER TABLE public.vehiculos ALTER COLUMN propietario_id DROP NOT NULL;
ALTER TABLE public.reservas ALTER COLUMN propietario_id DROP NOT NULL;
ALTER TABLE public.reservas ALTER COLUMN conductor_id DROP NOT NULL;
ALTER TABLE public.perfiles ALTER COLUMN id SET DEFAULT uuid_generate_v4();
ALTER TABLE public.perfiles DROP CONSTRAINT IF EXISTS perfiles_id_fkey;

-- 2. Limpiar reservas de prueba
DELETE FROM public.reseñas;
DELETE FROM public.resenas;
DELETE FROM public.reservas;

-- 3. Dejar solo 1 auto oficial de demostración en Valledupar
DELETE FROM public.vehiculos;

INSERT INTO public.vehiculos (marca, modelo, nombre_completo, año, categoria, transmision, combustible, puestos, precio_por_dia, ciudad, kilometraje_limite, descripcion, imagen_url, estado, soat_vigente)
VALUES
('Renault', 'Duster', 'Renault Duster 4x4 Turbo', 2024, 'SUV / Camioneta', 'Automático', 'Gasolina', 5, 220000, 'Valledupar', '250 km/día', 'Camioneta todoterreno 4x4 turbo de demostración. Totalmente equipada, SOAT vigente, seguro todo riesgo y mantenimiento al día en Valledupar.', 'img/car-rent-1.png', 'Activo', true);

-- 4. Habilitar permisos de gestión completa en RLS
DROP POLICY IF EXISTS "Gestion total de vehiculos" ON public.vehiculos;
CREATE POLICY "Gestion total de vehiculos" ON public.vehiculos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Gestion total de reservas" ON public.reservas;
CREATE POLICY "Gestion total de reservas" ON public.reservas FOR ALL USING (true) WITH CHECK (true);
