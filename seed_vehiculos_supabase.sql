-- =====================================================================
-- RENT CAR COLOMBIA - SEMBRAR VEHÍCULOS INICIALES EN SUPABASE
-- Ejecutar en el SQL Editor de Supabase
-- =====================================================================

-- 1. Permitir que propietario_id sea opcional para vehículos iniciales de la plataforma
ALTER TABLE public.vehiculos ALTER COLUMN propietario_id DROP NOT NULL;
ALTER TABLE public.reservas ALTER COLUMN propietario_id DROP NOT NULL;
ALTER TABLE public.reservas ALTER COLUMN conductor_id DROP NOT NULL;

-- 2. Insertar los 6 autos iniciales en Supabase
INSERT INTO public.vehiculos (marca, modelo, nombre_completo, año, categoria, transmision, combustible, puestos, precio_por_dia, ciudad, kilometraje_limite, descripcion, imagen_url, estado)
VALUES
('Toyota', 'Corolla Cross', 'Toyota Corolla Cross XEI Híbrida', 2023, 'SUV / Camioneta', 'Automático', 'Híbrido', 5, 280000, 'Valledupar', '250 km/día', 'Excelente camioneta híbrida, confort total y mínimo consumo para ciudad o carretera.', 'img/car-rent-1.png', 'Activo'),
('Mazda', 'CX-30', 'Mazda CX-30 Grand Touring', 2022, 'SUV / Camioneta', 'Automático', 'Gasolina', 5, 250000, 'Valledupar', '200 km/día', 'Diseño elegante, sonido Bose, acabados en cuero y seguridad activa i-Activsense.', 'img/car-rent-2.png', 'Activo'),
('Renault', 'Duster', 'Renault Duster 4x4 Turbo', 2023, 'SUV / Camioneta', 'Mecánico', 'Gasolina', 5, 220000, 'Valledupar', '200 km/día', 'Capacidad todoterreno, excelente espacio de baúl, ideal para turismo en el Cesar y Guajira.', 'img/car-rent-3.png', 'Activo'),
('Chevrolet', 'Onix Sedan', 'Chevrolet Onix Turbo Premier', 2022, 'Sedán', 'Automático', 'Gasolina', 5, 160000, 'Valledupar', '200 km/día', 'Motor turbo eficiente, conectividad Wi-Fi y 6 airbags de seguridad.', 'img/car-rent-4.png', 'Activo'),
('Nissan', 'Frontier', 'Nissan Frontier Doble Cabina 4x4', 2021, 'Pickup', 'Mecánico', 'Diésel', 5, 320000, 'Valledupar', '250 km/día', 'Fuerza, tracción 4x4 y platón de carga para proyectos, fincas o viajes exigentes.', 'img/car-rent-5.png', 'Activo'),
('Kia', 'Picanto', 'Kia Picanto GT Line', 2023, 'Compacto', 'Mecánico', 'Gasolina', 5, 130000, 'Valledupar', '200 km/día', 'El más económico para movilidad urbana, fácil de estacionar y aire acondicionado potente.', 'img/car-rent-6.png', 'Activo');
