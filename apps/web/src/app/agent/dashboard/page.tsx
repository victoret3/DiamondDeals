"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { createClient } from "@/lib/supabase/client";
import { Users, DollarSign, TrendingUp, Calendar } from "lucide-react";
import Link from "next/link";

export default function AgentDashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [agentData, setAgentData] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<any[]>([]);

  useEffect(() => {
    loadAgentData();
  }, []);

  const loadAgentData = async () => {
    setLoading(true);

    // Obtener datos del agente actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: playerData } = await supabase
      .from("players")
      .select("*")
      .eq("user_id", user.id)
      .single();

    setAgentData(playerData);

    // Obtener referidos
    const { data: referralsData } = await supabase
      .from("players")
      .select(`
        *,
        player_clubs (
          id,
          agent_commission_percentage,
          club:clubs (id, name)
        )
      `)
      .eq("referred_by_agent_id", playerData?.id);

    if (referralsData) setReferrals(referralsData);

    // Obtener reportes semanales de referidos (últimas 4 semanas)
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    // Obtener todos los player_club_ids de los referidos
    const playerClubIds = referralsData?.flatMap((r: any) =>
      r.player_clubs?.map((pc: any) => pc.id) || []
    ) || [];

    if (playerClubIds.length > 0) {
      const { data: reportsData } = await supabase
        .from("weekly_player_reports")
        .select(`
          *,
          player_club:player_clubs (
            id,
            player:players (full_name, nickname),
            club:clubs (name)
          )
        `)
        .gte("week_start", fourWeeksAgo.toISOString().split("T")[0])
        .in("player_club_id", playerClubIds)
        .order("week_start", { ascending: false });

      if (reportsData) setWeeklyReports(reportsData);
    }

    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
    });
  };

  // Calcular totales
  const totalCommissions = weeklyReports.reduce(
    (sum, r) => sum + parseFloat(r.agent_amount || 0),
    0
  );

  const activeReferrals = referrals.filter((r) => r.status === "active").length;

  if (loading) {
    return (
      <div className="p-8">
        <Loading message="Cargando dashboard..." />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Panel de Agente
          </h1>
          <p className="text-slate-600 mt-1">
            Bienvenido {agentData?.nickname || agentData?.full_name}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referidos</CardTitle>
              <Users className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{referrals.length}</div>
              <p className="text-xs text-slate-600 mt-1">
                {activeReferrals} activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comisiones (últimas 4 sem.)</CardTitle>
              <DollarSign className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalCommissions)}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {weeklyReports.length} reportes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio por Semana</CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(weeklyReports.length > 0 ? totalCommissions / 4 : 0)}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Últimas 4 semanas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clubs Activos</CardTitle>
              <Calendar className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(referrals.flatMap((r: any) => r.player_clubs?.map((pc: any) => pc.club?.id) || [])).size}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Clubs con referidos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Referidos */}
        <Card>
          <CardHeader>
            <CardTitle>Mis Referidos</CardTitle>
            <CardDescription>
              Jugadores que has referido al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <p className="text-center py-8 text-slate-600">
                Aún no tienes referidos
              </p>
            ) : (
              <div className="space-y-3">
                {referrals.map((referral) => (
                  <div key={referral.id} className="p-4 bg-slate-50 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-slate-900">
                          {referral.nickname || referral.full_name}
                        </p>
                        <p className="text-sm text-slate-600">
                          {referral.email}
                        </p>
                      </div>
                      <Badge variant={referral.status === "active" ? "success" : "warning"}>
                        {referral.status === "active" ? "Activo" : "Pendiente"}
                      </Badge>
                    </div>

                    {referral.player_clubs && referral.player_clubs.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {referral.player_clubs.map((pc: any) => (
                          <div
                            key={pc.id}
                            className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full"
                          >
                            {pc.club.name} - {pc.agent_commission_percentage}% comisión
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comisiones Recientes */}
        <Card>
          <CardHeader>
            <CardTitle>Comisiones Recientes</CardTitle>
            <CardDescription>
              Últimas 10 comisiones ganadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {weeklyReports.length === 0 ? (
              <p className="text-center py-8 text-slate-600">
                Aún no hay comisiones registradas
              </p>
            ) : (
              <div className="space-y-3">
                {weeklyReports.slice(0, 10).map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {report.player_club.player.nickname ||
                          report.player_club.player.full_name}
                      </p>
                      <p className="text-sm text-slate-600">
                        {report.player_club.club.name} · {formatDate(report.week_start)} -{" "}
                        {formatDate(report.week_end)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        {formatCurrency(parseFloat(report.agent_amount || 0))}
                      </p>
                      <p className="text-xs text-slate-500">
                        {report.agent_commission_percentage}% comisión
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
