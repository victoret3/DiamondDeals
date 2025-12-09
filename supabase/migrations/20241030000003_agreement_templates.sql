-- =====================================================
-- TEMPLATES DE ACUERDOS DIAMOND ↔ CLUB
-- =====================================================

CREATE TABLE public.diamond_club_agreement_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reglas del acuerdo Diamond ↔ Club (basado en ratio y hands totales del club)
CREATE TABLE public.diamond_club_agreement_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.diamond_club_agreement_templates(id) ON DELETE CASCADE,

  -- Ratio = PNL total club / Rake total club
  ratio_min DECIMAL(10,2) NOT NULL,
  ratio_max DECIMAL(10,2),

  -- Hands = suma de manos de todos los jugadores del club
  hands_min INTEGER NOT NULL DEFAULT 0,
  hands_max INTEGER,

  -- Porcentaje que cobra Diamond del Rake Action
  diamond_percentage DECIMAL(5,2) NOT NULL CHECK (diamond_percentage >= 0 AND diamond_percentage <= 100),

  priority INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_diamond_club_rules_template ON public.diamond_club_agreement_rules(template_id);
CREATE INDEX idx_diamond_club_rules_priority ON public.diamond_club_agreement_rules(priority);

-- =====================================================
-- TEMPLATES DE ACUERDOS DIAMOND ↔ JUGADOR
-- =====================================================

CREATE TABLE public.diamond_player_agreement_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reglas del acuerdo Diamond ↔ Jugador (basado en ratio y hands del jugador)
CREATE TABLE public.diamond_player_agreement_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.diamond_player_agreement_templates(id) ON DELETE CASCADE,

  -- Ratio = PNL jugador / Rake jugador
  ratio_min DECIMAL(10,2) NOT NULL,
  ratio_max DECIMAL(10,2),

  -- Hands = manos jugadas por el jugador
  hands_min INTEGER NOT NULL DEFAULT 0,
  hands_max INTEGER,

  -- Porcentaje que recibe el jugador del Rake Action
  player_percentage DECIMAL(5,2) NOT NULL CHECK (player_percentage >= 0 AND player_percentage <= 100),

  priority INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_diamond_player_rules_template ON public.diamond_player_agreement_rules(template_id);
CREATE INDEX idx_diamond_player_rules_priority ON public.diamond_player_agreement_rules(priority);

-- =====================================================
-- ACTUALIZAR TABLA CLUBS CON ACUERDOS
-- =====================================================

-- Acuerdo Diamond ↔ Club
ALTER TABLE public.clubs
  ADD COLUMN diamond_club_agreement_type VARCHAR(20) DEFAULT 'fixed' CHECK (diamond_club_agreement_type IN ('fixed', 'dynamic')),
  ADD COLUMN diamond_club_fixed_percentage DECIMAL(5,2) CHECK (diamond_club_fixed_percentage >= 0 AND diamond_club_fixed_percentage <= 100),
  ADD COLUMN diamond_club_template_id UUID REFERENCES public.diamond_club_agreement_templates(id) ON DELETE SET NULL;

-- Acuerdo Diamond ↔ Jugador (por defecto para jugadores de este club)
ALTER TABLE public.clubs
  ADD COLUMN diamond_player_agreement_type VARCHAR(20) DEFAULT 'fixed' CHECK (diamond_player_agreement_type IN ('fixed', 'dynamic')),
  ADD COLUMN diamond_player_fixed_percentage DECIMAL(5,2) CHECK (diamond_player_fixed_percentage >= 0 AND diamond_player_fixed_percentage <= 100),
  ADD COLUMN diamond_player_template_id UUID REFERENCES public.diamond_player_agreement_templates(id) ON DELETE SET NULL;

-- =====================================================
-- ACTUALIZAR TABLA PLAYER_CLUBS CON ACUERDO PERSONALIZADO
-- =====================================================

-- Permite sobrescribir el acuerdo Diamond ↔ Jugador para un jugador específico
ALTER TABLE public.player_clubs
  ADD COLUMN custom_diamond_agreement BOOLEAN DEFAULT false,
  ADD COLUMN diamond_agreement_type VARCHAR(20) CHECK (diamond_agreement_type IN ('fixed', 'dynamic')),
  ADD COLUMN diamond_fixed_percentage DECIMAL(5,2) CHECK (diamond_fixed_percentage >= 0 AND diamond_fixed_percentage <= 100),
  ADD COLUMN diamond_template_id UUID REFERENCES public.diamond_player_agreement_templates(id) ON DELETE SET NULL;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Diamond Club Agreement Templates
ALTER TABLE public.diamond_club_agreement_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage diamond club agreement templates"
  ON public.diamond_club_agreement_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Diamond Club Agreement Rules
ALTER TABLE public.diamond_club_agreement_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage diamond club agreement rules"
  ON public.diamond_club_agreement_rules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Diamond Player Agreement Templates
ALTER TABLE public.diamond_player_agreement_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage diamond player agreement templates"
  ON public.diamond_player_agreement_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Diamond Player Agreement Rules
ALTER TABLE public.diamond_player_agreement_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage diamond player agreement rules"
  ON public.diamond_player_agreement_rules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE public.diamond_club_agreement_templates IS 'Templates de acuerdos entre Diamond Deals y Clubs';
COMMENT ON TABLE public.diamond_club_agreement_rules IS 'Reglas dinámicas para calcular % que cobra Diamond del club basado en ratio y hands totales';
COMMENT ON TABLE public.diamond_player_agreement_templates IS 'Templates de acuerdos entre Diamond Deals y Jugadores';
COMMENT ON TABLE public.diamond_player_agreement_rules IS 'Reglas dinámicas para calcular % que recibe el jugador basado en ratio y hands individuales';

COMMENT ON COLUMN public.clubs.diamond_club_agreement_type IS 'Tipo de acuerdo Diamond↔Club: fixed (% fijo) o dynamic (usa template con reglas)';
COMMENT ON COLUMN public.clubs.diamond_club_fixed_percentage IS 'Porcentaje fijo que cobra Diamond del Rake Action cuando es tipo fixed';
COMMENT ON COLUMN public.clubs.diamond_club_template_id IS 'Template de reglas dinámicas para calcular % Diamond cuando es tipo dynamic';

COMMENT ON COLUMN public.clubs.diamond_player_agreement_type IS 'Tipo de acuerdo Diamond↔Jugador por defecto: fixed o dynamic';
COMMENT ON COLUMN public.clubs.diamond_player_fixed_percentage IS 'Porcentaje fijo que recibe jugador del Rake Action cuando es tipo fixed';
COMMENT ON COLUMN public.clubs.diamond_player_template_id IS 'Template de reglas dinámicas por defecto para jugadores del club';

COMMENT ON COLUMN public.player_clubs.custom_diamond_agreement IS 'Si true, este jugador tiene acuerdo personalizado (no usa el del club)';
COMMENT ON COLUMN public.player_clubs.diamond_agreement_type IS 'Tipo de acuerdo personalizado para este jugador';
COMMENT ON COLUMN public.player_clubs.diamond_fixed_percentage IS 'Porcentaje fijo personalizado para este jugador';
COMMENT ON COLUMN public.player_clubs.diamond_template_id IS 'Template personalizado para este jugador';
