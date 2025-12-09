-- Diamont Deals - Seed Data
-- Datos iniciales para desarrollo y testing

-- ==============================================
-- USUARIOS DE PRUEBA (admin y player)
-- ==============================================

-- NOTA: Los usuarios se crean en auth.users mediante Supabase CLI o dashboard
-- Aquí solo insertamos los profiles después de crear los usuarios

-- Usuario Admin (debes crear primero en auth.users)
-- Email: admin@diamontdeals.com
-- Password: Admin123!

-- Usuario Player de prueba (debes crear primero en auth.users)
-- Email: player@test.com
-- Password: Player123!

-- ==============================================
-- CLUBS DE PRUEBA
-- ==============================================

INSERT INTO public.clubs (name, code, base_rakeback_percentage, action_percentage, description, is_active) VALUES
  ('GGPoker', 'GGPOKER', 60.00, 20.00, 'GGPoker - Rakeback base 60% - Action 20%', true),
  ('PokerStars', 'POKERSTARS', 55.00, 25.00, 'PokerStars - Rakeback base 55% - Action 25%', true),
  ('888poker', '888POKER', 50.00, 15.00, '888poker - Rakeback base 50% - Action 15%', true),
  ('PartyPoker', 'PARTYPOKER', 58.00, 22.00, 'PartyPoker - Rakeback base 58% - Action 22%', true);

-- ==============================================
-- TEMPLATE DE CONDICIONES (como en la imagen)
-- ==============================================

INSERT INTO public.condition_templates (name, description, is_active)
VALUES (
  'Condiciones Standard 2024',
  'Template de condiciones dinámicas basado en ratio resultado/rake y manos jugadas',
  true
);

-- Obtener el ID del template recién creado
DO $$
DECLARE
  template_id UUID;
BEGIN
  SELECT id INTO template_id
  FROM public.condition_templates
  WHERE name = 'Condiciones Standard 2024'
  LIMIT 1;

  -- Insertar todas las reglas según la imagen
  INSERT INTO public.condition_rules (
    template_id,
    ratio_min,
    ratio_max,
    hands_min,
    hands_max,
    rakeback_percentage,
    priority
  ) VALUES
    -- Ratio: -0.5 o menor
    (template_id, -999.00, -0.50, 0, 2500, 20.00, 1),
    (template_id, -999.00, -0.50, 2500, 7000, 25.00, 2),
    (template_id, -999.00, -0.50, 7000, NULL, 30.00, 3),

    -- Ratio: -0.5 a 0
    (template_id, -0.50, 0.00, 0, 2500, 15.00, 4),
    (template_id, -0.50, 0.00, 2500, 7000, 20.00, 5),
    (template_id, -0.50, 0.00, 7000, NULL, 25.00, 6),

    -- Ratio: 0 a 0.25
    (template_id, 0.00, 0.25, 0, 2500, 10.00, 7),
    (template_id, 0.00, 0.25, 2500, 7000, 15.00, 8),
    (template_id, 0.00, 0.25, 7000, NULL, 20.00, 9),

    -- Ratio: 0.25 a 0.50
    (template_id, 0.25, 0.50, 0, 2500, 5.00, 10),
    (template_id, 0.25, 0.50, 2500, 7000, 10.00, 11),
    (template_id, 0.25, 0.50, 7000, NULL, 15.00, 12),

    -- Ratio: 0.50 o mayor
    (template_id, 0.50, NULL, 0, 2500, 0.00, 13),
    (template_id, 0.50, NULL, 2500, 7000, 5.00, 14),
    (template_id, 0.50, NULL, 7000, NULL, 10.00, 15);
END $$;

-- ==============================================
-- JUGADORES DE PRUEBA
-- ==============================================
-- NOTA: Los jugadores se crean con player_id y registration_token
-- El admin crea el jugador y obtiene un enlace único para que se registre
-- El jugador elegirá su nickname y email al registrarse

