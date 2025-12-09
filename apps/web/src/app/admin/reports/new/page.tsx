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
import { ArrowLeft, Save, Calculator, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";

export default function NewWeeklyReportPage() {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [clubs, setClubs] = useState<any[]>([]);
  const [selectedClub, setSelectedClub] = useState<any>(null);

  const [formData, setFormData] = useState({
    clubId: "",
    weekStart: "",
    weekEnd: "",
    totalPnl: "",
    totalRake: "",
  });

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

  // Actualizar club seleccionado cuando cambia clubId
  useEffect(() => {
    if (formData.clubId) {
      const club = clubs.find(c => c.id === formData.clubId);
      setSelectedClub(club);
    }
  }, [formData.clubId, clubs]);

  // Auto-calcular fechas de la semana pasada (lunes a domingo)
  const setLastWeek = () => {
    const today = new Date();
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - today.getDay() - 6); // Lunes pasado

    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6); // Domingo pasado

    setFormData({
      ...formData,
      weekStart: lastMonday.toISOString().split('T')[0],
      weekEnd: lastSunday.toISOString().split('T')[0],
    });
  };

  // Cálculos
  const calculations = {
    actionPercentage: selectedClub?.action_percentage || 0,
    actionAmount: 0,
    rakeAction: 0,
    isPnlPositive: false,
  };

  if (formData.totalPnl && formData.totalRake && selectedClub) {
    const pnl = parseFloat(formData.totalPnl);
    const rake = parseFloat(formData.totalRake);
    const actionPct = selectedClub.action_percentage;

    calculations.actionAmount = pnl * (actionPct / 100);
    calculations.rakeAction = (1 - (actionPct / 100)) * rake;
    calculations.isPnlPositive = pnl > 0;
  }

  const handleSave = async () => {
    if (!formData.clubId) {
      toast.error("Selecciona un club");
      return;
    }

    if (!formData.weekStart || !formData.weekEnd) {
      toast.error("Selecciona las fechas de la semana");
      return;
    }

    if (!formData.totalPnl) {
      toast.error("Ingresa el PNL total");
      return;
    }

    if (!formData.totalRake || parseFloat(formData.totalRake) < 0) {
      toast.error("Ingresa un rake válido");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("weekly_club_reports")
        .insert({
          club_id: formData.clubId,
          week_start: formData.weekStart,
          week_end: formData.weekEnd,
          total_pnl: parseFloat(formData.totalPnl),
          total_rake: parseFloat(formData.totalRake),
          action_percentage: selectedClub.action_percentage,
          created_by: user?.id,
        });

      if (error) {
        if (error.code === "23505") {
          toast.error("Ya existe un reporte para este club y semana");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Reporte semanal creado correctamente");
      router.push("/admin/reports");
    } catch (error: any) {
      console.error("Error creating report:", error);
      toast.error(error.message || "Error al crear el reporte");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Nuevo Reporte Semanal</h1>
            <p className="text-slate-600 mt-1">
              Ingresa los datos de PNL y Rake de la semana anterior
            </p>
          </div>
        </div>

        {/* Formulario */}
        <Card>
          <CardHeader>
            <CardTitle>Datos de la Semana</CardTitle>
            <CardDescription>
              Selecciona el club e ingresa los totales semanales
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="club">Club *</Label>
              <Select value={formData.clubId} onValueChange={(value) => setFormData({ ...formData, clubId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un club" />
                </SelectTrigger>
                <SelectContent>
                  {clubs.map((club) => (
                    <SelectItem key={club.id} value={club.id}>
                      {club.name} - Action {club.action_percentage}%
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
                  value={formData.weekStart}
                  onChange={(e) => setFormData({ ...formData, weekStart: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weekEnd">Fin de Semana *</Label>
                <Input
                  id="weekEnd"
                  type="date"
                  value={formData.weekEnd}
                  onChange={(e) => setFormData({ ...formData, weekEnd: e.target.value })}
                />
              </div>
            </div>

            <Button variant="outline" onClick={setLastWeek} className="w-full">
              <Calculator className="w-4 h-4 mr-2" />
              Usar Semana Pasada (Lun-Dom)
            </Button>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalPnl">PNL Total *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">€</span>
                  <Input
                    id="totalPnl"
                    type="number"
                    step="0.01"
                    value={formData.totalPnl}
                    onChange={(e) => setFormData({ ...formData, totalPnl: e.target.value })}
                    placeholder="0.00"
                    className="pl-8"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Positivo = ganancias, Negativo = pérdidas
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalRake">Rake Total *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">€</span>
                  <Input
                    id="totalRake"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.totalRake}
                    onChange={(e) => setFormData({ ...formData, totalRake: e.target.value })}
                    placeholder="0.00"
                    className="pl-8"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Rake generado en la semana
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cálculos Automáticos */}
        {selectedClub && formData.totalPnl && formData.totalRake && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900 flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Cálculos Automáticos
              </CardTitle>
              <CardDescription className="text-blue-800">
                Basado en Action del {calculations.actionPercentage}%
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Action Amount */}
              <div className="p-4 bg-white rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Action Amount</span>
                  <div className="flex items-center gap-2">
                    {calculations.isPnlPositive ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-2xl font-bold ${calculations.isPnlPositive ? 'text-green-600' : 'text-red-600'}`}>
                      €{Math.abs(calculations.actionAmount).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-600">
                  {calculations.isPnlPositive
                    ? "Jugadores pagan al club"
                    : "Club paga a jugadores"
                  } = PNL × {calculations.actionPercentage}%
                </p>
              </div>

              {/* Rake Action */}
              <div className="p-4 bg-white rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Rake Action</span>
                  <span className="text-2xl font-bold text-blue-600">
                    €{calculations.rakeAction.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Rake disponible para repartir = (1 - {calculations.actionPercentage}%) × Total Rake
                </p>
              </div>

              {/* Resumen */}
              <div className="p-3 bg-slate-100 rounded text-xs text-slate-700">
                <strong>Siguiente paso:</strong> Este Rake Action de €{calculations.rakeAction.toLocaleString('es-ES', { minimumFractionDigits: 2 })} se dividirá entre el jugador y Diamont Deals según los acuerdos configurados.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href="/admin/dashboard">
            <Button variant="outline">Cancelar</Button>
          </Link>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Guardando..." : "Guardar Reporte"}
          </Button>
        </div>
      </div>
    </div>
  );
}
