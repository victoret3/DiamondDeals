-- Llenar la tabla Standard Diamond-Club 2024 con las reglas
DO $$
DECLARE
  v_template_id UUID;
BEGIN
  -- Obtener el ID del template
  SELECT id INTO v_template_id
  FROM public.diamond_club_agreement_templates
  WHERE name = 'Standard Diamond-Club 2024'
  LIMIT 1;

  -- Borrar reglas existentes si las hay
  DELETE FROM public.diamond_club_agreement_rules WHERE template_id = v_template_id;

  -- Insertar todas las reglas (21 ratios × 3 rangos de rake = 63 reglas)

  -- Ratio -1.0
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, rake_min, rake_max, diamond_percentage, priority)
  VALUES
    (v_template_id, -1.0, -0.9, 0, 4999, 70.0, 1),
    (v_template_id, -1.0, -0.9, 5000, 9999, 75.0, 1),
    (v_template_id, -1.0, -0.9, 10000, NULL, 80.0, 1);

  -- Ratio -0.9
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, rake_min, rake_max, diamond_percentage, priority)
  VALUES
    (v_template_id, -0.9, -0.8, 0, 4999, 68.0, 1),
    (v_template_id, -0.9, -0.8, 5000, 9999, 73.0, 1),
    (v_template_id, -0.9, -0.8, 10000, NULL, 78.0, 1);

  -- Ratio -0.8
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, rake_min, rake_max, diamond_percentage, priority)
  VALUES
    (v_template_id, -0.8, -0.7, 0, 4999, 66.0, 1),
    (v_template_id, -0.8, -0.7, 5000, 9999, 71.0, 1),
    (v_template_id, -0.8, -0.7, 10000, NULL, 76.0, 1);

  -- Ratio -0.7
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, rake_min, rake_max, diamond_percentage, priority)
  VALUES
    (v_template_id, -0.7, -0.6, 0, 4999, 64.0, 1),
    (v_template_id, -0.7, -0.6, 5000, 9999, 69.0, 1),
    (v_template_id, -0.7, -0.6, 10000, NULL, 74.0, 1);

  -- Ratio -0.6
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, rake_min, rake_max, diamond_percentage, priority)
  VALUES
    (v_template_id, -0.6, -0.5, 0, 4999, 62.0, 1),
    (v_template_id, -0.6, -0.5, 5000, 9999, 67.0, 1),
    (v_template_id, -0.6, -0.5, 10000, NULL, 72.0, 1);

  -- Ratio -0.5
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, rake_min, rake_max, diamond_percentage, priority)
  VALUES
    (v_template_id, -0.5, -0.4, 0, 4999, 60.0, 1),
    (v_template_id, -0.5, -0.4, 5000, 9999, 65.0, 1),
    (v_template_id, -0.5, -0.4, 10000, NULL, 70.0, 1);

  -- Ratio -0.4
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, rake_min, rake_max, diamond_percentage, priority)
  VALUES
    (v_template_id, -0.4, -0.3, 0, 4999, 58.0, 1),
    (v_template_id, -0.4, -0.3, 5000, 9999, 63.0, 1),
    (v_template_id, -0.4, -0.3, 10000, NULL, 68.0, 1);

  -- Ratio -0.3
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, rake_min, rake_max, diamond_percentage, priority)
  VALUES
    (v_template_id, -0.3, -0.2, 0, 4999, 56.0, 1),
    (v_template_id, -0.3, -0.2, 5000, 9999, 61.0, 1),
    (v_template_id, -0.3, -0.2, 10000, NULL, 66.0, 1);

  -- Ratio -0.2
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, rake_min, rake_max, diamond_percentage, priority)
  VALUES
    (v_template_id, -0.2, -0.1, 0, 4999, 54.0, 1),
    (v_template_id, -0.2, -0.1, 5000, 9999, 59.0, 1),
    (v_template_id, -0.2, -0.1, 10000, NULL, 64.0, 1);

  -- Ratio -0.1
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, rake_min, rake_max, diamond_percentage, priority)
  VALUES
    (v_template_id, -0.1, 0.0, 0, 4999, 52.0, 1),
    (v_template_id, -0.1, 0.0, 5000, 9999, 57.0, 1),
    (v_template_id, -0.1, 0.0, 10000, NULL, 62.0, 1);

  -- Ratio 0.0
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, rake_min, rake_max, diamond_percentage, priority)
  VALUES
    (v_template_id, 0.0, 0.1, 0, 4999, 50.0, 1),
    (v_template_id, 0.0, 0.1, 5000, 9999, 55.0, 1),
    (v_template_id, 0.0, 0.1, 10000, NULL, 60.0, 1);

  -- Ratio 0.1
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, rake_min, rake_max, diamond_percentage, priority)
  VALUES
    (v_template_id, 0.1, 0.2, 0, 4999, 48.0, 1),
    (v_template_id, 0.1, 0.2, 5000, 9999, 53.0, 1),
    (v_template_id, 0.1, 0.2, 10000, NULL, 58.0, 1);

  -- Ratio 0.2
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, rake_min, rake_max, diamond_percentage, priority)
  VALUES
    (v_template_id, 0.2, 0.3, 0, 4999, 46.0, 1),
    (v_template_id, 0.2, 0.3, 5000, 9999, 51.0, 1),
    (v_template_id, 0.2, 0.3, 10000, NULL, 56.0, 1);

  -- Ratio 0.3
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, rake_min, rake_max, diamond_percentage, priority)
  VALUES
    (v_template_id, 0.3, 0.4, 0, 4999, 44.0, 1),
    (v_template_id, 0.3, 0.4, 5000, 9999, 49.0, 1),
    (v_template_id, 0.3, 0.4, 10000, NULL, 54.0, 1);

  -- Ratio 0.4
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, rake_min, rake_max, diamond_percentage, priority)
  VALUES
    (v_template_id, 0.4, 0.5, 0, 4999, 42.0, 1),
    (v_template_id, 0.4, 0.5, 5000, 9999, 47.0, 1),
    (v_template_id, 0.4, 0.5, 10000, NULL, 52.0, 1);

  -- Ratio 0.5
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, rake_min, rake_max, diamond_percentage, priority)
  VALUES
    (v_template_id, 0.5, 0.6, 0, 4999, 40.0, 1),
    (v_template_id, 0.5, 0.6, 5000, 9999, 45.0, 1),
    (v_template_id, 0.5, 0.6, 10000, NULL, 50.0, 1);

  -- Ratio 0.6
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, rake_min, rake_max, diamond_percentage, priority)
  VALUES
    (v_template_id, 0.6, 0.7, 0, 4999, 38.0, 1),
    (v_template_id, 0.6, 0.7, 5000, 9999, 43.0, 1),
    (v_template_id, 0.6, 0.7, 10000, NULL, 48.0, 1);

  -- Ratio 0.7
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, rake_min, rake_max, diamond_percentage, priority)
  VALUES
    (v_template_id, 0.7, 0.8, 0, 4999, 36.0, 1),
    (v_template_id, 0.7, 0.8, 5000, 9999, 41.0, 1),
    (v_template_id, 0.7, 0.8, 10000, NULL, 46.0, 1);

  -- Ratio 0.8
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, rake_min, rake_max, diamond_percentage, priority)
  VALUES
    (v_template_id, 0.8, 0.9, 0, 4999, 34.0, 1),
    (v_template_id, 0.8, 0.9, 5000, 9999, 39.0, 1),
    (v_template_id, 0.8, 0.9, 10000, NULL, 44.0, 1);

  -- Ratio 0.9
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, rake_min, rake_max, diamond_percentage, priority)
  VALUES
    (v_template_id, 0.9, 1.0, 0, 4999, 32.0, 1),
    (v_template_id, 0.9, 1.0, 5000, 9999, 37.0, 1),
    (v_template_id, 0.9, 1.0, 10000, NULL, 42.0, 1);

  -- Ratio 1.0 o mayor
  INSERT INTO public.diamond_club_agreement_rules (template_id, ratio_min, ratio_max, rake_min, rake_max, diamond_percentage, priority)
  VALUES
    (v_template_id, 1.0, NULL, 0, 4999, 30.0, 1),
    (v_template_id, 1.0, NULL, 5000, 9999, 35.0, 1),
    (v_template_id, 1.0, NULL, 10000, NULL, 40.0, 1);

  RAISE NOTICE 'Tabla Diamond-Club llenada con 63 reglas';
END $$;
