-- Actualizar usuario a rol admin
-- Este script convierte al usuario victor.perez@atyum.com en administrador

UPDATE public.profiles
SET role = 'admin'
WHERE id = 'ff37dc00-cf5b-43ef-a035-2d19e46c465a';

-- Verificar el cambio
SELECT id, email, role, created_at
FROM public.profiles
WHERE id = 'ff37dc00-cf5b-43ef-a035-2d19e46c465a';
