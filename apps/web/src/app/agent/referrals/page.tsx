"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { createClient } from "@/lib/supabase/client";
import { Users, Building2, TrendingUp, ChevronRight } from "lucide-react";

export default function ReferralsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [agentInfo, setAgentInfo] = useState<any>(null);

  useEffect(() => {
    loadReferrals();
  }, []);

  const loadReferrals = async () => {
    setLoading(true);

    // Obtener datos del agente actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: agentData } = await supabase
      .from("players")
      .select("id, full_name, nickname")
      .eq("user_id", user.id)
      .eq("is_agent", true)
      .single();

    if (!agentData) {
      setLoading(false);
      return;
    }

    setAgentInfo(agentData);

    // Obtener referidos
    const { data: referralsData } = await supabase
      .from("players")
      .select(`
        id,
        full_name,
        nickname,
        player_code,
        status,
        player_clubs (
          id,
          agent_commission_percentage,
          club:clubs (
            id,
            name,
            code
          )
        ),
        player_applications (
          id,
          app_nickname,
          application:applications (
            id,
            name,
            code
          )
        )
      `)
      .eq("referred_by_agent_id", agentData.id)
      .order("created_at", { ascending: false });

    if (referralsData) setReferrals(referralsData);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-8">
        <Loading message="Cargando referidos..." />
      </div>
    );
  }

  if (!agentInfo) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-slate-600">
              No tienes permisos de agente
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalReferrals = referrals.length;
  const activeReferrals = referrals.filter(r => r.status === "active").length;
  const totalClubs = referrals.reduce((acc, r) => acc + (r.player_clubs?.length || 0), 0);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mis Referidos</h1>
          <p className="text-slate-600 mt-1">
            Jugadores que has referido a Diamont Deals
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total Referidos</p>
                  <p className="text-2xl font-bold text-slate-900">{totalReferrals}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Activos</p>
                  <p className="text-2xl font-bold text-slate-900">{activeReferrals}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Clubs Totales</p>
                  <p className="text-2xl font-bold text-slate-900">{totalClubs}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referrals Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Referidos</CardTitle>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No tienes referidos todavía</p>
                <p className="text-sm text-slate-500 mt-2">
                  Los jugadores que sean asignados a ti como agente aparecerán aquí
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-300">
                      <th className="text-left py-3 px-4 font-semibold">Jugador</th>
                      <th className="text-center py-3 px-4 font-semibold">Estado</th>
                      <th className="text-left py-3 px-4 font-semibold">Apps</th>
                      <th className="text-left py-3 px-4 font-semibold">Clubs</th>
                      <th className="text-right py-3 px-4 font-semibold">Tu Comisión</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((referral) => (
                      <tr
                        key={referral.id}
                        onClick={() => router.push(`/agent/referrals/${referral.id}`)}
                        className="border-b border-slate-200 hover:bg-slate-50 cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-900">{referral.full_name}</p>
                          {referral.nickname && (
                            <p className="text-xs text-slate-500">@{referral.nickname}</p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={referral.status === "active" ? "success" : "secondary"}>
                            {referral.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {referral.player_applications && referral.player_applications.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {referral.player_applications.map((pa: any) => (
                                <Badge key={pa.id} variant="secondary" className="text-xs">
                                  {pa.application.name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {referral.player_clubs && referral.player_clubs.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {referral.player_clubs.map((pc: any) => (
                                <Badge key={pc.id} variant="outline" className="text-xs">
                                  {pc.club.name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {referral.player_clubs && referral.player_clubs.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {referral.player_clubs.map((pc: any) => (
                                <span key={pc.id} className="text-xs">
                                  <span className="text-slate-500">{pc.club.name}:</span>{" "}
                                  <span className="font-semibold text-green-600">
                                    {pc.agent_commission_percentage || 0}%
                                  </span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <ChevronRight className="w-4 h-4 text-slate-400" />
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
