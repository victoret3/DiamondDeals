-- Añadir columna de comisión del agente por club
ALTER TABLE public.player_clubs
  ADD COLUMN IF NOT EXISTS agent_commission_percentage DECIMAL(5,2) DEFAULT 0
  CHECK (agent_commission_percentage >= 0 AND agent_commission_percentage <= 100);

COMMENT ON COLUMN public.player_clubs.agent_commission_percentage IS 'Porcentaje de comisión que el agente cobra del rakeback de este jugador en este club';
