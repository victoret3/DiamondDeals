import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function fixUser() {
  const supabase = await createClient();

  // Cliente con service_role para bypass RLS
  const { createClient: createServiceClient } = await import("@supabase/supabase-js");
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    // 1. Obtener usuario actual
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        error: "No authenticated user",
      }, { status: 401 });
    }

    // 2. Crear perfil si no existe (usando admin client para bypass RLS)
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!existingProfile) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email!,
          role: "player",
        });

      if (profileError) {
        return NextResponse.json({
          error: "Error creating profile",
          details: profileError.message,
        }, { status: 500 });
      }
    }

    // 3. Buscar si hay algún player con el email del usuario (para vincular)
    const { data: players } = await supabaseAdmin
      .from("players")
      .select("*")
      .eq("email", user.email)
      .is("user_id", null);

    let linkedPlayer = null;

    if (players && players.length > 0) {
      // Vincular el primer player que coincida
      const { data: updated, error: updateError } = await supabaseAdmin
        .from("players")
        .update({
          user_id: user.id,
          status: "active"
        })
        .eq("id", players[0].id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({
          error: "Error linking player",
          details: updateError.message,
        }, { status: 500 });
      }

      linkedPlayer = updated;
    }

    // 4. Verificar resultado final
    const { data: finalProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const { data: finalPlayer } = await supabase
      .from("players")
      .select("*")
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({
      success: true,
      message: "Usuario arreglado correctamente",
      user: {
        id: user.id,
        email: user.email,
      },
      profile: finalProfile,
      player: finalPlayer,
      actions: {
        profileCreated: !existingProfile,
        playerLinked: linkedPlayer !== null,
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      error: "Unexpected error",
      message: error.message,
    }, { status: 500 });
  }
}

export async function GET() {
  return fixUser();
}

export async function POST() {
  return fixUser();
}
