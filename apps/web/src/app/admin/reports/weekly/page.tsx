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

  useEffect(() => {
    loadClubs();
  }, []);

  useEffect(() => {
    if (selectedClubId) {
      loadClubData();
    }
  }, [currentWeekStart, selectedClubId]);

  function getLastMonday() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    console.log('Today:', today, 'Day of week:', dayOfWeek);

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

    console.log('Days to subtract:', daysToSubtract);

    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - daysToSubtract);
    lastMonday.setHours(0, 0, 0, 0);

    console.log('Last Monday calculated:', lastMonday);

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
      .select("id, name, code")
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

    if (!report || !report.pnl || !report.rake || !report.hands) {
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
      hands: parseInt(report.hands),
    };

    // Si ya existe, actualizar; si no, insertar
    if (report.id) {
      await supabase
        .from("weekly_player_reports")
        .update(reportData)
        .eq("id", report.id);
    } else {
      const { data } = await supabase
        .from("weekly_player_reports")
        .insert(reportData)
        .select()
        .single();

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

      if (!report || !report.pnl || !report.rake || !report.hands) {
        continue;
      }

      const reportData = {
        player_club_id: playerClubId,
        week_start: formatDateISO(currentWeekStart),
        week_end: formatDateISO(weekEnd),
        pnl: parseFloat(report.pnl),
        rake: parseFloat(report.rake),
        hands: parseInt(report.hands),
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
    diamondClubAmount: Object.values(reports).reduce((sum, r) => sum + (parseFloat(r?.diamond_club_amount) || 0), 0),
  };

  const selectedClub = clubs.find(c => c.id === selectedClubId);

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

            {/* Club Selector */}
            <div className="flex items-center gap-4">
              <Building2 className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar club" />
                  </SelectTrigger>
                  <SelectContent>
                    {clubs.map((club) => (
                      <SelectItem key={club.id} value={club.id}>
                        {club.name} ({club.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                          <th className="text-left py-3 px-4 font-semibold">Jugador</th>
                          <th className="text-right py-3 px-4 font-semibold">PNL ($)</th>
                          <th className="text-right py-3 px-4 font-semibold">Rake ($)</th>
                          <th className="text-right py-3 px-4 font-semibold">Manos</th>
                          <th className="text-right py-3 px-4 font-semibold">Club ($)</th>
                          <th className="text-center py-3 px-4 font-semibold">Estado</th>
                          <th className="text-center py-3 px-4 font-semibold">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {playerClubs.map((pc) => {
                          const report = reports[pc.id] || {};
                          const isComplete = report.id;

                          return (
                            <tr key={pc.id} className="border-b border-slate-200 hover:bg-slate-50">
                              <td className="py-3 px-4">
                                <p className="font-medium text-slate-900">
                                  {pc.player.nickname || pc.player.full_name}
                                </p>
                                <p className="text-xs text-slate-500">{pc.player.player_code}</p>
                              </td>
                              <td className="py-3 px-4">
                                {isComplete ? (
                                  <p className={`text-right font-medium ${parseFloat(report.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ${parseFloat(report.pnl || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </p>
                                ) : (
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={report.pnl || ""}
                                    onChange={(e) => updateReportField(pc.id, "pnl", e.target.value)}
                                    className="text-right"
                                  />
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {isComplete ? (
                                  <p className="text-right font-medium text-slate-900">
                                    ${parseFloat(report.rake || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </p>
                                ) : (
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={report.rake || ""}
                                    onChange={(e) => updateReportField(pc.id, "rake", e.target.value)}
                                    className="text-right"
                                  />
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {isComplete ? (
                                  <p className="text-right font-medium text-slate-900">
                                    {parseInt(report.hands || 0).toLocaleString('en-US')}
                                  </p>
                                ) : (
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    value={report.hands || ""}
                                    onChange={(e) => updateReportField(pc.id, "hands", e.target.value)}
                                    className="text-right"
                                  />
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {isComplete && report.diamond_club_amount ? (
                                  <p className="text-right font-medium text-blue-600">
                                    ${parseFloat(report.diamond_club_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </p>
                                ) : (
                                  <p className="text-right text-slate-400">-</p>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {isComplete ? (
                                  <Check className="w-5 h-5 text-green-600 mx-auto" />
                                ) : (
                                  <AlertCircle className="w-5 h-5 text-slate-300 mx-auto" />
                                )}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {!isComplete && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => saveReport(pc.id)}
                                    disabled={saving || !report.pnl || !report.rake || !report.hands}
                                  >
                                    <Save className="w-4 h-4" />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {/* Fila de totales */}
                        <tr className="border-t-2 border-slate-400 bg-slate-50 font-bold">
                          <td className="py-3 px-4 text-slate-900">
                            TOTAL {selectedClub?.name}
                          </td>
                          <td className={`py-3 px-4 text-right ${clubTotals.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${clubTotals.pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-900">
                            ${clubTotals.rake.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-900">
                            {clubTotals.hands.toLocaleString('en-US')}
                          </td>
                          <td className="py-3 px-4 text-right text-blue-600">
                            ${clubTotals.diamondClubAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td colSpan={2} className="py-3 px-4"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
