"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loading } from "@/components/ui/loading";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Search, Eye, UserCheck, Clock, Users, Plus, Trash2, UserPlus } from "lucide-react";
import Link from "next/link";

interface Application {
  id: string;
  name: string;
  code: string;
}

interface PlayerApplication {
  id: string;
  app_player_id: string;
  app_nickname: string;
  application: Application;
}

interface Player {
  id: string;
  player_code: string;
  full_name: string;
  email: string;
  status: string;
  is_agent: boolean;
  created_at: string;
  player_applications?: PlayerApplication[];
  player_clubs?: any[];
  agent?: { nickname: string };
}

interface Club {
  id: string;
  name: string;
  code: string;
  application_id: string;
  application?: { name: string };
}

interface ConditionTemplate {
  id: string;
  name: string;
}

interface EditableApp {
  applicationId: string;
  playerId: string;
  nickname: string;
  isNew?: boolean;
  existingId?: string;
}

export default function PlayersPage() {
  const supabase = createClient();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Data for verification
  const [applications, setApplications] = useState<Application[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [templates, setTemplates] = useState<ConditionTemplate[]>([]);
  const [agents, setAgents] = useState<{ id: string; full_name: string; nickname: string; player_code: string }[]>([]);

  // Verification modal state
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [saving, setSaving] = useState(false);
  const [isAgent, setIsAgent] = useState(false);
  const [selectedClubs, setSelectedClubs] = useState<string[]>([]);
  const [clubConditions, setClubConditions] = useState<Record<string, { type: string; templateId?: string; fixedPercentage?: number }>>({});
  const [playerApps, setPlayerApps] = useState<EditableApp[]>([]);
  const [referredByAgentId, setReferredByAgentId] = useState<string | null>(null);
  const [agentCommission, setAgentCommission] = useState<number>(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    // Load players with applications and clubs
    const { data: playersData } = await supabase
      .from("players")
      .select(`
        id, player_code, full_name, email, status, is_agent, created_at,
        player_applications (
          id, app_player_id, app_nickname,
          application:applications (id, name, code)
        ),
        player_clubs (
          id,
          custom_diamond_agreement,
          diamond_agreement_type,
          diamond_fixed_percentage,
          club:clubs (name, code, diamond_player_agreement_type, diamond_player_fixed_percentage),
          weekly_reports:weekly_player_reports (player_percentage, week_start),
          player_conditions (template_id)
        ),
        agent:players!referred_by_agent_id(nickname)
      `)
      .order("created_at", { ascending: false });

    // Load templates to map IDs to names
    const { data: templatesForMapping } = await supabase
      .from("diamond_player_agreement_templates")
      .select("id, name");

    const templateNames: Record<string, string> = {};
    templatesForMapping?.forEach(t => {
      templateNames[t.id] = t.name;
    });

    // Add template names to player clubs
    if (playersData) {
      playersData.forEach((player: any) => {
        player.player_clubs?.forEach((pc: any) => {
          const templateId = pc.player_conditions?.[0]?.template_id;
          pc.template_name = templateId ? templateNames[templateId] : null;
        });
      });
    }

    // Load applications
    const { data: appsData } = await supabase
      .from("applications")
      .select("id, name, code")
      .eq("is_active", true)
      .order("name");

    // Load clubs with application
    const { data: clubsData } = await supabase
      .from("clubs")
      .select(`id, name, code, application_id, application:applications (name)`)
      .eq("is_active", true)
      .order("name");

    // Load condition templates
    const { data: templatesData } = await supabase
      .from("diamond_player_agreement_templates")
      .select("id, name")
      .eq("is_active", true)
      .order("name");

    // Load agents
    const { data: agentsData } = await supabase
      .from("players")
      .select("id, full_name, nickname, player_code")
      .eq("is_agent", true)
      .eq("status", "active")
      .order("full_name");

    if (playersData) setPlayers(playersData as any);
    if (appsData) setApplications(appsData);
    if (clubsData) setClubs(clubsData as any);
    if (templatesData) setTemplates(templatesData);
    if (agentsData) setAgents(agentsData);

    setLoading(false);
  };

  const toggleAgent = async (playerId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("players")
      .update({ is_agent: !currentStatus })
      .eq("id", playerId);

    if (!error) loadData();
  };

  // Filter players
  const filteredPlayers = players.filter(p => {
    const matchesSearch =
      p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.player_code?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase());

    if (activeTab === "pending") return matchesSearch && p.status === "pending";
    if (activeTab === "active") return matchesSearch && p.status === "active";
    return matchesSearch;
  });

  const pendingCount = players.filter(p => p.status === "pending").length;
  const activeCount = players.filter(p => p.status === "active").length;

  // Verification functions
  const openVerifyModal = (player: Player) => {
    setSelectedPlayer(player);
    setIsAgent(false);
    setSelectedClubs([]);
    setClubConditions({});
    setReferredByAgentId(null);
    setAgentCommission(0);

    const apps: EditableApp[] = player.player_applications?.map(pa => ({
      applicationId: pa.application.id,
      playerId: pa.app_player_id,
      nickname: pa.app_nickname,
      isNew: false,
      existingId: pa.id
    })) || [];
    setPlayerApps(apps);
  };

  const closeVerifyModal = () => {
    setSelectedPlayer(null);
    setPlayerApps([]);
    setSelectedClubs([]);
    setClubConditions({});
    setReferredByAgentId(null);
    setAgentCommission(0);
  };

  const addPlayerApp = () => {
    const usedAppIds = playerApps.map(pa => pa.applicationId);
    const availableApp = applications.find(a => !usedAppIds.includes(a.id));
    if (availableApp) {
      setPlayerApps([...playerApps, {
        applicationId: availableApp.id,
        playerId: "",
        nickname: "",
        isNew: true
      }]);
    }
  };

  const removePlayerApp = (index: number) => {
    setPlayerApps(playerApps.filter((_, i) => i !== index));
  };

  const updatePlayerApp = (index: number, field: keyof EditableApp, value: string) => {
    const updated = [...playerApps];
    updated[index] = { ...updated[index], [field]: value };
    setPlayerApps(updated);
  };

  const toggleClub = (clubId: string) => {
    if (selectedClubs.includes(clubId)) {
      setSelectedClubs(selectedClubs.filter(id => id !== clubId));
      const newConditions = { ...clubConditions };
      delete newConditions[clubId];
      setClubConditions(newConditions);
    } else {
      setSelectedClubs([...selectedClubs, clubId]);
      setClubConditions({
        ...clubConditions,
        [clubId]: { type: "fixed", fixedPercentage: 50 }
      });
    }
  };

  const updateClubCondition = (clubId: string, field: string, value: any) => {
    setClubConditions({
      ...clubConditions,
      [clubId]: { ...clubConditions[clubId], [field]: value }
    });
  };

  const getAvailableClubs = () => {
    const playerAppIds = playerApps.map(pa => pa.applicationId);
    return clubs.filter(club => playerAppIds.includes(club.application_id));
  };

  const getAvailableAppsToAdd = () => {
    const usedAppIds = playerApps.map(pa => pa.applicationId);
    return applications.filter(a => !usedAppIds.includes(a.id));
  };

  const handleVerify = async () => {
    if (!selectedPlayer) return;

    if (playerApps.length === 0) {
      toast.error("Debes asignar al menos una aplicación");
      return;
    }

    for (const app of playerApps) {
      if (!app.playerId.trim() || !app.nickname.trim()) {
        const appName = applications.find(a => a.id === app.applicationId)?.name;
        toast.error(`Completa el ID y nickname para ${appName}`);
        return;
      }
    }

    if (selectedClubs.length === 0) {
      toast.error("Debes asignar al menos un club");
      return;
    }

    setSaving(true);

    try {
      // 1. Update/create player applications
      const existingAppIds = selectedPlayer.player_applications?.map(pa => pa.id) || [];
      const keepAppIds = playerApps.filter(pa => pa.existingId).map(pa => pa.existingId);
      const toDeleteIds = existingAppIds.filter(id => !keepAppIds.includes(id));

      if (toDeleteIds.length > 0) {
        await supabase.from("player_applications").delete().in("id", toDeleteIds);
      }

      for (const app of playerApps) {
        if (app.existingId) {
          await supabase
            .from("player_applications")
            .update({
              application_id: app.applicationId,
              app_player_id: app.playerId,
              app_nickname: app.nickname
            })
            .eq("id", app.existingId);
        } else {
          await supabase
            .from("player_applications")
            .insert({
              player_id: selectedPlayer.id,
              application_id: app.applicationId,
              app_player_id: app.playerId,
              app_nickname: app.nickname
            });
        }
      }

      // 2. Update player status to active and set agent
      const { error: updateError } = await supabase
        .from("players")
        .update({
          status: "active",
          is_agent: isAgent,
          referred_by_agent_id: referredByAgentId,
          agent_commission_percentage: referredByAgentId ? agentCommission : 0
        })
        .eq("id", selectedPlayer.id);

      if (updateError) throw updateError;

      // 3. Assign clubs and conditions
      for (const clubId of selectedClubs) {
        const condition = clubConditions[clubId];

        // Crear player_club con los datos de la condición
        const playerClubData: any = {
          player_id: selectedPlayer.id,
          club_id: clubId,
          custom_diamond_agreement: true,
          diamond_agreement_type: condition.type,
          diamond_fixed_percentage: condition.type === "fixed" ? condition.fixedPercentage : null
        };

        const { data: playerClub, error: pcError } = await supabase
          .from("player_clubs")
          .insert(playerClubData)
          .select()
          .single();

        if (pcError) throw pcError;

        // Si es dinámico, crear entrada en player_conditions con el template
        if (condition.type === "dynamic" && condition.templateId) {
          const { error: condError } = await supabase
            .from("player_conditions")
            .insert({
              player_club_id: playerClub.id,
              condition_type: "dynamic",
              template_id: condition.templateId
            });

          if (condError) throw condError;
        }
      }

      // 4. If is agent, update profile role
      if (isAgent) {
        const { data: player } = await supabase
          .from("players")
          .select("user_id")
          .eq("id", selectedPlayer.id)
          .single();

        if (player?.user_id) {
          await supabase.from("profiles").update({ role: "agent" }).eq("id", player.user_id);
        }
      }

      toast.success(`Jugador ${selectedPlayer.full_name} verificado correctamente`);
      closeVerifyModal();
      loadData();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Error al verificar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const availableClubs = getAvailableClubs();
  const availableAppsToAdd = getAvailableAppsToAdd();

  // Render player row - una fila por jugador
  const renderPlayerRow = (player: Player) => {
    const isPending = player.status === "pending";

    // Función para obtener la condición de un club
    const getClubCondition = (pc: any) => {
      const hasCustom = pc.custom_diamond_agreement;
      const isFixed = hasCustom
        ? pc.diamond_agreement_type === "fixed"
        : pc.club.diamond_player_agreement_type === "fixed";

      if (isFixed) {
        const percentage = hasCustom
          ? pc.diamond_fixed_percentage
          : pc.club.diamond_player_fixed_percentage;
        return `${percentage}%`;
      } else {
        return pc.template_name || "Dinámico";
      }
    };

    if (isPending) {
      return (
        <tr key={player.id} className="border-b border-slate-200 hover:bg-amber-50 bg-amber-50/30">
          <td className="py-3 px-4">
            <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
              {player.player_code}
            </code>
          </td>
          <td className="py-3 px-4">
            <div className="flex items-center gap-2">
              <p className="font-medium text-slate-900">{player.full_name}</p>
              <Badge variant="warning" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Pendiente
              </Badge>
            </div>
            <p className="text-xs text-slate-500">{player.email}</p>
          </td>
          <td className="py-3 px-4">
            <div className="flex flex-wrap gap-1">
              {player.player_applications?.map(pa => (
                <Badge key={pa.id} variant="secondary" className="text-xs">
                  {pa.application.name}
                </Badge>
              ))}
              {(!player.player_applications || player.player_applications.length === 0) && (
                <span className="text-xs text-slate-400">-</span>
              )}
            </div>
          </td>
          <td className="py-3 px-4 text-slate-400">-</td>
          <td className="py-3 px-4 text-center text-slate-400">-</td>
          <td className="py-3 px-4 text-right">
            <Button size="sm" onClick={() => openVerifyModal(player)}>
              <UserCheck className="w-4 h-4 mr-1" />
              Verificar
            </Button>
          </td>
        </tr>
      );
    }

    // Jugador activo - una sola fila
    return (
      <tr key={player.id} className="border-b border-slate-200 hover:bg-slate-50">
        <td className="py-3 px-4">
          <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
            {player.player_code}
          </code>
        </td>
        <td className="py-3 px-4">
          <p className="font-medium text-slate-900">{player.full_name}</p>
          <p className="text-xs text-slate-500">{player.email}</p>
        </td>
        <td className="py-3 px-4">
          <div className="flex flex-wrap gap-1">
            {player.player_applications?.map(pa => (
              <Badge key={pa.id} variant="secondary" className="text-xs">
                {pa.application.name}
              </Badge>
            ))}
            {(!player.player_applications || player.player_applications.length === 0) && (
              <span className="text-xs text-slate-400">-</span>
            )}
          </div>
        </td>
        <td className="py-3 px-4">
          <div className="flex flex-wrap gap-1">
            {player.player_clubs?.map((pc: any) => (
              <Badge key={pc.id} variant="outline" className="text-xs">
                {pc.club.name} <span className="text-purple-600 ml-1">({getClubCondition(pc)})</span>
              </Badge>
            ))}
            {(!player.player_clubs || player.player_clubs.length === 0) && (
              <span className="text-xs text-slate-400">-</span>
            )}
          </div>
        </td>
        <td className="py-3 px-4 text-center">
          {player.is_agent ? (
            <Badge className="bg-green-600 text-xs">Sí</Badge>
          ) : (
            <span className="text-xs text-slate-400">No</span>
          )}
        </td>
        <td className="py-3 px-4 text-right">
          <Link href={`/admin/players/${player.id}`}>
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
        </td>
      </tr>
    );
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Jugadores</h1>
            <p className="text-slate-600 mt-1">
              Gestiona todos los jugadores del sistema
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all" className="gap-2">
                <Users className="w-4 h-4" />
                Todos ({players.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="w-4 h-4" />
                Pendientes
                {pendingCount > 0 && (
                  <Badge variant="warning" className="ml-1">{pendingCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="active" className="gap-2">
                <UserCheck className="w-4 h-4" />
                Activos ({activeCount})
              </TabsTrigger>
            </TabsList>

            {/* Search */}
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, código o email..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          <Card className="mt-4">
            <CardContent className="pt-6">
              {loading ? (
                <Loading message="Cargando jugadores..." />
              ) : filteredPlayers.length === 0 ? (
                <p className="text-center py-8 text-slate-600">
                  {search ? "No se encontraron jugadores" : "No hay jugadores"}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-slate-300">
                        <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Código</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Nombre</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Aplicaciones</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Clubs</th>
                        <th className="text-center py-3 px-4 font-semibold text-slate-700 text-sm">Es Agente</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700 text-sm"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPlayers.map(player => renderPlayerRow(player))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </Tabs>
      </div>

      {/* Verification Modal */}
      <Dialog open={!!selectedPlayer} onOpenChange={() => closeVerifyModal()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Verificar: {selectedPlayer?.full_name}</DialogTitle>
            <DialogDescription>
              Asigna aplicaciones, clubs y condiciones al jugador
            </DialogDescription>
          </DialogHeader>

          {selectedPlayer && (
            <div className="space-y-6 py-4">
              {/* Info del jugador */}
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-500">Código:</span>
                    <code className="ml-2 bg-slate-200 px-2 py-0.5 rounded text-xs">
                      {selectedPlayer.player_code}
                    </code>
                  </div>
                  <div>
                    <span className="text-slate-500">Email:</span>
                    <span className="ml-2">{selectedPlayer.email}</span>
                  </div>
                </div>
              </div>

              {/* Aplicaciones */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Aplicaciones *</Label>
                  {availableAppsToAdd.length > 0 && (
                    <Button variant="outline" size="sm" onClick={addPlayerApp}>
                      <Plus className="w-4 h-4 mr-1" />
                      Añadir App
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  {playerApps.map((app, index) => (
                    <div key={index} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <Select
                          value={app.applicationId}
                          onValueChange={(value) => updatePlayerApp(index, "applicationId", value)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {applications
                              .filter(a => a.id === app.applicationId || !playerApps.some(pa => pa.applicationId === a.id))
                              .map(a => (
                                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePlayerApp(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="ID (ej: 1234567)"
                          value={app.playerId}
                          onChange={(e) => updatePlayerApp(index, "playerId", e.target.value)}
                        />
                        <Input
                          placeholder="Nickname"
                          value={app.nickname}
                          onChange={(e) => updatePlayerApp(index, "nickname", e.target.value)}
                        />
                      </div>
                    </div>
                  ))}

                  {playerApps.length === 0 && (
                    <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded">
                      No hay aplicaciones asignadas. Añade al menos una.
                    </p>
                  )}
                </div>
              </div>

              {/* Es agente */}
              <div className="flex items-center space-x-3">
                <Switch id="is-agent" checked={isAgent} onCheckedChange={setIsAgent} />
                <Label htmlFor="is-agent">Es Agente (puede tener referidos)</Label>
              </div>

              {/* Agente Referidor */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-orange-600" />
                  <Label>Agente Referidor</Label>
                </div>
                {agents.filter(a => a.id !== selectedPlayer?.id).length === 0 ? (
                  <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded">
                    No hay agentes disponibles
                  </p>
                ) : (
                  <div className="space-y-3">
                    <Select
                      value={referredByAgentId || "none"}
                      onValueChange={(value) => {
                        setReferredByAgentId(value === "none" ? null : value);
                        if (value === "none") setAgentCommission(0);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sin agente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin agente</SelectItem>
                        {agents
                          .filter(a => a.id !== selectedPlayer?.id)
                          .map((agent) => (
                            <SelectItem key={agent.id} value={agent.id}>
                              {agent.full_name} ({agent.nickname || agent.player_code})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>

                    {referredByAgentId && (
                      <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                        <Label className="text-sm text-orange-800">Comisión del agente:</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={agentCommission}
                            onChange={(e) => setAgentCommission(parseFloat(e.target.value) || 0)}
                            className="w-20"
                          />
                          <span className="text-sm text-orange-800">% del rakeback</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Clubs */}
              <div className="space-y-3">
                <Label>Clubs *</Label>
                {availableClubs.length === 0 ? (
                  <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded">
                    {playerApps.length === 0
                      ? "Primero añade aplicaciones al jugador."
                      : "No hay clubs configurados para las aplicaciones seleccionadas."}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {availableClubs.map(club => (
                      <div key={club.id} className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={`club-${club.id}`}
                            checked={selectedClubs.includes(club.id)}
                            onCheckedChange={() => toggleClub(club.id)}
                          />
                          <Label htmlFor={`club-${club.id}`} className="font-medium cursor-pointer">
                            {club.name}
                            <span className="ml-2 text-xs text-slate-500">
                              ({club.application?.name})
                            </span>
                          </Label>
                        </div>

                        {selectedClubs.includes(club.id) && (
                          <div className="ml-7 p-3 bg-slate-50 rounded-lg space-y-3">
                            <div className="flex items-center gap-4">
                              <Select
                                value={clubConditions[club.id]?.type || "fixed"}
                                onValueChange={(value) => updateClubCondition(club.id, "type", value)}
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="fixed">Fijo</SelectItem>
                                  <SelectItem value="dynamic">Dinámico</SelectItem>
                                </SelectContent>
                              </Select>

                              {clubConditions[club.id]?.type === "fixed" ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={clubConditions[club.id]?.fixedPercentage || 50}
                                    onChange={(e) => updateClubCondition(club.id, "fixedPercentage", parseFloat(e.target.value))}
                                    className="w-20 px-2 py-1 border rounded text-center"
                                  />
                                  <span className="text-slate-600">%</span>
                                </div>
                              ) : (
                                <Select
                                  value={clubConditions[club.id]?.templateId || ""}
                                  onValueChange={(value) => updateClubCondition(club.id, "templateId", value)}
                                >
                                  <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Selecciona template" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {templates.map(t => (
                                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botón verificar */}
              <Button
                onClick={handleVerify}
                disabled={saving || selectedClubs.length === 0 || playerApps.length === 0}
                className="w-full"
                size="lg"
              >
                <UserCheck className="w-5 h-5 mr-2" />
                {saving ? "Verificando..." : "Verificar y Activar Jugador"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
