-- =====================================================
-- NUEVA ESTRUCTURA: APLICACIONES
-- =====================================================
-- Cada aplicación (PokerBros, PPPoker, etc.) tiene sus clubs
-- Cada jugador tiene un ID y nick POR APLICACIÓN

-- ==============================================
-- TABLA: applications
-- Aplicaciones de poker (PokerBros, PPPoker, etc.)
-- ==============================================
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_applications_code ON public.applications(code);
CREATE INDEX idx_applications_is_active ON public.applications(is_active);

-- Trigger para updated_at
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- MODIFICAR: clubs - añadir referencia a application
-- ==============================================
ALTER TABLE public.clubs
  ADD COLUMN application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE;

CREATE INDEX idx_clubs_application_id ON public.clubs(application_id);

-- ==============================================
-- TABLA: player_applications
-- Relación jugador-aplicación con ID y nick por app
-- ==============================================
CREATE TABLE IF NOT EXISTS public.player_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,

  -- ID del jugador en esta aplicación (ej: 1234-5678)
  app_player_id TEXT NOT NULL,
  -- Nickname en esta aplicación
  app_nickname TEXT NOT NULL,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Un jugador solo puede tener un registro por aplicación
  UNIQUE(player_id, application_id),
  -- El ID del jugador debe ser único dentro de cada aplicación
  UNIQUE(application_id, app_player_id)
);

-- Índices
CREATE INDEX idx_player_applications_player_id ON public.player_applications(player_id);
CREATE INDEX idx_player_applications_application_id ON public.player_applications(application_id);
CREATE INDEX idx_player_applications_app_player_id ON public.player_applications(app_player_id);

-- Trigger para updated_at
CREATE TRIGGER update_player_applications_updated_at BEFORE UPDATE ON public.player_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- RLS POLICIES
-- ==============================================

-- Habilitar RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_applications ENABLE ROW LEVEL SECURITY;

-- Applications: todos pueden ver, solo admins modifican
CREATE POLICY "Anyone can view active applications"
  ON public.applications FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage applications"
  ON public.applications FOR ALL
  USING (is_admin());

-- Player Applications: admins todo, jugadores ver propio
CREATE POLICY "Admins can manage player_applications"
  ON public.player_applications FOR ALL
  USING (is_admin());

CREATE POLICY "Players can view own applications"
  ON public.player_applications FOR SELECT
  USING (
    player_id IN (
      SELECT id FROM public.players WHERE user_id = auth.uid()
    )
  );

-- ==============================================
-- INSERTAR APLICACIONES POR DEFECTO
-- ==============================================
INSERT INTO public.applications (name, code) VALUES
  ('PokerBros', 'pokerbros'),
  ('PPPoker', 'pppoker'),
  ('ClubGG', 'clubgg'),
  ('Suprema Poker', 'suprema'),
  ('Upoker', 'upoker'),
  ('X-Poker', 'xpoker')
ON CONFLICT (code) DO NOTHING;

-- ==============================================
-- COMENTARIOS
-- ==============================================
COMMENT ON TABLE public.applications IS 'Aplicaciones de poker (PokerBros, PPPoker, etc.)';
COMMENT ON TABLE public.player_applications IS 'Relación jugador-aplicación con ID y nickname específicos por app';
COMMENT ON COLUMN public.player_applications.app_player_id IS 'ID del jugador dentro de esta aplicación específica';
COMMENT ON COLUMN public.player_applications.app_nickname IS 'Nickname del jugador dentro de esta aplicación específica';
