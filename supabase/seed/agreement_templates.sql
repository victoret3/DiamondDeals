-- =====================================================
-- TEMPLATE DE ACUERDO DIAMOND ↔ CLUB (Standard 2024)
-- =====================================================

INSERT INTO public.diamond_club_agreement_templates (name, description, is_active)
VALUES (
  'Standard Diamond-Club 2024',
  'Template estándar de acuerdo Diamond↔Club basado en ratio PNL/Rake y manos totales del club',
  true
);

-- Obtener el ID del template recién creado
DO $$
DECLARE
  v_template_id UUID;
BEGIN
  SELECT id INTO v_template_id
  FROM public.diamond_club_agreement_templates
  WHERE name = 'Standard Diamond-Club 2024'
  LIMIT 1;

  -- Insertar todas las reglas (basado en la primera imagen)
  -- Columnas: Up to 4,999 | 5,000-9,999 | Over 10,000

  -- Ratio -1.0
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, hands_min, hands_max, diamond_percentage, priority) VALUES
  (v_template_id, -999, -1.0, 0, 4999, 70.0, 1),
  (v_template_id, -999, -1.0, 5000, 9999, 75.0, 2),
  (v_template_id, -999, -1.0, 10000, NULL, 80.0, 3);

  -- Ratio -0.9
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, hands_min, hands_max, diamond_percentage, priority) VALUES
  (v_template_id, -1.0, -0.9, 0, 4999, 68.0, 4),
  (v_template_id, -1.0, -0.9, 5000, 9999, 73.0, 5),
  (v_template_id, -1.0, -0.9, 10000, NULL, 78.0, 6);

  -- Ratio -0.8
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, hands_min, hands_max, diamond_percentage, priority) VALUES
  (v_template_id, -0.9, -0.8, 0, 4999, 66.0, 7),
  (v_template_id, -0.9, -0.8, 5000, 9999, 71.0, 8),
  (v_template_id, -0.9, -0.8, 10000, NULL, 76.0, 9);

  -- Ratio -0.7
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, hands_min, hands_max, diamond_percentage, priority) VALUES
  (v_template_id, -0.8, -0.7, 0, 4999, 64.0, 10),
  (v_template_id, -0.8, -0.7, 5000, 9999, 69.0, 11),
  (v_template_id, -0.8, -0.7, 10000, NULL, 74.0, 12);

  -- Ratio -0.6
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, hands_min, hands_max, diamond_percentage, priority) VALUES
  (v_template_id, -0.7, -0.6, 0, 4999, 62.0, 13),
  (v_template_id, -0.7, -0.6, 5000, 9999, 67.0, 14),
  (v_template_id, -0.7, -0.6, 10000, NULL, 72.0, 15);

  -- Ratio -0.5
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, hands_min, hands_max, diamond_percentage, priority) VALUES
  (v_template_id, -0.6, -0.5, 0, 4999, 60.0, 16),
  (v_template_id, -0.6, -0.5, 5000, 9999, 65.0, 17),
  (v_template_id, -0.6, -0.5, 10000, NULL, 70.0, 18);

  -- Ratio -0.4
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, hands_min, hands_max, diamond_percentage, priority) VALUES
  (v_template_id, -0.5, -0.4, 0, 4999, 58.0, 19),
  (v_template_id, -0.5, -0.4, 5000, 9999, 63.0, 20),
  (v_template_id, -0.5, -0.4, 10000, NULL, 68.0, 21);

  -- Ratio -0.3
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, hands_min, hands_max, diamond_percentage, priority) VALUES
  (v_template_id, -0.4, -0.3, 0, 4999, 56.0, 22),
  (v_template_id, -0.4, -0.3, 5000, 9999, 61.0, 23),
  (v_template_id, -0.4, -0.3, 10000, NULL, 66.0, 24);

  -- Ratio -0.2
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, hands_min, hands_max, diamond_percentage, priority) VALUES
  (v_template_id, -0.3, -0.2, 0, 4999, 54.0, 25),
  (v_template_id, -0.3, -0.2, 5000, 9999, 59.0, 26),
  (v_template_id, -0.3, -0.2, 10000, NULL, 64.0, 27);

  -- Ratio -0.1
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, hands_min, hands_max, diamond_percentage, priority) VALUES
  (v_template_id, -0.2, -0.1, 0, 4999, 52.0, 28),
  (v_template_id, -0.2, -0.1, 5000, 9999, 57.0, 29),
  (v_template_id, -0.2, -0.1, 10000, NULL, 62.0, 30);

  -- Ratio 0.0
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, hands_min, hands_max, diamond_percentage, priority) VALUES
  (v_template_id, -0.1, 0.0, 0, 4999, 50.0, 31),
  (v_template_id, -0.1, 0.0, 5000, 9999, 55.0, 32),
  (v_template_id, -0.1, 0.0, 10000, NULL, 60.0, 33);

  -- Ratio 0.1
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, hands_min, hands_max, diamond_percentage, priority) VALUES
  (v_template_id, 0.0, 0.1, 0, 4999, 48.0, 34),
  (v_template_id, 0.0, 0.1, 5000, 9999, 53.0, 35),
  (v_template_id, 0.0, 0.1, 10000, NULL, 58.0, 36);

  -- Ratio 0.2
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, hands_min, hands_max, diamond_percentage, priority) VALUES
  (v_template_id, 0.1, 0.2, 0, 4999, 46.0, 37),
  (v_template_id, 0.1, 0.2, 5000, 9999, 51.0, 38),
  (v_template_id, 0.1, 0.2, 10000, NULL, 56.0, 39);

  -- Ratio 0.3
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, hands_min, hands_max, diamond_percentage, priority) VALUES
  (v_template_id, 0.2, 0.3, 0, 4999, 44.0, 40),
  (v_template_id, 0.2, 0.3, 5000, 9999, 49.0, 41),
  (v_template_id, 0.2, 0.3, 10000, NULL, 54.0, 42);

  -- Ratio 0.4
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, hands_min, hands_max, diamond_percentage, priority) VALUES
  (v_template_id, 0.3, 0.4, 0, 4999, 42.0, 43),
  (v_template_id, 0.3, 0.4, 5000, 9999, 47.0, 44),
  (v_template_id, 0.3, 0.4, 10000, NULL, 52.0, 45);

  -- Ratio 0.5
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, hands_min, hands_max, diamond_percentage, priority) VALUES
  (v_template_id, 0.4, 0.5, 0, 4999, 40.0, 46),
  (v_template_id, 0.4, 0.5, 5000, 9999, 45.0, 47),
  (v_template_id, 0.4, 0.5, 10000, NULL, 50.0, 48);

  -- Ratio 0.6
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, hands_min, hands_max, diamond_percentage, priority) VALUES
  (v_template_id, 0.5, 0.6, 0, 4999, 38.0, 49),
  (v_template_id, 0.5, 0.6, 5000, 9999, 43.0, 50),
  (v_template_id, 0.5, 0.6, 10000, NULL, 48.0, 51);

  -- Ratio 0.7
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, hands_min, hands_max, diamond_percentage, priority) VALUES
  (v_template_id, 0.6, 0.7, 0, 4999, 36.0, 52),
  (v_template_id, 0.6, 0.7, 5000, 9999, 41.0, 53),
  (v_template_id, 0.6, 0.7, 10000, NULL, 46.0, 54);

  -- Ratio 0.8
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, hands_min, hands_max, diamond_percentage, priority) VALUES
  (v_template_id, 0.7, 0.8, 0, 4999, 34.0, 55),
  (v_template_id, 0.7, 0.8, 5000, 9999, 39.0, 56),
  (v_template_id, 0.7, 0.8, 10000, NULL, 44.0, 57);

  -- Ratio 0.9
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, hands_min, hands_max, diamond_percentage, priority) VALUES
  (v_template_id, 0.8, 0.9, 0, 4999, 32.0, 58),
  (v_template_id, 0.8, 0.9, 5000, 9999, 37.0, 59),
  (v_template_id, 0.8, 0.9, 10000, NULL, 42.0, 60);

  -- Ratio 1.0
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, hands_min, hands_max, diamond_percentage, priority) VALUES
  (v_template_id, 0.9, 999, 0, 4999, 30.0, 61),
  (v_template_id, 0.9, 999, 5000, 9999, 35.0, 62),
  (v_template_id, 0.9, 999, 10000, NULL, 40.0, 63);
