-- =====================================================
-- DATOS FAKE SIMPLES Y CLAROS
-- =====================================================

DO $$
DECLARE
  v_ggpoker_id UUID;
  v_pokerstars_id UUID;
  v_player_template_id UUID;
  v_condition_template_id UUID;

  v_carlos_id UUID;
  v_ana_id UUID;
  v_miguel_id UUID;
  v_laura_id UUID;

  v_carlos_gg_pc_id UUID;
  v_miguel_gg_pc_id UUID;
  v_laura_ps_pc_id UUID;
  v_ana_gg_pc_id UUID;

  v_week_start DATE;
  v_week_end DATE;
BEGIN
  -- Obtener IDs de clubs
  SELECT id INTO v_ggpoker_id FROM public.clubs WHERE code = 'GGPOKER';
  SELECT id INTO v_pokerstars_id FROM public.clubs WHERE code = 'POKERSTARS';

  -- Obtener template IDs
  SELECT id INTO v_player_template_id
  FROM public.diamond_player_agreement_templates
  WHERE name = 'Standard Diamond-Player 2024'
  LIMIT 1;

  SELECT id INTO v_condition_template_id
  FROM public.condition_templates
  WHERE name = 'Condiciones Standard 2024';

  -- Configurar clubs con acuerdos dinámicos (tabla)
  UPDATE public.clubs
  SET
    diamond_player_agreement_type = 'dynamic',
    diamond_player_template_id = v_player_template_id
  WHERE code IN ('GGPOKER', 'POKERSTARS');

  -- =====================================================
  -- CREAR 4 JUGADORES SIMPLES
  -- =====================================================

  -- 1. Carlos - Normal, sin agente, juega en GGPoker
  INSERT INTO public.players (player_code, player_id, full_name, nickname, phone, email, status, token_used, is_agent)
  VALUES ('1001-2345', '1111-1111', 'Carlos Martínez', 'CarlosPro', '+34611222333', 'carlos@test.com', 'active', true, false)
  RETURNING id INTO v_carlos_id;

  -- 2. Ana - AGENTE, juega en GGPoker
  INSERT INTO public.players (player_code, player_id, full_name, nickname, phone, email, status, token_used, is_agent)
  VALUES ('2002-3456', '2222-2222', 'Ana García', 'AnaPoker', '+34622333444', 'ana@test.com', 'active', true, true)
  RETURNING id INTO v_ana_id;

  -- 3. Miguel - Referido por Ana, juega en GGPoker
  INSERT INTO public.players (player_code, player_id, full_name, nickname, phone, email, status, token_used, is_agent, referred_by_agent_id)
  VALUES ('3003-4567', '3333-3333', 'Miguel López', 'MiguelShark', '+34633444555', 'miguel@test.com', 'active', true, false, v_ana_id)
  RETURNING id INTO v_miguel_id;

  -- 4. Laura - Referida por Ana, juega en PokerStars, ACUERDO FIJO 35%
  INSERT INTO public.players (player_code, player_id, full_name, nickname, phone, email, status, token_used, is_agent, referred_by_agent_id)
  VALUES ('4004-5678', '4444-4444', 'Laura Sánchez', 'LauraPower', '+34644555666', 'laura@test.com', 'active', true, false, v_ana_id)
  RETURNING id INTO v_laura_id;

  -- =====================================================
  -- ASIGNAR JUGADORES A CLUBS
  -- =====================================================

  -- Carlos en GGPoker (sin agente, usa tabla del club)
  INSERT INTO public.player_clubs (player_id, club_id, username_in_club, agent_commission_percentage)
  VALUES (v_carlos_id, v_ggpoker_id, 'carlos_gg', 0)
  RETURNING id INTO v_carlos_gg_pc_id;

  -- Ana en GGPoker (agente, sin comisión porque es ella)
  INSERT INTO public.player_clubs (player_id, club_id, username_in_club, agent_commission_percentage)
  VALUES (v_ana_id, v_ggpoker_id, 'ana_gg', 0)
  RETURNING id INTO v_ana_gg_pc_id;

  -- Miguel en GGPoker (referido de Ana, comisión 30%)
  INSERT INTO public.player_clubs (player_id, club_id, username_in_club, agent_commission_percentage)
  VALUES (v_miguel_id, v_ggpoker_id, 'miguel_gg', 30.0)
  RETURNING id INTO v_miguel_gg_pc_id;

  -- Laura en PokerStars (referida de Ana, comisión 25%, ACUERDO FIJO 35%)
  INSERT INTO public.player_clubs (player_id, club_id, username_in_club, agent_commission_percentage, custom_diamond_agreement, diamond_agreement_type, diamond_fixed_percentage)
  VALUES (v_laura_id, v_pokerstars_id, 'laura_ps', 25.0, true, 'fixed', 35.0)
  RETURNING id INTO v_laura_ps_pc_id;

  -- Asignar condiciones a todos
  INSERT INTO public.player_conditions (player_club_id, condition_type, template_id)
  VALUES
    (v_carlos_gg_pc_id, 'dynamic', v_condition_template_id),
    (v_ana_gg_pc_id, 'dynamic', v_condition_template_id),
    (v_miguel_gg_pc_id, 'dynamic', v_condition_template_id),
    (v_laura_ps_pc_id, 'dynamic', v_condition_template_id);

  -- =====================================================
  -- REPORTES SEMANALES (semana pasada)
  -- =====================================================

  v_week_start := DATE_TRUNC('week', CURRENT_DATE - INTERVAL '1 week');
  v_week_end := v_week_start + INTERVAL '6 days';

  -- Carlos en GGPoker: Ganando bien, ratio 1.39, 8500 manos -> Tabla da 10%
  INSERT INTO public.weekly_player_reports (player_club_id, week_start, week_end, pnl, rake, hands)
  VALUES (v_carlos_gg_pc_id, v_week_start, v_week_end, 2500.00, 1800.00, 8500);

  -- Ana en GGPoker: Break even, ratio -0.33, 4200 manos -> Tabla da 25%
  INSERT INTO public.weekly_player_reports (player_club_id, week_start, week_end, pnl, rake, hands)
  VALUES (v_ana_gg_pc_id, v_week_start, v_week_end, -300.00, 900.00, 4200);

  -- Miguel en GGPoker: Ganando, ratio 0.6, 9800 manos -> Tabla da 10%
  INSERT INTO public.weekly_player_reports (player_club_id, week_start, week_end, pnl, rake, hands)
  VALUES (v_miguel_gg_pc_id, v_week_start, v_week_end, 1200.00, 2000.00, 9800);

  -- Laura en PokerStars: Perdiendo, FIJO 35%
  INSERT INTO public.weekly_player_reports (player_club_id, week_start, week_end, pnl, rake, hands)
  VALUES (v_laura_ps_pc_id, v_week_start, v_week_end, -1500.00, 1100.00, 6500);

  RAISE NOTICE 'Datos fake creados correctamente';
  RAISE NOTICE '- Carlos: GGPoker, sin agente, tabla';
  RAISE NOTICE '- Ana: GGPoker, AGENTE, tabla';
  RAISE NOTICE '- Miguel: GGPoker, referido Ana (30%%), tabla';
  RAISE NOTICE '- Laura: PokerStars, referida Ana (25%%), FIJO 35%%';
END $$;

-- Ver resumen
SELECT
  p.player_code as "Código",
  p.nickname as "Jugador",
  c.code as "Club",
  CASE WHEN p.is_agent THEN 'AGENTE' ELSE 'Jugador' END as "Tipo",
  CASE
    WHEN pc.custom_diamond_agreement AND pc.diamond_agreement_type = 'fixed'
      THEN pc.diamond_fixed_percentage::text || '% FIJO'
    WHEN pc.custom_diamond_agreement AND pc.diamond_agreement_type = 'dynamic'
      THEN 'TABLA Personal'
    ELSE 'TABLA Club'
  END as "Rakeback",
  COALESCE(pc.agent_commission_percentage::text || '%', '-') as "Comisión Agente"
FROM public.players p
JOIN public.player_clubs pc ON pc.player_id = p.id
JOIN public.clubs c ON pc.club_id = c.id
WHERE p.player_code ~ '^[0-9]{4}-[0-9]{4}$'
ORDER BY p.player_code;
