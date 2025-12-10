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
  const { data: player } = await supabase
    .from("players")
    .select(`
      *,
      club:clubs(id, name, code, logo_url, base_rakeback_percentage)
    `)
    .eq("user_id", user.id)
    .single();

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
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Obtener reportes semanales del jugador
  const { data: weeklyReports } = await supabase
    .from("weekly_player_reports")
    .select("*")
    .eq("player_id", player.id)
    .order("week_start", { ascending: false })
    .limit(10);

  // Calcular totales
  const totalRakeback = weeklyReports?.reduce((sum, r) => sum + (r.player_rakeback || 0), 0) || 0;
  const totalResult = weeklyReports?.reduce((sum, r) => sum + (r.result || 0), 0) || 0;
  const totalRake = weeklyReports?.reduce((sum, r) => sum + (r.rake || 0), 0) || 0;

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
                Club Actual
              </CardTitle>
              <Users className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{player.club?.name || "-"}</div>
              <p className="text-xs text-slate-500 mt-1">
                Rakeback base: {player.club?.base_rakeback_percentage || 0}%
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

        {/* Mi Club */}
        <Card>
          <CardHeader>
            <CardTitle>Mi Club</CardTitle>
            <CardDescription>Información de tu club actual</CardDescription>
          </CardHeader>
          <CardContent>
            {player.club ? (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  {player.club.logo_url && (
                    <img
                      src={player.club.logo_url}
                      alt={player.club.name}
                      className="w-12 h-12 object-contain rounded"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-slate-900">{player.club.name}</h3>
                    <p className="text-sm text-slate-600">
                      Código: {player.club.code}
                    </p>
                  </div>
                </div>
                <Badge variant="success">Activo</Badge>
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
            {weeklyReports && weeklyReports.length > 0 ? (
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
