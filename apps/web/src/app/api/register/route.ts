import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function generatePlayerCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `DD-${part1}-${part2}`;
}

interface AppRegistration {
  applicationId: string;
  playerId: string;
  nickname: string;
}

export async function POST(request: NextRequest) {
  try {
    const { fullName, email, password, applications } = await request.json();

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    if (!applications || applications.length === 0) {
      return NextResponse.json(
        { error: "Debes seleccionar al menos una aplicación" },
        { status: 400 }
      );
    }

    // Usar service role para bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Crear usuario en Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Error al crear usuario" },
        { status: 500 }
      );
    }

    // 2. Crear/actualizar perfil
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: authData.user.id,
        email: email,
        full_name: fullName,
        role: "player"
      });

    if (profileError) {
      console.error("Profile error:", profileError);
    }

    // 3. Crear jugador pendiente
    const { data: player, error: playerError } = await supabase
      .from("players")
      .insert({
        player_code: generatePlayerCode(),
        user_id: authData.user.id,
        full_name: fullName,
        email: email,
        status: "pending",
        is_agent: false,
      })
      .select()
      .single();

    if (playerError) {
      console.error("Player error:", playerError);
      return NextResponse.json(
        { error: playerError.message },
        { status: 400 }
      );
    }

    // 4. Crear registros en player_applications
    const appRecords = (applications as AppRegistration[]).map(app => ({
      player_id: player.id,
      application_id: app.applicationId,
      app_player_id: app.playerId,
      app_nickname: app.nickname,
    }));

    const { error: appError } = await supabase
      .from("player_applications")
      .insert(appRecords);

    if (appError) {
      console.error("Player applications error:", appError);
      return NextResponse.json(
        { error: "Error al guardar aplicaciones: " + appError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Registro exitoso"
    });

  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: error.message || "Error interno" },
      { status: 500 }
    );
  }
}
