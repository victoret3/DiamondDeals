-- =====================================================
-- DATOS FAKE PARA TESTING
-- =====================================================

-- IMPORTANTE: Primero debes ejecutar los scripts:
-- 1. seed.sql (clubs base)
-- 2. agreement_templates.sql (templates de acuerdos)

-- =====================================================
-- LIMPIAR DATOS FAKE EXISTENTES
-- =====================================================

DO $$
BEGIN
  -- Eliminar reportes semanales de jugadores fake
  -- (códigos numéricos XXXX-XXXX o antiguos DD-XXXX-XXXX)
  DELETE FROM public.weekly_player_reports
  WHERE player_club_id IN (
    SELECT pc.id FROM public.player_clubs pc
    JOIN public.players p ON pc.player_id = p.id
    WHERE p.player_code ~ '^[0-9]{4}-[0-9]{4}$' OR p.player_code LIKE 'DD-%'
  );

  -- Eliminar condiciones de player_clubs fake
  DELETE FROM public.player_conditions
  WHERE player_club_id IN (
    SELECT pc.id FROM public.player_clubs pc
    JOIN public.players p ON pc.player_id = p.id
    WHERE p.player_code ~ '^[0-9]{4}-[0-9]{4}$' OR p.player_code LIKE 'DD-%'
  );

  -- Eliminar player_clubs de jugadores fake
  DELETE FROM public.player_clubs
  WHERE player_id IN (
    SELECT id FROM public.players
    WHERE player_code ~ '^[0-9]{4}-[0-9]{4}$' OR player_code LIKE 'DD-%'
  );

  -- Eliminar jugadores fake
  DELETE FROM public.players
  WHERE player_code ~ '^[0-9]{4}-[0-9]{4}$' OR player_code LIKE 'DD-%';

  RAISE NOTICE 'Datos fake eliminados correctamente';
END $$;

-- =====================================================
-- ACTUALIZAR CLUBS EXISTENTES CON ACUERDOS
-- =====================================================

DO $$
DECLARE
  v_club_template_id UUID;
  v_player_template_id UUID;
BEGIN
  -- Obtener IDs de los templates
  SELECT id INTO v_club_template_id
  FROM public.diamond_club_agreement_templates
  WHERE name = 'Standard Diamond-Club 2024'
  LIMIT 1;

  SELECT id INTO v_player_template_id
  FROM public.diamond_player_agreement_templates
  WHERE name = 'Standard Diamond-Player 2024'
  LIMIT 1;

  -- Actualizar GGPoker con acuerdos dinámicos
  UPDATE public.clubs
  SET
    diamond_club_agreement_type = 'dynamic',
    diamond_club_template_id = v_club_template_id,
    diamond_player_agreement_type = 'dynamic',
    diamond_player_template_id = v_player_template_id
  WHERE code = 'GGPOKER';

  -- Actualizar PokerStars con acuerdo fijo club, dinámico jugador
  UPDATE public.clubs
  SET
    diamond_club_agreement_type = 'fixed',
    diamond_club_fixed_percentage = 55.0,
    diamond_player_agreement_type = 'dynamic',
    diamond_player_template_id = v_player_template_id
  WHERE code = 'POKERSTARS';

  -- Actualizar 888poker con ambos fijos
  UPDATE public.clubs
  SET
    diamond_club_agreement_type = 'fixed',
    diamond_club_fixed_percentage = 50.0,
    diamond_player_agreement_type = 'fixed',
    diamond_player_fixed_percentage = 25.0
  WHERE code = '888POKER';
END $$;

-- =====================================================
-- JUGADORES FAKE
-- =====================================================

-- Jugador 1: Carlos (Normal, sin agente)
INSERT INTO public.players (player_code, player_id, full_name, nickname, phone, email, status, token_used, is_agent, referred_by_agent_id)
VALUES ('1001-2345', '1111-1111', 'Carlos Martínez', 'CarlosPro', '+34611222333', 'carlos@test.com', 'active', true, false, NULL);

