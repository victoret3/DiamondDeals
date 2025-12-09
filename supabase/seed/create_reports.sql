-- Crear reportes para los jugadores que ya existen
DO $$
DECLARE
  v_week_start DATE;
  v_week_end DATE;
  v_pc_id UUID;
BEGIN
  v_week_start := DATE_TRUNC('week', CURRENT_DATE - INTERVAL '1 week');
  v_week_end := v_week_start + INTERVAL '6 days';

  -- Carlos en GGPoker
  SELECT pc.id INTO v_pc_id
  FROM public.player_clubs pc
  JOIN public.players p ON pc.player_id = p.id
  JOIN public.clubs c ON pc.club_id = c.id
  WHERE p.nickname = 'CarlosPro' AND c.code = 'GGPOKER';

  INSERT INTO public.weekly_player_reports (player_club_id, week_start, week_end, pnl, rake, hands)
  VALUES (v_pc_id, v_week_start, v_week_end, 2500.00, 1800.00, 8500);

  -- Ana en GGPoker
  SELECT pc.id INTO v_pc_id
  FROM public.player_clubs pc
  JOIN public.players p ON pc.player_id = p.id
  JOIN public.clubs c ON pc.club_id = c.id
  WHERE p.nickname = 'AnaPoker' AND c.code = 'GGPOKER';

  INSERT INTO public.weekly_player_reports (player_club_id, week_start, week_end, pnl, rake, hands)
  VALUES (v_pc_id, v_week_start, v_week_end, -300.00, 900.00, 4200);

  -- Miguel en GGPoker
  SELECT pc.id INTO v_pc_id
  FROM public.player_clubs pc
  JOIN public.players p ON pc.player_id = p.id
  JOIN public.clubs c ON pc.club_id = c.id
  WHERE p.nickname = 'MiguelShark' AND c.code = 'GGPOKER';

  INSERT INTO public.weekly_player_reports (player_club_id, week_start, week_end, pnl, rake, hands)
  VALUES (v_pc_id, v_week_start, v_week_end, 1200.00, 2000.00, 9800);

  -- Laura en PokerStars
  SELECT pc.id INTO v_pc_id
  FROM public.player_clubs pc
  JOIN public.players p ON pc.player_id = p.id
  JOIN public.clubs c ON pc.club_id = c.id
  WHERE p.nickname = 'LauraPower' AND c.code = 'POKERSTARS';

  INSERT INTO public.weekly_player_reports (player_club_id, week_start, week_end, pnl, rake, hands)
  VALUES (v_pc_id, v_week_start, v_week_end, -1500.00, 1100.00, 6500);

  RAISE NOTICE 'Reportes creados correctamente';
END $$;