END $$;

-- =====================================================
-- TEMPLATE DE ACUERDO DIAMOND ↔ JUGADOR (Standard 2024)
-- =====================================================

INSERT INTO public.diamond_player_agreement_templates (name, description, is_active)
VALUES (
  'Standard Diamond-Player 2024',
  'Template estándar de acuerdo Diamond↔Jugador basado en ratio PNL/Rake y manos del jugador',
  true
);

-- Obtener el ID del template recién creado
DO $$
DECLARE
  v_template_id UUID;
BEGIN
  SELECT id INTO v_template_id
  FROM public.diamond_player_agreement_templates
  WHERE name = 'Standard Diamond-Player 2024'
  LIMIT 1;

  -- Insertar todas las reglas (basado en la segunda imagen)
  -- Columnas: 0 a 2.5k | 2.5k a 7k | 7k+

  -- Ratio -0.5 o menor
  INSERT INTO public.diamond_player_agreement_rules (template_id, ratio_min, ratio_max, hands_min, hands_max, player_percentage, priority) VALUES
  (v_template_id, -999, -0.5, 0, 2500, 20.0, 1),
  (v_template_id, -999, -0.5, 2501, 7000, 25.0, 2),
  (v_template_id, -999, -0.5, 7001, NULL, 30.0, 3);

  -- Ratio -0.5 a 0
  INSERT INTO public.diamond_player_agreement_rules (template_id, ratio_min, ratio_max, hands_min, hands_max, player_percentage, priority) VALUES
  (v_template_id, -0.5, 0.0, 0, 2500, 15.0, 4),
  (v_template_id, -0.5, 0.0, 2501, 7000, 20.0, 5),
  (v_template_id, -0.5, 0.0, 7001, NULL, 25.0, 6);

  -- Ratio 0 a 0.25
  INSERT INTO public.diamond_player_agreement_rules (template_id, ratio_min, ratio_max, hands_min, hands_max, player_percentage, priority) VALUES
  (v_template_id, 0.0, 0.25, 0, 2500, 10.0, 7),
  (v_template_id, 0.0, 0.25, 2501, 7000, 15.0, 8),
  (v_template_id, 0.0, 0.25, 7001, NULL, 20.0, 9);

  -- Ratio 0.25 a 0.50
  INSERT INTO public.diamond_player_agreement_rules (template_id, ratio_min, ratio_max, hands_min, hands_max, player_percentage, priority) VALUES
  (v_template_id, 0.25, 0.50, 0, 2500, 5.0, 10),
  (v_template_id, 0.25, 0.50, 2501, 7000, 10.0, 11),
  (v_template_id, 0.25, 0.50, 7001, NULL, 15.0, 12);

  -- Ratio 0.50 o mayor
  INSERT INTO public.diamond_player_agreement_rules (template_id, ratio_min, ratio_max, hands_min, hands_max, player_percentage, priority) VALUES
  (v_template_id, 0.50, 999, 0, 2500, 0.0, 13),
  (v_template_id, 0.50, 999, 2501, 7000, 5.0, 14),
  (v_template_id, 0.50, 999, 7001, NULL, 10.0, 15);
END $$;