-- Jugador 2: Ana (Agente)
INSERT INTO public.players (player_code, player_id, full_name, nickname, phone, email, status, token_used, is_agent, referred_by_agent_id)
VALUES ('2002-3456', '2222-2222', 'Ana García', 'AnaPoker', '+34622333444', 'ana@test.com', 'active', true, true, NULL);

-- Jugador 3: Miguel (Referido por Ana)
INSERT INTO public.players (player_code, player_id, full_name, nickname, phone, email, status, token_used, is_agent, referred_by_agent_id)
SELECT '3003-4567', '3333-3333', 'Miguel López', 'MiguelShark', '+34633444555', 'miguel@test.com', 'active', true, false, id
FROM public.players WHERE nickname = 'AnaPoker';

-- Jugador 4: Laura (Referida por Ana)
INSERT INTO public.players (player_code, player_id, full_name, nickname, phone, email, status, token_used, is_agent, referred_by_agent_id)
SELECT '4004-5678', '4444-4444', 'Laura Sánchez', 'LauraPower', '+34644555666', 'laura@test.com', 'active', true, false, id
FROM public.players WHERE nickname = 'AnaPoker';

-- Jugador 5: Pedro (Agente)
INSERT INTO public.players (player_code, player_id, full_name, nickname, phone, email, status, token_used, is_agent, referred_by_agent_id)
VALUES ('5005-6789', '5555-5555', 'Pedro Rodríguez', 'PedroAce', '+34655666777', 'pedro@test.com', 'active', true, true, NULL);

-- Jugador 6: Sofia (Referida por Pedro)
INSERT INTO public.players (player_code, player_id, full_name, nickname, phone, email, status, token_used, is_agent, referred_by_agent_id)
SELECT '6006-7890', '6666-6666', 'Sofía Martín', 'SofiaQueen', '+34666777888', 'sofia@test.com', 'active', true, false, id
FROM public.players WHERE nickname = 'PedroAce';

-- Jugador 7: David (Normal, sin agente)
INSERT INTO public.players (player_code, player_id, full_name, nickname, phone, email, status, token_used, is_agent, referred_by_agent_id)
VALUES ('7007-8901', '7777-7777', 'David Fernández', 'DavidKing', '+34677888999', 'david@test.com', 'active', true, false, NULL);

-- Jugador 8: Elena (Referida por Ana)
INSERT INTO public.players (player_code, player_id, full_name, nickname, phone, email, status, token_used, is_agent, referred_by_agent_id)
SELECT '8008-9012', '8888-8888', 'Elena Jiménez', 'ElenaChip', '+34688999000', 'elena@test.com', 'active', true, false, id
FROM public.players WHERE nickname = 'AnaPoker';

-- =====================================================
-- ASIGNAR JUGADORES A CLUBS
-- =====================================================

DO $$
DECLARE
  v_ggpoker_id UUID;
  v_pokerstars_id UUID;
  v_888poker_id UUID;
  v_condition_template_id UUID;
  v_player_template_id UUID;
