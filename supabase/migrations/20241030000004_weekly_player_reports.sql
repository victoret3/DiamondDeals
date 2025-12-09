-- =====================================================
-- REPORTES SEMANALES POR JUGADOR
-- =====================================================

CREATE TABLE public.weekly_player_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_club_id UUID NOT NULL REFERENCES public.player_clubs(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,

  -- ===== DATOS INGRESADOS POR EL ADMIN =====
  pnl DECIMAL(12,2) NOT NULL,
  rake DECIMAL(12,2) NOT NULL CHECK (rake >= 0),
  hands INTEGER NOT NULL CHECK (hands >= 0),

  -- ===== DATOS CALCULADOS AUTOMÁTICAMENTE =====
  -- Paso 1: Ratio
  ratio DECIMAL(10,4),

  -- Paso 2: Action (del club)
  action_percentage DECIMAL(5,2) NOT NULL, -- Copiado del club
  action_amount DECIMAL(12,2), -- PNL × action_percentage

  -- Paso 3: Rake Action (lo que queda para repartir)
  rake_action DECIMAL(12,2), -- (1 - action_percentage) × rake

  -- Paso 4: Acuerdo Diamond ↔ Club
  diamond_club_agreement_type VARCHAR(20),
  diamond_club_percentage DECIMAL(5,2), -- % calculado
  diamond_club_amount DECIMAL(12,2), -- rake_action × diamond_club_percentage

  -- Paso 5: Acuerdo Diamond ↔ Jugador
  diamond_player_agreement_type VARCHAR(20),
  player_percentage DECIMAL(5,2), -- % calculado
  player_amount DECIMAL(12,2), -- rake_action × player_percentage

  -- Paso 6: Profit de Diamond
  diamond_profit DECIMAL(12,2), -- diamond_club_amount - player_amount

  -- Metadatos
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_player_club_week UNIQUE(player_club_id, week_start, week_end),
  CONSTRAINT valid_week_dates CHECK (week_end >= week_start)
);

-- Índices
CREATE INDEX idx_weekly_player_reports_player_club ON public.weekly_player_reports(player_club_id);
CREATE INDEX idx_weekly_player_reports_dates ON public.weekly_player_reports(week_start, week_end);
CREATE INDEX idx_weekly_player_reports_created_at ON public.weekly_player_reports(created_at);

-- =====================================================
-- FUNCIÓN: Buscar porcentaje en acuerdo dinámico Diamond ↔ Club
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_diamond_club_percentage(
  p_template_id UUID,
  p_ratio DECIMAL,
  p_hands INTEGER
) RETURNS DECIMAL AS $$
DECLARE
  v_percentage DECIMAL(5,2);
BEGIN
  SELECT diamond_percentage INTO v_percentage
  FROM public.diamond_club_agreement_rules
  WHERE template_id = p_template_id
    AND p_ratio >= ratio_min
    AND (ratio_max IS NULL OR p_ratio < ratio_max)
    AND p_hands >= hands_min
    AND (hands_max IS NULL OR p_hands <= hands_max)
  ORDER BY priority
  LIMIT 1;

  RETURN COALESCE(v_percentage, 0);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: Buscar porcentaje en acuerdo dinámico Diamond ↔ Jugador
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_player_percentage(
  p_template_id UUID,
  p_ratio DECIMAL,
  p_hands INTEGER
) RETURNS DECIMAL AS $$
DECLARE
  v_percentage DECIMAL(5,2);
BEGIN
  SELECT player_percentage INTO v_percentage
  FROM public.diamond_player_agreement_rules
  WHERE template_id = p_template_id
    AND p_ratio >= ratio_min
    AND (ratio_max IS NULL OR p_ratio < ratio_max)
    AND p_hands >= hands_min
    AND (hands_max IS NULL OR p_hands <= hands_max)
  ORDER BY priority
  LIMIT 1;

  RETURN COALESCE(v_percentage, 0);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: Calcular todos los campos del reporte
-- =====================================================

CREATE OR REPLACE FUNCTION public.calculate_weekly_player_report()
RETURNS TRIGGER AS $$
DECLARE
  v_club_record RECORD;
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
    -- Dinámico: buscar en template usando ratio total del club y hands totales
    -- NOTA: Para esto necesitaríamos agregar ratio y hands, pero por ahora usamos los del jugador
    -- TODO: Implementar agregación de todos los jugadores del club en esta semana
    NEW.diamond_club_percentage := public.get_diamond_club_percentage(
      v_player_club_record.club_diamond_club_template,
      NEW.ratio,
      NEW.hands
    );
  END IF;

  NEW.diamond_club_amount := NEW.rake_action * (NEW.diamond_club_percentage / 100);

  -- PASO 5: Calcular acuerdo Diamond ↔ Jugador
  -- Si el jugador tiene acuerdo personalizado, usar ese; sino usar el del club
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
    -- Usar acuerdo del club
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

  -- PASO 6: Calcular profit de Diamond
  NEW.diamond_profit := NEW.diamond_club_amount - NEW.player_amount;

  -- Actualizar timestamp
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular automáticamente
CREATE TRIGGER calculate_weekly_player_report_trigger
  BEFORE INSERT OR UPDATE ON public.weekly_player_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_weekly_player_report();

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.weekly_player_reports ENABLE ROW LEVEL SECURITY;

-- Admins pueden hacer todo
CREATE POLICY "Admins can manage weekly player reports"
  ON public.weekly_player_reports
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Jugadores pueden ver solo sus propios reportes
CREATE POLICY "Players can view their own reports"
  ON public.weekly_player_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.player_clubs pc
      JOIN public.players p ON pc.player_id = p.id
      WHERE pc.id = weekly_player_reports.player_club_id
      AND p.user_id = auth.uid()
    )
  );

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE public.weekly_player_reports IS 'Reportes semanales individuales por jugador con todos los cálculos de rakeback y profit';
COMMENT ON COLUMN public.weekly_player_reports.pnl IS 'PNL (resultado) del jugador en la semana';
COMMENT ON COLUMN public.weekly_player_reports.rake IS 'Rake generado por el jugador en la semana';
COMMENT ON COLUMN public.weekly_player_reports.hands IS 'Manos jugadas por el jugador en la semana';
COMMENT ON COLUMN public.weekly_player_reports.ratio IS 'Ratio = PNL / Rake';
COMMENT ON COLUMN public.weekly_player_reports.action_amount IS 'Monto del Action = PNL × action%. Si >0 jugador paga club, si <0 club paga jugador';
COMMENT ON COLUMN public.weekly_player_reports.rake_action IS 'Rake disponible para repartir = (1 - action%) × rake';
COMMENT ON COLUMN public.weekly_player_reports.diamond_club_amount IS 'Monto que cobra Diamond del club = rake_action × diamond_club%';
COMMENT ON COLUMN public.weekly_player_reports.player_amount IS 'Monto que recibe el jugador = rake_action × player%';
COMMENT ON COLUMN public.weekly_player_reports.diamond_profit IS 'Profit neto de Diamond = diamond_club_amount - player_amount';
