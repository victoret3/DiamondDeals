import { SupabaseClient } from "@supabase/supabase-js";
import { Database, PlayerInsert, PlayerUpdate } from "../types";

export async function getPlayers(client: SupabaseClient<Database>) {
  return client
    .from("players")
    .select("*")
    .order("created_at", { ascending: false });
}

export async function getPlayerById(
  client: SupabaseClient<Database>,
  id: string
) {
  return client.from("players").select("*").eq("id", id).single();
}

export async function getPlayerByCode(
  client: SupabaseClient<Database>,
  playerCode: string
) {
  return client.from("players").select("*").eq("player_code", playerCode).single();
}

export async function createPlayer(
  client: SupabaseClient<Database>,
  player: PlayerInsert
) {
  return client.from("players").insert(player).select().single();
}

export async function updatePlayer(
  client: SupabaseClient<Database>,
  id: string,
  player: PlayerUpdate
) {
  return client.from("players").update(player).eq("id", id).select().single();
}

export async function deletePlayer(
  client: SupabaseClient<Database>,
  id: string
) {
  return client.from("players").delete().eq("id", id);
}

export async function getPlayerClubs(
  client: SupabaseClient<Database>,
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
