import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function PlayerDashboard() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Obtener perfil del jugador
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Obtener el player asociado al usuario
  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Obtener los clubs del jugador
  let playerClubs: any[] = [];
  if (player) {
    const { data: clubsData } = await supabase
      .from("player_clubs")
      .select(`
        *,
        club:clubs(id, name, code, logo_url)
      `)
      .eq("player_id", player.id)
      .eq("is_active", true);

    playerClubs = clubsData || [];
  }

  // Si no hay player asociado, mostrar mensaje
  if (!player) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Bienvenido</CardTitle>
              <CardDescription>Tu cuenta aún no está vinculada a un perfil de jugador</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Contacta con tu agente o administrador para que vincule tu cuenta a tu perfil de jugador.
              </p>
              <p className="text-xs text-slate-400 mt-4">
                Debug: user_id = {user.id}
              </p>
              {playerError && (
                <p className="text-xs text-red-400 mt-1">
                  Error: {playerError.message}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Obtener reportes semanales del jugador (de todos sus clubs)
  const playerClubIds = playerClubs.map(pc => pc.id);
  let weeklyReports: any[] = [];

  if (playerClubIds.length > 0) {
    const { data: reportsData } = await supabase
      .from("weekly_player_reports")
      .select(`
        *,
        player_club:player_clubs(
          club:clubs(name, code)
        )
      `)
      .in("player_club_id", playerClubIds)
      .order("week_start", { ascending: false })
      .limit(10);

    weeklyReports = reportsData || [];
  }

  // Calcular totales
  const totalRakeback = weeklyReports.reduce((sum, r) => sum + (r.player_rakeback || 0), 0);
  const totalResult = weeklyReports.reduce((sum, r) => sum + (r.result || 0), 0);
  const totalRake = weeklyReports.reduce((sum, r) => sum + (r.rake || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mi Dashboard</h1>
          <p className="text-slate-600 mt-1">Bienvenido, {profile?.full_name || player.nickname}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {playerClubs.length > 1 ? "Clubs" : "Club Actual"}
              </CardTitle>
              <Users className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {playerClubs.length > 0
                  ? playerClubs.map(pc => pc.club?.name).join(", ")
                  : "-"}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {playerClubs.length} club{playerClubs.length !== 1 ? "es" : ""} activo{playerClubs.length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Resultado Total
              </CardTitle>
              <DollarSign className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalResult >= 0 ? "text-green-600" : "text-red-600"}`}>
                {totalResult >= 0 ? "+" : ""}{totalResult.toFixed(2)}€
              </div>
              <p className="text-xs text-slate-500 mt-1">Rake generado: {totalRake.toFixed(2)}€</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Rakeback Acumulado
              </CardTitle>
              <DollarSign className="w-4 h-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{totalRakeback.toFixed(2)}€</div>
              <p className="text-xs text-slate-500 mt-1">Total histórico</p>
            </CardContent>
          </Card>
        </div>

        {/* Mis Clubs */}
        <Card>
          <CardHeader>
            <CardTitle>Mis Clubs</CardTitle>
            <CardDescription>Clubs donde juegas actualmente</CardDescription>
          </CardHeader>
          <CardContent>
            {playerClubs.length > 0 ? (
              <div className="space-y-3">
                {playerClubs.map((pc) => (
                  <div key={pc.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {pc.club?.logo_url && (
                        <img
                          src={pc.club.logo_url}
                          alt={pc.club.name}
                          className="w-12 h-12 object-contain rounded"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold text-slate-900">{pc.club?.name}</h3>
                        <p className="text-sm text-slate-600">
                          Código: {pc.club?.code}
                        </p>
                      </div>
                    </div>
                    <Badge variant="success">Activo</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">No estás asignado a ningún club</p>
            )}
          </CardContent>
        </Card>

        {/* Historial de Semanas */}
        <Card>
          <CardHeader>
            <CardTitle>Historial Semanal</CardTitle>
            <CardDescription>Tus últimas semanas de juego</CardDescription>
          </CardHeader>
          <CardContent>
            {weeklyReports.length > 0 ? (
              <div className="space-y-3">
                {weeklyReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between py-3 px-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-900">
                          Semana del {new Date(report.week_start).toLocaleDateString("es-ES")}
                        </p>
                        <p className="text-sm text-slate-500">
                          {report.player_club?.club?.name && (
                            <span className="mr-2">{report.player_club.club.name} •</span>
                          )}
                          Rake: {report.rake?.toFixed(2) || 0}€
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${(report.result || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {(report.result || 0) >= 0 ? "+" : ""}{(report.result || 0).toFixed(2)}€
                      </p>
                      <p className="text-sm text-yellow-600">
                        Rakeback: {(report.player_rakeback || 0).toFixed(2)}€
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">
                No hay reportes semanales todavía
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