BEGIN
  -- Obtener IDs de clubs
  SELECT id INTO v_ggpoker_id FROM public.clubs WHERE code = 'GGPOKER';
  SELECT id INTO v_pokerstars_id FROM public.clubs WHERE code = 'POKERSTARS';
  SELECT id INTO v_888poker_id FROM public.clubs WHERE code = '888POKER';

  SELECT id INTO v_condition_template_id
  FROM public.condition_templates
  WHERE name = 'Condiciones Standard 2024';

  -- Obtener ID del template de jugador para acuerdos personalizados
  SELECT id INTO v_player_template_id
  FROM public.diamond_player_agreement_templates
  WHERE name = 'Standard Diamond-Player 2024'
  LIMIT 1;

  -- Carlos en GGPoker y PokerStars
  INSERT INTO public.player_clubs (player_id, club_id, username_in_club, agent_commission_percentage)
  SELECT id, v_ggpoker_id, 'carlos_gg', 0
  FROM public.players WHERE nickname = 'CarlosPro';

  INSERT INTO public.player_clubs (player_id, club_id, username_in_club, agent_commission_percentage)
  SELECT id, v_pokerstars_id, 'carlos_ps', 0
  FROM public.players WHERE nickname = 'CarlosPro';

  -- Ana (agente) en GGPoker y 888poker
  INSERT INTO public.player_clubs (player_id, club_id, username_in_club, agent_commission_percentage)
  SELECT id, v_ggpoker_id, 'ana_gg', 0
  FROM public.players WHERE nickname = 'AnaPoker';

  INSERT INTO public.player_clubs (player_id, club_id, username_in_club, agent_commission_percentage)
  SELECT id, v_888poker_id, 'ana_888', 0
  FROM public.players WHERE nickname = 'AnaPoker';

  -- Miguel (referido de Ana) en GGPoker con 30% comisión
  INSERT INTO public.player_clubs (player_id, club_id, username_in_club, agent_commission_percentage)
  SELECT id, v_ggpoker_id, 'miguel_gg', 30.0
  FROM public.players WHERE nickname = 'MiguelShark';

  -- Laura (referida de Ana) en PokerStars con 25% comisión
  INSERT INTO public.player_clubs (player_id, club_id, username_in_club, agent_commission_percentage)
  SELECT id, v_pokerstars_id, 'laura_ps', 25.0
  FROM public.players WHERE nickname = 'LauraPower';

  -- Pedro (agente) en PokerStars
  INSERT INTO public.player_clubs (player_id, club_id, username_in_club, agent_commission_percentage)
  SELECT id, v_pokerstars_id, 'pedro_ps', 0
  FROM public.players WHERE nickname = 'PedroAce';

  -- Sofia (referida de Pedro) en GGPoker y PokerStars con 35% comisión
  INSERT INTO public.player_clubs (player_id, club_id, username_in_club, agent_commission_percentage)
  SELECT id, v_ggpoker_id, 'sofia_gg', 35.0
  FROM public.players WHERE nickname = 'SofiaQueen';

  INSERT INTO public.player_clubs (player_id, club_id, username_in_club, agent_commission_percentage)
  SELECT id, v_pokerstars_id, 'sofia_ps', 35.0
  FROM public.players WHERE nickname = 'SofiaQueen';

  -- David en 888poker
  INSERT INTO public.player_clubs (player_id, club_id, username_in_club, agent_commission_percentage)
  SELECT id, v_888poker_id, 'david_888', 0
  FROM public.players WHERE nickname = 'DavidKing';

  -- Elena (referida de Ana) en GGPoker y 888poker con 28% comisión
  INSERT INTO public.player_clubs (player_id, club_id, username_in_club, agent_commission_percentage)
  SELECT id, v_ggpoker_id, 'elena_gg', 28.0
  FROM public.players WHERE nickname = 'ElenaChip';

  INSERT INTO public.player_clubs (player_id, club_id, username_in_club, agent_commission_percentage)
  SELECT id, v_888poker_id, 'elena_888', 28.0
  FROM public.players WHERE nickname = 'ElenaChip';

  -- Asignar condiciones a cada player_club
  -- (Para este ejemplo usamos la condición dinámica standard para todos)
  INSERT INTO public.player_conditions (player_club_id, condition_type, template_id)
  SELECT id, 'dynamic', v_condition_template_id
  FROM public.player_clubs;

  -- =====================================================
  -- ACUERDOS PERSONALIZADOS PARA ALGUNOS JUGADORES
  -- =====================================================

  -- Carlos en GGPoker: acuerdo personalizado FIJO (40% para él)
  UPDATE public.player_clubs
  SET
    custom_diamond_agreement = true,
    diamond_agreement_type = 'fixed',
    diamond_fixed_percentage = 40.0
  WHERE id IN (
    SELECT pc.id
    FROM public.player_clubs pc
    JOIN public.players p ON pc.player_id = p.id
    JOIN public.clubs c ON pc.club_id = c.id
    WHERE p.nickname = 'CarlosPro' AND c.code = 'GGPOKER'
  );

  -- Miguel en GGPoker: usa acuerdo dinámico personalizado (template player)
  UPDATE public.player_clubs
  SET
    custom_diamond_agreement = true,
    diamond_agreement_type = 'dynamic',
    diamond_template_id = v_player_template_id
  WHERE id IN (
    SELECT pc.id
    FROM public.player_clubs pc
    JOIN public.players p ON pc.player_id = p.id
    JOIN public.clubs c ON pc.club_id = c.id
    WHERE p.nickname = 'MiguelShark' AND c.code = 'GGPOKER'
  );

  -- Laura en PokerStars: acuerdo personalizado FIJO (35% para ella)
  UPDATE public.player_clubs
  SET
    custom_diamond_agreement = true,
    diamond_agreement_type = 'fixed',
    diamond_fixed_percentage = 35.0
  WHERE id IN (
    SELECT pc.id
    FROM public.player_clubs pc
    JOIN public.players p ON pc.player_id = p.id
    JOIN public.clubs c ON pc.club_id = c.id
    WHERE p.nickname = 'LauraPower' AND c.code = 'POKERSTARS'
  );

  -- Los demás jugadores usan el acuerdo por defecto del club
  -- (no tienen custom_diamond_agreement = true, así que heredan del club)
