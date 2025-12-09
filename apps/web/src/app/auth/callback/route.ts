import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Obtener el rol del usuario
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      // Redirigir según el rol
      if (profile?.role === "admin") {
        return NextResponse.redirect(`${origin}/admin/dashboard`);
      } else {
        return NextResponse.redirect(`${origin}/player/dashboard`);
      }
    }
  }

  // Si hay error, redirigir al login
  return NextResponse.redirect(`${origin}/login`);
}
