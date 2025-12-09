"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loading } from "@/components/ui/loading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Save, UserCheck, Building2 } from "lucide-react";
import Link from "next/link";

export default function PlayerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [playerClubs, setPlayerClubs] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    // Cargar jugador
    const { data: playerData } = await supabase
      .from("players")
      .select("*")
      .eq("id", params.id)
      .single();

    // Cargar agentes disponibles
    const { data: agentsData } = await supabase
      .from("players")
      .select("id, full_name, nickname, player_code")
      .eq("is_agent", true)
      .order("full_name");

    // Cargar clubs del jugador
    const { data: clubsData } = await supabase
      .from("player_clubs")
      .select(`
        *,
        club:clubs(id, name, code)
      `)
      .eq("player_id", params.id);

    if (playerData) setPlayer(playerData);
    if (agentsData) setAgents(agentsData);
    if (clubsData) setPlayerClubs(clubsData);

    setLoading(false);
  };

  const updateAgent = async (agentId: string | null) => {
    setSaving(true);
    const { error } = await supabase
      .from("players")
      .update({ referred_by_agent_id: agentId === "none" ? null : agentId })
      .eq("id", params.id);

    if (!error) {
      await loadData();
    }
    setSaving(false);
  };

  const updateAgentCommission = async (playerClubId: string, commission: number) => {
    const { error } = await supabase
      .from("player_clubs")
      .update({ agent_commission_percentage: commission })
      .eq("id", playerClubId);

    if (!error) {
      await loadData();
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <Loading message="Cargando jugador..." />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="p-8">
        <p className="text-center text-slate-600">Jugador no encontrado</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/players">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900">{player.full_name}</h1>
              {player.is_agent && (
                <Badge className="bg-green-600">AGENTE</Badge>
              )}
            </div>
            <p className="text-slate-600 mt-1">
              <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                {player.player_code}
              </code>
            </p>
          </div>
        </div>

        {/* Información del jugador */}
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-600">Email</Label>
                <p className="font-medium">{player.email || "-"}</p>
              </div>
              <div>
                <Label className="text-slate-600">Teléfono</Label>
                <p className="font-medium">{player.phone || "-"}</p>
              </div>
              <div>
                <Label className="text-slate-600">Nickname</Label>
                <p className="font-medium">{player.nickname || "-"}</p>
              </div>
              <div>
                <Label className="text-slate-600 block mb-2">Estado</Label>
                <Badge variant={player.status === "active" ? "success" : "secondary"}>
                  {player.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agente */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-purple-600" />
              <CardTitle>Agente Referidor</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Seleccionar Agente</Label>
              <Select
                value={player.referred_by_agent_id || "none"}
                onValueChange={updateAgent}
                disabled={saving}
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
              <p className="text-xs text-slate-500 mt-2">
                El agente recibirá comisión del rakeback de este jugador según se configure por club
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Clubs y comisiones */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <CardTitle>Clubs y Comisión del Agente</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {playerClubs.length === 0 ? (
              <p className="text-center py-8 text-slate-600">
                Este jugador no está en ningún club todavía
              </p>
            ) : (
              <div className="space-y-4">
                {playerClubs.map((pc) => (
                  <div
                    key={pc.id}
                    className="p-4 border border-slate-200 rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{pc.club.name}</p>
                        <code className="text-xs text-slate-500">{pc.club.code}</code>
                      </div>
                      {!player.referred_by_agent_id && (
                        <Badge variant="secondary" className="text-xs">
                          Sin agente
                        </Badge>
                      )}
                    </div>

                    {player.referred_by_agent_id && (
                      <div className="flex items-center gap-4">
                        <Label className="text-sm">Comisión del agente (%):</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={pc.agent_commission_percentage || 0}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (value >= 0 && value <= 100) {
                              updateAgentCommission(pc.id, value);
                            }
                          }}
                          className="w-24"
                        />
                        <span className="text-sm text-slate-600">
                          del rakeback del jugador
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
