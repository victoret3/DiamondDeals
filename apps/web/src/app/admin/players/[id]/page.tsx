"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loading } from "@/components/ui/loading";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Save, UserCheck, Building2, Plus, Trash2, Smartphone, Link2, Unlink, Pencil, Check, X } from "lucide-react";
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

interface PlayerClubData {
  id: string;
  club_id: string;
  club: Club;
  custom_diamond_agreement: boolean;
  diamond_agreement_type: string;
  diamond_fixed_percentage: number | null;
  condition_template_id?: string | null;
}

export default function PlayerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [playerClubs, setPlayerClubs] = useState<PlayerClubData[]>([]);

  // Edit state
  const [applications, setApplications] = useState<Application[]>([]);
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [templates, setTemplates] = useState<ConditionTemplate[]>([]);
  const [playerApps, setPlayerApps] = useState<EditableApp[]>([]);

  // New club to add
  const [showAddClub, setShowAddClub] = useState(false);
  const [newClubId, setNewClubId] = useState("");
  const [newClubConditionType, setNewClubConditionType] = useState("fixed");
  const [newClubFixedPercentage, setNewClubFixedPercentage] = useState(50);
  const [newClubTemplateId, setNewClubTemplateId] = useState("");

  // User linking
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  // Player code editing
  const [editingCode, setEditingCode] = useState(false);
  const [newPlayerCode, setNewPlayerCode] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    // Cargar jugador con aplicaciones
    const { data: playerData } = await supabase
      .from("players")
      .select(`
        *,
        player_applications (
          id, app_player_id, app_nickname,
          application:applications (id, name, code)
        )
      `)
      .eq("id", params.id)
      .single();

    // Cargar agentes disponibles
    const { data: agentsData } = await supabase
      .from("players")
      .select("id, full_name, nickname, player_code")
      .eq("is_agent", true)
      .neq("id", params.id)
      .order("full_name");

    // Cargar clubs del jugador con diamond_template_id
    const { data: clubsData } = await supabase
      .from("player_clubs")
      .select(`
        id, club_id, custom_diamond_agreement, diamond_agreement_type,
        diamond_fixed_percentage, diamond_template_id,
        club:clubs(id, name, code, application_id, application:applications(name))
      `)
      .eq("player_id", params.id);

    // Mapear para usar diamond_template_id como condition_template_id
    const clubsWithTemplate = clubsData?.map(pc => ({
      ...pc,
      condition_template_id: pc.diamond_template_id || null
    })) || [];

    // Cargar todas las aplicaciones
    const { data: appsData } = await supabase
      .from("applications")
      .select("id, name, code")
      .eq("is_active", true)
      .order("name");

    // Cargar todos los clubs
    const { data: allClubsData } = await supabase
      .from("clubs")
      .select("id, name, code, application_id, application:applications(name)")
      .eq("is_active", true)
      .order("name");

    // Cargar templates de condiciones de jugador
    const { data: templatesData } = await supabase
      .from("diamond_player_agreement_templates")
      .select("id, name")
      .eq("is_active", true)
      .order("name");

    // Cargar usuarios disponibles para vincular (profiles que no están vinculados a otros jugadores)
    const { data: usersData } = await supabase
      .from("profiles")
      .select("id, email, full_name, role")
      .in("role", ["player", "agent"])
      .order("full_name");

    // Filtrar usuarios que ya están vinculados a otros jugadores
    if (usersData) {
      const { data: linkedPlayers } = await supabase
        .from("players")
        .select("user_id")
        .not("user_id", "is", null);

      const linkedUserIds = linkedPlayers?.map(p => p.user_id) || [];
      const available = usersData.filter(u =>
        !linkedUserIds.includes(u.id) || (playerData && playerData.user_id === u.id)
      );
      setAvailableUsers(available);
    }

    if (playerData) {
      setPlayer(playerData);
      // Inicializar apps editables
      const apps: EditableApp[] = playerData.player_applications?.map((pa: any) => ({
        applicationId: pa.application.id,
        playerId: pa.app_player_id,
        nickname: pa.app_nickname,
        isNew: false,
        existingId: pa.id
      })) || [];
      setPlayerApps(apps);
    }
    if (agentsData) setAgents(agentsData);
    if (clubsWithTemplate) setPlayerClubs(clubsWithTemplate as any);
    if (appsData) setApplications(appsData);
    if (allClubsData) setAllClubs(allClubsData as any);
    if (templatesData) setTemplates(templatesData);

    setLoading(false);
  };

  // ========== PLAYER APPS ==========
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

  const savePlayerApps = async () => {
    // Validar
    for (const app of playerApps) {
      if (!app.playerId.trim() || !app.nickname.trim()) {
        const appName = applications.find(a => a.id === app.applicationId)?.name;
        toast.error(`Completa el ID y nickname para ${appName}`);
        return;
      }
    }

    setSaving(true);
    try {
      const existingAppIds = player.player_applications?.map((pa: any) => pa.id) || [];
      const keepAppIds = playerApps.filter(pa => pa.existingId).map(pa => pa.existingId);
      const toDeleteIds = existingAppIds.filter((id: string) => !keepAppIds.includes(id));

      // Eliminar apps removidas
      if (toDeleteIds.length > 0) {
        await supabase.from("player_applications").delete().in("id", toDeleteIds);
      }

      // Actualizar/crear apps
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
              player_id: player.id,
              application_id: app.applicationId,
              app_player_id: app.playerId,
              app_nickname: app.nickname
            });
        }
      }

      toast.success("Aplicaciones guardadas");
      loadData();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // ========== PLAYER STATUS ==========
  const toggleAgent = async () => {
    setSaving(true);
    const newValue = !player.is_agent;
    const { error } = await supabase
      .from("players")
      .update({ is_agent: newValue })
      .eq("id", player.id);

    if (error) {
      toast.error("Error: " + error.message);
    } else {
      toast.success(newValue ? "Jugador convertido en agente" : "Rol de agente eliminado");
      loadData();
    }
    setSaving(false);
  };

  const toggleStatus = async () => {
    setSaving(true);
    const newStatus = player.status === "active" ? "inactive" : "active";
    const { error } = await supabase
      .from("players")
      .update({ status: newStatus })
      .eq("id", player.id);

    if (error) {
      toast.error("Error: " + error.message);
    } else {
      toast.success(`Estado cambiado a ${newStatus}`);
      loadData();
    }
    setSaving(false);
  };

  // ========== PLAYER CODE ==========
  const savePlayerCode = async () => {
    if (!newPlayerCode.trim()) {
      toast.error("El código no puede estar vacío");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("players")
      .update({ player_code: newPlayerCode.trim().toUpperCase() })
      .eq("id", player.id);

    if (error) {
      toast.error("Error: " + error.message);
    } else {
      toast.success("Código actualizado");
      setEditingCode(false);
      loadData();
    }
    setSaving(false);
  };

  // ========== USER LINKING ==========
  const linkUser = async (userId: string) => {
    if (!userId || userId === "none") {
      toast.error("Selecciona un usuario");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("players")
      .update({ user_id: userId })
      .eq("id", player.id);

    if (error) {
      toast.error("Error: " + error.message);
    } else {
      toast.success("Usuario vinculado correctamente");
      setSelectedUserId("");
      loadData();
    }
    setSaving(false);
  };

  const unlinkUser = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("players")
      .update({ user_id: null })
      .eq("id", player.id);

    if (error) {
      toast.error("Error: " + error.message);
    } else {
      toast.success("Usuario desvinculado");
      loadData();
    }
    setSaving(false);
  };

  // ========== AGENT ==========
  const updateAgent = async (agentId: string | null) => {
    setSaving(true);
    const actualAgentId = agentId === "none" ? null : agentId;
    const { error } = await supabase
      .from("players")
      .update({
        referred_by_agent_id: actualAgentId,
        agent_commission_percentage: actualAgentId ? player.agent_commission_percentage || 0 : 0
      })
      .eq("id", params.id);

    if (!error) {
      toast.success("Agente actualizado");
      loadData();
    } else {
      toast.error("Error: " + error.message);
    }
    setSaving(false);
  };

  const updateAgentCommission = async (commission: number) => {
    const { error } = await supabase
      .from("players")
      .update({ agent_commission_percentage: commission })
      .eq("id", params.id);

    if (!error) {
      loadData();
    }
  };

  // ========== CLUBS ==========
  const getAvailableClubsToAdd = () => {
    const playerAppIds = playerApps.map(pa => pa.applicationId);
    const existingClubIds = playerClubs.map(pc => pc.club_id);
    return allClubs.filter(c =>
      playerAppIds.includes(c.application_id) && !existingClubIds.includes(c.id)
    );
  };

  const addClub = async () => {
    if (!newClubId) {
      toast.error("Selecciona un club");
      return;
    }

    setSaving(true);
    try {
      // Crear player_club con todo incluido
      const { error: pcError } = await supabase
        .from("player_clubs")
        .insert({
          player_id: player.id,
          club_id: newClubId,
          custom_diamond_agreement: true,
          diamond_agreement_type: newClubConditionType,
          diamond_fixed_percentage: newClubConditionType === "fixed" ? newClubFixedPercentage : null,
          diamond_template_id: newClubConditionType === "dynamic" ? newClubTemplateId : null
        });

      if (pcError) throw pcError;

      toast.success("Club añadido");
      setShowAddClub(false);
      setNewClubId("");
      setNewClubConditionType("fixed");
      setNewClubFixedPercentage(50);
      setNewClubTemplateId("");
      loadData();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const removeClub = async (playerClubId: string) => {
    setSaving(true);
    const { error } = await supabase
      .from("player_clubs")
      .delete()
      .eq("id", playerClubId);

    if (error) {
      toast.error("Error: " + error.message);
    } else {
      toast.success("Club eliminado");
      loadData();
    }
    setSaving(false);
  };

  const updateClubCondition = async (playerClubId: string, type: string, value: number, templateId?: string) => {
    // Actualizar player_clubs directamente con el template_id
    const { error } = await supabase
      .from("player_clubs")
      .update({
        custom_diamond_agreement: true,
        diamond_agreement_type: type,
        diamond_fixed_percentage: type === "fixed" ? value : null,
        diamond_template_id: type === "dynamic" ? templateId : null
      })
      .eq("id", playerClubId);

    if (error) {
      toast.error("Error: " + error.message);
      return;
    }

    toast.success("Condiciones actualizadas");
    loadData();
  };

  const availableAppsToAdd = applications.filter(a => !playerApps.some(pa => pa.applicationId === a.id));
  const availableClubsToAdd = getAvailableClubsToAdd();

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
              <Badge variant={player.status === "active" ? "success" : "secondary"}>
                {player.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {editingCode ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={newPlayerCode}
                    onChange={(e) => setNewPlayerCode(e.target.value.toUpperCase())}
                    className="w-40 h-7 text-xs font-mono"
                    placeholder="DD-XXXX-XXXX"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={savePlayerCode}
                    disabled={saving}
                    className="h-7 w-7 p-0"
                  >
                    <Check className="w-4 h-4 text-green-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingCode(false)}
                    className="h-7 w-7 p-0"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                    {player.player_code}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNewPlayerCode(player.player_code);
                      setEditingCode(true);
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Pencil className="w-3 h-3 text-slate-400" />
                  </Button>
                </div>
              )}
              <span className="text-sm text-slate-600">{player.email}</span>
            </div>
          </div>
        </div>

        {/* Usuario Vinculado */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-blue-600" />
              <CardTitle>Usuario Vinculado</CardTitle>
            </div>
            <CardDescription>
              El usuario de la app que puede acceder como este jugador
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {player.user_id ? (
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <p className="font-medium text-green-800">Usuario vinculado</p>
                  <p className="text-sm text-green-600">
                    {availableUsers.find(u => u.id === player.user_id)?.email || player.user_id}
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50">
                      <Unlink className="w-4 h-4 mr-2" />
                      Desvincular
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Desvincular usuario?</AlertDialogTitle>
                      <AlertDialogDescription>
                        El usuario ya no podrá acceder a este perfil de jugador.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={unlinkUser}>
                        Desvincular
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Este jugador no tiene un usuario vinculado. Vincúlalo para que pueda acceder a su dashboard.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Select
                    value={selectedUserId}
                    onValueChange={setSelectedUserId}
                    disabled={saving}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecciona un usuario..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name || user.email} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => linkUser(selectedUserId)}
                    disabled={saving || !selectedUserId}
                  >
                    <Link2 className="w-4 h-4 mr-2" />
                    Vincular
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estado y Agente */}
        <Card>
          <CardHeader>
            <CardTitle>Estado del Jugador</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Es Agente</Label>
                <p className="text-xs text-slate-500">Puede tener jugadores referidos</p>
              </div>
              <Switch
                checked={player.is_agent}
                onCheckedChange={toggleAgent}
                disabled={saving}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Estado Activo</Label>
                <p className="text-xs text-slate-500">Jugador activo en el sistema</p>
              </div>
              <Switch
                checked={player.status === "active"}
                onCheckedChange={toggleStatus}
                disabled={saving}
              />
            </div>
          </CardContent>
        </Card>

        {/* Aplicaciones */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-purple-600" />
                <CardTitle>Aplicaciones</CardTitle>
              </div>
              {availableAppsToAdd.length > 0 && (
                <Button variant="outline" size="sm" onClick={addPlayerApp}>
                  <Plus className="w-4 h-4 mr-1" />
                  Añadir App
                </Button>
              )}
            </div>
            <CardDescription>Apps donde juega este jugador con su ID y nickname</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {playerApps.length === 0 ? (
              <p className="text-center py-4 text-slate-500">Sin aplicaciones asignadas</p>
            ) : (
              playerApps.map((app, index) => (
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
              ))
            )}

            {playerApps.length > 0 && (
              <Button onClick={savePlayerApps} disabled={saving} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Guardando..." : "Guardar Aplicaciones"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Clubs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <CardTitle>Clubs</CardTitle>
              </div>
              {availableClubsToAdd.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => setShowAddClub(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Añadir Club
                </Button>
              )}
            </div>
            <CardDescription>Clubs donde juega y sus condiciones de rakeback</CardDescription>
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
                        <p className="text-xs text-slate-500">
                          {(pc.club as any).application?.name} - {pc.club.code}
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar club?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Se eliminará {pc.club.name} del jugador. Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => removeClub(pc.id)}>
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    {/* Condiciones */}
                    <div className="flex items-center gap-4 p-3 bg-slate-50 rounded flex-wrap">
                      <Label className="text-sm">Rakeback:</Label>
                      <Select
                        value={pc.diamond_agreement_type || "fixed"}
                        onValueChange={(value) => {
                          if (value === "fixed") {
                            updateClubCondition(pc.id, value, pc.diamond_fixed_percentage || 50);
                          } else {
                            // Si cambia a dinámico, mantener el template actual o esperar selección
                            updateClubCondition(pc.id, value, 0, pc.condition_template_id || undefined);
                          }
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Fijo</SelectItem>
                          <SelectItem value="dynamic">Dinámico</SelectItem>
                        </SelectContent>
                      </Select>

                      {pc.diamond_agreement_type === "fixed" ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            defaultValue={pc.diamond_fixed_percentage || 50}
                            onBlur={(e) => {
                              const value = parseFloat(e.target.value);
                              if (value >= 0 && value <= 100 && value !== pc.diamond_fixed_percentage) {
                                updateClubCondition(pc.id, "fixed", value);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const value = parseFloat((e.target as HTMLInputElement).value);
                                if (value >= 0 && value <= 100) {
                                  updateClubCondition(pc.id, "fixed", value);
                                }
                              }
                            }}
                            className="w-20"
                          />
                          <span className="text-sm text-slate-600">%</span>
                        </div>
                      ) : (
                        <Select
                          value={pc.condition_template_id || ""}
                          onValueChange={(templateId) => updateClubCondition(pc.id, "dynamic", 0, templateId)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Selecciona condiciones" />
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
                ))}
              </div>
            )}

            {/* Add Club Form */}
            {showAddClub && (
              <div className="mt-4 p-4 border-2 border-dashed border-blue-300 rounded-lg space-y-4">
                <h4 className="font-medium">Añadir Club</h4>
                <div className="space-y-3">
                  <div>
                    <Label>Club</Label>
                    <Select value={newClubId} onValueChange={setNewClubId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un club" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableClubsToAdd.map(club => (
                          <SelectItem key={club.id} value={club.id}>
                            {club.name} ({club.application?.name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-4">
                    <Select value={newClubConditionType} onValueChange={setNewClubConditionType}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fijo</SelectItem>
                        <SelectItem value="dynamic">Dinámico</SelectItem>
                      </SelectContent>
                    </Select>

                    {newClubConditionType === "fixed" ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={newClubFixedPercentage}
                          onChange={(e) => setNewClubFixedPercentage(parseFloat(e.target.value))}
                          className="w-20"
                        />
                        <span>%</span>
                      </div>
                    ) : (
                      <Select value={newClubTemplateId} onValueChange={setNewClubTemplateId}>
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

                  <div className="flex gap-2">
                    <Button onClick={addClub} disabled={saving || !newClubId}>
                      <Plus className="w-4 h-4 mr-2" />
                      Añadir
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddClub(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agente Referidor */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-orange-600" />
              <CardTitle>Agente Referidor</CardTitle>
            </div>
            <CardDescription>El agente que refirió a este jugador recibe comisión</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Agente</Label>
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
            </div>

            {player.referred_by_agent_id && (
              <div className="p-4 bg-orange-50 rounded-lg space-y-2">
                <Label className="text-orange-800">Comisión del agente</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    defaultValue={player.agent_commission_percentage || 0}
                    onBlur={(e) => {
                      const value = parseFloat(e.target.value);
                      if (value >= 0 && value <= 100 && value !== player.agent_commission_percentage) {
                        updateAgentCommission(value);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const value = parseFloat((e.target as HTMLInputElement).value);
                        if (value >= 0 && value <= 100) {
                          updateAgentCommission(value);
                        }
                      }
                    }}
                    className="w-24"
                    disabled={saving}
                  />
                  <span className="text-sm text-orange-800">% del rakeback del jugador</span>
                </div>
                <p className="text-xs text-orange-600">
                  Este porcentaje se aplica a todo el rakeback que gane el jugador, independientemente del club.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
