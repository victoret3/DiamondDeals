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
import { ArrowLeft, Save, Plus, Trash2, User } from "lucide-react";
import Link from "next/link";

export default function PlayerConditionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const [newRule, setNewRule] = useState({
    ratio_min: "",
    ratio_max: "",
    hands_min: "",
    hands_max: "",
    player_percentage: "",
    priority: "1",
  });

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
      .order("priority");

    if (rulesData) setRules(rulesData);

    setLoading(false);
  };

  const handleSaveTemplate = async () => {
    if (!formData.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("diamond_player_agreement_templates")
        .update({
          name: formData.name,
          description: formData.description || null,
        })
        .eq("id", templateId);

      if (error) throw error;

      toast.success("Template actualizado correctamente");
      loadTemplateData();
    } catch (error: any) {
      console.error("Error updating template:", error);
      toast.error(error.message || "Error al actualizar el template");
    } finally {
      setSaving(false);
    }
  };

  const handleAddRule = async () => {
    if (!newRule.ratio_min || !newRule.player_percentage) {
      toast.error("Ratio mínimo y porcentaje jugador son obligatorios");
      return;
    }

    try {
      const { error } = await supabase
        .from("diamond_player_agreement_rules")
        .insert({
          template_id: templateId,
          ratio_min: parseFloat(newRule.ratio_min),
          ratio_max: newRule.ratio_max ? parseFloat(newRule.ratio_max) : null,
          hands_min: newRule.hands_min ? parseInt(newRule.hands_min) : 0,
          hands_max: newRule.hands_max ? parseInt(newRule.hands_max) : null,
          player_percentage: parseFloat(newRule.player_percentage),
          priority: parseInt(newRule.priority),
        });

      if (error) throw error;

      toast.success("Regla añadida correctamente");
      setNewRule({
        ratio_min: "",
        ratio_max: "",
        hands_min: "",
        hands_max: "",
        player_percentage: "",
        priority: "1",
      });
      loadTemplateData();
    } catch (error: any) {
      console.error("Error adding rule:", error);
      toast.error(error.message || "Error al añadir la regla");
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta regla?")) return;

    try {
      const { error } = await supabase
        .from("diamond_player_agreement_rules")
        .delete()
        .eq("id", ruleId);

      if (error) throw error;

      toast.success("Regla eliminada correctamente");
      loadTemplateData();
    } catch (error: any) {
      console.error("Error deleting rule:", error);
      toast.error(error.message || "Error al eliminar la regla");
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
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/conditions/player">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
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
          <Badge variant={template.is_active ? "success" : "secondary"} className="text-sm px-3 py-1">
            {template.is_active ? "Activo" : "Inactivo"}
          </Badge>
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
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ej: Condiciones que aumentan con mejor rendimiento"
                rows={3}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveTemplate} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reglas */}
        <Card>
          <CardHeader>
            <CardTitle>Reglas ({rules.length})</CardTitle>
            <CardDescription>
              Define los porcentajes que recibe el jugador según su ratio y manos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Lista de reglas existentes */}
            {rules.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-300">
                      <th className="text-left py-3 px-4 font-semibold">Prioridad</th>
                      <th className="text-left py-3 px-4 font-semibold">Ratio</th>
                      <th className="text-left py-3 px-4 font-semibold">Manos</th>
                      <th className="text-right py-3 px-4 font-semibold">% Jugador</th>
                      <th className="text-right py-3 px-4 font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((rule) => (
                      <tr key={rule.id} className="border-b border-slate-200">
                        <td className="py-3 px-4">
                          <Badge variant="outline">{rule.priority}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          {rule.ratio_min} {rule.ratio_max ? `- ${rule.ratio_max}` : "+"}
                        </td>
                        <td className="py-3 px-4">
                          {rule.hands_min} {rule.hands_max ? `- ${rule.hands_max}` : "+"}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {rule.player_percentage}%
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRule(rule.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Formulario para añadir nueva regla */}
            <div className="border-t pt-4 space-y-4">
              <h3 className="font-semibold text-slate-900">Añadir Nueva Regla</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ratio_min">Ratio Mínimo *</Label>
                  <Input
                    id="ratio_min"
                    type="number"
                    step="0.01"
                    value={newRule.ratio_min}
                    onChange={(e) => setNewRule({ ...newRule, ratio_min: e.target.value })}
                    placeholder="Ej: -5.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ratio_max">Ratio Máximo (opcional)</Label>
                  <Input
                    id="ratio_max"
                    type="number"
                    step="0.01"
                    value={newRule.ratio_max}
                    onChange={(e) => setNewRule({ ...newRule, ratio_max: e.target.value })}
                    placeholder="Ej: 0.00 (dejar vacío para sin límite)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hands_min">Manos Mínimas</Label>
                  <Input
                    id="hands_min"
                    type="number"
                    value={newRule.hands_min}
                    onChange={(e) => setNewRule({ ...newRule, hands_min: e.target.value })}
                    placeholder="Ej: 0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hands_max">Manos Máximas (opcional)</Label>
                  <Input
                    id="hands_max"
                    type="number"
                    value={newRule.hands_max}
                    onChange={(e) => setNewRule({ ...newRule, hands_max: e.target.value })}
                    placeholder="Dejar vacío para sin límite"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="player_percentage">% Jugador *</Label>
                  <Input
                    id="player_percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={newRule.player_percentage}
                    onChange={(e) => setNewRule({ ...newRule, player_percentage: e.target.value })}
                    placeholder="Ej: 30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridad</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={newRule.priority}
                    onChange={(e) => setNewRule({ ...newRule, priority: e.target.value })}
                    placeholder="Ej: 1"
                  />
                  <p className="text-xs text-slate-500">
                    Menor número = mayor prioridad
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleAddRule}>
                  <Plus className="w-4 h-4 mr-2" />
                  Añadir Regla
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
