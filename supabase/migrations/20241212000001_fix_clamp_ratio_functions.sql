-- =====================================================
-- FIX: Clampear ratio entre -1 y 1 en funciones de búsqueda
-- =====================================================

-- Actualizar función get_diamond_club_percentage para clampear ratio
CREATE OR REPLACE FUNCTION public.get_diamond_club_percentage(
  p_template_id UUID,
  p_ratio DECIMAL,
  p_rake DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  v_percentage DECIMAL(5,2);
  v_clamped_ratio DECIMAL;
BEGIN
  -- Clampear ratio entre -1 y 1
  v_clamped_ratio := GREATEST(-1, LEAST(1, p_ratio));

  SELECT diamond_percentage INTO v_percentage
  FROM public.diamond_club_agreement_rules
  WHERE template_id = p_template_id
    AND v_clamped_ratio >= ratio_min
    AND (ratio_max IS NULL OR v_clamped_ratio < ratio_max)
    AND p_rake >= rake_min
    AND (rake_max IS NULL OR p_rake <= rake_max)
  ORDER BY priority DESC
  LIMIT 1;

  RETURN COALESCE(v_percentage, 0);
END;
$$ LANGUAGE plpgsql;

-- Actualizar función get_player_percentage para clampear ratio
CREATE OR REPLACE FUNCTION public.get_player_percentage(
  p_template_id UUID,
  p_ratio DECIMAL,
  p_hands INTEGER
) RETURNS DECIMAL AS $$
DECLARE
  v_percentage DECIMAL(5,2);
  v_clamped_ratio DECIMAL;
BEGIN
  -- Clampear ratio entre -1 y 1
  v_clamped_ratio := GREATEST(-1, LEAST(1, p_ratio));

  SELECT player_percentage INTO v_percentage
  FROM public.diamond_player_agreement_rules
  WHERE template_id = p_template_id
    AND v_clamped_ratio >= ratio_min
    AND (ratio_max IS NULL OR v_clamped_ratio < ratio_max)
    AND p_hands >= hands_min
    AND (hands_max IS NULL OR p_hands <= hands_max)
  ORDER BY priority DESC
  LIMIT 1;

  RETURN COALESCE(v_percentage, 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.get_diamond_club_percentage IS 'Busca el porcentaje Diamond-Club en las reglas dinámicas. Clampea el ratio entre -1 y 1.';
COMMENT ON FUNCTION public.get_player_percentage IS 'Busca el porcentaje Diamond-Jugador en las reglas dinámicas. Clampea el ratio entre -1 y 1.';
