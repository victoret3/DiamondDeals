-- Permitir que los campos full_name sean NULL
-- Esto permite crear jugadores sin datos personales y que los rellenen al registrarse

ALTER TABLE public.players
  ALTER COLUMN full_name DROP NOT NULL;

COMMENT ON COLUMN public.players.full_name IS 'Nombre completo del jugador (lo rellena el jugador al registrarse)';
