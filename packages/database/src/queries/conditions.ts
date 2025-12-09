import { SupabaseClient } from "@supabase/supabase-js";
import {
  Database,
  ConditionTemplateInsert,
  ConditionRuleInsert,
  PlayerConditionInsert,
} from "../types";

// Condition Templates
export async function getConditionTemplates(client: SupabaseClient<Database>) {
  return client
    .from("condition_templates")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
}

export async function getConditionTemplateById(
  client: SupabaseClient<Database>,
  id: string
) {
  return client
    .from("condition_templates")
    .select("*, condition_rules(*)")
    .eq("id", id)
    .single();
}

export async function createConditionTemplate(
  client: SupabaseClient<Database>,
  template: ConditionTemplateInsert
) {
  return client
    .from("condition_templates")
    .insert(template)
    .select()
    .single();
}

// Condition Rules
export async function getConditionRules(
  client: SupabaseClient<Database>,
  templateId: string
) {
  return client
    .from("condition_rules")
    .select("*")
    .eq("template_id", templateId)
    .order("priority", { ascending: true });
}

export async function createConditionRule(
  client: SupabaseClient<Database>,
  rule: ConditionRuleInsert
) {
  return client.from("condition_rules").insert(rule).select().single();
}

// Player Conditions
export async function getPlayerConditions(
  client: SupabaseClient<Database>,
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
  client: SupabaseClient<Database>,
  condition: PlayerConditionInsert
) {
  return client.from("player_conditions").insert(condition).select().single();
}

// Find matching rakeback percentage based on stats
export async function findMatchingRakeback(
  client: SupabaseClient<Database>,
  templateId: string,
  ratio: number,
  handsPlayed: number
): Promise<number | null> {
  const { data: rules } = await getConditionRules(client, templateId);

  if (!rules || rules.length === 0) return null;

  // Find matching rule
  const matchingRule = rules.find((rule) => {
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
