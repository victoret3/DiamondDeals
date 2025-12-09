-- Diamont Deals - Row Level Security Policies
-- Políticas de seguridad para todas las tablas

-- ==============================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- ==============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.condition_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.condition_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- FUNCIONES HELPER
-- ==============================================

-- Función para verificar si el usuario es admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si el usuario es player
CREATE OR REPLACE FUNCTION public.is_player()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'player'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener el player_id del usuario actual
CREATE OR REPLACE FUNCTION public.get_player_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM public.players
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- POLÍTICAS: profiles
-- ==============================================

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- Los admins pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (is_admin());

-- Los admins pueden actualizar todos los perfiles
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (is_admin());

-- ==============================================
-- POLÍTICAS: players
-- ==============================================

-- Los admins pueden hacer todo con players
CREATE POLICY "Admins can view all players"
  ON public.players FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert players"
  ON public.players FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update players"
  ON public.players FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete players"
  ON public.players FOR DELETE
  USING (is_admin());

-- Los players pueden ver su propia información
CREATE POLICY "Players can view own data"
  ON public.players FOR SELECT
  USING (user_id = auth.uid());

-- Los players pueden actualizar su propia información (limitado)
CREATE POLICY "Players can update own data"
  ON public.players FOR UPDATE
  USING (user_id = auth.uid());

-- Permitir SELECT para validar player_code durante registro (sin auth)
CREATE POLICY "Public can check player code existence"
  ON public.players FOR SELECT
  USING (user_id IS NULL); -- Solo players no vinculados

-- ==============================================
-- POLÍTICAS: clubs
-- ==============================================

-- Los admins pueden hacer todo con clubs
CREATE POLICY "Admins can manage clubs"
  ON public.clubs FOR ALL
  USING (is_admin());

-- Los players pueden ver clubs activos
CREATE POLICY "Players can view active clubs"
  ON public.clubs FOR SELECT
  USING (is_active = true);

-- ==============================================
-- POLÍTICAS: player_clubs
-- ==============================================

-- Los admins pueden hacer todo
CREATE POLICY "Admins can manage player_clubs"
  ON public.player_clubs FOR ALL
  USING (is_admin());

-- Los players pueden ver sus propias asociaciones
CREATE POLICY "Players can view own clubs"
  ON public.player_clubs FOR SELECT
  USING (
    player_id IN (
      SELECT id FROM public.players WHERE user_id = auth.uid()
    )
  );

-- ==============================================
-- POLÍTICAS: condition_templates
-- ==============================================

-- Los admins pueden hacer todo
CREATE POLICY "Admins can manage condition_templates"
  ON public.condition_templates FOR ALL
  USING (is_admin());

-- Los players pueden ver templates activos
CREATE POLICY "Players can view active templates"
  ON public.condition_templates FOR SELECT
  USING (is_active = true);

-- ==============================================
-- POLÍTICAS: condition_rules
-- ==============================================

-- Los admins pueden hacer todo
CREATE POLICY "Admins can manage condition_rules"
  ON public.condition_rules FOR ALL
  USING (is_admin());

-- Los players pueden ver reglas de templates activos
CREATE POLICY "Players can view rules of active templates"
  ON public.condition_rules FOR SELECT
  USING (
    template_id IN (
      SELECT id FROM public.condition_templates WHERE is_active = true
    )
  );

-- ==============================================
-- POLÍTICAS: player_conditions
-- ==============================================

-- Los admins pueden hacer todo
CREATE POLICY "Admins can manage player_conditions"
  ON public.player_conditions FOR ALL
  USING (is_admin());

-- Los players pueden ver sus propias condiciones
CREATE POLICY "Players can view own conditions"
  ON public.player_conditions FOR SELECT
  USING (
    player_club_id IN (
      SELECT pc.id FROM public.player_clubs pc
      JOIN public.players p ON pc.player_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- ==============================================
-- POLÍTICAS: player_stats
-- ==============================================

-- Los admins pueden hacer todo
CREATE POLICY "Admins can manage player_stats"
  ON public.player_stats FOR ALL
  USING (is_admin());

-- Los players pueden ver sus propias estadísticas
CREATE POLICY "Players can view own stats"
  ON public.player_stats FOR SELECT
  USING (
    player_club_id IN (
      SELECT pc.id FROM public.player_clubs pc
      JOIN public.players p ON pc.player_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- ==============================================
-- GRANTS
-- ==============================================

-- Dar permisos a usuarios autenticados
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Dar permisos limitados a usuarios anónimos (para registro)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.players TO anon;
