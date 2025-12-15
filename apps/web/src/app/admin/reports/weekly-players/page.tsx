"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Loading } from "@/components/ui/loading";

export default function WeeklyPlayerReportsPage() {
  const supabase = createClient();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("weekly_player_reports")
      .select(`
        *,
        player_club:player_clubs (
          id,
          club:clubs (name, code),
          player:players (full_name, nickname)
        )
      `)
      .order("week_start", { ascending: false });

    if (data) setReports(data);
    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Reportes Semanales</h1>
            <p className="text-slate-600 mt-1">Histórico de reportes por jugador</p>
          </div>
          <Link href="/admin/reports/weekly-players/new">
            <Button size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Nuevo Reporte
            </Button>
          </Link>
        </div>

        {/* Reports Table */}
        <Card>
          <CardHeader>
            <CardTitle>{reports.length} reportes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loading message="Cargando..." />
            ) : reports.length === 0 ? (
              <p className="text-center py-8 text-slate-600">No hay reportes</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-300">
                      <th className="text-left py-3 px-3 font-semibold">Semana</th>
                      <th className="text-left py-3 px-3 font-semibold">Jugador</th>
                      <th className="text-left py-3 px-3 font-semibold">Club</th>
                      <th className="text-right py-3 px-3 font-semibold">PNL</th>
                      <th className="text-right py-3 px-3 font-semibold">Rake</th>
                      <th className="text-right py-3 px-3 font-semibold">Manos</th>
                      <th className="text-right py-3 px-3 font-semibold">Rakeback</th>
                      <th className="text-right py-3 px-3 font-semibold">Agente</th>
                      <th className="text-right py-3 px-3 font-semibold">Jugador Recibe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => {
                      const hasAgent = parseFloat(r.agent_commission_percentage) > 0;
                      const playerReceives = hasAgent
                        ? parseFloat(r.player_amount_net)
                        : parseFloat(r.player_amount);

                      return (
                        <tr key={r.id} className="border-b border-slate-200 hover:bg-slate-50">
                          <td className="py-3 px-3">
                            <div className="text-xs text-slate-600">
                              {formatDate(r.week_start)}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-medium">
                              {r.player_club.player.nickname}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-slate-700">
                              {r.player_club.club.code}
                            </span>
                          </td>
                          <td className={`py-3 px-3 text-right font-medium ${
                            parseFloat(r.pnl) >= 0 ? "text-green-600" : "text-red-600"
                          }`}>
                            {formatCurrency(parseFloat(r.pnl))}
                          </td>
                          <td className="py-3 px-3 text-right text-slate-700">
                            {formatCurrency(parseFloat(r.rake))}
                          </td>
                          <td className="py-3 px-3 text-right text-slate-700">
                            {r.hands.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="font-medium text-blue-600">
                              {formatCurrency(parseFloat(r.player_amount))}
                            </div>
                            <div className="text-xs text-slate-500">
                              {r.player_percentage}%
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {hasAgent ? (
                              <div>
                                <div className="font-medium text-purple-600">
                                  {formatCurrency(parseFloat(r.agent_amount || 0))}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {r.agent_commission_percentage}%
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="font-bold text-green-600">
                              {formatCurrency(playerReceives)}
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
