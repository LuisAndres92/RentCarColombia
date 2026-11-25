-- =====================================================================
-- RENT CAR COLOMBIA - LIMPIEZA A ESTADO REAL DE PRODUCCIÓN (SUPABASE)
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase:
-- https://supabase.com/dashboard/project/dfgnlpvfwvfqagmwfjmo/sql
-- =====================================================================

-- 1. Limpiar todas las reservas y reseñas de prueba
DELETE FROM public.reseñas;
DELETE FROM public.resenas;
DELETE FROM public.reservas;

-- 2. Eliminar los vehículos de prueba y dejar ÚNICAMENTE 1 vehículo oficial de ejemplo
DELETE FROM public.vehiculos 
WHERE id = 'car_mod_demo'
   OR propietario_id = 'usr_demo_host_2'
   OR descripcion LIKE '%sierra%'
   OR (nombre_completo NOT LIKE '%Renault Duster 4x4 Turbo%' AND nombre_completo NOT LIKE '%Duster Iconic%');

-- 3. Si por alguna razón se borraron todos, asegurar que exista el vehículo oficial de ejemplo en Valledupar:
INSERT INTO public.vehiculos (
    marca, modelo, nombre_completo, año, categoria, transmision, combustible, 
    puestos, precio_por_dia, ciudad, kilometraje_limite, descripcion, imagen_url, estado, soat_vigente
)
SELECT 
    'Renault', 'Duster', 'Renault Duster 4x4 Turbo', 2024, 'SUV / Camioneta', 'Automático', 'Gasolina', 
    5, 220000, 'Valledupar', '250 km/día', 
    'Camioneta todoterreno 4x4 turbo de demostración. Totalmente equipada, SOAT vigente, seguro todo riesgo y mantenimiento al día en Valledupar.', 
    'img/car-rent-1.png', 'Activo', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.vehiculos WHERE nombre_completo LIKE '%Renault Duster%'
);

-- 4. HABILITAR PERMISOS COMPLETOS EN RLS (Row Level Security)
-- Esto permite que el Superadmin y los clientes registrados puedan agregar,
-- editar, moderar y eliminar vehículos y reservas directamente desde la web:
ALTER TABLE public.vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Autos activos son visibles para todos" ON public.vehiculos;
DROP POLICY IF EXISTS "Propietarios pueden modificar sus propios autos" ON public.vehiculos;
DROP POLICY IF EXISTS "Gestion total de vehiculos" ON public.vehiculos;
CREATE POLICY "Gestion total de vehiculos" ON public.vehiculos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Conductor y Propietario pueden ver sus reservas" ON public.reservas;
DROP POLICY IF EXISTS "Conductores pueden crear solicitudes de reserva" ON public.reservas;
DROP POLICY IF EXISTS "Gestion total de reservas" ON public.reservas;
CREATE POLICY "Gestion total de reservas" ON public.reservas FOR ALL USING (true) WITH CHECK (true);

-- 5. Consulta de verificación inmediata (Debe retornar 1 vehículo y 0 reservas)
SELECT count(*) AS total_vehiculos FROM public.vehiculos;
SELECT count(*) AS total_reservas FROM public.reservas;
