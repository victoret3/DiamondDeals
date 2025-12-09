-- Crear jugadores reales basados en el Excel de CLUBGG
-- Semana: 27 OCT - 02 NOV 2025

DO $$
DECLARE
  v_club_id UUID;
  v_pc_igna UUID;
  v_pc_hardcoriano UUID;
  v_pc_alex UUID;
  v_pc_jon UUID;
  v_pc_alex_sirbaal UUID;
  v_pc_flip UUID;
  v_pc_julio UUID;
  v_pc_manuel UUID;
  v_pc_cristian UUID;
BEGIN
  -- Obtener el club CLUBGG
  SELECT id INTO v_club_id FROM public.clubs WHERE code = 'CLUBGG' LIMIT 1;

  IF v_club_id IS NULL THEN
    RAISE EXCEPTION 'Club CLUBGG no encontrado';
  END IF;

  -- Borrar datos existentes si los hay
  DELETE FROM public.weekly_player_reports WHERE player_club_id IN (
    SELECT id FROM public.player_clubs WHERE club_id = v_club_id
  );
  DELETE FROM public.player_clubs WHERE club_id = v_club_id;
  DELETE FROM public.players WHERE player_code LIKE 'DD%';

  -- JUGADOR 1: Igna (DD1)
  INSERT INTO public.players (player_code, full_name, nickname, email, status, is_agent)
  VALUES ('DD1', 'Ignacio Molina', 'Policiadepppoke', 'igna@test.com', 'active', false)
  RETURNING id INTO v_pc_igna;

  INSERT INTO public.player_clubs (player_id, club_id, custom_diamond_agreement, diamond_agreement_type, diamond_fixed_percentage, agent_commission_percentage)
  VALUES ((SELECT id FROM public.players WHERE player_code = 'DD1'), v_club_id, true, 'fixed', 60, 0)
  RETURNING id INTO v_pc_igna;

  -- JUGADOR 2: Hardcoriano (DD26) - Tiene agente
  INSERT INTO public.players (player_code, full_name, nickname, email, status, is_agent)
  VALUES ('DD26', 'Hardcoriano', 'grassKing3', 'hardcoriano@test.com', 'active', false);

  INSERT INTO public.player_clubs (player_id, club_id, custom_diamond_agreement, diamond_agreement_type, diamond_fixed_percentage, agent_commission_percentage)
  VALUES ((SELECT id FROM public.players WHERE player_code = 'DD26'), v_club_id, true, 'fixed', 40, 60)
  RETURNING id INTO v_pc_hardcoriano;

  -- JUGADOR 3: Alex Penco (DD27) - Tiene agente
  INSERT INTO public.players (player_code, full_name, nickname, email, status, is_agent)
  VALUES ('DD27', 'Alex Penco', 'Twinkle55', 'alex.penco@test.com', 'active', false);

  INSERT INTO public.player_clubs (player_id, club_id, custom_diamond_agreement, diamond_agreement_type, diamond_fixed_percentage, agent_commission_percentage)
  VALUES ((SELECT id FROM public.players WHERE player_code = 'DD27'), v_club_id, true, 'fixed', 30, 60)
  RETURNING id INTO v_pc_alex;

  -- JUGADOR 4: Jon Tomé (DD28)
  INSERT INTO public.players (player_code, full_name, nickname, email, status, is_agent)
  VALUES ('DD28', 'Jon Tomé', 'azartv', 'jon.tome@test.com', 'active', false);

  INSERT INTO public.player_clubs (player_id, club_id, custom_diamond_agreement, diamond_agreement_type, diamond_fixed_percentage, agent_commission_percentage)
  VALUES ((SELECT id FROM public.players WHERE player_code = 'DD28'), v_club_id, true, 'fixed', 30, 60)
  RETURNING id INTO v_pc_jon;

  -- JUGADOR 5: Alex SirBaal (DD43)
  INSERT INTO public.players (player_code, full_name, nickname, email, status, is_agent)
  VALUES ('DD43', 'Alex SirBaal', 'interminable', 'alex.sirbaal@test.com', 'active', false);

  INSERT INTO public.player_clubs (player_id, club_id, custom_diamond_agreement, diamond_agreement_type, diamond_fixed_percentage, agent_commission_percentage)
  VALUES ((SELECT id FROM public.players WHERE player_code = 'DD43'), v_club_id, true, 'fixed', 30, 60)
  RETURNING id INTO v_pc_alex_sirbaal;

  -- JUGADOR 6: Flip Esteve (DD32)
  INSERT INTO public.players (player_code, full_name, nickname, email, status, is_agent)
  VALUES ('DD32', 'Flip Esteve', 'DuncamAA', 'flip.esteve@test.com', 'active', false);

  INSERT INTO public.player_clubs (player_id, club_id, custom_diamond_agreement, diamond_agreement_type, diamond_fixed_percentage, agent_commission_percentage)
  VALUES ((SELECT id FROM public.players WHERE player_code = 'DD32'), v_club_id, true, 'fixed', 30, 60)
  RETURNING id INTO v_pc_flip;

  -- JUGADOR 7: Julio Ruiz (DD47)
  INSERT INTO public.players (player_code, full_name, nickname, email, status, is_agent)
  VALUES ('DD47', 'Julio Ruiz', 'Gianizzz', 'julio.ruiz@test.com', 'active', false);

  INSERT INTO public.player_clubs (player_id, club_id, custom_diamond_agreement, diamond_agreement_type, diamond_fixed_percentage, agent_commission_percentage)
  VALUES ((SELECT id FROM public.players WHERE player_code = 'DD47'), v_club_id, true, 'fixed', 30, 60)
  RETURNING id INTO v_pc_julio;

  -- JUGADOR 8: Manuel Lopez (DD53)
  INSERT INTO public.players (player_code, full_name, nickname, email, status, is_agent)
  VALUES ('DD53', 'Manuel Lopez', 'Bryan155', 'manuel.lopez@test.com', 'active', false);

  INSERT INTO public.player_clubs (player_id, club_id, custom_diamond_agreement, diamond_agreement_type, diamond_fixed_percentage, agent_commission_percentage)
  VALUES ((SELECT id FROM public.players WHERE player_code = 'DD53'), v_club_id, true, 'fixed', 30, 60)
  RETURNING id INTO v_pc_manuel;

  -- JUGADOR 9: Cristian Hoyos (DD17)
  INSERT INTO public.players (player_code, full_name, nickname, email, status, is_agent)
  VALUES ('DD17', 'Cristian Hoyos', 'Timm01', 'cristian.hoyos@test.com', 'active', false);

  INSERT INTO public.player_clubs (player_id, club_id, custom_diamond_agreement, diamond_agreement_type, diamond_fixed_percentage, agent_commission_percentage)
  VALUES ((SELECT id FROM public.players WHERE player_code = 'DD17'), v_club_id, true, 'fixed', 30, 60)
  RETURNING id INTO v_pc_cristian;

  -- CREAR REPORTES PARA LA SEMANA 27 OCT - 02 NOV 2025
  -- Igna (DD1): PNL=-1534.71, Rake=3302.31, Hands estimadas (rake/0.5 aprox)
  INSERT INTO public.weekly_player_reports (player_club_id, week_start, week_end, pnl, rake, hands)
  VALUES (v_pc_igna, '2025-10-27', '2025-11-02', -1534.71, 3302.31, 6600);

  -- Hardcoriano (DD26): PNL=-5300.84, Rake=13639.14
  INSERT INTO public.weekly_player_reports (player_club_id, week_start, week_end, pnl, rake, hands)
  VALUES (v_pc_hardcoriano, '2025-10-27', '2025-11-02', -5300.84, 13639.14, 27000);

  -- Alex Penco (DD27): PNL=-6252.86, Rake=7222.96
  INSERT INTO public.weekly_player_reports (player_club_id, week_start, week_end, pnl, rake, hands)
  VALUES (v_pc_alex, '2025-10-27', '2025-11-02', -6252.86, 7222.96, 14400);

  -- Jon Tomé (DD28): PNL=-24.54, Rake=6.13
  INSERT INTO public.weekly_player_reports (player_club_id, week_start, week_end, pnl, rake, hands)
  VALUES (v_pc_jon, '2025-10-27', '2025-11-02', -24.54, 6.13, 12);

  -- Alex SirBaal (DD43): PNL=6.08, Rake=0.64
  INSERT INTO public.weekly_player_reports (player_club_id, week_start, week_end, pnl, rake, hands)
  VALUES (v_pc_alex_sirbaal, '2025-10-27', '2025-11-02', 6.08, 0.64, 1);

  -- Flip Esteve (DD32): PNL=-133.41, Rake=136.93
  INSERT INTO public.weekly_player_reports (player_club_id, week_start, week_end, pnl, rake, hands)
  VALUES (v_pc_flip, '2025-10-27', '2025-11-02', -133.41, 136.93, 274);

  -- Julio Ruiz (DD47): PNL=-1928.58, Rake=439.97
  INSERT INTO public.weekly_player_reports (player_club_id, week_start, week_end, pnl, rake, hands)
  VALUES (v_pc_julio, '2025-10-27', '2025-11-02', -1928.58, 439.97, 880);

  -- Manuel Lopez (DD53): PNL=-110.87, Rake=98.04
  INSERT INTO public.weekly_player_reports (player_club_id, week_start, week_end, pnl, rake, hands)
  VALUES (v_pc_manuel, '2025-10-27', '2025-11-02', -110.87, 98.04, 196);

  -- Cristian Hoyos (DD17): PNL=-39.10, Rake=92.13
  INSERT INTO public.weekly_player_reports (player_club_id, week_start, week_end, pnl, rake, hands)
  VALUES (v_pc_cristian, '2025-10-27', '2025-11-02', -39.10, 92.13, 184);

  RAISE NOTICE 'Jugadores y reportes creados correctamente para CLUBGG';
END $$;
