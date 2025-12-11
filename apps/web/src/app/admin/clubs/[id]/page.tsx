"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Building2, Users } from "lucide-react";
import Link from "next/link";
import ClubForm from "@/components/forms/ClubForm";

export default function ClubDetailPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.id as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [club, setClub] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    logoUrl: "",
    actionPercentage: "",
    diamondClubAgreementType: "fixed" as "fixed" | "dynamic",
    diamondClubFixedPercentage: "",
    diamondClubTemplateId: "",
    diamondPlayerAgreementType: "fixed" as "fixed" | "dynamic",
    diamondPlayerFixedPercentage: "",
    diamondPlayerTemplateId: "",
  });

  useEffect(() => {
    loadClubData();
  }, [clubId]);

  const loadClubData = async () => {
    setLoading(true);

    // Cargar club
    const { data: clubData, error: clubError } = await supabase
      .from("clubs")
      .select(`
        *,
        diamond_club_template:diamond_club_template_id(id, name),
        diamond_player_template:diamond_player_template_id(id, name)
      `)
      .eq("id", clubId)
      .single();

    if (clubError || !clubData) {
      toast.error("Club no encontrado");
      router.push("/admin/clubs");
      return;
    }

    setClub(clubData);
    setFormData({
      name: clubData.name,
      code: clubData.code,
      logoUrl: clubData.logo_url || "",
      actionPercentage: clubData.action_percentage?.toString() || "",
      diamondClubAgreementType: clubData.diamond_club_agreement_type || "fixed",
      diamondClubFixedPercentage: clubData.diamond_club_fixed_percentage?.toString() || "",
      diamondClubTemplateId: clubData.diamond_club_template_id || "",
      diamondPlayerAgreementType: clubData.diamond_player_agreement_type || "fixed",
      diamondPlayerFixedPercentage: clubData.diamond_player_fixed_percentage?.toString() || "",
      diamondPlayerTemplateId: clubData.diamond_player_template_id || "",
    });

    // Cargar jugadores del club
    const { data: playersData } = await supabase
      .from("player_clubs")
      .select(`
        *,
        player:players(id, full_name, nickname, player_id)
      `)
      .eq("club_id", clubId);

    if (playersData) setPlayers(playersData);

    setLoading(false);
  };

  const handleSave = async (updateData: any) => {
    const { error } = await supabase
      .from("clubs")
      .update(updateData)
      .eq("id", clubId);

    if (error) throw error;

    toast.success("Club actualizado correctamente");
    await loadClubData();
  };

  if (loading) {
    return (
      <div className="p-8">
        <Loading message="Cargando club..." />
      </div>
    );
  }

  if (!club) {
    return null;
  }

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/clubs">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-slate-600" />
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{club.name}</h1>
                <p className="text-slate-600 mt-1">
                  Edita la configuración del club
                </p>
              </div>
            </div>
          </div>
          <Badge variant={club.is_active ? "success" : "secondary"} className="text-sm px-3 py-1">
            {club.is_active ? "Activo" : "Inactivo"}
          </Badge>
        </div>

        {/* Información Básica */}
        <ClubForm
          initialData={formData}
          onSave={handleSave}
          isEditing={true}
        />

        {/* Jugadores del Club */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Jugadores ({players.length})
            </CardTitle>
            <CardDescription>
              Jugadores asignados a este club
            </CardDescription>
          </CardHeader>
          <CardContent>
            {players.length === 0 ? (
              <p className="text-center py-8 text-slate-600">
                No hay jugadores asignados a este club todavía
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-300">
                      <th className="text-left py-3 px-4 font-semibold">ID</th>
                      <th className="text-left py-3 px-4 font-semibold">Nombre</th>
                      <th className="text-left py-3 px-4 font-semibold">Nickname</th>
                      <th className="text-left py-3 px-4 font-semibold">Username en Club</th>
                      <th className="text-center py-3 px-4 font-semibold">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((pc) => (
                      <tr key={pc.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">
                            {pc.player?.player_id}
                          </code>
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {pc.player?.full_name}
                        </td>
                        <td className="py-3 px-4">
                          {pc.player?.nickname || "-"}
                        </td>
                        <td className="py-3 px-4">
                          {pc.username_in_club || "-"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={pc.is_active ? "success" : "secondary"}>
                            {pc.is_active ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
