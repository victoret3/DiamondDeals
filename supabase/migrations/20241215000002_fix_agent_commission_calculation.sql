-- Corregir cálculo de comisión del agente
-- La comisión del agente se resta del beneficio de Diamond, NO del jugador

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

  -- PASO 6: Calcular comisión del agente (se calcula sobre el rakeback del jugador)
  NEW.agent_commission_percentage := COALESCE(v_player_club_record.agent_commission_percentage, 0);
  NEW.agent_commission_amount := NEW.player_amount * (NEW.agent_commission_percentage / 100);

  -- El jugador recibe su rakeback completo (la comisión del agente NO se resta del jugador)
  NEW.player_amount_net := NEW.player_amount;

  -- PASO 7: Calcular profit de Diamond (restando la comisión del agente)
  -- diamond_profit = lo que recibe Diamond del club - lo que paga al jugador - lo que paga al agente
  NEW.diamond_profit := NEW.diamond_club_amount - NEW.player_amount - NEW.agent_commission_amount;

  -- Actualizar timestamp
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON COLUMN public.weekly_player_reports.agent_commission_amount IS 'Comisión del agente (se resta del beneficio de Diamond)';
COMMENT ON COLUMN public.weekly_player_reports.diamond_profit IS 'Beneficio neto de Diamond = diamond_club_amount - player_amount - agent_commission_amount';
