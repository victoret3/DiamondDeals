"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { FileText, Plus, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import Link from "next/link";
import { Loading } from "@/components/ui/loading";

export default function ReportsPage() {
  const supabase = createClient();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("weekly_club_reports")
      .select(`
        *,
        club:clubs (
          name,
          code
        )
      `)
      .order("week_start", { ascending: false });

    if (data) setReports(data);
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Reportes Semanales</h1>
            <p className="text-slate-600 mt-1">
              Histórico de PNL, Rake y cálculos de Rakeback
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/reports/weekly-players">
              <Button size="lg" variant="outline">
                Ver por Jugador
              </Button>
            </Link>
            <Link href="/admin/reports/weekly-players/new">
              <Button size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Nuevo Reporte Semanal
              </Button>
            </Link>
          </div>
        </div>

        {/* Reports List */}
        {loading ? (
          <Card>
            <CardContent className="py-8">
              <Loading message="Cargando reportes..." />
            </CardContent>
          </Card>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 mb-4">
                  No hay reportes todavía. Crea el primer reporte semanal.
                </p>
                <Link href="/admin/reports/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primer Reporte
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {report.club.name}
                        <Badge variant="outline">{report.club.code}</Badge>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(report.week_start)} - {formatDate(report.week_end)}
                      </CardDescription>
                    </div>
                    <Badge className="bg-purple-100 text-purple-700">
                      Action {report.action_percentage}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* PNL */}
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        {parseFloat(report.total_pnl) >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <span className="text-xs font-medium text-slate-600">PNL Total</span>
                      </div>
                      <p className={`text-lg font-bold ${parseFloat(report.total_pnl) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(parseFloat(report.total_pnl))}
                      </p>
                    </div>

                    {/* Total Rake */}
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <span className="text-xs font-medium text-slate-600 block mb-1">Rake Total</span>
                      <p className="text-lg font-bold text-slate-900">
                        {formatCurrency(parseFloat(report.total_rake))}
                      </p>
                    </div>

                    {/* Action Amount */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="text-xs font-medium text-blue-700 block mb-1">Action Amount</span>
                      <p className="text-lg font-bold text-blue-900">
                        {formatCurrency(Math.abs(parseFloat(report.action_amount)))}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        {parseFloat(report.total_pnl) >= 0 ? "Jugador → Club" : "Club → Jugador"}
                      </p>
                    </div>

                    {/* Rake Action */}
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-xs font-medium text-green-700 block mb-1">Rake Action</span>
                      <p className="text-lg font-bold text-green-900">
                        {formatCurrency(parseFloat(report.rake_action))}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Para repartir
                      </p>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="mt-4 pt-4 border-t text-xs text-slate-500">
                    Creado el {new Date(report.created_at).toLocaleString('es-ES')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
