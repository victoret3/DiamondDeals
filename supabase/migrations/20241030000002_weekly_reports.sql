-- Añadir campo action_percentage a la tabla clubs
ALTER TABLE public.clubs
  ADD COLUMN action_percentage DECIMAL(5,2) DEFAULT 0 CHECK (action_percentage >= 0 AND action_percentage <= 100);

COMMENT ON COLUMN public.clubs.action_percentage IS 'Porcentaje de Action del club (0-100). Si PNL > 0 jugador paga al club, si PNL < 0 club paga al jugador';

-- Crear tabla de reportes semanales por club
CREATE TABLE public.weekly_club_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,

  -- Datos ingresados por el admin cada lunes
  total_pnl DECIMAL(12,2) NOT NULL, -- PNL total de todos los jugadores del club en la semana
  total_rake DECIMAL(12,2) NOT NULL CHECK (total_rake >= 0), -- Rake total generado en la semana

  -- Datos calculados automáticamente
  action_percentage DECIMAL(5,2) NOT NULL, -- % de action (copiado del club para histórico)
  action_amount DECIMAL(12,2) NOT NULL, -- PNL * (action_percentage / 100)
  rake_action DECIMAL(12,2) NOT NULL, -- (1 - action_percentage/100) * total_rake

  -- Metadatos
  created_by UUID REFERENCES auth.users(id), -- Admin que creó el reporte
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_club_week UNIQUE(club_id, week_start, week_end),
  CONSTRAINT valid_week_dates CHECK (week_end >= week_start)
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_weekly_reports_club ON public.weekly_club_reports(club_id);
CREATE INDEX idx_weekly_reports_dates ON public.weekly_club_reports(week_start, week_end);
CREATE INDEX idx_weekly_reports_created_at ON public.weekly_club_reports(created_at);

-- Función para calcular automáticamente los campos derivados
CREATE OR REPLACE FUNCTION public.calculate_weekly_report_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Copiar action_percentage del club si no se especifica
  IF NEW.action_percentage IS NULL THEN
    SELECT action_percentage INTO NEW.action_percentage
    FROM public.clubs
    WHERE id = NEW.club_id;
  END IF;

  -- Calcular action_amount: PNL * (action_percentage / 100)
  -- Positivo = jugador paga al club, Negativo = club paga al jugador
  NEW.action_amount := NEW.total_pnl * (NEW.action_percentage / 100);

  -- Calcular rake_action: (1 - action_percentage/100) * total_rake
  NEW.rake_action := (1 - (NEW.action_percentage / 100)) * NEW.total_rake;

  -- Actualizar timestamp
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular campos automáticamente
CREATE TRIGGER calculate_weekly_report_fields_trigger
  BEFORE INSERT OR UPDATE ON public.weekly_club_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_weekly_report_fields();

-- RLS Policies
ALTER TABLE public.weekly_club_reports ENABLE ROW LEVEL SECURITY;

-- Los admins pueden hacer todo
CREATE POLICY "Admins can do everything on weekly_club_reports"
  ON public.weekly_club_reports
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Los jugadores pueden ver solo los reportes de sus clubs
CREATE POLICY "Players can view their club reports"
  ON public.weekly_club_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.player_clubs pc
      JOIN public.players p ON pc.player_id = p.id
      WHERE p.user_id = auth.uid()
      AND pc.club_id = weekly_club_reports.club_id
    )
  );

-- Comentarios
COMMENT ON TABLE public.weekly_club_reports IS 'Reportes semanales por club con PNL, Rake y cálculos de Action';
COMMENT ON COLUMN public.weekly_club_reports.total_pnl IS 'PNL total de todos los jugadores del club en la semana';
COMMENT ON COLUMN public.weekly_club_reports.total_rake IS 'Rake total generado por todos los jugadores del club';
COMMENT ON COLUMN public.weekly_club_reports.action_amount IS 'Monto del Action = PNL × (action_percentage / 100). Si >0 jugador paga club, si <0 club paga jugador';
COMMENT ON COLUMN public.weekly_club_reports.rake_action IS 'Rake después del Action = (1 - action_percentage/100) × total_rake';
