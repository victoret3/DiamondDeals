"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { Calendar, DollarSign, TrendingUp } from "lucide-react";

interface WeeklyReport {
  id: string;
  week_start: string;
  week_end: string;
  pnl: number;
  rake: number;
  hands: number;
  action_percentage: number;
  action_amount: number;
  rake_action: number;
  player_percentage: number;
  player_amount: number;
  club_name: string;
}

export default function PlayerReportsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<any>(null);
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string>("all");
  const [playerClubs, setPlayerClubs] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (player) {
      loadReports();
    }
  }, [selectedClubId, player]);

  const loadData = async () => {
    setLoading(true);

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Get player associated with user
    const { data: playerData } = await supabase
      .from("players")
      .select("id, full_name, nickname, player_code")
      .eq("user_id", user.id)
      .single();

    if (!playerData) {
      setLoading(false);
      return;
    }

    setPlayer(playerData);

    // Get player's clubs
    const { data: clubsData } = await supabase
      .from("player_clubs")
      .select(`
        id,
        club:clubs (id, name, code)
      `)
      .eq("player_id", playerData.id);

    setPlayerClubs(clubsData || []);
    setLoading(false);
  };

  const loadReports = async () => {
    if (!player) return;

    // Get player_club ids
    let playerClubIds: string[] = [];

    if (selectedClubId === "all") {
      playerClubIds = playerClubs.map(pc => pc.id);
    } else {
      const pc = playerClubs.find(pc => pc.club.id === selectedClubId);
      if (pc) playerClubIds = [pc.id];
    }

    if (playerClubIds.length === 0) {
      setReports([]);
      return;
    }

    const { data: reportsData } = await supabase
      .from("weekly_player_reports")
      .select(`
        id,
        week_start,
        week_end,
        pnl,
        rake,
        hands,
        action_percentage,
        action_amount,
        rake_action,
        player_percentage,
        player_amount,
        player_club:player_clubs (
          club:clubs (name)
        )
      `)
      .in("player_club_id", playerClubIds)
      .order("week_start", { ascending: false });

    const formattedReports: WeeklyReport[] = (reportsData || []).map((r: any) => ({
      id: r.id,
      week_start: r.week_start,
      week_end: r.week_end,
      pnl: parseFloat(r.pnl) || 0,
      rake: parseFloat(r.rake) || 0,
      hands: r.hands || 0,
      action_percentage: parseFloat(r.action_percentage) || 0,
      action_amount: parseFloat(r.action_amount) || 0,
      rake_action: parseFloat(r.rake_action) || 0,
      player_percentage: parseFloat(r.player_percentage) || 0,
      player_amount: parseFloat(r.player_amount) || 0,
      club_name: r.player_club?.club?.name || '',
    }));

    setReports(formattedReports);
  };

  const formatDateShort = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  // Calculate totals
  const totals = {
    pnl: reports.reduce((sum, r) => sum + r.pnl, 0),
    rake: reports.reduce((sum, r) => sum + r.rake, 0),
    hands: reports.reduce((sum, r) => sum + r.hands, 0),
    actionAmount: reports.reduce((sum, r) => sum + r.action_amount, 0),
    playerAmount: reports.reduce((sum, r) => sum + r.player_amount, 0),
    ajuste: reports.reduce((sum, r) => sum + r.action_amount + r.player_amount, 0),
  };

  if (loading) {
    return (
      <div className="p-8">
        <Loading message="Cargando reportes..." />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-8 text-center text-slate-600">
            No tienes un perfil de jugador asociado a tu cuenta.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mis Reportes Semanales</h1>
          <p className="text-slate-600 mt-1">
            Historial de tus resultados y rakeback
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Rakeback Total</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ${totals.playerAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-blue-700 mt-1">
                Acumulado histórico
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rake Generado</CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totals.rake.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Total histórico
              </p>
            </CardContent>
          </Card>

          <Card className={totals.pnl >= 0 ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${totals.pnl >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                PNL Total
              </CardTitle>
              <DollarSign className={`h-4 w-4 ${totals.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totals.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${totals.pnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p className={`text-xs mt-1 ${totals.pnl >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                Resultado acumulado
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Calendar className="w-5 h-5 text-purple-600" />
              <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por club" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los clubs</SelectItem>
                  {playerClubs.map((pc) => (
                    <SelectItem key={pc.club.id} value={pc.club.id}>
                      {pc.club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reports Table */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Semanas</CardTitle>
            <CardDescription>
              Detalle de tus resultados semanales
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <p className="text-center py-8 text-slate-600">
                No hay reportes semanales todavía
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
                          <p className="font-medium text-slate-900">
                            {formatDateShort(report.week_start)} - {formatDateShort(report.week_end)}
                          </p>
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant="secondary">{report.club_name}</Badge>
                        </td>
                        <td className={`py-3 px-2 text-right font-medium ${report.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${report.pnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-2 text-right">
                          ${report.rake.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {report.hands.toLocaleString('en-US')}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <p className="font-medium text-purple-600">
                            ${report.action_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-slate-500">{report.action_percentage}%</p>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <p className="font-bold text-slate-900">
                            ${report.player_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-slate-500">{report.player_percentage}%</p>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <p className="font-bold text-green-600">
                            ${(report.action_amount + report.player_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                        </td>
                      </tr>
                    ))}
                    {/* Totals Row */}
                    <tr className="border-t-2 border-slate-400 bg-slate-50 font-bold">
                      <td className="py-3 px-2 text-slate-900" colSpan={2}>TOTAL</td>
                      <td className={`py-3 px-2 text-right ${totals.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${totals.pnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-2 text-right text-slate-900">
                        ${totals.rake.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-2 text-right text-slate-900">
                        {totals.hands.toLocaleString('en-US')}
                      </td>
                      <td className="py-3 px-2 text-right text-purple-600">
                        ${totals.actionAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-2 text-right text-slate-900">
                        ${totals.playerAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-2 text-right text-green-600">
                        ${totals.ajuste.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
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
