import { SupabaseClient } from "@supabase/supabase-js";

// Using any for flexibility until types are regenerated from Supabase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any>;

export async function getClubs(client: AnySupabaseClient) {
  return client
    .from("clubs")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });
}

export async function getClubById(
  client: AnySupabaseClient,
  id: string
) {
  return client.from("clubs").select("*").eq("id", id).single();
}

export async function createClub(
  client: AnySupabaseClient,
  club: Record<string, unknown>
) {
  return client.from("clubs").insert(club).select().single();
}

export async function updateClub(
  client: AnySupabaseClient,
  id: string,
  club: Record<string, unknown>
) {
  return client.from("clubs").update(club).eq("id", id).select().single();
}

export async function deleteClub(client: AnySupabaseClient, id: string) {
  return client.from("clubs").delete().eq("id", id);
}
