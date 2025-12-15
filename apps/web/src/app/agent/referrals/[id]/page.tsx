"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, DollarSign, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function ReferralDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [referral, setReferral] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    setLoading(true);

    // Verificar que el usuario es agente y que el jugador es su referido
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: agentData } = await supabase
      .from("players")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_agent", true)
      .single();

    if (!agentData) {
      router.push("/agent/dashboard");
      return;
    }

    // Obtener el referido (verificando que pertenece a este agente)
    const { data: referralData } = await supabase
      .from("players")
      .select(`
        id,
        full_name,
        nickname,
        status,
        player_clubs (
          id,
          agent_commission_percentage,
          club:clubs (id, name, code)
        )
      `)
      .eq("id", params.id)
      .eq("referred_by_agent_id", agentData.id)
      .single();

    if (!referralData) {
      router.push("/agent/referrals");
      return;
    }

    setReferral(referralData);
    setAuthorized(true);

    // Obtener reportes semanales del referido
    const playerClubIds = referralData.player_clubs?.map((pc: any) => pc.id) || [];

    if (playerClubIds.length > 0) {
      const { data: reportsData } = await supabase
        .from("weekly_player_reports")
        .select(`
          *,
          player_club:player_clubs (
            id,
            club:clubs (name)
          )
        `)
        .in("player_club_id", playerClubIds)
        .order("week_start", { ascending: false });

      setReports(reportsData || []);
    }

    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
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
  const totals = {
    pnl: reports.reduce((sum, r) => sum + parseFloat(r.pnl || 0), 0),
    rake: reports.reduce((sum, r) => sum + parseFloat(r.rake || 0), 0),
    hands: reports.reduce((sum, r) => sum + (r.hands || 0), 0),
    actionAmount: reports.reduce((sum, r) => sum + parseFloat(r.action_amount || 0), 0),
    playerAmount: reports.reduce((sum, r) => sum + parseFloat(r.player_amount || 0), 0),
    agentAmount: reports.reduce((sum, r) => sum + parseFloat(r.agent_amount || 0), 0),
  };

  if (loading) {
    return (
      <div className="p-8">
        <Loading message="Cargando datos..." />
      </div>
    );
  }

  if (!authorized || !referral) {
    return null;
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/agent/referrals">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {referral.nickname || referral.full_name}
            </h1>
            <p className="text-slate-600 mt-1">
              Reportes semanales de tu referido
            </p>
          </div>
          <Badge variant={referral.status === "active" ? "success" : "secondary"} className="ml-auto">
            {referral.status}
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Tu Ajuste Total</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(totals.agentAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Rake Generado</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(totals.rake)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${totals.pnl >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <DollarSign className={`w-6 h-6 ${totals.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <p className="text-sm text-slate-600">PNL Total</p>
                  <p className={`text-2xl font-bold ${totals.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(totals.pnl)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clubs y comisiones */}
        <Card>
          <CardHeader>
            <CardTitle>Clubs y Comisiones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {referral.player_clubs?.map((pc: any) => (
                <div key={pc.id} className="px-4 py-2 bg-slate-100 rounded-lg">
                  <span className="font-medium">{pc.club.name}</span>
                  <span className="ml-2 text-purple-600 font-semibold">{pc.agent_commission_percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reportes */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Reportes</CardTitle>
            <CardDescription>Reportes semanales del jugador</CardDescription>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <p className="text-center py-8 text-slate-600">
                No hay reportes todavía
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-300">
                      <th className="text-left py-3 px-2 font-semibold">Semana</th>
                      <th className="text-left py-3 px-2 font-semibold">Club</th>
                      <th className="text-right py-3 px-2 font-semibold">PNL ($)</th>
                      <th className="text-right py-3 px-2 font-semibold">Rake ($)</th>
                      <th className="text-right py-3 px-2 font-semibold">Manos</th>
                      <th className="text-right py-3 px-2 font-semibold">Action</th>
                      <th className="text-right py-3 px-2 font-semibold">Rakeback</th>
                      <th className="text-right py-3 px-2 font-semibold">Ajuste</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="py-3 px-2">
                          {formatDate(report.week_start)} - {formatDate(report.week_end)}
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant="secondary">{report.player_club?.club?.name}</Badge>
                        </td>
                        <td className={`py-3 px-2 text-right font-medium ${parseFloat(report.pnl) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(parseFloat(report.pnl || 0))}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {formatCurrency(parseFloat(report.rake || 0))}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {(report.hands || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <p className="font-medium text-slate-900">
                            {formatCurrency(parseFloat(report.action_amount || 0))}
                          </p>
                          <p className="text-xs text-slate-500">{report.action_percentage}%</p>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <p className="font-medium text-slate-900">
                            {formatCurrency(parseFloat(report.player_amount || 0))}
                          </p>
                          <p className="text-xs text-slate-500">{report.player_percentage}%</p>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <p className="font-bold text-purple-600">
                            {formatCurrency(parseFloat(report.agent_amount || 0))}
                          </p>
                          <p className="text-xs text-slate-500">{report.agent_commission_percentage}%</p>
                        </td>
                      </tr>
                    ))}
                    {/* Totals */}
                    <tr className="border-t-2 border-slate-400 bg-slate-50 font-bold">
                      <td className="py-3 px-2" colSpan={2}>TOTAL</td>
                      <td className={`py-3 px-2 text-right ${totals.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(totals.pnl)}
                      </td>
                      <td className="py-3 px-2 text-right">{formatCurrency(totals.rake)}</td>
                      <td className="py-3 px-2 text-right">{totals.hands.toLocaleString()}</td>
                      <td className="py-3 px-2 text-right">{formatCurrency(totals.actionAmount)}</td>
                      <td className="py-3 px-2 text-right">{formatCurrency(totals.playerAmount)}</td>
                      <td className="py-3 px-2 text-right text-purple-600">{formatCurrency(totals.agentAmount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
