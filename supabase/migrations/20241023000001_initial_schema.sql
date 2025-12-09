-- Diamont Deals - Initial Schema
-- Creación de todas las tablas del sistema

-- ==============================================
-- EXTENSIONES
-- ==============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- TABLA: profiles
-- Perfiles de usuario (extiende auth.users)
-- ==============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'player')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para profiles
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- ==============================================
-- TABLA: players
-- Jugadores de poker
-- ==============================================
CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_code TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para players
CREATE INDEX idx_players_player_code ON public.players(player_code);
CREATE INDEX idx_players_user_id ON public.players(user_id);
CREATE INDEX idx_players_status ON public.players(status);
CREATE INDEX idx_players_created_by ON public.players(created_by);

-- ==============================================
-- TABLA: clubs
-- Clubs de poker
-- ==============================================
CREATE TABLE IF NOT EXISTS public.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  base_rakeback_percentage DECIMAL(5,2) NOT NULL CHECK (base_rakeback_percentage >= 0 AND base_rakeback_percentage <= 100),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para clubs
CREATE INDEX idx_clubs_code ON public.clubs(code);
CREATE INDEX idx_clubs_is_active ON public.clubs(is_active);

-- ==============================================
-- TABLA: player_clubs
-- Relación N:N entre jugadores y clubs
-- ==============================================
CREATE TABLE IF NOT EXISTS public.player_clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  username_in_club TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,

  UNIQUE(player_id, club_id)
);

-- Índices para player_clubs
CREATE INDEX idx_player_clubs_player_id ON public.player_clubs(player_id);
CREATE INDEX idx_player_clubs_club_id ON public.player_clubs(club_id);
CREATE INDEX idx_player_clubs_is_active ON public.player_clubs(is_active);

-- ==============================================
-- TABLA: condition_templates
-- Templates de condiciones dinámicas
-- ==============================================
CREATE TABLE IF NOT EXISTS public.condition_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para condition_templates
CREATE INDEX idx_condition_templates_is_active ON public.condition_templates(is_active);
CREATE INDEX idx_condition_templates_created_by ON public.condition_templates(created_by);

-- ==============================================
-- TABLA: condition_rules
-- Reglas específicas de cada template
-- ==============================================
CREATE TABLE IF NOT EXISTS public.condition_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.condition_templates(id) ON DELETE CASCADE NOT NULL,

  -- Ratio (Resultado/Rake)
  ratio_min DECIMAL(10,2) NOT NULL,
  ratio_max DECIMAL(10,2) NULL,

  -- Manos jugadas
  hands_min INTEGER NOT NULL CHECK (hands_min >= 0),
  hands_max INTEGER NULL CHECK (hands_max IS NULL OR hands_max > hands_min),

  -- Rakeback de Diamont Deals
  rakeback_percentage DECIMAL(5,2) NOT NULL CHECK (rakeback_percentage >= 0 AND rakeback_percentage <= 100),

  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para condition_rules
CREATE INDEX idx_condition_rules_template_id ON public.condition_rules(template_id);
CREATE INDEX idx_condition_rules_priority ON public.condition_rules(priority);

-- ==============================================
-- TABLA: player_conditions
-- Condiciones asignadas a cada jugador por club
-- ==============================================
CREATE TABLE IF NOT EXISTS public.player_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_club_id UUID REFERENCES public.player_clubs(id) ON DELETE CASCADE NOT NULL,

  -- Tipo de condición
  condition_type TEXT NOT NULL CHECK (condition_type IN ('fixed', 'dynamic')),

  -- Si es fijo
  fixed_percentage DECIMAL(5,2) NULL CHECK (fixed_percentage IS NULL OR (fixed_percentage >= 0 AND fixed_percentage <= 100)),

  -- Si es dinámico
  template_id UUID REFERENCES public.condition_templates(id) NULL,

  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ NULL,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: debe ser fijo O dinámico, no ambos
  CHECK (
    (condition_type = 'fixed' AND fixed_percentage IS NOT NULL AND template_id IS NULL) OR
    (condition_type = 'dynamic' AND template_id IS NOT NULL AND fixed_percentage IS NULL)
  )
);

-- Índices para player_conditions
CREATE INDEX idx_player_conditions_player_club_id ON public.player_conditions(player_club_id);
CREATE INDEX idx_player_conditions_template_id ON public.player_conditions(template_id);
CREATE INDEX idx_player_conditions_is_active ON public.player_conditions(is_active);

-- ==============================================
-- TABLA: player_stats
-- Estadísticas mensuales del jugador por club
-- ==============================================
CREATE TABLE IF NOT EXISTS public.player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_club_id UUID REFERENCES public.player_clubs(id) ON DELETE CASCADE NOT NULL,

  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  hands_played INTEGER DEFAULT 0 CHECK (hands_played >= 0),
  total_rake DECIMAL(12,2) DEFAULT 0 CHECK (total_rake >= 0),
  total_result DECIMAL(12,2) DEFAULT 0,
  ratio DECIMAL(10,2) DEFAULT 0,

  club_rakeback_amount DECIMAL(12,2) DEFAULT 0,
  diamont_rakeback_amount DECIMAL(12,2) DEFAULT 0,
  applied_rakeback_percentage DECIMAL(5,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(player_club_id, period_start)
);

-- Índices para player_stats
CREATE INDEX idx_player_stats_player_club_id ON public.player_stats(player_club_id);
CREATE INDEX idx_player_stats_period ON public.player_stats(period_start, period_end);

-- ==============================================
-- TRIGGERS
-- ==============================================

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a las tablas relevantes
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON public.players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON public.clubs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_conditions_updated_at BEFORE UPDATE ON public.player_conditions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_stats_updated_at BEFORE UPDATE ON public.player_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- FUNCIÓN: Crear perfil automáticamente al registrarse
-- ==============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    'player' -- Por defecto todos son players
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil al registrarse
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================
-- FUNCIÓN: Actualizar estado del jugador al vincularse
-- ==============================================
CREATE OR REPLACE FUNCTION public.update_player_status_on_link()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND OLD.user_id IS NULL THEN
    NEW.status = 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_player_user_link
  BEFORE UPDATE ON public.players
  FOR EACH ROW
  WHEN (OLD.user_id IS DISTINCT FROM NEW.user_id)
  EXECUTE FUNCTION public.update_player_status_on_link();
