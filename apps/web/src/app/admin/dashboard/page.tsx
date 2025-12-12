"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Building2, DollarSign, TrendingUp, Trophy, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface WeeklyProfit {
  weekStart: string;
  weekLabel: string;
  profit: number;
  rakeAction: number;
  rakeback: number;
}

interface PlayerRanking {
  id: string;
  name: string;
  playerCode: string;
  totalRake: number;
  clubName: string;
}

interface ActivePlayer {
  id: string;
  name: string;
  playerCode: string;
  rake: number;
  pnl: number;
}

export default function AdminDashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  // Stats
  const [lastWeekProfit, setLastWeekProfit] = useState(0);
  const [monthProfit, setMonthProfit] = useState(0);
  const [activePlayersCount, setActivePlayersCount] = useState(0);
  const [totalClubs, setTotalClubs] = useState(0);

  // Chart data
  const [weeklyProfits, setWeeklyProfits] = useState<WeeklyProfit[]>([]);

  // Active players this week
  const [activePlayers, setActivePlayers] = useState<ActivePlayer[]>([]);

  // Ranking
  const [rankingPeriod, setRankingPeriod] = useState("all");
  const [playerRanking, setPlayerRanking] = useState<PlayerRanking[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    loadRanking();
  }, [rankingPeriod]);

  const getLastMonday = (weeksAgo: number = 0) => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    let daysToSubtract;
    if (dayOfWeek === 0) {
      daysToSubtract = 6;
    } else {
      daysToSubtract = dayOfWeek - 1;
    }
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysToSubtract - (weeksAgo * 7));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const formatDateISO = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const loadDashboardData = async () => {
    setLoading(true);

    // Get clubs with their agreements
    const { data: clubs } = await supabase
      .from("clubs")
      .select(`
        id,
        name,
        diamond_club_agreement_type,
        diamond_club_fixed_percentage,
        diamond_club_template_id
      `)
      .eq("is_active", true);

    setTotalClubs(clubs?.length || 0);

    // Load diamond club rules for dynamic agreements
    const templateIds = clubs?.filter(c => c.diamond_club_agreement_type === 'dynamic' && c.diamond_club_template_id)
      .map(c => c.diamond_club_template_id) || [];

    let diamondClubRules: any[] = [];
    if (templateIds.length > 0) {
      const { data: rules } = await supabase
        .from("diamond_club_agreement_rules")
        .select("*")
        .in("template_id", templateIds)
        .order("priority", { ascending: false });
      diamondClubRules = rules || [];
    }

    // Get all weekly player reports
    const { data: allReports } = await supabase
      .from("weekly_player_reports")
      .select(`
        *,
        player_club:player_clubs (
          club_id,
          club:clubs (
            id,
            name,
            diamond_club_agreement_type,
            diamond_club_fixed_percentage,
            diamond_club_template_id
          )
        )
      `)
      .order("week_start", { ascending: false });

    // Calculate profits per week per club
    const weekClubData: Record<string, Record<string, { rakeAction: number, rake: number, pnl: number, rakeback: number }>> = {};

    allReports?.forEach(report => {
      const weekKey = report.week_start;
      const clubId = report.player_club?.club_id;

      if (!weekKey || !clubId) return;

      if (!weekClubData[weekKey]) {
        weekClubData[weekKey] = {};
      }
      if (!weekClubData[weekKey][clubId]) {
        weekClubData[weekKey][clubId] = { rakeAction: 0, rake: 0, pnl: 0, rakeback: 0 };
      }

      weekClubData[weekKey][clubId].rakeAction += parseFloat(report.rake_action) || 0;
      weekClubData[weekKey][clubId].rake += parseFloat(report.rake) || 0;
      weekClubData[weekKey][clubId].pnl += parseFloat(report.pnl) || 0;
      weekClubData[weekKey][clubId].rakeback += parseFloat(report.player_amount) || 0;
    });

    // Calculate Diamond profit for each week
    const calculateDiamondProfit = (weekKey: string) => {
      const clubsData = weekClubData[weekKey];
      if (!clubsData) return { profit: 0, rakeAction: 0, rakeback: 0 };

      let totalProfit = 0;
      let totalRakeAction = 0;
      let totalRakeback = 0;

      Object.entries(clubsData).forEach(([clubId, data]) => {
        const club = clubs?.find(c => c.id === clubId);
        if (!club) return;

        totalRakeAction += data.rakeAction;
        totalRakeback += data.rakeback;

        // Calculate Diamond amount from club
        let diamondPercentage = 0;
        if (club.diamond_club_agreement_type === 'fixed') {
          diamondPercentage = parseFloat(club.diamond_club_fixed_percentage) || 0;
        } else if (club.diamond_club_template_id) {
          const rawRatio = data.rake > 0 ? data.pnl / data.rake : 0;
          const ratio = Math.max(-1, Math.min(1, rawRatio));

          const clubRules = diamondClubRules.filter(r => r.template_id === club.diamond_club_template_id);
          for (const rule of clubRules) {
            const ratioMatches = ratio >= rule.ratio_min && (rule.ratio_max === null || ratio <= rule.ratio_max);
            const rakeMatches = data.rake >= rule.rake_min && (rule.rake_max === null || data.rake <= rule.rake_max);
            if (ratioMatches && rakeMatches) {
              diamondPercentage = parseFloat(rule.diamond_percentage);
              break;
            }
          }
        }

        const diamondFromClub = data.rakeAction * (diamondPercentage / 100);
        totalProfit += diamondFromClub - data.rakeback;
      });

      return { profit: totalProfit, rakeAction: totalRakeAction, rakeback: totalRakeback };
    };

    // Get last week profit
    const lastWeekStart = formatDateISO(getLastMonday(1));
    const lastWeekData = calculateDiamondProfit(lastWeekStart);
    setLastWeekProfit(lastWeekData.profit);

    // Get current month profit
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    let monthTotal = 0;
    Object.keys(weekClubData).forEach(weekKey => {
      const weekDate = new Date(weekKey);
      if (weekDate >= firstDayOfMonth) {
        monthTotal += calculateDiamondProfit(weekKey).profit;
      }
    });
    setMonthProfit(monthTotal);

    // Build weekly profits for chart (last 12 weeks)
    const chartData: WeeklyProfit[] = [];
    for (let i = 11; i >= 0; i--) {
      const monday = getLastMonday(i);
      const weekKey = formatDateISO(monday);
      const data = calculateDiamondProfit(weekKey);

      chartData.push({
        weekStart: weekKey,
        weekLabel: monday.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
        profit: Math.round(data.profit * 100) / 100,
        rakeAction: Math.round(data.rakeAction * 100) / 100,
        rakeback: Math.round(data.rakeback * 100) / 100,
      });
    }
    setWeeklyProfits(chartData);

    // Get active players this week (last week that has data)
    const thisWeekStart = formatDateISO(getLastMonday(1));
    const { data: weekReports } = await supabase
      .from("weekly_player_reports")
      .select(`
        pnl,
        rake,
        player_club:player_clubs (
          player:players (
            id,
            full_name,
            nickname,
            player_code
          )
        )
      `)
      .eq("week_start", thisWeekStart);

    const activeList: ActivePlayer[] = (weekReports || []).map((r: any) => ({
      id: r.player_club?.player?.id,
      name: r.player_club?.player?.nickname || r.player_club?.player?.full_name,
      playerCode: r.player_club?.player?.player_code,
      rake: parseFloat(r.rake) || 0,
      pnl: parseFloat(r.pnl) || 0,
    })).filter((p: ActivePlayer) => p.id);

    setActivePlayers(activeList);
    setActivePlayersCount(activeList.length);

    setLoading(false);
  };

  const loadRanking = async () => {
    let dateFilter: Date | null = null;
    const now = new Date();

    switch (rankingPeriod) {
      case "week":
        dateFilter = getLastMonday(1);
        break;
      case "month":
        dateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "3months":
        dateFilter = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case "6months":
        dateFilter = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        break;
      case "12months":
        dateFilter = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
    }

    let query = supabase
      .from("weekly_player_reports")
      .select(`
        rake,
        player_club:player_clubs (
          player:players (
            id,
            full_name,
            nickname,
            player_code
          ),
          club:clubs (
            name
          )
        )
      `);

    if (dateFilter) {
      query = query.gte("week_start", formatDateISO(dateFilter));
    }

    const { data: reports } = await query;

    // Aggregate by player
    const playerTotals: Record<string, { name: string, playerCode: string, totalRake: number, clubName: string }> = {};

    reports?.forEach((r: any) => {
      const playerId = r.player_club?.player?.id;
      if (!playerId) return;

      if (!playerTotals[playerId]) {
        playerTotals[playerId] = {
          name: r.player_club?.player?.nickname || r.player_club?.player?.full_name,
          playerCode: r.player_club?.player?.player_code,
          totalRake: 0,
          clubName: r.player_club?.club?.name || '',
        };
      }
      playerTotals[playerId].totalRake += parseFloat(r.rake) || 0;
    });

    const ranking = Object.entries(playerTotals)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.totalRake - a.totalRake)
      .slice(0, 10);

    setPlayerRanking(ranking);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">
            Resumen de ganancias y actividad de Diamond Deals
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Beneficio Semana Anterior</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${lastWeekProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${lastWeekProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-green-700 mt-1">
                Beneficio neto Diamond
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Beneficio del Mes</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${monthProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                ${monthProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-blue-700 mt-1">
                Acumulado {new Date().toLocaleDateString('es-ES', { month: 'long' })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jugadores Activos</CardTitle>
              <Users className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activePlayersCount}</div>
              <p className="text-xs text-slate-600 mt-1">
                Semana anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clubs Activos</CardTitle>
              <Building2 className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClubs}</div>
              <p className="text-xs text-slate-600 mt-1">
                En operación
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Weekly Profit Evolution */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Evolución de Beneficios (12 semanas)
              </CardTitle>
              <CardDescription>
                Beneficio neto de Diamond Deals por semana
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyProfits}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="weekLabel" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Beneficio']}
                      labelFormatter={(label) => `Semana: ${label}`}
                    />
                    <Bar
                      dataKey="profit"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Active Players This Week */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Jugadores Activos
              </CardTitle>
              <CardDescription>
                Jugadores que jugaron la semana anterior
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activePlayers.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Users className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>No hay datos de la semana anterior</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {activePlayers.slice(0, 10).map((player, idx) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-400 w-6">
                          {idx + 1}.
                        </span>
                        <div>
                          <p className="font-medium text-slate-900">{player.name}</p>
                          <p className="text-xs text-slate-500 font-mono">{player.playerCode}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-900">
                          ${player.rake.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <p className={`text-xs ${player.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          PNL: ${player.pnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ranking */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Ranking de Rake
                  </CardTitle>
                  <CardDescription>
                    Top 10 jugadores por rake generado
                  </CardDescription>
                </div>
                <Select value={rankingPeriod} onValueChange={setRankingPeriod}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todo</SelectItem>
                    <SelectItem value="week">Última semana</SelectItem>
                    <SelectItem value="month">Último mes</SelectItem>
                    <SelectItem value="3months">3 meses</SelectItem>
                    <SelectItem value="6months">6 meses</SelectItem>
                    <SelectItem value="12months">12 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {playerRanking.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Trophy className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>No hay datos en este período</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {playerRanking.map((player, idx) => (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        idx === 0 ? 'bg-yellow-50 border border-yellow-200' :
                        idx === 1 ? 'bg-slate-100 border border-slate-200' :
                        idx === 2 ? 'bg-orange-50 border border-orange-200' :
                        'bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-bold w-6 ${
                          idx === 0 ? 'text-yellow-500' :
                          idx === 1 ? 'text-slate-400' :
                          idx === 2 ? 'text-orange-400' :
                          'text-slate-400'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-medium text-slate-900">{player.name}</p>
                          <p className="text-xs text-slate-500">{player.clubName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">
                          ${player.totalRake.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-slate-500">rake</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