END $$;

-- =====================================================
-- REPORTES SEMANALES FAKE (semana pasada)
-- =====================================================

DO $$
DECLARE
  v_week_start DATE;
  v_week_end DATE;
  v_pc_id UUID;
BEGIN
  -- Calcular semana pasada (lunes a domingo)
  v_week_start := CURRENT_DATE - INTERVAL '1 week' - (EXTRACT(DOW FROM CURRENT_DATE)::integer - 1) * INTERVAL '1 day';
  v_week_end := v_week_start + INTERVAL '6 days';

  -- Carlos en GGPoker: Ganando mucho
  SELECT pc.id INTO v_pc_id
  FROM public.player_clubs pc
  JOIN public.players p ON pc.player_id = p.id
  JOIN public.clubs c ON pc.club_id = c.id
  WHERE p.nickname = 'CarlosPro' AND c.code = 'GGPOKER';

  INSERT INTO public.weekly_player_reports (player_club_id, week_start, week_end, pnl, rake, hands)
  VALUES (v_pc_id, v_week_start, v_week_end, 2500.00, 1800.00, 8500);

  -- Carlos en PokerStars: Perdiendo
  SELECT pc.id INTO v_pc_id
  FROM public.player_clubs pc
  JOIN public.players p ON pc.player_id = p.id
  JOIN public.clubs c ON pc.club_id = c.id
  WHERE p.nickname = 'CarlosPro' AND c.code = 'POKERSTARS';

  INSERT INTO public.weekly_player_reports (player_club_id, week_start, week_end, pnl, rake, hands)
  VALUES (v_pc_id, v_week_start, v_week_end, -800.00, 1200.00, 5200);

  -- Ana (agente) en GGPoker: Perdiendo ligeramente
  SELECT pc.id INTO v_pc_id
  FROM public.player_clubs pc
  JOIN public.players p ON pc.player_id = p.id
  JOIN public.clubs c ON pc.club_id = c.id
  WHERE p.nickname = 'AnaPoker' AND c.code = 'GGPOKER';

  INSERT INTO public.weekly_player_reports (player_club_id, week_start, week_end, pnl, rake, hands)
  VALUES (v_pc_id, v_week_start, v_week_end, -300.00, 900.00, 4200);

  -- Miguel (referido de Ana) en GGPoker: Ganando
  SELECT pc.id INTO v_pc_id
  FROM public.player_clubs pc
  JOIN public.players p ON pc.player_id = p.id
  JOIN public.clubs c ON pc.club_id = c.id
  WHERE p.nickname = 'MiguelShark' AND c.code = 'GGPOKER';

  INSERT INTO public.weekly_player_reports (player_club_id, week_start, week_end, pnl, rake, hands)
  VALUES (v_pc_id, v_week_start, v_week_end, 1200.00, 2000.00, 9800);

  -- Laura (referida de Ana) en PokerStars: Perdiendo mucho
  SELECT pc.id INTO v_pc_id
  FROM public.player_clubs pc
  JOIN public.players p ON pc.player_id = p.id
  JOIN public.clubs c ON pc.club_id = c.id
  WHERE p.nickname = 'LauraPower' AND c.code = 'POKERSTARS';

  INSERT INTO public.weekly_player_reports (player_club_id, week_start, week_end, pnl, rake, hands)
  VALUES (v_pc_id, v_week_start, v_week_end, -1500.00, 1100.00, 6500);

  -- Sofia (referida de Pedro) en GGPoker: Break even
  SELECT pc.id INTO v_pc_id
  FROM public.player_clubs pc
  JOIN public.players p ON pc.player_id = p.id
  JOIN public.clubs c ON pc.club_id = c.id
  WHERE p.nickname = 'SofiaQueen' AND c.code = 'GGPOKER';

  INSERT INTO public.weekly_player_reports (player_club_id, week_start, week_end, pnl, rake, hands)
  VALUES (v_pc_id, v_week_start, v_week_end, 50.00, 800.00, 3200);

  -- Sofia en PokerStars: Ganando
  SELECT pc.id INTO v_pc_id
  FROM public.player_clubs pc
  JOIN public.players p ON pc.player_id = p.id
  JOIN public.clubs c ON pc.club_id = c.id
  WHERE p.nickname = 'SofiaQueen' AND c.code = 'POKERSTARS';

  INSERT INTO public.weekly_player_reports (player_club_id, week_start, week_end, pnl, rake, hands)
  VALUES (v_pc_id, v_week_start, v_week_end, 900.00, 1500.00, 7100);

  -- David en 888poker: Perdiendo
  SELECT pc.id INTO v_pc_id
  FROM public.player_clubs pc
  JOIN public.players p ON pc.player_id = p.id
  JOIN public.clubs c ON pc.club_id = c.id
  WHERE p.nickname = 'DavidKing' AND c.code = '888POKER';

  INSERT INTO public.weekly_player_reports (player_club_id, week_start, week_end, pnl, rake, hands)
  VALUES (v_pc_id, v_week_start, v_week_end, -600.00, 700.00, 2800);

  -- Elena (referida de Ana) en GGPoker: Ganando mucho
  SELECT pc.id INTO v_pc_id
  FROM public.player_clubs pc
  JOIN public.players p ON pc.player_id = p.id
  JOIN public.clubs c ON pc.club_id = c.id
  WHERE p.nickname = 'ElenaChip' AND c.code = 'GGPOKER';

  INSERT INTO public.weekly_player_reports (player_club_id, week_start, week_end, pnl, rake, hands)
  VALUES (v_pc_id, v_week_start, v_week_end, 1800.00, 2200.00, 11000);

  -- Elena en 888poker: Break even
  SELECT pc.id INTO v_pc_id
  FROM public.player_clubs pc
  JOIN public.players p ON pc.player_id = p.id
  JOIN public.clubs c ON pc.club_id = c.id
  WHERE p.nickname = 'ElenaChip' AND c.code = '888POKER';

  INSERT INTO public.weekly_player_reports (player_club_id, week_start, week_end, pnl, rake, hands)
  VALUES (v_pc_id, v_week_start, v_week_end, -100.00, 600.00, 2500);
