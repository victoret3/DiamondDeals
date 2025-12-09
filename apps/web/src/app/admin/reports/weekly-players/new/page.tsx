"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Save, Calculator, User } from "lucide-react";
import Link from "next/link";

interface PlayerReport {
  playerClubId: string;
  playerName: string;
  pnl: string;
  rake: string;
  hands: string;
}

export default function NewWeeklyPlayerReportsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [clubs, setClubs] = useState<any[]>([]);
  const [selectedClubId, setSelectedClubId] = useState("");
  const [playerReports, setPlayerReports] = useState<PlayerReport[]>([]);

  const [weekStart, setWeekStart] = useState("");
  const [weekEnd, setWeekEnd] = useState("");

  // Cargar clubs
  useEffect(() => {
    async function loadClubs() {
      const { data } = await supabase
        .from("clubs")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (data) setClubs(data);
    }
    loadClubs();
  }, []);

  // Cargar jugadores cuando se selecciona un club
  useEffect(() => {
    if (!selectedClubId) return;

    async function loadPlayers() {
      const { data } = await supabase
        .from("player_clubs")
        .select(`
          id,
          player:players (
            id,
            full_name,
            nickname
          )
        `)
        .eq("club_id", selectedClubId);

      if (data) {
        setPlayerReports(
          data.map((pc: any) => ({
            playerClubId: pc.id,
            playerName: pc.player.nickname || pc.player.full_name,
            pnl: "",
            rake: "",
            hands: "",
          }))
        );
      }
    }
    loadPlayers();
  }, [selectedClubId]);

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

  const updatePlayerReport = (index: number, field: keyof PlayerReport, value: string) => {
    const updated = [...playerReports];
    updated[index][field] = value;
    setPlayerReports(updated);
  };

  const handleSave = async () => {
    if (!selectedClubId) {
      toast.error("Selecciona un club");
      return;
    }

    if (!weekStart || !weekEnd) {
      toast.error("Selecciona las fechas de la semana");
      return;
    }

    // Validar que al menos un jugador tenga datos
    const reportsWithData = playerReports.filter(
      (r) => r.pnl !== "" || r.rake !== "" || r.hands !== ""
    );

    if (reportsWithData.length === 0) {
      toast.error("Ingresa datos para al menos un jugador");
      return;
    }

    // Validar que todos los reportes con datos estén completos
    for (const report of reportsWithData) {
      if (!report.pnl || !report.rake || !report.hands) {
        toast.error(`Completa todos los campos para ${report.playerName}`);
        return;
      }
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Insertar cada reporte
      const inserts = reportsWithData.map((report) => ({
        player_club_id: report.playerClubId,
        week_start: weekStart,
        week_end: weekEnd,
        pnl: parseFloat(report.pnl),
        rake: parseFloat(report.rake),
        hands: parseInt(report.hands),
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
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/reports">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Reportes Semanales por Jugador
            </h1>
            <p className="text-slate-600 mt-1">
              Ingresa los datos de cada jugador del club para la semana
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
              <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un club" />
                </SelectTrigger>
                <SelectContent>
                  {clubs.map((club) => (
                    <SelectItem key={club.id} value={club.id}>
                      {club.name}
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
        {selectedClubId && playerReports.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Jugadores ({playerReports.length})</CardTitle>
              <CardDescription>
                Ingresa PNL, Rake y Manos para cada jugador
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Header */}
                <div className="grid grid-cols-12 gap-3 text-sm font-medium text-slate-600 pb-2 border-b">
                  <div className="col-span-3">Jugador</div>
                  <div className="col-span-3">PNL (€)</div>
                  <div className="col-span-3">Rake (€)</div>
                  <div className="col-span-3">Manos</div>
                </div>

                {/* Rows */}
                {playerReports.map((report, index) => (
                  <div key={report.playerClubId} className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-3 flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-900">
                        {report.playerName}
                      </span>
                    </div>
                    <div className="col-span-3">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                          €
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          value={report.pnl}
                          onChange={(e) =>
                            updatePlayerReport(index, "pnl", e.target.value)
                          }
                          placeholder="0.00"
                          className="pl-8"
                        />
                      </div>
                    </div>
                    <div className="col-span-3">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                          €
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={report.rake}
                          onChange={(e) =>
                            updatePlayerReport(index, "rake", e.target.value)
                          }
                          placeholder="0.00"
                          className="pl-8"
                        />
                      </div>
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        min="0"
                        value={report.hands}
                        onChange={(e) =>
                          updatePlayerReport(index, "hands", e.target.value)
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedClubId && playerReports.length === 0 && (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-slate-600">
                Este club no tiene jugadores asignados todavía.
              </p>
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
            disabled={saving || !selectedClubId || playerReports.length === 0}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Guardando..." : "Guardar Reportes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
