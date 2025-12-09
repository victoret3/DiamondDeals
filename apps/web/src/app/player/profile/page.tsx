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
import { User, Mail, Phone, Code } from "lucide-react";

export default function ProfilePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    email: "",
    fullName: "",
    phone: "",
    playerCode: "",
    status: "",
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        // Obtener usuario actual
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        // Obtener datos del jugador
        const { data: player } = await supabase
          .from("players")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (player) {
          setProfile({
            email: player.email || user.email || "",
            fullName: player.full_name || "",
            phone: player.phone || "",
            playerCode: player.player_code || "",
            status: player.status || "",
          });
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error("Error al cargar el perfil");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error("No user found");

      // Actualizar datos del jugador
      const { error } = await supabase
        .from("players")
        .update({
          full_name: profile.fullName,
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
          <h1 className="text-3xl font-bold text-slate-900">Mi Perfil</h1>
          <p className="text-slate-600 mt-1">
            Gestiona tu información personal
          </p>
        </div>

        {/* Player Code Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Código de Jugador
            </CardTitle>
            <CardDescription>
              Tu código único de identificación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <code className="flex-1 px-4 py-3 bg-slate-100 rounded-lg text-lg font-mono font-bold">
                {profile.playerCode}
              </code>
              <Badge variant={profile.status === "active" ? "success" : "warning"}>
                {profile.status === "active" ? "Activo" : "Pendiente"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Personal Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Información Personal
            </CardTitle>
            <CardDescription>
              Actualiza tus datos personales
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
