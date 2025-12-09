-- =====================================================
-- LIMPIAR TODO - JUGADORES Y REPORTES
-- =====================================================

DO $$
BEGIN
  -- Eliminar todos los reportes semanales
  DELETE FROM public.weekly_player_reports;

  -- Eliminar todas las condiciones
  DELETE FROM public.player_conditions;

  -- Eliminar todas las asignaciones jugador-club
  DELETE FROM public.player_clubs;

  -- Eliminar todos los jugadores
  DELETE FROM public.players;

  RAISE NOTICE 'Base de datos limpiada completamente';
END $$;