END $$;

-- =====================================================
-- RESUMEN DE DATOS CREADOS
-- =====================================================

-- RESUMEN GENERAL
SELECT '========== RESUMEN GENERAL ==========' as info;
SELECT
  'Jugadores totales' as tipo,
  COUNT(*) as cantidad
FROM public.players WHERE player_code ~ '^[0-9]{4}-[0-9]{4}$'
UNION ALL
SELECT
  'Agentes' as tipo,
  COUNT(*) as cantidad
FROM public.players WHERE is_agent = true AND player_code ~ '^[0-9]{4}-[0-9]{4}$'
UNION ALL
SELECT
  'Jugadores con agente' as tipo,
  COUNT(*) as cantidad
FROM public.players WHERE referred_by_agent_id IS NOT NULL AND player_code ~ '^[0-9]{4}-[0-9]{4}$'
UNION ALL
SELECT
  'Asignaciones jugador-club' as tipo,
  COUNT(*) as cantidad
FROM public.player_clubs pc
JOIN public.players p ON pc.player_id = p.id
WHERE p.player_code ~ '^[0-9]{4}-[0-9]{4}$'
UNION ALL
SELECT
  'Reportes semanales' as tipo,
  COUNT(*) as cantidad
FROM public.weekly_player_reports wpr
JOIN public.player_clubs pc ON wpr.player_club_id = pc.id
JOIN public.players p ON pc.player_id = p.id
WHERE p.player_code ~ '^[0-9]{4}-[0-9]{4}$';

