-- Fix RLS policies for agreement rules tables
-- The policies were missing WITH CHECK clause for INSERT operations

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage diamond player agreement rules" ON public.diamond_player_agreement_rules;
DROP POLICY IF EXISTS "Admins can manage diamond club agreement rules" ON public.diamond_club_agreement_rules;

-- Recreate Diamond Player Agreement Rules policy with WITH CHECK
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
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Recreate Diamond Club Agreement Rules policy with WITH CHECK
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
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
