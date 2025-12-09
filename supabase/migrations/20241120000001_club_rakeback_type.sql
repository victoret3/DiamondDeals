-- Migration: Add rakeback type to clubs
-- Permite que los clubs tengan rakeback fijo o variable

-- Agregar columna para tipo de rakeback (fixed o variable)
ALTER TABLE public.clubs
ADD COLUMN IF NOT EXISTS rakeback_type TEXT DEFAULT 'fixed' CHECK (rakeback_type IN ('fixed', 'variable'));

-- Hacer que base_rakeback_percentage sea nullable (solo se usa cuando es 'fixed')
ALTER TABLE public.clubs
ALTER COLUMN base_rakeback_percentage DROP NOT NULL;

-- Agregar comentarios
COMMENT ON COLUMN public.clubs.rakeback_type IS 'Tipo de rakeback del club: fixed (todos los jugadores reciben el mismo %) o variable (cada jugador tiene su propio acuerdo Diamond→Jugador configurado al asignarlo)';
COMMENT ON COLUMN public.clubs.base_rakeback_percentage IS 'Porcentaje base de rakeback que ofrece el club (solo aplicable cuando rakeback_type = fixed)';
COMMENT ON COLUMN public.clubs.diamond_player_agreement_type IS 'Acuerdo Diamond→Jugador por defecto cuando rakeback_type = variable';
COMMENT ON COLUMN public.clubs.diamond_player_fixed_percentage IS 'Porcentaje fijo por defecto del acuerdo Diamond→Jugador cuando rakeback_type = variable y agreement_type = fixed';
COMMENT ON COLUMN public.clubs.diamond_player_template_id IS 'Template por defecto del acuerdo Diamond→Jugador cuando rakeback_type = variable y agreement_type = dynamic';
