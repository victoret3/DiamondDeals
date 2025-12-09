import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  try {
    // 1. Verificar usuario actual
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        error: "No authenticated user",
        authError: authError?.message,
      });
    }

    // 2. Verificar si existe en profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // 3. Verificar si está vinculado a algún player
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // 4. Verificar todos los profiles
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from("profiles")
      .select("*");

    // 5. Verificar todos los players
    const { data: allPlayers, error: allPlayersError } = await supabase
      .from("players")
      .select("*");

    // 6. Verificar usuarios de auth
    const { data: authUsers, error: authUsersError } = await supabase.auth.admin.listUsers();

    return NextResponse.json({
      currentUser: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      currentProfile: profile || "NO EXISTE",
      profileError: profileError?.message,
      currentPlayer: player || "NO VINCULADO",
      playerError: playerError?.message,
      stats: {
        totalProfiles: allProfiles?.length || 0,
        totalPlayers: allPlayers?.length || 0,
        playersWithUser: allPlayers?.filter(p => p.user_id !== null).length || 0,
        playersWithoutUser: allPlayers?.filter(p => p.user_id === null).length || 0,
        authUsers: authUsers?.users.length || 0,
      },
      allProfiles: allProfiles || [],
      allPlayers: allPlayers || [],
    });
  } catch (error: any) {
    return NextResponse.json({
      error: "Unexpected error",
      message: error.message,
    }, { status: 500 });
  }
}
