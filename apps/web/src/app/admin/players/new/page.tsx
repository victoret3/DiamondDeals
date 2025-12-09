"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Copy, Check } from "lucide-react";
import Link from "next/link";
import PlayerForm from "@/components/forms/PlayerForm";

export default function NewPlayerPage() {
  const supabase = createClient();
  const [registrationLink, setRegistrationLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Enlace copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Error al copiar el enlace");
    }
  };

  const handleSave = async (formData: any) => {
    // 1. Crear jugador (PostgreSQL generará automáticamente el registration_token)
    const { data: player, error: playerError } = await supabase
      .from("players")
      .insert({
        is_agent: formData.isAgent,
        status: "pending",
        token_used: false
      })
      .select()
      .single();

    if (playerError) {
      if (playerError.code === "23505") {
        toast.error("Este ID de jugador ya existe");
      } else {
        throw playerError;
      }
      return;
    }

    // 2. Asignar clubs
    for (const clubId of formData.selectedClubs) {
      const { data: playerClub, error: pcError } = await supabase
        .from("player_clubs")
        .insert({
          player_id: player.id,
          club_id: clubId,
          username_in_club: null
        })
        .select()
        .single();

      if (pcError) throw pcError;

      // 3. Asignar condición al club
      const condition = formData.clubConditions[clubId];
      const conditionData: any = {
        player_club_id: playerClub.id,
        condition_type: condition.type
      };

      if (condition.type === "dynamic") {
        conditionData.template_id = condition.templateId;
      } else {
        conditionData.fixed_percentage = condition.fixedPercentage;
      }

      const { error: condError } = await supabase
        .from("player_conditions")
        .insert(conditionData);

      if (condError) throw condError;
    }

    // 4. Generar enlace de registro
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/register?token=${player.registration_token}`;
    setRegistrationLink(link);

    toast.success("Jugador creado correctamente");
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Nuevo Jugador</h1>
            <p className="text-slate-600 mt-1">
              Crea un nuevo jugador y asígnalo a clubs con sus condiciones
            </p>
          </div>
        </div>

        {/* Enlace de Registro Generado */}
        {registrationLink && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900">Jugador Creado Exitosamente</CardTitle>
              <CardDescription className="text-green-800">
                Comparte este enlace de un solo uso con el jugador
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  value={registrationLink}
                  readOnly
                  className="font-mono text-sm bg-white"
                />
                <Button onClick={() => copyToClipboard(registrationLink)}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-sm text-green-800">
                Este enlace solo puede usarse una vez. El jugador deberá rellenar todos sus datos:
                ID, nombre completo, teléfono, nickname, email y contraseña.
              </p>
              <Link href="/admin/players">
                <Button variant="outline" className="w-full">
                  Ver Todos los Jugadores
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Configuración del Jugador */}
        {!registrationLink && (
          <PlayerForm onSave={handleSave} />
        )}
      </div>
    </div>
  );
}