-- JUGADORES Y SUS CLUBS CON ACUERDOS
SELECT '' as separador;
SELECT '========== JUGADORES Y CLUBS (con detalles de acuerdos) ==========' as info;
SELECT
  p.player_code as "Código",
  p.nickname as "Jugador",
  c.code as "Club",
  CASE
    WHEN p.is_agent THEN '👤 AGENTE'
    WHEN p.referred_by_agent_id IS NOT NULL THEN
      '🔗 Ref: ' || (SELECT nickname FROM public.players WHERE id = p.referred_by_agent_id)
    ELSE '✓ Normal'
  END as "Tipo/Referido",
  CASE
    WHEN pc.custom_diamond_agreement THEN
      CASE
        WHEN pc.diamond_agreement_type = 'fixed' THEN '🎯 FIJO ' || pc.diamond_fixed_percentage::text || '%'
        WHEN pc.diamond_agreement_type = 'dynamic' THEN '📊 TABLA PERSONALIZADA'
        ELSE 'Sin definir'
      END
    ELSE
      CASE
        WHEN c.diamond_player_agreement_type = 'fixed' THEN 'Club: Fijo ' || c.diamond_player_fixed_percentage::text || '%'
        WHEN c.diamond_player_agreement_type = 'dynamic' THEN 'Club: Tabla Default'
        ELSE 'Club: Sin definir'
      END
  END as "Acuerdo Rakeback",
  CASE
    WHEN pc.agent_commission_percentage > 0 THEN pc.agent_commission_percentage::text || '%'
    ELSE '-'
  END as "Com. Agente"
FROM public.players p
JOIN public.player_clubs pc ON pc.player_id = p.id
JOIN public.clubs c ON pc.club_id = c.id
WHERE p.player_code ~ '^[0-9]{4}-[0-9]{4}$'
ORDER BY p.player_code, c.code;

-- CONFIGURACIÓN DE CLUBS
SELECT '' as separador;
SELECT '========== CONFIGURACIÓN DE CLUBS ==========' as info;
SELECT
  c.code as "Club",
  CASE
    WHEN c.diamond_club_agreement_type = 'fixed' THEN 'Fijo ' || c.diamond_club_fixed_percentage::text || '%'
    WHEN c.diamond_club_agreement_type = 'dynamic' THEN 'Tabla Dinámica'
    ELSE 'Sin definir'
  END as "Diamond ↔ Club",
  CASE
    WHEN c.diamond_player_agreement_type = 'fixed' THEN 'Fijo ' || c.diamond_player_fixed_percentage::text || '%'
    WHEN c.diamond_player_agreement_type = 'dynamic' THEN 'Tabla Dinámica'
    ELSE 'Sin definir'
  END as "Diamond ↔ Player (default)",
  c.action_percentage::text || '%' as "Action %"
FROM public.clubs c
WHERE c.code IN ('GGPOKER', 'POKERSTARS', '888POKER')
ORDER BY c.code;

-- AGENTES Y SUS REFERIDOS
SELECT '' as separador;
SELECT '========== AGENTES Y SUS REFERIDOS ==========' as info;
SELECT
  agent.player_code as "Código Agente",
  agent.nickname as "Agente",
  COUNT(DISTINCT referred.id) as "Total Referidos",
  STRING_AGG(DISTINCT referred.nickname, ', ') as "Nombres Referidos"
FROM public.players agent
LEFT JOIN public.players referred ON referred.referred_by_agent_id = agent.id
WHERE agent.is_agent = true AND agent.player_code ~ '^[0-9]{4}-[0-9]{4}$'
GROUP BY agent.id, agent.player_code, agent.nickname
ORDER BY agent.player_code;
