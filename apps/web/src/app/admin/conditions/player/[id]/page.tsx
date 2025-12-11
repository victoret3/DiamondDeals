"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Save, User } from "lucide-react";
import Link from "next/link";

// Manos ranges definition
const HANDS_RANGES = [
  { id: "low", label: "0 a 2.5K", min: 0, max: 2500 },
  { id: "mid", label: "2.5K a 7K", min: 2500, max: 7000 },
  { id: "high", label: "7K+", min: 7000, max: null },
];

// Ratios ranges
const RATIO_RANGES = [
  { id: "r1", label: "-0.5 O MENOS", min: -999, max: -0.5 },
  { id: "r2", label: "-0.5 A 0", min: -0.5, max: 0 },
  { id: "r3", label: "0 A 0.25", min: 0, max: 0.25 },
  { id: "r4", label: "0.25 A 0.5", min: 0.25, max: 0.5 },
  { id: "r5", label: "0.5 A MAYOR", min: 0.5, max: 999 },
];

type TableData = Record<string, Record<string, number>>;

function getHandsRangeId(handsMin: number): string {
  if (handsMin >= 7000) return "high";
  if (handsMin >= 2500) return "mid";
  return "low";
}

function getRatioRangeId(ratioMin: number): string {
  // Match based on the exact ratio_min values stored in the database
  if (ratioMin === -999 || ratioMin < -0.5) return "r1";
  if (ratioMin === -0.5) return "r2";
  if (ratioMin === 0) return "r3";
  if (ratioMin === 0.25) return "r4";
  return "r5"; // 0.5 or greater
}

// Default values based on the screenshot pattern
function getDefaultPercentage(ratioId: string, handsId: string): number {
  const defaults: Record<string, Record<string, number>> = {
    r1: { low: 40, mid: 45, high: 50 },
    r2: { low: 35, mid: 40, high: 45 },
    r3: { low: 30, mid: 35, high: 40 },
    r4: { low: 25, mid: 30, high: 35 },
    r5: { low: 20, mid: 25, high: 30 },
  };
  return defaults[ratioId]?.[handsId] ?? 30;
}

export default function PlayerConditionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const [tableData, setTableData] = useState<TableData>({});

  useEffect(() => {
    loadTemplateData();
  }, [templateId]);

  const loadTemplateData = async () => {
    setLoading(true);

    // Cargar template
    const { data: templateData, error: templateError } = await supabase
      .from("diamond_player_agreement_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (templateError || !templateData) {
      toast.error("Template no encontrado");
      router.push("/admin/conditions/player");
      return;
    }

    setTemplate(templateData);
    setFormData({
      name: templateData.name,
      description: templateData.description || "",
    });

    // Cargar reglas
    const { data: rulesData } = await supabase
      .from("diamond_player_agreement_rules")
      .select("*")
      .eq("template_id", templateId)
      .order("ratio_min", { ascending: true })
      .order("hands_min", { ascending: true });

    // Initialize table data with defaults
    const data: TableData = {};
    RATIO_RANGES.forEach(ratio => {
      data[ratio.id] = {};
      HANDS_RANGES.forEach(hands => {
        data[ratio.id][hands.id] = getDefaultPercentage(ratio.id, hands.id);
      });
    });

    // Override with existing rules
    if (rulesData && rulesData.length > 0) {
      rulesData.forEach(rule => {
        const ratioId = getRatioRangeId(parseFloat(rule.ratio_min));
        const handsId = getHandsRangeId(parseInt(rule.hands_min));
        if (data[ratioId]) {
          data[ratioId][handsId] = parseFloat(rule.player_percentage);
        }
      });
    }

    setTableData(data);
    setLoading(false);
  };

  const handleCellChange = (ratioId: string, handsId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setTableData(prev => ({
      ...prev,
      [ratioId]: {
        ...prev[ratioId],
        [handsId]: Math.min(100, Math.max(0, numValue)),
      },
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setSaving(true);
    try {
      // Update template info
      const { error: templateError } = await supabase
        .from("diamond_player_agreement_templates")
        .update({
          name: formData.name,
          description: formData.description || null,
        })
        .eq("id", templateId);

      if (templateError) throw templateError;

      // Delete existing rules
      const { error: deleteError } = await supabase
        .from("diamond_player_agreement_rules")
        .delete()
        .eq("template_id", templateId);

      if (deleteError) {
        console.error("Error deleting rules:", deleteError);
        throw deleteError;
      }

      // Create new rules from table data
      const newRules: any[] = [];
      let priority = 1;

      RATIO_RANGES.forEach(ratio => {
        HANDS_RANGES.forEach(hands => {
          newRules.push({
            template_id: templateId,
            ratio_min: ratio.min,
            ratio_max: ratio.max === 999 ? null : ratio.max,
            hands_min: hands.min,
            hands_max: hands.max,
            player_percentage: tableData[ratio.id]?.[hands.id] || 30,
            priority: priority++,
          });
        });
      });

      const { error: rulesError } = await supabase
        .from("diamond_player_agreement_rules")
        .insert(newRules);

      if (rulesError) throw rulesError;

      toast.success("Template actualizado correctamente");
      loadTemplateData();
    } catch (error: any) {
      console.error("Error updating template:", error);
      toast.error(error.message || "Error al actualizar el template");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <Loading message="Cargando template..." />
      </div>
    );
  }

  if (!template) {
    return null;
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/conditions/player">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-slate-600" />
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{template.name}</h1>
                <p className="text-slate-600 mt-1">
                  Template de condiciones Diamond → Jugador
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={template.is_active ? "success" : "secondary"} className="text-sm px-3 py-1">
              {template.is_active ? "Activo" : "Inactivo"}
            </Badge>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Guardando..." : "Guardar Todo"}
            </Button>
          </div>
        </div>

        {/* Información del Template */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Template</CardTitle>
            <CardDescription>
              Edita el nombre y descripción del template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Rakeback Progresivo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ej: Condiciones estándar para jugadores"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Excel-like Table */}
        <Card>
          <CardHeader>
            <CardTitle>Tabla de Porcentajes</CardTitle>
            <CardDescription>
              Edita directamente los porcentajes de rakeback. Ratio = Resultado / Rake
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-amber-200">
                    <th rowSpan={2} className="py-3 px-4 text-left font-semibold border-r border-amber-300 bg-amber-300">
                      RATIO
                    </th>
                    <th colSpan={HANDS_RANGES.length} className="py-2 px-4 text-center font-semibold border-b border-amber-300">
                      MANOS
                    </th>
                  </tr>
                  <tr className="bg-amber-100">
                    {HANDS_RANGES.map(hands => (
                      <th key={hands.id} className="py-2 px-4 text-center font-medium min-w-[100px] border-r border-amber-200 last:border-r-0">
                        {hands.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RATIO_RANGES.map((ratio, idx) => (
                    <tr
                      key={ratio.id}
                      className={`border-t border-amber-200 ${idx % 2 === 0 ? 'bg-amber-50' : 'bg-white'}`}
                    >
                      <td className="py-2 px-4 font-medium border-r border-amber-200 bg-amber-100 whitespace-nowrap">
                        {ratio.label}
                      </td>
                      {HANDS_RANGES.map(hands => (
                        <td key={hands.id} className="py-1 px-2 text-center border-r border-amber-100 last:border-r-0">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={tableData[ratio.id]?.[hands.id] || 0}
                            onChange={(e) => handleCellChange(ratio.id, hands.id, e.target.value)}
                            className="w-16 mx-auto text-center h-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Los valores representan el % de rakeback que recibe el jugador según su ratio y manos jugadas.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
