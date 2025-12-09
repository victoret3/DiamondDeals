-- =====================================================
-- SISTEMA DE AGENTES
-- =====================================================

-- Añadir campos a la tabla players
ALTER TABLE public.players
  ADD COLUMN is_agent BOOLEAN DEFAULT false,
  ADD COLUMN referred_by_agent_id UUID REFERENCES public.players(id) ON DELETE SET NULL;

-- Índices
CREATE INDEX idx_players_is_agent ON public.players(is_agent);
CREATE INDEX idx_players_referred_by ON public.players(referred_by_agent_id);

-- Función para actualizar el rol en profiles cuando se marca como agente
CREATE OR REPLACE FUNCTION public.sync_agent_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_agent = true AND NEW.user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET role = 'agent'
    WHERE id = NEW.user_id;
  ELSIF NEW.is_agent = false AND OLD.is_agent = true AND NEW.user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET role = 'player'
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para sincronizar el rol
CREATE TRIGGER sync_agent_role_trigger
  AFTER INSERT OR UPDATE OF is_agent ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_agent_role();

-- Añadir comisión del agente en player_clubs
ALTER TABLE public.player_clubs
  ADD COLUMN agent_commission_percentage DECIMAL(5,2) DEFAULT 0 CHECK (agent_commission_percentage >= 0 AND agent_commission_percentage <= 100);

-- Añadir campos de comisión de agente en weekly_player_reports
ALTER TABLE public.weekly_player_reports
  ADD COLUMN agent_commission_percentage DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN agent_commission_amount DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN player_amount_net DECIMAL(12,2);

-- =====================================================
-- ACTUALIZAR FUNCIÓN DE CÁLCULO DE REPORTES
-- =====================================================

CREATE OR REPLACE FUNCTION public.calculate_weekly_player_report()
RETURNS TRIGGER AS $$
DECLARE
  v_player_club_record RECORD;
BEGIN
  -- Obtener información del player_club y club
  SELECT
    pc.*,
    c.action_percentage as club_action_percentage,
    c.diamond_club_agreement_type as club_diamond_club_type,
    c.diamond_club_fixed_percentage as club_diamond_club_fixed,
    c.diamond_club_template_id as club_diamond_club_template,
    c.diamond_player_agreement_type as club_diamond_player_type,
    c.diamond_player_fixed_percentage as club_diamond_player_fixed,
    c.diamond_player_template_id as club_diamond_player_template
  INTO v_player_club_record
  FROM public.player_clubs pc
  JOIN public.clubs c ON pc.club_id = c.id
  WHERE pc.id = NEW.player_club_id;

  -- PASO 1: Calcular ratio
  IF NEW.rake > 0 THEN
    NEW.ratio := NEW.pnl / NEW.rake;
  ELSE
    NEW.ratio := 0;
  END IF;

  -- PASO 2: Calcular Action
  NEW.action_percentage := v_player_club_record.club_action_percentage;
  NEW.action_amount := NEW.pnl * (NEW.action_percentage / 100);

  -- PASO 3: Calcular Rake Action
  NEW.rake_action := (1 - (NEW.action_percentage / 100)) * NEW.rake;

  -- PASO 4: Calcular acuerdo Diamond ↔ Club
  NEW.diamond_club_agreement_type := v_player_club_record.club_diamond_club_type;

  IF NEW.diamond_club_agreement_type = 'fixed' THEN
    NEW.diamond_club_percentage := v_player_club_record.club_diamond_club_fixed;
  ELSE
    NEW.diamond_club_percentage := public.get_diamond_club_percentage(
      v_player_club_record.club_diamond_club_template,
      NEW.ratio,
      NEW.hands
    );
  END IF;

  NEW.diamond_club_amount := NEW.rake_action * (NEW.diamond_club_percentage / 100);

  -- PASO 5: Calcular acuerdo Diamond ↔ Jugador
  IF v_player_club_record.custom_diamond_agreement THEN
    NEW.diamond_player_agreement_type := v_player_club_record.diamond_agreement_type;

    IF NEW.diamond_player_agreement_type = 'fixed' THEN
      NEW.player_percentage := v_player_club_record.diamond_fixed_percentage;
    ELSE
      NEW.player_percentage := public.get_player_percentage(
        v_player_club_record.diamond_template_id,
        NEW.ratio,
        NEW.hands
      );
    END IF;
  ELSE
    NEW.diamond_player_agreement_type := v_player_club_record.club_diamond_player_type;

    IF NEW.diamond_player_agreement_type = 'fixed' THEN
      NEW.player_percentage := v_player_club_record.club_diamond_player_fixed;
    ELSE
      NEW.player_percentage := public.get_player_percentage(
        v_player_club_record.club_diamond_player_template,
        NEW.ratio,
        NEW.hands
      );
    END IF;
  END IF;

  NEW.player_amount := NEW.rake_action * (NEW.player_percentage / 100);

  -- PASO 6: Calcular comisión del agente
  NEW.agent_commission_percentage := v_player_club_record.agent_commission_percentage;
  NEW.agent_commission_amount := NEW.player_amount * (NEW.agent_commission_percentage / 100);
  NEW.player_amount_net := NEW.player_amount - NEW.agent_commission_amount;

  -- PASO 7: Calcular profit de Diamond
  NEW.diamond_profit := NEW.diamond_club_amount - NEW.player_amount;

  -- Actualizar timestamp
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VISTA: Reportes de agentes (agregado de sus referidos)
-- =====================================================

