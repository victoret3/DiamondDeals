import { SupabaseClient } from "@supabase/supabase-js";

// Using any for flexibility until types are regenerated from Supabase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any>;

export async function getPlayers(client: AnySupabaseClient) {
  return client
    .from("players")
    .select("*")
    .order("created_at", { ascending: false });
}

export async function getPlayerById(
  client: AnySupabaseClient,
  id: string
) {
  return client.from("players").select("*").eq("id", id).single();
}

export async function getPlayerByCode(
  client: AnySupabaseClient,
  playerCode: string
) {
  return client.from("players").select("*").eq("player_code", playerCode).single();
}

export async function createPlayer(
  client: AnySupabaseClient,
  player: Record<string, unknown>
) {
  return client.from("players").insert(player).select().single();
}

export async function updatePlayer(
  client: AnySupabaseClient,
  id: string,
  player: Record<string, unknown>
) {
  return client.from("players").update(player).eq("id", id).select().single();
}

export async function deletePlayer(
  client: AnySupabaseClient,
  id: string
) {
  return client.from("players").delete().eq("id", id);
}

export async function getPlayerClubs(
  client: AnySupabaseClient,
  playerId: string
) {
  return client
    .from("player_clubs")
    .select(`
      *,
      club:clubs(*),
      player:players(*)
    `)
    .eq("player_id", playerId)
    .eq("is_active", true);
}
