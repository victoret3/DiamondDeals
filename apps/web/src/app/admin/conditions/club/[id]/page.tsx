"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Save, Building2 } from "lucide-react";
import Link from "next/link";

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

// Default values based on the standard pattern
function getDefaultPercentage(ratio: number, rakeRange: string): number {
  const basePercentages: Record<string, number> = {
    low: 50,
    mid: 55,
    high: 60,
  };
  const ratioAdjustment = -ratio * 20;
  return basePercentages[rakeRange] + ratioAdjustment;
}

export default function ClubConditionDetailPage() {
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
      .from("diamond_club_agreement_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (templateError || !templateData) {
      toast.error("Template no encontrado");
      router.push("/admin/conditions/club");
      return;
    }

    setTemplate(templateData);
    setFormData({
      name: templateData.name,
      description: templateData.description || "",
    });

    // Cargar reglas
    const { data: rulesData } = await supabase
      .from("diamond_club_agreement_rules")
      .select("*")
      .eq("template_id", templateId)
      .order("ratio_min", { ascending: true })
      .order("rake_min", { ascending: true });

    // Initialize table data with defaults
    const data: TableData = {};
    RATIOS.forEach(ratio => {
      const key = ratio.toFixed(1);
      data[key] = {};
      RAKE_RANGES.forEach(range => {
        data[key][range.id] = getDefaultPercentage(ratio, range.id);
      });
    });

    // Override with existing rules
    if (rulesData && rulesData.length > 0) {
      rulesData.forEach(rule => {
        const ratioKey = parseFloat(rule.ratio_min).toFixed(1);
        const rakeRangeId = getRakeRangeId(parseFloat(rule.rake_min));
        if (data[ratioKey]) {
          data[ratioKey][rakeRangeId] = parseFloat(rule.diamond_percentage);
        }
      });
    }

    setTableData(data);
    setLoading(false);
  };

  const handleCellChange = (ratio: number, rakeRangeId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const key = ratio.toFixed(1);
    setTableData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [rakeRangeId]: Math.min(100, Math.max(0, numValue)),
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
      console.log("=== SAVING TEMPLATE ===");
      console.log("Template ID:", templateId);
      console.log("Form Data:", formData);
      console.log("Table Data:", tableData);

      // Update template info
      const { data: updateData, error: templateError } = await supabase
        .from("diamond_club_agreement_templates")
        .update({
          name: formData.name,
          description: formData.description || null,
        })
        .eq("id", templateId)
        .select();

      console.log("Update template result:", updateData);
      console.log("Update template error:", templateError);

      if (templateError) throw templateError;

      // Delete existing rules
      const { data: deleteData, error: deleteError } = await supabase
        .from("diamond_club_agreement_rules")
        .delete()
        .eq("template_id", templateId)
        .select();

      console.log("Delete rules result:", deleteData);
      console.log("Delete rules error:", deleteError);

      if (deleteError) {
        console.error("Delete error:", deleteError);
        throw deleteError;
      }

      // Create new rules from table data
      const newRules: any[] = [];

      RATIOS.forEach(ratio => {
        const key = ratio.toFixed(1);
        RAKE_RANGES.forEach(range => {
          newRules.push({
            template_id: templateId,
            ratio_min: ratio,
            ratio_max: ratio === 1.0 ? null : Math.round((ratio + 0.1) * 10) / 10,
            rake_min: range.min,
            rake_max: range.max,
            diamond_percentage: tableData[key]?.[range.id] || 50,
          });
        });
      });

      console.log("New rules to insert:", newRules.length, "rules");
      console.log("First 3 rules:", newRules.slice(0, 3));

      const { data: insertData, error: rulesError } = await supabase
        .from("diamond_club_agreement_rules")
        .insert(newRules)
        .select();

      console.log("Insert rules result:", insertData?.length, "inserted");
      console.log("Insert rules error:", rulesError);

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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/conditions/club">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-slate-600" />
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{template.name}</h1>
                <p className="text-slate-600 mt-1">
                  Template de condiciones Diamond → Club
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
                  placeholder="Ej: Condiciones estándar para clubs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Excel-like Table */}
        <Card>
          <CardHeader>
            <CardTitle>Tabla de Porcentajes Diamond → Club</CardTitle>
            <CardDescription>
              Edita directamente los porcentajes. Ratio = PNL / Rake
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="py-3 px-4 text-left font-semibold border-r border-slate-200 bg-slate-200 sticky left-0 z-10">
                      Ratio
                    </th>
                    {RAKE_RANGES.map(range => (
                      <th key={range.id} className="py-3 px-4 text-center font-semibold min-w-[140px]">
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
                      <td className="py-2 px-4 font-medium border-r border-slate-200 bg-slate-100 sticky left-0 z-10">
                        {ratio.toFixed(1)}
                      </td>
                      {RAKE_RANGES.map(range => (
                        <td key={range.id} className="py-1 px-2 text-center">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={tableData[ratio.toFixed(1)]?.[range.id] || 0}
                            onChange={(e) => handleCellChange(ratio, range.id, e.target.value)}
                            className="w-20 mx-auto text-center h-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
