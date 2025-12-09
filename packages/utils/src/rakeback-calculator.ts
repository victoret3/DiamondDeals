/**
 * Calcula el rakeback dinámico basado en las reglas de condiciones
 */
export interface RakebackRule {
  ratio_min: number;
  ratio_max: number | null;
  hands_min: number;
  hands_max: number | null;
  rakeback_percentage: number;
  priority: number;
}

export interface PlayerPerformance {
  hands_played: number;
  total_rake: number;
  total_result: number;
}

export function calculateRatio(performance: PlayerPerformance): number {
  if (performance.total_rake === 0) return 0;
  return performance.total_result / performance.total_rake;
}

export function findMatchingRule(
  rules: RakebackRule[],
  ratio: number,
  handsPlayed: number
): RakebackRule | null {
  // Ordenar por prioridad
  const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);

  // Encontrar la primera regla que coincida
  return (
    sortedRules.find((rule) => {
      const ratioMatches =
        ratio >= rule.ratio_min &&
        (rule.ratio_max === null || ratio < rule.ratio_max);

      const handsMatch =
        handsPlayed >= rule.hands_min &&
        (rule.hands_max === null || handsPlayed < rule.hands_max);

      return ratioMatches && handsMatch;
    }) ?? null
  );
}

export function calculateDynamicRakeback(
  performance: PlayerPerformance,
  rules: RakebackRule[]
): number {
  const ratio = calculateRatio(performance);
  const matchingRule = findMatchingRule(rules, ratio, performance.hands_played);

  return matchingRule?.rakeback_percentage ?? 0;
}

export function calculateRakebackAmount(
  totalRake: number,
  rakebackPercentage: number
): number {
  return (totalRake * rakebackPercentage) / 100;
}

/**
 * Calcula el rakeback total de Diamont Deals
 */
export function calculateDiamontRakeback(
  performance: PlayerPerformance,
  rules: RakebackRule[],
  clubRakebackPercentage: number
): {
  ratio: number;
  diamontRakebackPercentage: number;
  clubRakebackAmount: number;
  diamontRakebackAmount: number;
  totalRakebackAmount: number;
} {
  const ratio = calculateRatio(performance);
  const diamontRakebackPercentage = calculateDynamicRakeback(performance, rules);

  const clubRakebackAmount = calculateRakebackAmount(
    performance.total_rake,
    clubRakebackPercentage
  );

  const diamontRakebackAmount = calculateRakebackAmount(
    clubRakebackAmount,
    diamontRakebackPercentage
  );

  return {
    ratio,
    diamontRakebackPercentage,
    clubRakebackAmount,
    diamontRakebackAmount,
    totalRakebackAmount: clubRakebackAmount + diamontRakebackAmount,
  };
}
