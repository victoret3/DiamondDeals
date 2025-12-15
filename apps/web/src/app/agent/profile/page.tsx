"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { User, Mail, Phone, Code, Users, DollarSign, Copy, Check } from "lucide-react";

export default function AgentProfilePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const [profile, setProfile] = useState({
    email: "",
    fullName: "",
    nickname: "",
    phone: "",
    playerCode: "",
    status: "",
  });

  const [stats, setStats] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    totalCommissions: 0,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // Obtener datos del agente
      const { data: player } = await supabase
        .from("players")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (player) {
        setProfile({
          email: player.email || user.email || "",
          fullName: player.full_name || "",
          nickname: player.nickname || "",
          phone: player.phone || "",
          playerCode: player.player_code || "",
          status: player.status || "",
        });

        // Obtener estadísticas de referidos
        const { data: referrals } = await supabase
          .from("players")
          .select("id, status")
          .eq("referred_by_agent_id", player.id);

        const totalReferrals = referrals?.length || 0;
        const activeReferrals = referrals?.filter(r => r.status === "active").length || 0;

        // Obtener comisiones totales
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

        // Obtener IDs de player_clubs de los referidos
        const { data: playerClubs } = await supabase
          .from("player_clubs")
          .select("id")
          .in("player_id", referrals?.map(r => r.id) || []);

        let totalCommissions = 0;
        if (playerClubs && playerClubs.length > 0) {
          const { data: reports } = await supabase
            .from("weekly_player_reports")
            .select("agent_amount")
            .in("player_club_id", playerClubs.map(pc => pc.id))
            .gte("week_start", fourWeeksAgo.toISOString().split("T")[0]);

          totalCommissions = reports?.reduce(
            (sum, r) => sum + parseFloat(r.agent_amount || 0),
            0
          ) || 0;
        }

        setStats({
          totalReferrals,
          activeReferrals,
          totalCommissions,
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Error al cargar el perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("players")
        .update({
          full_name: profile.fullName,
          nickname: profile.nickname,
          phone: profile.phone,
          email: profile.email,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Perfil actualizado correctamente");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error(error.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const copyAgentCode = () => {
    navigator.clipboard.writeText(profile.playerCode);
    setCopied(true);
    toast.success("Código copiado al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <Loading message="Cargando perfil..." />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mi Perfil de Agente</h1>
          <p className="text-slate-600 mt-1">
            Gestiona tu información y comparte tu código con nuevos referidos
          </p>
        </div>

        {/* Agent Code Card - Destacado */}
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Code className="w-5 h-5" />
              Tu Código de Agente
            </CardTitle>
            <CardDescription className="text-green-700">
              Comparte este código con nuevos jugadores para que se registren como tus referidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <code className="flex-1 px-4 py-3 bg-white border-2 border-green-300 rounded-lg text-xl font-mono font-bold text-green-800 text-center">
                {profile.playerCode}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={copyAgentCode}
                className="h-12 w-12 border-green-300 hover:bg-green-100"
              >
                {copied ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <Copy className="h-5 w-5 text-green-600" />
                )}
              </Button>
            </div>
            <p className="text-sm text-green-700 mt-3">
              Los jugadores deben usar este código al registrarse para aparecer como tus referidos
            </p>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalReferrals}</p>
                  <p className="text-xs text-slate-600">Referidos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <User className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeReferrals}</p>
                  <p className="text-xs text-slate-600">Activos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(stats.totalCommissions)}
                  </p>
                  <p className="text-xs text-slate-600">Últimas 4 sem.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Personal Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Información Personal
                </CardTitle>
                <CardDescription>
                  Actualiza tus datos personales
                </CardDescription>
              </div>
              <Badge variant={profile.status === "active" ? "success" : "warning"}>
                {profile.status === "active" ? "Activo" : "Pendiente"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre Completo</Label>
                <Input
                  id="fullName"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  placeholder="Tu nombre completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nickname">Nickname</Label>
                <Input
                  id="nickname"
                  value={profile.nickname}
                  onChange={(e) => setProfile({ ...profile, nickname: e.target.value })}
                  placeholder="Tu nickname"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                placeholder="tu@email.com"
              />
              <p className="text-xs text-slate-500">
                Este email se usa para iniciar sesión
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Teléfono
              </Label>
              <Input
                id="phone"
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="+34 600 000 000"
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </div>
    </div>
  );
}