-- Jugador 1: No registrado (pendiente)
-- El registration_token se genera automáticamente por PostgreSQL
INSERT INTO public.players (player_id, full_name, phone, status, token_used)
VALUES (
  '1234-5678',
  'Carlos Martínez',
  '+34612345678',
  'pending',
  false
);

-- Jugador 2: No registrado (pendiente)
INSERT INTO public.players (player_id, full_name, phone, status, token_used)
VALUES (
  '2345-6789',
  'Ana García',
  '+34623456789',
  'pending',
  false
);

-- Jugador 3: No registrado (pendiente)
INSERT INTO public.players (player_id, full_name, phone, status, token_used)
VALUES (
  '3456-7890',
  'Miguel López',
  '+34634567890',
  'pending',
  false
);

-- NOTA: Para vincular un jugador a un usuario:
-- 1. El admin crea el jugador y obtiene un enlace con el registration_token
-- 2. El jugador accede al enlace y completa el registro (nickname, confirma ID, email, password)
-- 3. El sistema vincula el player con el user y marca token_used = true
-- 4. El status cambia a 'active'

-- ==============================================
-- EJEMPLO: Asignar jugador a clubs (después de registro)
-- ==============================================

-- Este bloque solo se ejecuta si hay jugadores activos
-- Descomenta y ajusta los IDs después de crear jugadores reales

/*
DO $$
DECLARE
  player_id UUID;
  ggpoker_id UUID;
  pokerstars_id UUID;
  template_id UUID;
BEGIN
  -- Obtener IDs
  SELECT id INTO player_id FROM public.players WHERE email = 'player@test.com' LIMIT 1;
  SELECT id INTO ggpoker_id FROM public.clubs WHERE code = 'GGPOKER' LIMIT 1;
  SELECT id INTO pokerstars_id FROM public.clubs WHERE code = 'POKERSTARS' LIMIT 1;
  SELECT id INTO template_id FROM public.condition_templates WHERE name = 'Condiciones Standard 2024' LIMIT 1;

  -- Asignar jugador a GGPoker
  INSERT INTO public.player_clubs (player_id, club_id, username_in_club)
  VALUES (player_id, ggpoker_id, 'player_ggpoker');

  -- Asignar jugador a PokerStars
  INSERT INTO public.player_clubs (player_id, club_id, username_in_club)
  VALUES (player_id, pokerstars_id, 'player_pokerstars');

  -- Asignar condiciones dinámicas para GGPoker
  INSERT INTO public.player_conditions (
    player_club_id,
    condition_type,
    template_id
  )
  SELECT pc.id, 'dynamic', template_id
  FROM public.player_clubs pc
  WHERE pc.player_id = player_id AND pc.club_id = ggpoker_id;

  -- Asignar condiciones fijas para PokerStars (30%)
  INSERT INTO public.player_conditions (
    player_club_id,
    condition_type,
    fixed_percentage
  )
  SELECT pc.id, 'fixed', 30.00
  FROM public.player_clubs pc
  WHERE pc.player_id = player_id AND pc.club_id = pokerstars_id;
END $$;
*/

-- ==============================================
-- ESTADÍSTICAS DE PRUEBA
-- ==============================================

/*
-- Ejemplo de estadísticas mensuales
INSERT INTO public.player_stats (
  player_club_id,
  period_start,
  period_end,
  hands_played,
  total_rake,
  total_result,
  ratio,
  club_rakeback_amount,
  diamont_rakeback_amount,
  applied_rakeback_percentage
)
SELECT
  pc.id,
  '2024-10-01'::DATE,
  '2024-10-31'::DATE,
  8500,
  1200.00,
  -450.00,
  -0.375,
  720.00, -- 60% del rake (club)
  144.00, -- 20% del rakeback del club (Diamont)
  20.00
FROM public.player_clubs pc
JOIN public.players p ON pc.player_id = p.id
JOIN public.clubs c ON pc.club_id = c.id
WHERE p.email = 'player@test.com' AND c.code = 'GGPOKER'
LIMIT 1;
*/
