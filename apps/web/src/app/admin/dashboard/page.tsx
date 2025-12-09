"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Building2, DollarSign } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface DashboardStats {
  totalPlayers: number;
  activePlayers: number;
  totalClubs: number;
  monthlyRakeback: number;
}

interface RecentPlayer {
  id: string;
  full_name: string;
  player_code: string;
  status: string;
  created_at: string;
}

interface ClubStats {
  id: string;
  name: string;
  players: number;
  totalRakeback: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPlayers: 0,
    activePlayers: 0,
    totalClubs: 0,
    monthlyRakeback: 0,
  });
  const [recentPlayers, setRecentPlayers] = useState<RecentPlayer[]>([]);
  const [topClubs, setTopClubs] = useState<ClubStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      const supabase = createClient();

      // Fetch players stats
      const { count: totalPlayers } = await supabase
        .from("players")
        .select("*", { count: "exact", head: true });

      const { count: activePlayers } = await supabase
        .from("players")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Fetch clubs count
      const { count: totalClubs } = await supabase
        .from("clubs")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Fetch recent players
      const { data: players } = await supabase
        .from("players")
        .select("id, full_name, player_code, status, created_at")
        .order("created_at", { ascending: false })
        .limit(3);

      // Fetch clubs with player count
      const { data: clubs } = await supabase
        .from("clubs")
        .select(`
          id,
          name,
          player_clubs(count)
        `)
        .eq("is_active", true)
        .limit(3);

      setStats({
        totalPlayers: totalPlayers || 0,
        activePlayers: activePlayers || 0,
        totalClubs: totalClubs || 0,
        monthlyRakeback: 0,
      });

      setRecentPlayers(players || []);

      setTopClubs(
        (clubs || []).map((club: any) => ({
          id: club.id,
          name: club.name,
          players: club.player_clubs?.[0]?.count || 0,
          totalRakeback: 0,
        }))
      );

      setLoading(false);
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Panel de Administración</h1>
          <p className="text-slate-600 mt-1">
            Gestiona jugadores, clubs y condiciones de rakeback
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jugadores</CardTitle>
              <Users className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPlayers}</div>
              <p className="text-xs text-slate-600 mt-1">
                {stats.activePlayers} activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clubs Activos</CardTitle>
              <Building2 className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClubs}</div>
              <p className="text-xs text-slate-600 mt-1">
                En operación
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rakeback del Mes</CardTitle>
              <DollarSign className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                €{stats.monthlyRakeback.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Sin reportes aún
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Players */}
          <Card>
            <CardHeader>
              <CardTitle>Jugadores Recientes</CardTitle>
              <CardDescription>
                Últimos jugadores añadidos al sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentPlayers.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Users className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>No hay jugadores registrados</p>
                  <Link href="/admin/players/new">
                    <Button variant="outline" className="mt-4">
                      Añadir Jugador
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {recentPlayers.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-slate-900">{player.full_name}</p>
                          <p className="text-sm text-slate-600 font-mono">{player.player_code}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={player.status === "active" ? "success" : "warning"}>
                            {player.status === "active" ? "Activo" : "Pendiente"}
                          </Badge>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(player.created_at).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link href="/admin/players">
                    <Button variant="outline" className="w-full mt-4">
                      Ver Todos
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>

          {/* Top Clubs */}
          <Card>
            <CardHeader>
              <CardTitle>Clubs Principales</CardTitle>
              <CardDescription>
                Clubs de poker activos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topClubs.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Building2 className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>No hay clubs configurados</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {topClubs.map((club, idx) => (
                      <div key={club.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-900">{club.name}</p>
                            <p className="text-sm text-slate-600">
                              {club.players} jugadores
                            </p>
                          </div>
                        </div>
                        {idx < topClubs.length - 1 && <div className="border-t" />}
                      </div>
                    ))}
                  </div>
                  <Link href="/admin/clubs">
                    <Button variant="outline" className="w-full mt-4">
                      Ver Todos
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
