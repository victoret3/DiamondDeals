"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { createClient } from "@/lib/supabase/client";
import { Building2, Plus, Eye, Power } from "lucide-react";
import Link from "next/link";

export default function ClubsPage() {
  const supabase = createClient();
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("clubs")
      .select(`
        *,
        player_clubs (id),
        diamond_club_template:diamond_club_template_id(name)
      `)
      .order("name");

    if (data) setClubs(data);
    setLoading(false);
  };

  const toggleClubStatus = async (clubId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("clubs")
      .update({ is_active: !currentStatus })
      .eq("id", clubId);

    if (!error) {
      loadClubs();
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Clubs</h1>
            <p className="text-slate-600 mt-1">
              Gestiona los clubs de poker disponibles
            </p>
          </div>
          <Link href="/admin/clubs/new">
            <Button size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Nuevo Club
            </Button>
          </Link>
        </div>

        {/* Clubs Table */}
        <Card>
          <CardHeader>
            <CardTitle>{clubs.length} clubs</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loading message="Cargando clubs..." />
            ) : clubs.length === 0 ? (
              <p className="text-center py-8 text-slate-600">
                No hay clubs todavía. Crea el primero.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-300">
                      <th className="text-left py-3 px-4 font-semibold">Nombre</th>
                      <th className="text-left py-3 px-4 font-semibold">Código</th>
                      <th className="text-center py-3 px-4 font-semibold">Estado</th>
                      <th className="text-right py-3 px-4 font-semibold">Rakeback</th>
                      <th className="text-right py-3 px-4 font-semibold">Action</th>
                      <th className="text-right py-3 px-4 font-semibold">Diamond → Club</th>
                      <th className="text-center py-3 px-4 font-semibold">Jugadores</th>
                      <th className="text-right py-3 px-4 font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {clubs.map((club) => (
                      <tr key={club.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-600" />
                            <span className="font-medium text-slate-900">{club.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">
                            {club.code}
                          </code>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={club.is_active ? "success" : "secondary"}>
                            {club.is_active ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-sm">
                            {club.rakeback_type === "variable"
                              ? <Badge variant="outline">Variable</Badge>
                              : `${club.base_rakeback_percentage}%`}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-bold text-slate-900">
                            {club.action_percentage}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-sm font-medium">
                            {club.diamond_club_agreement_type === 'fixed'
                              ? `${club.diamond_club_fixed_percentage}%`
                              : club.diamond_club_template?.name || 'Sin configurar'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-bold text-slate-900">
                            {club.player_clubs?.length || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleClubStatus(club.id, club.is_active)}
                              title={club.is_active ? "Desactivar club" : "Activar club"}
                            >
                              <Power className={`w-4 h-4 ${club.is_active ? 'text-green-600' : 'text-slate-400'}`} />
                            </Button>
                            <Link href={`/admin/clubs/${club.id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
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
