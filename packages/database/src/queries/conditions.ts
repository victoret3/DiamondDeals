import { SupabaseClient } from "@supabase/supabase-js";

// Using any for flexibility until types are regenerated from Supabase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any>;

// Condition Templates
export async function getConditionTemplates(client: AnySupabaseClient) {
  return client
    .from("condition_templates")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
}

export async function getConditionTemplateById(
  client: AnySupabaseClient,
  id: string
) {
  return client
    .from("condition_templates")
    .select("*, condition_rules(*)")
    .eq("id", id)
    .single();
}

export async function createConditionTemplate(
  client: AnySupabaseClient,
  template: Record<string, unknown>
) {
  return client
    .from("condition_templates")
    .insert(template)
    .select()
    .single();
}

// Condition Rules
export async function getConditionRules(
  client: AnySupabaseClient,
  templateId: string
) {
  return client
    .from("condition_rules")
    .select("*")
    .eq("template_id", templateId)
    .order("priority", { ascending: true });
}

export async function createConditionRule(
  client: AnySupabaseClient,
  rule: Record<string, unknown>
) {
  return client.from("condition_rules").insert(rule).select().single();
}

// Player Conditions
export async function getPlayerConditions(
  client: AnySupabaseClient,
  playerClubId: string
) {
  return client
    .from("player_conditions")
    .select("*, template:condition_templates(*)")
    .eq("player_club_id", playerClubId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });
}

export async function createPlayerCondition(
  client: AnySupabaseClient,
  condition: Record<string, unknown>
) {
  return client.from("player_conditions").insert(condition).select().single();
}

// Find matching rakeback percentage based on stats
export async function findMatchingRakeback(
  client: AnySupabaseClient,
  templateId: string,
  ratio: number,
  handsPlayed: number
): Promise<number | null> {
  const { data: rules } = await getConditionRules(client, templateId);

  if (!rules || rules.length === 0) return null;

  // Find matching rule
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matchingRule = rules.find((rule: any) => {
    const ratioMatches =
      ratio >= rule.ratio_min &&
      (rule.ratio_max === null || ratio < rule.ratio_max);

    const handsMatch =
      handsPlayed >= rule.hands_min &&
      (rule.hands_max === null || handsPlayed < rule.hands_max);

    return ratioMatches && handsMatch;
  });

  return matchingRule?.rakeback_percentage ?? null;
}
