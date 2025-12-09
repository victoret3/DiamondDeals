import { SupabaseClient } from "@supabase/supabase-js";
import { Database, ClubInsert, ClubUpdate } from "../types";

export async function getClubs(client: SupabaseClient<Database>) {
  return client
    .from("clubs")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });
}

export async function getClubById(
  client: SupabaseClient<Database>,
  id: string
) {
  return client.from("clubs").select("*").eq("id", id).single();
}

export async function createClub(
  client: SupabaseClient<Database>,
  club: ClubInsert
) {
  return client.from("clubs").insert(club).select().single();
}

export async function updateClub(
  client: SupabaseClient<Database>,
  id: string,
  club: ClubUpdate
) {
  return client.from("clubs").update(club).eq("id", id).select().single();
}

export async function deleteClub(client: SupabaseClient<Database>, id: string) {
  return client.from("clubs").delete().eq("id", id);
}
