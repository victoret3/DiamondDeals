-- Añadir nuevos campos a la tabla players
ALTER TABLE public.players
  ADD COLUMN registration_token UUID DEFAULT gen_random_uuid() UNIQUE,
  ADD COLUMN token_used BOOLEAN DEFAULT FALSE,
  ADD COLUMN player_id VARCHAR(9) UNIQUE, -- Formato: XXXX-XXXX
  ADD COLUMN nickname VARCHAR(50) UNIQUE;

-- Añadir nickname a la tabla profiles para permitir login con nick
ALTER TABLE public.profiles
  ADD COLUMN nickname VARCHAR(50) UNIQUE;

-- Actualizar el enum de rol para incluir 'agent'
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('player', 'admin', 'agent'));

-- Índices para mejorar búsquedas
CREATE INDEX idx_players_registration_token ON public.players(registration_token);
CREATE INDEX idx_players_player_id ON public.players(player_id);
CREATE INDEX idx_players_nickname ON public.players(nickname);
CREATE INDEX idx_profiles_nickname ON public.profiles(nickname);

-- Comentarios
COMMENT ON COLUMN public.players.registration_token IS 'Token único de un solo uso para el enlace de registro';
COMMENT ON COLUMN public.players.token_used IS 'Indica si el token ya fue usado para registro';
COMMENT ON COLUMN public.players.player_id IS 'ID del jugador en formato XXXX-XXXX (números)';
COMMENT ON COLUMN public.players.nickname IS 'Apodo/nick del jugador';
COMMENT ON COLUMN public.profiles.nickname IS 'Apodo/nick del usuario (copiado desde players al registrarse)';
