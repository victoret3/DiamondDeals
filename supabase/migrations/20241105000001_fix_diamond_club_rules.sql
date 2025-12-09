-- Cambiar diamond_club_agreement_rules para usar RAKE en lugar de HANDS
-- (porque Diamond-Club se basa en ratio + rake en $, no en manos)

ALTER TABLE public.diamond_club_agreement_rules
  DROP COLUMN hands_min,
  DROP COLUMN hands_max,
  ADD COLUMN rake_min DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN rake_max DECIMAL(12,2);

COMMENT ON TABLE public.diamond_club_agreement_rules IS 'Reglas Diamond-Club basadas en ratio (PNL/Rake) y rake total en dólares';
COMMENT ON COLUMN public.diamond_club_agreement_rules.rake_min IS 'Rake mínimo en USD';
COMMENT ON COLUMN public.diamond_club_agreement_rules.rake_max IS 'Rake máximo en USD (NULL = sin límite)';