CREATE OR REPLACE VIEW public.agent_reports AS
SELECT
  p.id as agent_id,
  p.full_name as agent_name,
  p.nickname as agent_nickname,
  wpr.week_start,
  wpr.week_end,
  c.id as club_id,
  c.name as club_name,
  COUNT(DISTINCT wpr.id) as total_referrals,
  SUM(wpr.pnl) as total_pnl,
  SUM(wpr.rake) as total_rake,
  SUM(wpr.hands) as total_hands,
  SUM(wpr.agent_commission_amount) as total_commission,
  wpr.created_at
FROM public.players p
JOIN public.players referred ON referred.referred_by_agent_id = p.id
JOIN public.player_clubs pc ON pc.player_id = referred.id
JOIN public.clubs c ON c.id = pc.club_id
LEFT JOIN public.weekly_player_reports wpr ON wpr.player_club_id = pc.id
WHERE p.is_agent = true
GROUP BY p.id, p.full_name, p.nickname, wpr.week_start, wpr.week_end, c.id, c.name, wpr.created_at;

-- =====================================================
-- RLS: Políticas para agentes
-- =====================================================

-- Los agentes pueden ver solo sus propios reportes
CREATE POLICY "Agents can view their referral reports"
  ON public.weekly_player_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.player_clubs pc
      JOIN public.players p ON pc.player_id = p.id
      JOIN public.players agent ON p.referred_by_agent_id = agent.id
      WHERE pc.id = weekly_player_reports.player_club_id
      AND agent.user_id = auth.uid()
    )
  );

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON COLUMN public.players.is_agent IS 'Indica si este jugador es un agente (puede tener referidos)';
COMMENT ON COLUMN public.players.referred_by_agent_id IS 'ID del agente que refirió a este jugador';
COMMENT ON COLUMN public.player_clubs.agent_commission_percentage IS 'Porcentaje de comisión que el agente cobra del rakeback de este jugador en este club';
COMMENT ON COLUMN public.weekly_player_reports.agent_commission_percentage IS 'Porcentaje de comisión del agente (copiado de player_clubs)';
COMMENT ON COLUMN public.weekly_player_reports.agent_commission_amount IS 'Monto de comisión para el agente = player_amount × agent_commission%';
COMMENT ON COLUMN public.weekly_player_reports.player_amount_net IS 'Monto neto que recibe el jugador = player_amount - agent_commission_amount';
COMMENT ON VIEW public.agent_reports IS 'Vista agregada de reportes por agente, mostrando totales de sus referidos por club y semana';
