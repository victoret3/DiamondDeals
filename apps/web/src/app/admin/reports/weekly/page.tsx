"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { Calendar, ChevronLeft, ChevronRight, Save, Check, AlertCircle, Building2 } from "lucide-react";

export default function WeeklyReportsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getLastMonday());
  const [clubs, setClubs] = useState<any[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string>("");
  const [playerClubs, setPlayerClubs] = useState<any[]>([]);
  const [reports, setReports] = useState<Record<string, any>>({});
  const [diamondClubRules, setDiamondClubRules] = useState<any[]>([]);

  useEffect(() => {
    loadClubs();
  }, []);

  useEffect(() => {
    if (selectedClubId) {
      loadClubData();
      loadDiamondClubRules();
    }
  }, [currentWeekStart, selectedClubId]);

  const loadDiamondClubRules = async () => {
    const club = clubs.find(c => c.id === selectedClubId);
    if (!club || club.diamond_club_agreement_type !== 'dynamic' || !club.diamond_club_template_id) {
      setDiamondClubRules([]);
      return;
    }

    const { data } = await supabase
      .from("diamond_club_agreement_rules")
      .select("*")
      .eq("template_id", club.diamond_club_template_id)
      .order("priority", { ascending: false });

    if (data) {
      setDiamondClubRules(data);
    }
  };

  function getLastMonday() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Calculate days to subtract to get to last Monday (week starts on Monday)
    let daysToSubtract;
    if (dayOfWeek === 0) {
      // Sunday: go back 6 days to get this week's Monday, then 7 more = 13 total
      daysToSubtract = 13;
    } else if (dayOfWeek === 1) {
      // Monday: go back 7 days to get last Monday
      daysToSubtract = 7;
    } else {
      // Tuesday (2) through Saturday (6):
      // Go back (dayOfWeek - 1) days to get to this week's Monday, then 7 more
      daysToSubtract = (dayOfWeek - 1) + 7;
    }

    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - daysToSubtract);
    lastMonday.setHours(0, 0, 0, 0);

    return lastMonday;
  }

  function getWeekEnd(weekStart: Date) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return weekEnd;
  }

  function formatDateShort(date: Date) {
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  }

  function formatDateISO(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const loadClubs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("clubs")
      .select(`
        id,
        name,
        code,
        logo_url,
        diamond_club_agreement_type,
        diamond_club_fixed_percentage,
        diamond_club_template_id
      `)
      .eq("is_active", true)
      .order("name");

    if (data && data.length > 0) {
      setClubs(data);
      setSelectedClubId(data[0].id);
    }
    setLoading(false);
  };

  const loadClubData = async () => {
    if (!selectedClubId) return;

    setLoading(true);
    const weekEnd = getWeekEnd(currentWeekStart);

    console.log('=== LOADING CLUB DATA ===');
    console.log('Selected Club ID:', selectedClubId);
    console.log('Week Start:', formatDateISO(currentWeekStart));
    console.log('Week End:', formatDateISO(weekEnd));

    // Cargar player_clubs solo del club seleccionado
    const { data: playerClubsData, error: playerClubsError } = await supabase
      .from("player_clubs")
      .select(`
        id,
        player:players (
          id,
          full_name,
          nickname,
          player_code
        )
      `)
      .eq("club_id", selectedClubId)
      .order("player(full_name)");

    console.log('Player Clubs Data:', playerClubsData);
    console.log('Player Clubs Error:', playerClubsError);

    if (playerClubsData) {
      setPlayerClubs(playerClubsData);

      // Cargar reportes existentes para esta semana y este club
      const playerClubIds = playerClubsData.map(pc => pc.id);
      console.log('Player Club IDs:', playerClubIds);

      const { data: reportsData, error: reportsError } = await supabase
        .from("weekly_player_reports")
        .select("*")
        .in("player_club_id", playerClubIds)
        .eq("week_start", formatDateISO(currentWeekStart))
        .eq("week_end", formatDateISO(weekEnd));

      console.log('Reports Data:', reportsData);
      console.log('Reports Error:', reportsError);

      if (reportsData) {
        const reportsMap: Record<string, any> = {};
        reportsData.forEach(report => {
          reportsMap[report.player_club_id] = report;
        });
        console.log('Reports Map:', reportsMap);
        setReports(reportsMap);
      } else {
        setReports({});
      }
    }

    setLoading(false);
  };

  const previousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const updateReportField = (playerClubId: string, field: string, value: string) => {
    setReports(prev => ({
      ...prev,
      [playerClubId]: {
        ...(prev[playerClubId] || {}),
        player_club_id: playerClubId,
        [field]: value
      }
    }));
  };

  const saveReport = async (playerClubId: string) => {
    setSaving(true);
    const report = reports[playerClubId];

    console.log("=== SAVING REPORT ===");
    console.log("Player Club ID:", playerClubId);
    console.log("Report data:", report);

    if (!report || !report.pnl || !report.rake) {
      console.log("Missing required fields");
      setSaving(false);
      return;
    }

    const weekEnd = getWeekEnd(currentWeekStart);

    const reportData = {
      player_club_id: playerClubId,
      week_start: formatDateISO(currentWeekStart),
      week_end: formatDateISO(weekEnd),
      pnl: parseFloat(report.pnl),
      rake: parseFloat(report.rake),
      hands: parseInt(report.hands) || 0,
    };

    console.log("Report data to save:", reportData);

    // Si ya existe, actualizar; si no, insertar
    if (report.id) {
      const { data, error } = await supabase
        .from("weekly_player_reports")
        .update(reportData)
        .eq("id", report.id)
        .select()
        .single();

      console.log("Update result:", data);
      console.log("Update error:", error);

      if (error) {
        console.error("Update error:", error);
      } else {
        console.log("Update successful, player_percentage:", data?.player_percentage, "player_amount:", data?.player_amount);
        // Actualizar el estado con los datos calculados por el trigger
        if (data) {
          setReports(prev => ({
            ...prev,
            [playerClubId]: data
          }));
        }
      }
    } else {
      const { data, error } = await supabase
        .from("weekly_player_reports")
        .insert(reportData)
        .select()
        .single();

      console.log("Insert result:", data);
      console.log("Insert error:", error);

      if (data) {
        setReports(prev => ({
          ...prev,
          [playerClubId]: data
        }));
      }
    }

    setSaving(false);
  };

  const saveAllReports = async () => {
    setSaving(true);
    const weekEnd = getWeekEnd(currentWeekStart);

    for (const playerClubId of Object.keys(reports)) {
      const report = reports[playerClubId];

      if (!report || !report.pnl || !report.rake) {
        continue;
      }

      const reportData = {
        player_club_id: playerClubId,
        week_start: formatDateISO(currentWeekStart),
        week_end: formatDateISO(weekEnd),
        pnl: parseFloat(report.pnl),
        rake: parseFloat(report.rake),
        hands: report.hands ? parseInt(report.hands) : null,
      };

      if (report.id) {
        await supabase
          .from("weekly_player_reports")
          .update(reportData)
          .eq("id", report.id);
      } else {
        await supabase
          .from("weekly_player_reports")
          .insert(reportData);
      }
    }

    await loadClubData();
    setSaving(false);
  };

  const weekEnd = getWeekEnd(currentWeekStart);
  const completedCount = Object.values(reports).filter(r => r && r.id).length;
  const totalCount = playerClubs.length;

  // Calcular totales del club
  const clubTotals = {
    pnl: Object.values(reports).reduce((sum, r) => sum + (parseFloat(r?.pnl) || 0), 0),
    rake: Object.values(reports).reduce((sum, r) => sum + (parseFloat(r?.rake) || 0), 0),
    hands: Object.values(reports).reduce((sum, r) => sum + (parseInt(r?.hands) || 0), 0),
    actionAmount: Object.values(reports).reduce((sum, r) => sum + (parseFloat(r?.action_amount) || 0), 0),
    rakeAction: Object.values(reports).reduce((sum, r) => sum + (parseFloat(r?.rake_action) || 0), 0),
    rakebackAmount: Object.values(reports).reduce((sum, r) => sum + (parseFloat(r?.player_amount) || 0), 0),
    agentAmount: Object.values(reports).reduce((sum, r) => sum + (parseFloat(r?.agent_amount) || 0), 0),
    totalAmount: Object.values(reports).reduce((sum, r) => {
      // Ajuste = Action + Rakeback (agente NO se resta del jugador, se resta de Diamond)
      return sum + ((parseFloat(r?.action_amount) || 0) + (parseFloat(r?.player_amount) || 0));
    }, 0),
  };

  const selectedClub = clubs.find(c => c.id === selectedClubId);

  // Calcular ganancia de Diamond del Club
  const calculateDiamondClubAmount = () => {
    if (!selectedClub || clubTotals.rakeAction === 0) {
      return { percentage: 0, amount: 0, type: 'fixed' as const };
    }

    const rawRatio = clubTotals.rake > 0 ? clubTotals.pnl / clubTotals.rake : 0;

    if (selectedClub.diamond_club_agreement_type === 'fixed') {
      const percentage = parseFloat(selectedClub.diamond_club_fixed_percentage) || 0;
      return {
        percentage,
        amount: clubTotals.rakeAction * (percentage / 100),
        type: 'fixed' as const
      };
    } else {
      // Clampear el ratio: si es menor que -1 usa -1, si es mayor que 1 usa 1
      const ratio = Math.max(-1, Math.min(1, rawRatio));

      // Buscar en reglas dinámicas (ordenadas por prioridad desc)
      for (const rule of diamondClubRules) {
        const ratioMatches = ratio >= rule.ratio_min && (rule.ratio_max === null || ratio <= rule.ratio_max);
        const rakeMatches = clubTotals.rake >= rule.rake_min && (rule.rake_max === null || clubTotals.rake <= rule.rake_max);

        if (ratioMatches && rakeMatches) {
          return {
            percentage: parseFloat(rule.diamond_percentage),
            amount: clubTotals.rakeAction * (parseFloat(rule.diamond_percentage) / 100),
            type: 'dynamic' as const
          };
        }
      }
      // Si no hay regla que coincida, usar 0
      return { percentage: 0, amount: 0, type: 'dynamic' as const };
    }
  };

  const diamondClubCalc = calculateDiamondClubAmount();
  const rawRatio = clubTotals.rake > 0 ? clubTotals.pnl / clubTotals.rake : 0;
  const clampedRatio = Math.max(-1, Math.min(1, rawRatio));

  if (loading) {
    return (
      <div className="p-8">
        <Loading message="Cargando reportes..." />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reportes Semanales</h1>
          <p className="text-slate-600 mt-1">
            Carga los datos de PNL, Rake y Manos de cada jugador por club
          </p>
        </div>

        {/* Week & Club Selector */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <Button variant="outline" onClick={previousWeek}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Semana Anterior
              </Button>

              <div className="flex items-center gap-4">
                <Calendar className="w-5 h-5 text-purple-600" />
                <div className="text-center">
                  <p className="text-sm text-slate-600">Semana del</p>
                  <p className="text-xl font-bold text-slate-900">
                    {formatDateShort(currentWeekStart)} - {formatDateShort(weekEnd)}
                  </p>
                  <p className="text-xs text-slate-500">{currentWeekStart.getFullYear()}</p>
                </div>
                <Badge variant={completedCount === totalCount && totalCount > 0 ? "success" : "secondary"}>
                  {completedCount}/{totalCount} completados
                </Badge>
              </div>

              <Button variant="outline" onClick={nextWeek}>
                Semana Siguiente
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Club Selector - Logo Grid */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-slate-700">Selecciona un club</span>
              </div>
              <div className="flex flex-wrap gap-4">
                {clubs.map((club) => (
                  <button
                    key={club.id}
                    onClick={() => setSelectedClubId(club.id)}
                    className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all hover:shadow-lg ${
                      selectedClubId === club.id
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="w-20 h-20 flex items-center justify-center">
                      {club.logo_url ? (
                        <img
                          src={club.logo_url}
                          alt={club.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center">
                          <Building2 className="w-10 h-10 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <span className={`mt-3 text-sm font-medium ${
                      selectedClubId === club.id ? 'text-blue-700' : 'text-slate-600'
                    }`}>
                      {club.name}
                    </span>
                    {selectedClubId === club.id && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            size="lg"
            onClick={saveAllReports}
            disabled={saving}
          >
            <Save className="w-5 h-5 mr-2" />
            Guardar Todos
          </Button>
        </div>

        {/* Reports Table */}
        {selectedClubId && (
          <Card>
            <CardHeader>
              <CardTitle>
                Jugadores de {selectedClub?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {playerClubs.length === 0 ? (
                <p className="text-center py-8 text-slate-600">
                  No hay jugadores en este club
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-slate-300">
                          <th className="text-left py-3 px-2 font-semibold">Jugador</th>
                          <th className="text-right py-3 px-2 font-semibold">PNL ($)</th>
                          <th className="text-right py-3 px-2 font-semibold">Rake ($)</th>
                          <th className="text-right py-3 px-2 font-semibold">Manos</th>
                          <th className="text-right py-3 px-2 font-semibold">Action</th>
                          <th className="text-right py-3 px-2 font-semibold">Rakeback</th>
                          <th className="text-right py-3 px-2 font-semibold">Agente</th>
                          <th className="text-right py-3 px-2 font-semibold">Ajuste</th>
                          <th className="text-center py-3 px-2 font-semibold"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {playerClubs.map((pc) => {
                          const report = reports[pc.id] || {};
                          const isComplete = report.id;

                          // Calcular lo que recibe el jugador
                          const hasAgent = parseFloat(report.agent_commission_percentage) > 0;
                          const playerReceives = hasAgent
                            ? parseFloat(report.player_amount_net)
                            : parseFloat(report.player_amount);

                          return (
                            <tr key={pc.id} className="border-b border-slate-200 hover:bg-slate-50">
                              <td className="py-3 px-2">
                                <p className="font-medium text-slate-900">
                                  {pc.player.nickname || pc.player.full_name}
                                </p>
                                <p className="text-xs text-slate-500">{pc.player.player_code}</p>
                              </td>
                              <td className="py-3 px-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  defaultValue={report.pnl || ""}
                                  onBlur={(e) => updateReportField(pc.id, "pnl", e.target.value)}
                                  className={`text-right ${parseFloat(report.pnl || 0) >= 0 ? '' : 'text-red-600'}`}
                                />
                              </td>
                              <td className="py-3 px-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  defaultValue={report.rake || ""}
                                  onBlur={(e) => updateReportField(pc.id, "rake", e.target.value)}
                                  className="text-right"
                                />
                              </td>
                              <td className="py-3 px-2">
                                <Input
                                  type="number"
                                  placeholder="0"
                                  defaultValue={report.hands || ""}
                                  onBlur={(e) => updateReportField(pc.id, "hands", e.target.value)}
                                  className="text-right"
                                />
                              </td>
                              <td className="py-3 px-2">
                                {isComplete ? (
                                  <div className="text-right">
                                    <p className="font-medium text-purple-600">
                                      ${parseFloat(report.action_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {report.action_percentage}%
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-right text-slate-400">-</p>
                                )}
                              </td>
                              <td className="py-3 px-2">
                                {isComplete && report.player_amount ? (
                                  <div className="text-right">
                                    <p className="font-bold text-slate-900">
                                      ${parseFloat(report.player_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {report.player_percentage}%
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-right text-slate-400">-</p>
                                )}
                              </td>
                              <td className="py-3 px-2">
                                {isComplete && hasAgent ? (
                                  <div className="text-right">
                                    <p className="font-bold text-purple-600">
                                      ${parseFloat(report.agent_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {report.agent_commission_percentage}%
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-right text-slate-400">-</p>
                                )}
                              </td>
                              <td className="py-3 px-2">
                                {isComplete ? (
                                  <div className="text-right">
                                    <p className="font-bold text-green-600">
                                      ${((parseFloat(report.action_amount) || 0) + (parseFloat(report.player_amount) || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-right text-slate-400">-</p>
                                )}
                              </td>
                              <td className="py-3 px-2 text-center">
                                <Button
                                  size="sm"
                                  variant={isComplete ? "ghost" : "outline"}
                                  onClick={() => saveReport(pc.id)}
                                  disabled={saving || !report.pnl || !report.rake}
                                >
                                  {isComplete ? <Check className="w-4 h-4 text-green-600" /> : <Save className="w-4 h-4" />}
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                        {/* Fila de totales */}
                        <tr className="border-t-2 border-slate-400 bg-slate-50 font-bold">
                          <td className="py-3 px-2 text-slate-900">
                            TOTAL {selectedClub?.name}
                          </td>
                          <td className={`py-3 px-2 text-right ${clubTotals.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${clubTotals.pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-2 text-right text-slate-900">
                            ${clubTotals.rake.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-2 text-right text-slate-900">
                            {clubTotals.hands.toLocaleString('en-US')}
                          </td>
                          <td className={`py-3 px-2 text-right ${clubTotals.actionAmount >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                            ${clubTotals.actionAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-2 text-right text-slate-900">
                            ${clubTotals.rakebackAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-2 text-right text-purple-600">
                            ${clubTotals.agentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-2 text-right text-green-600">
                            ${clubTotals.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-2"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Resumen Diamond ↔ Club */}
        {selectedClubId && completedCount > 0 && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-blue-900">
                Ganancia Diamond ↔ Club
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Rake Action Total</p>
                  <p className="text-xl font-bold text-slate-900">
                    ${clubTotals.rakeAction.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Ratio Club (PNL/Rake)</p>
                  <p className="text-xl font-bold text-slate-900">
                    {rawRatio.toFixed(2)}
                    {(rawRatio < -1 || rawRatio > 1) && (
                      <span className="text-sm text-slate-500 ml-1">
                        → {clampedRatio.toFixed(1)}
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">
                    % Diamond ({diamondClubCalc.type === 'fixed' ? 'Fijo' : 'Dinámico'})
                  </p>
                  <p className="text-xl font-bold text-blue-600">
                    {diamondClubCalc.percentage.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Beneficio Neto Diamond</p>
                  <p className={`text-2xl font-bold ${(diamondClubCalc.amount - clubTotals.rakebackAmount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${(diamondClubCalc.amount - clubTotals.rakebackAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
