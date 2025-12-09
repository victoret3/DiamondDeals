"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Edit, Save, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loading } from "@/components/ui/loading";
import { toast } from "sonner";

// Rake ranges definition
const RAKE_RANGES = [
  { id: "low", label: "Up to $4,999", min: 0, max: 4999 },
  { id: "mid", label: "$5,000-$9,999", min: 5000, max: 9999 },
  { id: "high", label: "Over $10,000", min: 10000, max: null },
];

// Generate ratios from -1.0 to 1.0 in 0.1 increments
const RATIOS = Array.from({ length: 21 }, (_, i) => {
  const ratio = -1 + i * 0.1;
  return Math.round(ratio * 10) / 10;
});

type TableData = Record<string, Record<string, number>>;

function getRakeRangeId(rakeMin: number): string {
  if (rakeMin >= 10000) return "high";
  if (rakeMin >= 5000) return "mid";
  return "low";
}

export default function DiamondClubPlanDetailPage() {
  const params = useParams();
  const supabase = createClient();
  const [plan, setPlan] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [tableData, setTableData] = useState<TableData>({});

  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = async () => {
    setLoading(true);

    const { data: planData } = await supabase
      .from("diamond_club_agreement_templates")
      .select("*")
      .eq("id", params.id)
      .single();

    const { data: rulesData } = await supabase
      .from("diamond_club_agreement_rules")
      .select("*")
      .eq("template_id", params.id)
      .order("ratio_min", { ascending: true })
      .order("rake_min", { ascending: true });

    if (planData) {
      setPlan(planData);
      setEditName(planData.name);
      setEditDescription(planData.description || "");
      setEditIsActive(planData.is_active);
    }
    if (rulesData) {
      setRules(rulesData);
      // Convert rules to table data
      const data: TableData = {};
      RATIOS.forEach(ratio => {
        data[ratio.toString()] = { low: 50, mid: 55, high: 60 }; // defaults
      });
      rulesData.forEach(rule => {
        const ratioKey = parseFloat(rule.ratio_min).toFixed(1);
        const rakeRangeId = getRakeRangeId(parseFloat(rule.rake_min));
        if (data[ratioKey]) {
          data[ratioKey][rakeRangeId] = parseFloat(rule.diamond_percentage);
        }
      });
      setTableData(data);
    }
    setLoading(false);
  };

  const handleCellChange = (ratio: number, rakeRangeId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setTableData(prev => ({
      ...prev,
      [ratio.toString()]: {
        ...prev[ratio.toString()],
        [rakeRangeId]: Math.min(100, Math.max(0, numValue)),
      },
    }));
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setSaving(true);

    try {
      // Update template
      const { error: templateError } = await supabase
        .from("diamond_club_agreement_templates")
        .update({
          name: editName.trim(),
          description: editDescription.trim() || null,
          is_active: editIsActive,
        })
        .eq("id", params.id);

      if (templateError) throw templateError;

      // Delete existing rules
      await supabase
        .from("diamond_club_agreement_rules")
        .delete()
        .eq("template_id", params.id);

      // Create new rules from table data
      const newRules: any[] = [];

      RATIOS.forEach(ratio => {
        RAKE_RANGES.forEach(range => {
          newRules.push({
            template_id: params.id,
            ratio_min: ratio,
            ratio_max: ratio === 1.0 ? null : Math.round((ratio + 0.1) * 10) / 10,
            rake_min: range.min,
            rake_max: range.max,
            diamond_percentage: tableData[ratio.toString()]?.[range.id] || 50,
          });
        });
      });

      const { error: rulesError } = await supabase
        .from("diamond_club_agreement_rules")
        .insert(newRules);

      if (rulesError) throw rulesError;

      toast.success("Tabla actualizada correctamente");
      setEditing(false);
      loadPlan();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Error al guardar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setEditName(plan?.name || "");
    setEditDescription(plan?.description || "");
    setEditIsActive(plan?.is_active || true);
    loadPlan(); // Reload to reset table data
  };

  if (loading) {
    return (
      <div className="p-8">
        <Loading message="Cargando..." />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="p-8">
        <p className="text-center">Tabla no encontrada</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/diamond-club-plans">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              {editing ? (
                <h1 className="text-3xl font-bold text-slate-900">Editando Tabla</h1>
              ) : (
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-slate-900">{plan.name}</h1>
                  <Badge variant={plan.is_active ? "success" : "secondary"}>
                    {plan.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              )}
              {!editing && plan.description && (
                <p className="text-slate-600 mt-1">{plan.description}</p>
              )}
            </div>
          </div>
          {editing ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          ) : (
            <Button onClick={() => setEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          )}
        </div>

        {/* Basic Info (only in edit mode) */}
        {editing && (
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre de la tabla *</Label>
                  <Input
                    id="name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Ej: Tabla Estándar 2024"
                  />
                </div>
                <div className="flex items-center space-x-3 pt-6">
                  <Switch
                    id="active"
                    checked={editIsActive}
                    onCheckedChange={setEditIsActive}
                  />
                  <Label htmlFor="active">Tabla activa</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea
                  id="description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Descripción de la tabla..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Excel-like Table */}
        <Card>
          <CardHeader>
            <CardTitle>Tabla Diamond → Club</CardTitle>
            <p className="text-sm text-slate-600">
              % que Diamond cobra al club según ratio (PNL/Rake) y rake total en $
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="py-3 px-4 text-left font-semibold border-r border-slate-200 bg-slate-200 sticky left-0">
                      Ratio
                    </th>
                    {RAKE_RANGES.map(range => (
                      <th key={range.id} className="py-3 px-4 text-center font-semibold min-w-[120px]">
                        {range.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RATIOS.map((ratio, idx) => (
                    <tr
                      key={ratio}
                      className={`border-t border-slate-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                    >
                      <td className="py-2 px-4 font-medium border-r border-slate-200 bg-slate-100 sticky left-0">
                        {ratio.toFixed(1)}
                      </td>
                      {RAKE_RANGES.map(range => (
                        <td key={range.id} className="py-1 px-2 text-center">
                          {editing ? (
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={tableData[ratio.toString()]?.[range.id] || 0}
                              onChange={(e) => handleCellChange(ratio, range.id, e.target.value)}
                              className="w-20 mx-auto text-center h-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          ) : (
                            <span className="font-medium text-purple-600">
                              {tableData[ratio.toString()]?.[range.id]?.toFixed(1) || "—"}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Statistics (only in view mode) */}
        {!editing && (
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-slate-600">Total Reglas</p>
                  <p className="text-3xl font-bold text-slate-900">{rules.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-slate-600">% Mínimo Diamond</p>
                  <p className="text-3xl font-bold text-green-600">
                    {rules.length > 0 ? Math.min(...rules.map(r => parseFloat(r.diamond_percentage))) : 0}%
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-slate-600">% Máximo Diamond</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {rules.length > 0 ? Math.max(...rules.map(r => parseFloat(r.diamond_percentage))) : 0}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
