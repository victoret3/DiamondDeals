"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

interface ConditionRule {
  id: string;
  ratioMin: string;
  ratioMax: string;
  handsMin: string;
  handsMax: string;
  rakebackPercentage: string;
}

export default function NewConditionPage() {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const [rules, setRules] = useState<ConditionRule[]>([
    {
      id: "1",
      ratioMin: "",
      ratioMax: "",
      handsMin: "0",
      handsMax: "",
      rakebackPercentage: "",
    }
  ]);

  const addRule = () => {
    setRules([
      ...rules,
      {
        id: Date.now().toString(),
        ratioMin: "",
        ratioMax: "",
        handsMin: "0",
        handsMax: "",
        rakebackPercentage: "",
      }
    ]);
  };

  const removeRule = (id: string) => {
    if (rules.length === 1) {
      toast.error("Debe haber al menos una regla");
      return;
    }
    setRules(rules.filter(r => r.id !== id));
  };

  const updateRule = (id: string, field: keyof ConditionRule, value: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("El nombre del template es obligatorio");
      return;
    }

    // Validar reglas
    for (const rule of rules) {
      if (!rule.rakebackPercentage || parseFloat(rule.rakebackPercentage) < 0) {
        toast.error("Todas las reglas deben tener un porcentaje de rakeback válido");
        return;
      }
    }

    setSaving(true);
    try {
      // 1. Crear template
      const { data: template, error: templateError } = await supabase
        .from("condition_templates")
        .insert({
          name: formData.name,
          description: formData.description || null,
          is_active: true
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // 2. Crear reglas
      const rulesData = rules.map((rule, index) => ({
        template_id: template.id,
        ratio_min: rule.ratioMin ? parseFloat(rule.ratioMin) : -999,
        ratio_max: rule.ratioMax ? parseFloat(rule.ratioMax) : null,
        hands_min: parseInt(rule.handsMin) || 0,
        hands_max: rule.handsMax ? parseInt(rule.handsMax) : null,
        rakeback_percentage: parseFloat(rule.rakebackPercentage),
        priority: index + 1
      }));

      const { error: rulesError } = await supabase
        .from("condition_rules")
        .insert(rulesData);

      if (rulesError) throw rulesError;

      toast.success("Template de condiciones creado correctamente");
      router.push("/admin/conditions");
    } catch (error: any) {
      console.error("Error creating condition template:", error);
      toast.error(error.message || "Error al crear el template");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Nuevo Template de Condiciones</h1>
            <p className="text-slate-600 mt-1">
              Crea un template de condiciones dinámicas basado en ratio y manos jugadas
            </p>
          </div>
        </div>

        {/* Información del Template */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Template</CardTitle>
            <CardDescription>
              Define el nombre y descripción del template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Template *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Condiciones Standard 2024"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ej: Template de condiciones dinámicas basado en ratio resultado/rake"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Reglas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Reglas de Condiciones</CardTitle>
                <CardDescription>
                  Define las reglas basadas en ratio (resultado/rake) y manos jugadas
                </CardDescription>
              </div>
              <Button onClick={addRule} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Añadir Regla
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Header de tabla */}
              <div className="grid grid-cols-12 gap-3 text-sm font-medium text-slate-600 pb-2 border-b">
                <div className="col-span-2">Ratio Min</div>
                <div className="col-span-2">Ratio Max</div>
                <div className="col-span-2">Manos Min</div>
                <div className="col-span-2">Manos Max</div>
                <div className="col-span-3">Rakeback %</div>
                <div className="col-span-1"></div>
              </div>

              {/* Reglas */}
              {rules.map((rule, index) => (
                <div key={rule.id} className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={rule.ratioMin}
                      onChange={(e) => updateRule(rule.id, "ratioMin", e.target.value)}
                      placeholder="-999"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={rule.ratioMax}
                      onChange={(e) => updateRule(rule.id, "ratioMax", e.target.value)}
                      placeholder="Sin límite"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={rule.handsMin}
                      onChange={(e) => updateRule(rule.id, "handsMin", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={rule.handsMax}
                      onChange={(e) => updateRule(rule.id, "handsMax", e.target.value)}
                      placeholder="Sin límite"
                    />
                  </div>
                  <div className="col-span-3">
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={rule.rakebackPercentage}
                        onChange={(e) => updateRule(rule.id, "rakebackPercentage", e.target.value)}
                        placeholder="0"
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                        %
                      </span>
                    </div>
                  </div>
                  <div className="col-span-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRule(rule.id)}
                      disabled={rules.length === 1}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}

              {rules.length === 0 && (
                <p className="text-center text-slate-500 py-8">
                  No hay reglas definidas. Haz clic en "Añadir Regla" para empezar.
                </p>
              )}
            </div>

            {/* Ayuda */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">ℹ️ Información sobre las reglas:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Ratio:</strong> resultado/rake (ej: -0.5 = perdiendo, 0.5 = ganando)</li>
                <li>• <strong>Manos:</strong> cantidad de manos jugadas en el período</li>
                <li>• <strong>Rakeback %:</strong> porcentaje del rakeback del club que recibe Diamont Deals</li>
                <li>• Deja "Max" vacío para indicar "sin límite superior"</li>
                <li>• Las reglas se evalúan en orden de prioridad (de arriba a abajo)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href="/admin/dashboard">
            <Button variant="outline">Cancelar</Button>
          </Link>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Guardando..." : "Crear Template"}
          </Button>
        </div>
      </div>
    </div>
  );
}
