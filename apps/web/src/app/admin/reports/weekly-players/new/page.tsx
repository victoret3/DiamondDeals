"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Save, Calculator, User, TrendingUp, Building2 } from "lucide-react";
import Link from "next/link";

interface PlayerCondition {
  playerClubId: string;
  playerId: string;
  playerName: string;
  conditionType: "fixed" | "dynamic";
  fixedPercentage: number | null;
  templateId: string | null;
}

interface PlayerReport {
  playerClubId: string;
  playerId: string;
  playerName: string;
  conditionType: "fixed" | "dynamic";
  fixedPercentage: number | null;
  templateId: string | null;
  pnl: string;
  rake: string;
  hands: string;
  // Calculados
  ratio: number;
  playerPercentage: number;
  playerAmount: number;
}

interface TemplateRule {
  id: string;
  templateId: string;
  ratioMin: number;
  ratioMax: number | null;
  handsMin: number;
  handsMax: number | null;
  playerPercentage: number;
}

interface Club {
  id: string;
  name: string;
  code: string;
  actionPercentage: number;
  diamondClubAgreementType: "fixed" | "dynamic";
  diamondClubFixedPercentage: number | null;
  diamondClubTemplateId: string | null;
}

interface ClubTemplateRule {
  id: string;
  templateId: string;
  ratioMin: number;
  ratioMax: number | null;
  handsMin: number;
  handsMax: number | null;
  diamondPercentage: number;
}

export default function NewWeeklyPlayerReportsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [playerReports, setPlayerReports] = useState<PlayerReport[]>([]);
  const [templateRules, setTemplateRules] = useState<TemplateRule[]>([]);
  const [clubTemplateRules, setClubTemplateRules] = useState<ClubTemplateRule[]>([]);

  const [weekStart, setWeekStart] = useState("");
  const [weekEnd, setWeekEnd] = useState("");

  // Cargar clubs
  useEffect(() => {
    async function loadClubs() {
      const { data } = await supabase
        .from("clubs")
        .select(`
          id, name, code, action_percentage,
          diamond_club_agreement_type, diamond_club_fixed_percentage, diamond_club_template_id
        `)
        .eq("is_active", true)
        .order("name");

      if (data) {
        setClubs(data.map((c: any) => ({
          id: c.id,
          name: c.name,
          code: c.code,
          actionPercentage: c.action_percentage || 0,
          diamondClubAgreementType: c.diamond_club_agreement_type || "fixed",
          diamondClubFixedPercentage: c.diamond_club_fixed_percentage,
          diamondClubTemplateId: c.diamond_club_template_id,
        })));
      }
    }
    loadClubs();
  }, []);

  // Cargar templates de condiciones de jugadores
  useEffect(() => {
    async function loadTemplateRules() {
      const { data, error } = await supabase
        .from("diamond_player_agreement_rules")
        .select("id, template_id, ratio_min, ratio_max, player_percentage, priority")
        .order("template_id, priority");

      if (error) {
        console.error("Error loading player rules:", error);
        return;
      }

      if (data) {
        setTemplateRules(data.map((r: any) => ({
          id: r.id,
          templateId: r.template_id,
          ratioMin: r.ratio_min,
          ratioMax: r.ratio_max,
          handsMin: 0,
          handsMax: null,
          playerPercentage: r.player_percentage,
        })));
      }
    }
    loadTemplateRules();
  }, []);

  // Cargar templates de condiciones Club-Diamont
  useEffect(() => {
    async function loadClubTemplateRules() {
      const { data, error } = await supabase
        .from("diamond_club_agreement_rules")
        .select("id, template_id, ratio_min, ratio_max, diamond_percentage, priority")
        .order("template_id, priority");

      if (error) {
        console.error("Error loading club rules:", error);
        return;
      }

      if (data) {
        setClubTemplateRules(data.map((r: any) => ({
          id: r.id,
          templateId: r.template_id,
          ratioMin: r.ratio_min,
          ratioMax: r.ratio_max,
          handsMin: 0,
          handsMax: null,
          diamondPercentage: r.diamond_percentage,
        })));
      }
    }
    loadClubTemplateRules();
  }, []);

  // Cargar jugadores cuando se selecciona un club
  useEffect(() => {
    if (!selectedClub) {
      setPlayerReports([]);
      return;
    }

    const clubId = selectedClub.id;

    async function loadPlayers() {
      const { data } = await supabase
        .from("player_clubs")
        .select(`
          id,
          custom_diamond_agreement,
          diamond_agreement_type,
          diamond_fixed_percentage,
          diamond_template_id,
          player:players (
            id,
            full_name,
            nickname
          )
        `)
        .eq("club_id", clubId);

      if (data) {
        setPlayerReports(
          data.map((pc: any) => ({
            playerClubId: pc.id,
            playerId: pc.player.id,
            playerName: pc.player.nickname || pc.player.full_name,
            conditionType: pc.custom_diamond_agreement ? pc.diamond_agreement_type : "fixed",
            fixedPercentage: pc.custom_diamond_agreement ? pc.diamond_fixed_percentage : 50,
            templateId: pc.custom_diamond_agreement ? pc.diamond_template_id : null,
            pnl: "",
            rake: "",
            hands: "",
            ratio: 0,
            playerPercentage: 0,
            playerAmount: 0,
          }))
        );
      }
    }
    loadPlayers();
  }, [selectedClub]);

  // Función para calcular % del jugador según template dinámico
  const getPlayerPercentageFromTemplate = (templateId: string, ratio: number): number => {
    const rules = templateRules.filter(r => r.templateId === templateId);
    for (const rule of rules) {
      const matchesRatio = ratio >= rule.ratioMin && (rule.ratioMax === null || ratio < rule.ratioMax);
      if (matchesRatio) {
        return rule.playerPercentage;
      }
    }
    return 0;
  };

  // Función para calcular % del club según template dinámico
  const getClubPercentageFromTemplate = (templateId: string, ratio: number): number => {
    const rules = clubTemplateRules.filter(r => r.templateId === templateId);
    for (const rule of rules) {
      const matchesRatio = ratio >= rule.ratioMin && (rule.ratioMax === null || ratio < rule.ratioMax);
      if (matchesRatio) {
        return rule.diamondPercentage;
      }
    }
    return 0;
  };

  // Auto-calcular semana pasada
  const setLastWeek = () => {
    const today = new Date();
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - today.getDay() - 6);

    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);

    setWeekStart(lastMonday.toISOString().split("T")[0]);
    setWeekEnd(lastSunday.toISOString().split("T")[0]);
  };

  const updatePlayerReport = (index: number, field: "pnl" | "rake" | "hands", value: string) => {
    const updated = [...playerReports];
    updated[index] = { ...updated[index], [field]: value };

    // Recalcular
    const pnl = parseFloat(updated[index].pnl) || 0;
    const rake = parseFloat(updated[index].rake) || 0;
    const hands = parseInt(updated[index].hands) || 0;
    const ratio = rake > 0 ? pnl / rake : 0;

    let playerPercentage = 0;
    if (updated[index].conditionType === "fixed") {
      playerPercentage = updated[index].fixedPercentage || 0;
    } else if (updated[index].templateId) {
      playerPercentage = getPlayerPercentageFromTemplate(updated[index].templateId, ratio);
    }

    // rake_action = rake * (1 - action%)
    const actionPercentage = selectedClub?.actionPercentage || 0;
    const rakeAction = rake * (1 - actionPercentage / 100);
    const playerAmount = rakeAction * (playerPercentage / 100);

    updated[index].ratio = ratio;
    updated[index].playerPercentage = playerPercentage;
    updated[index].playerAmount = playerAmount;

    setPlayerReports(updated);
  };

  // Calcular totales y resumen Club-Diamont
  const summary = useMemo(() => {
    if (!selectedClub) return null;

    const reportsWithData = playerReports.filter(r => r.rake !== "" && parseFloat(r.rake) > 0);

    const totalPnl = reportsWithData.reduce((sum, r) => sum + (parseFloat(r.pnl) || 0), 0);
    const totalRake = reportsWithData.reduce((sum, r) => sum + (parseFloat(r.rake) || 0), 0);
    const totalHands = reportsWithData.reduce((sum, r) => sum + (parseInt(r.hands) || 0), 0);
    const totalPlayerAmount = reportsWithData.reduce((sum, r) => sum + r.playerAmount, 0);

    const totalRatio = totalRake > 0 ? totalPnl / totalRake : 0;
    const actionPercentage = selectedClub.actionPercentage || 0;
    const totalRakeAction = totalRake * (1 - actionPercentage / 100);

    // Calcular % Club-Diamont
    let clubDiamondPercentage = 0;
    if (selectedClub.diamondClubAgreementType === "fixed") {
      clubDiamondPercentage = selectedClub.diamondClubFixedPercentage || 0;
    } else if (selectedClub.diamondClubTemplateId) {
      clubDiamondPercentage = getClubPercentageFromTemplate(
        selectedClub.diamondClubTemplateId,
        totalRatio
      );
    }

    const clubDiamondAmount = totalRakeAction * (clubDiamondPercentage / 100);
    const diamondProfit = clubDiamondAmount - totalPlayerAmount;

    return {
      totalPnl,
      totalRake,
      totalHands,
      totalRatio,
      totalRakeAction,
      totalPlayerAmount,
      clubDiamondPercentage,
      clubDiamondAmount,
      diamondProfit,
      playersWithData: reportsWithData.length,
    };
  }, [playerReports, selectedClub, clubTemplateRules]);

  const handleSave = async () => {
    if (!selectedClub) {
      toast.error("Selecciona un club");
      return;
    }

    if (!weekStart || !weekEnd) {
      toast.error("Selecciona las fechas de la semana");
      return;
    }

    const reportsWithData = playerReports.filter(
      (r) => r.pnl !== "" || r.rake !== "" || r.hands !== ""
    );

    if (reportsWithData.length === 0) {
      toast.error("Ingresa datos para al menos un jugador");
      return;
    }

    for (const report of reportsWithData) {
      if (!report.pnl || !report.rake) {
        toast.error(`Completa PNL y Rake para ${report.playerName}`);
        return;
      }
      // Manos solo requeridas si tiene condición dinámica
      if (report.conditionType === "dynamic" && !report.hands) {
        toast.error(`${report.playerName} tiene condición dinámica, necesita las manos`);
        return;
      }
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const inserts = reportsWithData.map((report) => ({
        player_club_id: report.playerClubId,
        week_start: weekStart,
        week_end: weekEnd,
        pnl: parseFloat(report.pnl),
        rake: parseFloat(report.rake),
        hands: report.hands ? parseInt(report.hands) : 0,
        created_by: user?.id,
      }));

      const { error } = await supabase
        .from("weekly_player_reports")
        .insert(inserts);

      if (error) {
        if (error.code === "23505") {
          toast.error("Ya existen reportes para algunos jugadores en esta semana");
        } else {
          throw error;
        }
        return;
      }

      toast.success(`${inserts.length} reportes creados correctamente`);
      router.push("/admin/reports/weekly-players");
    } catch (error: any) {
      console.error("Error creating reports:", error);
      toast.error(error.message || "Error al crear los reportes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/reports">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Nuevo Reporte Semanal
            </h1>
            <p className="text-slate-600 mt-1">
              Ingresa los datos de cada jugador y ve los cálculos en tiempo real
            </p>
          </div>
        </div>

        {/* Selección de Club y Semana */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
            <CardDescription>Selecciona el club y la semana</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="club">Club *</Label>
              <Select
                value={selectedClub?.id || ""}
                onValueChange={(id) => setSelectedClub(clubs.find(c => c.id === id) || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un club" />
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weekStart">Inicio de Semana *</Label>
                <Input
                  id="weekStart"
                  type="date"
                  value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weekEnd">Fin de Semana *</Label>
                <Input
                  id="weekEnd"
                  type="date"
                  value={weekEnd}
                  onChange={(e) => setWeekEnd(e.target.value)}
                />
              </div>
            </div>

            <Button variant="outline" onClick={setLastWeek} className="w-full">
              <Calculator className="w-4 h-4 mr-2" />
              Usar Semana Pasada (Lun-Dom)
            </Button>
          </CardContent>
        </Card>

        {/* Lista de Jugadores */}
        {selectedClub && playerReports.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Jugadores ({playerReports.length})</CardTitle>
              <CardDescription>
                Ingresa PNL, Rake y Manos. El rakeback se calcula automáticamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-slate-600 pb-2 border-b">
                  <div className="col-span-2">Jugador</div>
                  <div className="col-span-2">PNL (€)</div>
                  <div className="col-span-2">Rake (€)</div>
                  <div className="col-span-1">Manos</div>
                  <div className="col-span-1 text-center">Ratio</div>
                  <div className="col-span-2 text-center">Condición</div>
                  <div className="col-span-2 text-right">Rakeback Jugador</div>
                </div>

                {/* Rows */}
                {playerReports.map((report, index) => (
                  <div key={report.playerClubId} className="grid grid-cols-12 gap-2 items-center py-2 border-b border-slate-100">
                    <div className="col-span-2 flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-slate-900 truncate">
                        {report.playerName}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={report.pnl}
                        onChange={(e) => updatePlayerReport(index, "pnl", e.target.value)}
                        placeholder="0.00"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={report.rake}
                        onChange={(e) => updatePlayerReport(index, "rake", e.target.value)}
                        placeholder="0.00"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="col-span-1">
                      <Input
                        type="number"
                        min="0"
                        value={report.hands}
                        onChange={(e) => updatePlayerReport(index, "hands", e.target.value)}
                        placeholder="0"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <span className={`text-sm font-mono ${report.ratio >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {report.rake ? report.ratio.toFixed(2) : "-"}
                      </span>
                    </div>
                    <div className="col-span-2 text-center">
                      <Badge variant={report.conditionType === "fixed" ? "secondary" : "outline"} className="text-xs">
                        {report.conditionType === "fixed"
                          ? `Fijo ${report.fixedPercentage}%`
                          : `Dinámico → ${report.playerPercentage}%`}
                      </Badge>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-sm font-semibold text-green-600">
                        {report.rake ? `${report.playerAmount.toFixed(2)} €` : "-"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedClub && playerReports.length === 0 && (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-slate-600">
                Este club no tiene jugadores asignados todavía.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Resumen Club-Diamont */}
        {summary && summary.playersWithData > 0 && (
          <Card className="border-2 border-blue-200 bg-blue-50/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-blue-900">Resumen: {selectedClub?.name}</CardTitle>
              </div>
              <CardDescription>
                Acuerdo Club → Diamont: {selectedClub?.diamondClubAgreementType === "fixed"
                  ? `Fijo ${selectedClub?.diamondClubFixedPercentage}%`
                  : `Dinámico → ${summary.clubDiamondPercentage.toFixed(1)}%`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-lg border">
                  <p className="text-xs text-slate-500">Total Rake</p>
                  <p className="text-xl font-bold text-slate-900">{summary.totalRake.toFixed(2)} €</p>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <p className="text-xs text-slate-500">Rake Action ({100 - (selectedClub?.actionPercentage || 0)}%)</p>
                  <p className="text-xl font-bold text-slate-900">{summary.totalRakeAction.toFixed(2)} €</p>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <p className="text-xs text-slate-500">Club paga a Diamont ({summary.clubDiamondPercentage.toFixed(1)}%)</p>
                  <p className="text-xl font-bold text-blue-600">{summary.clubDiamondAmount.toFixed(2)} €</p>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <p className="text-xs text-slate-500">Diamont paga a Jugadores</p>
                  <p className="text-xl font-bold text-green-600">{summary.totalPlayerAmount.toFixed(2)} €</p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-white rounded-lg border-2 border-purple-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-purple-900">Profit Diamont</span>
                  </div>
                  <span className={`text-2xl font-bold ${summary.diamondProfit >= 0 ? "text-purple-600" : "text-red-600"}`}>
                    {summary.diamondProfit.toFixed(2)} €
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  = Club paga ({summary.clubDiamondAmount.toFixed(2)} €) - Jugadores reciben ({summary.totalPlayerAmount.toFixed(2)} €)
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href="/admin/reports">
            <Button variant="outline">Cancelar</Button>
          </Link>
          <Button
            onClick={handleSave}
            disabled={saving || !selectedClub || playerReports.length === 0}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Guardando..." : "Guardar Reportes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
