"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  return Math.round(ratio * 10) / 10; // Fix floating point issues
});

// Default values based on the image pattern
function getDefaultPercentage(ratio: number, rakeRange: string): number {
  // Base percentage at ratio 0 for each rake range
  const basePercentages: Record<string, number> = {
    low: 50,
    mid: 55,
    high: 60,
  };

  // Each 0.1 decrease in ratio adds 2% to the percentage
  const ratioAdjustment = -ratio * 20;

  return basePercentages[rakeRange] + ratioAdjustment;
}

type TableData = Record<string, Record<string, number>>;

export default function NewDiamondClubPlanPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Initialize table data with default values
  const [tableData, setTableData] = useState<TableData>(() => {
    const data: TableData = {};
    RATIOS.forEach(ratio => {
      data[ratio.toString()] = {};
      RAKE_RANGES.forEach(range => {
        data[ratio.toString()][range.id] = getDefaultPercentage(ratio, range.id);
      });
    });
    return data;
  });

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
    if (!name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setSaving(true);

    try {
      // Create template
      const { data: template, error: templateError } = await supabase
        .from("diamond_club_agreement_templates")
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          is_active: isActive,
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Create rules from table data
      const rules: any[] = [];

      RATIOS.forEach(ratio => {
        RAKE_RANGES.forEach(range => {
          rules.push({
            template_id: template.id,
            ratio_min: ratio,
            ratio_max: ratio === 1.0 ? null : ratio + 0.1,
            rake_min: range.min,
            rake_max: range.max,
            diamond_percentage: tableData[ratio.toString()][range.id],
          });
        });
      });

      const { error: rulesError } = await supabase
        .from("diamond_club_agreement_rules")
        .insert(rules);

      if (rulesError) throw rulesError;

      toast.success("Tabla creada correctamente");
      router.push(`/admin/diamond-club-plans/${template.id}`);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Error al guardar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

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
              <h1 className="text-3xl font-bold text-slate-900">Nueva Tabla Diamond → Club</h1>
              <p className="text-slate-600 mt-1">
                Define los porcentajes según ratio y rake
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="w-5 h-5 mr-2" />
            {saving ? "Guardando..." : "Guardar Tabla"}
          </Button>
        </div>

        {/* Basic Info */}
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Tabla Estándar 2024"
                />
              </div>
              <div className="flex items-center space-x-3 pt-6">
                <Switch
                  id="active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="active">Tabla activa</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción de la tabla..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Excel-like Table */}
        <Card>
          <CardHeader>
            <CardTitle>Tabla de Porcentajes</CardTitle>
            <p className="text-sm text-slate-600">
              Edita directamente los porcentajes en cada celda. Ratio = PNL / Rake
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
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={tableData[ratio.toString()][range.id]}
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
