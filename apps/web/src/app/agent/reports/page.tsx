"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { Calendar, DollarSign, TrendingUp, Users, Wallet } from "lucide-react";

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

interface ReferralReport {
  id: string;
  week_start: string;
  week_end: string;
  player_name: string;
  player_code: string;
  club_name: string;
  rake: number;
  player_amount: number;
  agent_commission_percentage: number;
  agent_amount: number;
}

export default function AgentReportsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState<any>(null);

  // Own reports (as player)
  const [ownReports, setOwnReports] = useState<WeeklyReport[]>([]);
  const [playerClubs, setPlayerClubs] = useState<any[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string>("all");

  // Referral reports
  const [referralReports, setReferralReports] = useState<ReferralReport[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string>("all");
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (agent) {
      loadOwnReports();
    }
  }, [selectedClubId, agent]);

  useEffect(() => {
    if (agent) {
      loadReferralReports();
    }
  }, [selectedWeek, agent]);

  const loadData = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Get agent data
    const { data: agentData } = await supabase
      .from("players")
      .select("id, full_name, nickname, player_code, is_agent")
      .eq("user_id", user.id)
      .single();

    if (!agentData || !agentData.is_agent) {
      setLoading(false);
      return;
    }

    setAgent(agentData);

    // Get agent's clubs
    const { data: clubsData } = await supabase
      .from("player_clubs")
      .select(`id, club:clubs (id, name, code)`)
      .eq("player_id", agentData.id);

    setPlayerClubs(clubsData || []);

    // Get available weeks from referral reports
    const { data: weeksData } = await supabase
      .from("weekly_player_reports")
      .select("week_start")
      .order("week_start", { ascending: false });

    const uniqueWeeks = [...new Set(weeksData?.map(w => w.week_start) || [])];
    setAvailableWeeks(uniqueWeeks);

    setLoading(false);
  };

  const loadOwnReports = async () => {
    if (!agent) return;

    let playerClubIds: string[] = [];
    if (selectedClubId === "all") {
      playerClubIds = playerClubs.map(pc => pc.id);
    } else {
      const pc = playerClubs.find(pc => pc.club.id === selectedClubId);
      if (pc) playerClubIds = [pc.id];
    }

    if (playerClubIds.length === 0) {
      setOwnReports([]);
      return;
    }

    const { data: reportsData } = await supabase
      .from("weekly_player_reports")
      .select(`
        id, week_start, week_end, pnl, rake, hands,
        action_percentage, action_amount, rake_action,
        player_percentage, player_amount,
        player_club:player_clubs (club:clubs (name))
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

    setOwnReports(formattedReports);
  };

  const loadReferralReports = async () => {
    if (!agent) return;

    // Get referrals
    const { data: referrals } = await supabase
      .from("players")
      .select("id, full_name, nickname, player_code, agent_commission_percentage")
      .eq("referred_by_agent_id", agent.id);

    if (!referrals || referrals.length === 0) {
      setReferralReports([]);
      return;
    }

    // Get player_club ids for all referrals
    const referralIds = referrals.map(r => r.id);
    const { data: playerClubsData } = await supabase
      .from("player_clubs")
      .select("id, player_id, club:clubs (name)")
      .in("player_id", referralIds);

    if (!playerClubsData || playerClubsData.length === 0) {
      setReferralReports([]);
      return;
    }

    const playerClubMap = new Map<string, any>();
    playerClubsData.forEach(pc => {
      playerClubMap.set(pc.id, pc);
    });

    // Get reports
    let query = supabase
      .from("weekly_player_reports")
      .select(`
        id, week_start, week_end, rake, player_amount,
        agent_commission_percentage, agent_amount,
        player_club_id
      `)
      .in("player_club_id", playerClubsData.map(pc => pc.id))
      .order("week_start", { ascending: false });

    if (selectedWeek !== "all") {
      query = query.eq("week_start", selectedWeek);
    }

    const { data: reportsData } = await query;

    const formattedReports: ReferralReport[] = (reportsData || []).map((r: any) => {
      const playerClub = playerClubMap.get(r.player_club_id);
      const player = referrals.find(ref => ref.id === playerClub?.player_id);

      return {
        id: r.id,
        week_start: r.week_start,
        week_end: r.week_end,
        player_name: player?.nickname || player?.full_name || '',
        player_code: player?.player_code || '',
        club_name: playerClub?.club?.name || '',
        rake: parseFloat(r.rake) || 0,
        player_amount: parseFloat(r.player_amount) || 0,
        agent_commission_percentage: parseFloat(r.agent_commission_percentage) || 0,
        agent_amount: parseFloat(r.agent_amount) || 0,
      };
    });

    setReferralReports(formattedReports);
  };

  const formatDateShort = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  // Own totals
  const ownTotals = {
    pnl: ownReports.reduce((sum, r) => sum + r.pnl, 0),
    rake: ownReports.reduce((sum, r) => sum + r.rake, 0),
    hands: ownReports.reduce((sum, r) => sum + r.hands, 0),
    actionAmount: ownReports.reduce((sum, r) => sum + r.action_amount, 0),
    playerAmount: ownReports.reduce((sum, r) => sum + r.player_amount, 0),
    ajuste: ownReports.reduce((sum, r) => sum + r.action_amount + r.player_amount, 0),
  };

  // Referral totals
  const referralTotals = {
    rake: referralReports.reduce((sum, r) => sum + r.rake, 0),
    playerAmount: referralReports.reduce((sum, r) => sum + r.player_amount, 0),
    agentAmount: referralReports.reduce((sum, r) => sum + r.agent_amount, 0),
  };

  if (loading) {
    return (
      <div className="p-8">
        <Loading message="Cargando reportes..." />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-8 text-center text-slate-600">
            No tienes permisos de agente.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mis Reportes</h1>
          <p className="text-slate-600 mt-1">
            Tus resultados y comisiones de referidos
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Mi Rakeback</CardTitle>
              <Wallet className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ${ownTotals.playerAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-blue-700 mt-1">Como jugador</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Comisiones Referidos</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${referralTotals.agentAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-green-700 mt-1">De tus referidos</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Total Ganancias</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                ${(ownTotals.playerAmount + referralTotals.agentAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-purple-700 mt-1">Rakeback + Comisiones</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="own" className="space-y-6">
          <TabsList>
            <TabsTrigger value="own">Mis Resultados</TabsTrigger>
            <TabsTrigger value="referrals">Comisiones Referidos</TabsTrigger>
          </TabsList>

          {/* Own Reports Tab */}
          <TabsContent value="own" className="space-y-6">
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

            <Card>
              <CardHeader>
                <CardTitle>Mi Historial de Semanas</CardTitle>
                <CardDescription>Tus resultados como jugador</CardDescription>
              </CardHeader>
              <CardContent>
                {ownReports.length === 0 ? (
                  <p className="text-center py-8 text-slate-600">No hay reportes</p>
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
                        {ownReports.map((report) => (
                          <tr key={report.id} className="border-b border-slate-200 hover:bg-slate-50">
                            <td className="py-3 px-2">
                              {formatDateShort(report.week_start)} - {formatDateShort(report.week_end)}
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
                            <td className="py-3 px-2 text-right">{report.hands}</td>
                            <td className="py-3 px-2 text-right">
                              <p className="font-medium text-purple-600">
                                ${report.action_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-slate-500">{report.action_percentage}%</p>
                            </td>
                            <td className="py-3 px-2 text-right">
                              <p className="font-bold">
                                ${report.player_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-slate-500">{report.player_percentage}%</p>
                            </td>
                            <td className="py-3 px-2 text-right font-bold text-green-600">
                              ${(report.action_amount + report.player_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-slate-400 bg-slate-50 font-bold">
                          <td className="py-3 px-2" colSpan={2}>TOTAL</td>
                          <td className={`py-3 px-2 text-right ${ownTotals.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${ownTotals.pnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-2 text-right">
                            ${ownTotals.rake.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-2 text-right">{ownTotals.hands}</td>
                          <td className="py-3 px-2 text-right text-purple-600">
                            ${ownTotals.actionAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-2 text-right">
                            ${ownTotals.playerAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-2 text-right text-green-600">
                            ${ownTotals.ajuste.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referral Reports Tab */}
          <TabsContent value="referrals" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filtrar por semana" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las semanas</SelectItem>
                      {availableWeeks.map((week) => (
                        <SelectItem key={week} value={week}>
                          {formatDateShort(week)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comisiones de Referidos</CardTitle>
                <CardDescription>Lo que ganas de tus jugadores referidos</CardDescription>
              </CardHeader>
              <CardContent>
                {referralReports.length === 0 ? (
                  <p className="text-center py-8 text-slate-600">No hay reportes de referidos</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-slate-300">
                          <th className="text-left py-3 px-2 font-semibold">Semana</th>
                          <th className="text-left py-3 px-2 font-semibold">Jugador</th>
                          <th className="text-left py-3 px-2 font-semibold">Club</th>
                          <th className="text-right py-3 px-2 font-semibold">Rake ($)</th>
                          <th className="text-right py-3 px-2 font-semibold">Su Rakeback</th>
                          <th className="text-right py-3 px-2 font-semibold">Tu Comisión</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referralReports.map((report) => (
                          <tr key={report.id} className="border-b border-slate-200 hover:bg-slate-50">
                            <td className="py-3 px-2">
                              {formatDateShort(report.week_start)} - {formatDateShort(report.week_end)}
                            </td>
                            <td className="py-3 px-2">
                              <p className="font-medium">{report.player_name}</p>
                              <p className="text-xs text-slate-500 font-mono">{report.player_code}</p>
                            </td>
                            <td className="py-3 px-2">
                              <Badge variant="secondary">{report.club_name}</Badge>
                            </td>
                            <td className="py-3 px-2 text-right">
                              ${report.rake.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-2 text-right">
                              ${report.player_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-2 text-right">
                              <p className="font-bold text-green-600">
                                ${report.agent_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-slate-500">{report.agent_commission_percentage}%</p>
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-slate-400 bg-slate-50 font-bold">
                          <td className="py-3 px-2" colSpan={3}>TOTAL</td>
                          <td className="py-3 px-2 text-right">
                            ${referralTotals.rake.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-2 text-right">
                            ${referralTotals.playerAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-2 text-right text-green-600">
                            ${referralTotals.agentAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
