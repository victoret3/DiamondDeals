"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Save, UserCheck } from "lucide-react";
import Link from "next/link";

interface PlayerFormProps {
  onSave: (data: any) => Promise<void>;
}

export default function PlayerForm({ onSave }: PlayerFormProps) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [loadingClubs, setLoadingClubs] = useState(false);
  const [clubs, setClubs] = useState<any[]>([]);
  const [conditions, setConditions] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    isAgent: false,
    selectedClubs: [] as string[],
    clubConditions: {} as Record<string, { type: string; templateId?: string; fixedPercentage?: number }>,
    referredByAgentId: null as string | null,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoadingClubs(true);

    // Cargar clubs
    const { data: clubsData } = await supabase
      .from("clubs")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (clubsData) setClubs(clubsData);

    // Cargar templates de condiciones
    const { data: templatesData } = await supabase
      .from("condition_templates")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (templatesData) setConditions(templatesData);

    // Cargar agentes disponibles
    const { data: agentsData } = await supabase
      .from("players")
      .select("id, full_name, nickname, player_code")
      .eq("is_agent", true)
      .eq("status", "active")
      .order("full_name");

    if (agentsData) setAgents(agentsData);

    setLoadingClubs(false);
  };

  const handleClubToggle = (clubId: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        selectedClubs: [...formData.selectedClubs, clubId],
        clubConditions: {
          ...formData.clubConditions,
          [clubId]: { type: "dynamic", templateId: conditions[0]?.id }
        }
      });
    } else {
      const newSelected = formData.selectedClubs.filter(id => id !== clubId);
      const newConditions = { ...formData.clubConditions };
      delete newConditions[clubId];
      setFormData({
        ...formData,
        selectedClubs: newSelected,
        clubConditions: newConditions
      });
    }
  };

  const handleConditionTypeChange = (clubId: string, type: string) => {
    setFormData({
      ...formData,
      clubConditions: {
        ...formData.clubConditions,
        [clubId]: {
          type,
          ...(type === "dynamic" ? { templateId: conditions[0]?.id } : { fixedPercentage: 30 })
        }
      }
    });
  };

  const handleSubmit = async () => {
    if (formData.selectedClubs.length === 0) {
      toast.error("Debes seleccionar al menos un club");
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
    } catch (error: any) {
      console.error('Error saving player:', error);
      toast.error(error.message || 'Error al crear el jugador');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Configuración del Jugador</CardTitle>
          <CardDescription>
            Configura el tipo de jugador antes de generar el enlace de registro
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isAgent"
              checked={formData.isAgent}
              onCheckedChange={(checked) => setFormData({ ...formData, isAgent: checked as boolean })}
            />
            <Label htmlFor="isAgent" className="cursor-pointer">
              <span className="font-medium">¿Es agente?</span>
              <p className="text-xs text-slate-500 font-normal">
                Los agentes pueden tener jugadores referidos y ganar comisiones
              </p>
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Agente Referidor */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-orange-600" />
            <CardTitle>Agente Referidor</CardTitle>
          </div>
          <CardDescription>
            Selecciona el agente que refirió a este jugador (opcional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <p className="text-slate-500 text-sm">
              No hay agentes disponibles. Primero crea un jugador con rol de agente.
            </p>
          ) : (
            <Select
              value={formData.referredByAgentId || "none"}
              onValueChange={(value) => setFormData({ ...formData, referredByAgentId: value === "none" ? null : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin agente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin agente</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.full_name} ({agent.nickname || agent.player_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clubs y Condiciones</CardTitle>
          <CardDescription>
            Selecciona los clubs y asigna una condición para cada uno
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingClubs ? (
            <p className="text-slate-600">Cargando clubs...</p>
          ) : clubs.length === 0 ? (
            <p className="text-slate-600">
              No hay clubs disponibles. <Link href="/admin/clubs/new" className="text-blue-600 hover:underline">Crea uno primero</Link>
            </p>
          ) : (
            clubs.map((club) => (
              <div key={club.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={`club-${club.id}`}
                    checked={formData.selectedClubs.includes(club.id)}
                    onCheckedChange={(checked) => handleClubToggle(club.id, checked as boolean)}
                  />
                  <Label htmlFor={`club-${club.id}`} className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-medium">{club.name}</p>
                      <p className="text-sm text-slate-600">
                        {club.rakeback_type === "variable"
                          ? "Rakeback: Acuerdos variables"
                          : `Rakeback base: ${club.base_rakeback_percentage}%`}
                      </p>
                    </div>
                  </Label>
                </div>

                {formData.selectedClubs.includes(club.id) && (
                  <div className="ml-6 pl-4 border-l-2 space-y-3">
                    <div className="space-y-2">
                      <Label>Tipo de Condición</Label>
                      <Select
                        value={formData.clubConditions[club.id]?.type || "dynamic"}
                        onValueChange={(value) => handleConditionTypeChange(club.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dynamic">Dinámica (basada en rendimiento)</SelectItem>
                          <SelectItem value="fixed">Fija (porcentaje fijo)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.clubConditions[club.id]?.type === "dynamic" ? (
                      <div className="space-y-2">
                        <Label>Template de Condiciones</Label>
                        <Select
                          value={formData.clubConditions[club.id]?.templateId}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            clubConditions: {
                              ...formData.clubConditions,
                              [club.id]: { ...formData.clubConditions[club.id], templateId: value }
                            }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {conditions.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>Porcentaje Fijo de Rakeback</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={formData.clubConditions[club.id]?.fixedPercentage || 30}
                            onChange={(e) => setFormData({
                              ...formData,
                              clubConditions: {
                                ...formData.clubConditions,
                                [club.id]: { ...formData.clubConditions[club.id], fixedPercentage: parseFloat(e.target.value) }
                              }
                            })}
                            className="pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                            %
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Guardando..." : "Crear Jugador"}
        </Button>
      </div>
    </>
  );
}
