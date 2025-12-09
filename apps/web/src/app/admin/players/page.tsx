"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import { createClient } from "@/lib/supabase/client";
import { UserPlus, Search, Eye, UserCheck } from "lucide-react";
import Link from "next/link";

export default function PlayersPage() {
  const supabase = createClient();
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("players")
      .select(`
        *,
        agent:players!referred_by_agent_id(nickname),
        player_clubs (
          id,
          custom_diamond_agreement,
          diamond_agreement_type,
          diamond_fixed_percentage,
          agent_commission_percentage,
          club:clubs (
            name,
            code,
            diamond_player_agreement_type,
            diamond_player_fixed_percentage
          ),
          weekly_reports:weekly_player_reports (
            player_percentage,
            week_start
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (data) setPlayers(data);
    setLoading(false);
  };

  const toggleAgent = async (playerId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("players")
      .update({ is_agent: !currentStatus })
      .eq("id", playerId);

    if (!error) {
      loadPlayers();
    }
  };

  const filteredPlayers = players.filter(p =>
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.player_code?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

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
          <Link href="/admin/players/new">
            <Button size="lg">
              <UserPlus className="w-5 h-5 mr-2" />
              Nuevo Jugador
            </Button>
          </Link>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, código o email..."
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Players Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {filteredPlayers.length} jugador{filteredPlayers.length !== 1 ? "es" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loading message="Cargando jugadores..." />
            ) : filteredPlayers.length === 0 ? (
              <p className="text-center py-8 text-slate-600">
                {search ? "No se encontraron jugadores" : "No hay jugadores todavía"}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-slate-300">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Código</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Nombre</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Club</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Rakeback</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Agente</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700 text-sm"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlayers.map((player) => {
                      const clubsCount = player.player_clubs?.length || 0;
                      return player.player_clubs && player.player_clubs.length > 0 ? (
                        player.player_clubs.map((pc: any, idx: number) => {
                          const hasCustom = pc.custom_diamond_agreement;
                          const isFixed = hasCustom
                            ? pc.diamond_agreement_type === "fixed"
                            : pc.club.diamond_player_agreement_type === "fixed";
                          const percentage = hasCustom
                            ? pc.diamond_fixed_percentage
                            : pc.club.diamond_player_fixed_percentage;

                          // Obtener último rakeback calculado si es dinámico
                          let lastRakeback = null;
                          if (!isFixed && pc.weekly_reports && pc.weekly_reports.length > 0) {
                            const sorted = [...pc.weekly_reports].sort((a, b) =>
                              new Date(b.week_start).getTime() - new Date(a.week_start).getTime()
                            );
                            lastRakeback = sorted[0]?.player_percentage;
                          }

                          return (
                            <tr key={`${player.id}-${idx}`} className="border-b border-slate-200 hover:bg-slate-50">
                              {/* Código y Nombre solo en primera fila */}
                              {idx === 0 && (
                                <>
                                  <td rowSpan={clubsCount} className="py-3 px-4 align-top">
                                    <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                                      {player.player_code}
                                    </code>
                                  </td>
                                  <td rowSpan={clubsCount} className="py-3 px-4 align-top">
                                    <div>
                                      <p className="font-medium text-slate-900">{player.full_name}</p>
                                      {player.is_agent && (
                                        <Badge className="bg-green-600 text-xs mt-1">AGENTE</Badge>
                                      )}
                                    </div>
                                  </td>
                                </>
                              )}
                              {/* Club */}
                              <td className="py-3 px-4">
                                <span className="font-medium text-slate-900 text-sm">{pc.club.name}</span>
                              </td>
                              {/* Rakeback */}
                              <td className="py-3 px-4">
                                {isFixed ? (
                                  // Fijo
                                  hasCustom ? (
                                    <span className="inline-block bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">
                                      {percentage}% (Personal)
                                    </span>
                                  ) : (
                                    <span className="inline-block bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs">
                                      {percentage}%
                                    </span>
                                  )
                                ) : (
                                  // Dinámico
                                  <div className="flex flex-col gap-0.5">
                                    {hasCustom ? (
                                      <span className="inline-block bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">
                                        Variable (Personal)
                                      </span>
                                    ) : (
                                      <span className="inline-block bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs">
                                        Variable
                                      </span>
                                    )}
                                    {lastRakeback && (
                                      <span className="text-xs text-slate-500">
                                        Última: {lastRakeback}%
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>
                              {/* Agente */}
                              <td className="py-3 px-4">
                                {pc.agent_commission_percentage > 0 ? (
                                  <div>
                                    <p className="text-xs text-slate-600">
                                      {player.agent?.nickname || "N/A"}
                                    </p>
                                    <p className="text-xs font-semibold text-orange-600">
                                      Cobra {pc.agent_commission_percentage}%
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-400">-</span>
                                )}
                              </td>
                              {/* Acciones solo en primera fila */}
                              {idx === 0 && (
                                <td rowSpan={clubsCount} className="py-3 px-4 text-right align-top">
                                  <div className="flex items-center gap-2 justify-end">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => toggleAgent(player.id, player.is_agent)}
                                      title={player.is_agent ? "Quitar rol de agente" : "Convertir en agente"}
                                    >
                                      <UserCheck className={`w-4 h-4 ${player.is_agent ? 'text-green-600' : 'text-slate-400'}`} />
                                    </Button>
                                    <Link href={`/admin/players/${player.id}`}>
                                      <Button variant="outline" size="sm">
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                    </Link>
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })
                      ) : (
                        <tr key={player.id} className="border-b border-slate-200 hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                              {player.player_code}
                            </code>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-medium text-slate-900">{player.full_name}</p>
                          </td>
                          <td className="py-3 px-4 text-slate-400 text-xs">Sin clubs</td>
                          <td className="py-3 px-4 text-slate-400">-</td>
                          <td className="py-3 px-4 text-slate-400">-</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleAgent(player.id, player.is_agent)}
                                title={player.is_agent ? "Quitar rol de agente" : "Convertir en agente"}
                              >
                                <UserCheck className={`w-4 h-4 ${player.is_agent ? 'text-green-600' : 'text-slate-400'}`} />
                              </Button>
                              <Link href={`/admin/players/${player.id}`}>
                                <Button variant="outline" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
