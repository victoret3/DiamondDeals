"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Building2, DollarSign } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  // Mock data - luego conectaremos con Supabase
  const stats = {
    totalPlayers: 24,
    activePlayers: 18,
    totalClubs: 4,
    monthlyRakeback: 15420.50,
  };

  const recentPlayers = [
    { id: 1, name: "Carlos Martínez", code: "DD-LKJH23-A1B2", status: "pending", date: "2024-10-20" },
    { id: 2, name: "Ana García", code: "DD-MNOP45-C3D4", status: "active", date: "2024-10-19" },
    { id: 3, name: "Miguel López", code: "DD-QRST67-E5F6", status: "active", date: "2024-10-18" },
  ];

  const topClubs = [
    { name: "GGPoker", players: 12, rakeback: 60, totalRake: 8500 },
    { name: "PokerStars", players: 8, rakeback: 55, totalRake: 6200 },
    { name: "888poker", players: 5, rakeback: 50, totalRake: 3100 },
  ];

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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
              <p className="text-xs text-green-600 mt-1">
                +12% vs mes anterior
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
              <div className="space-y-4">
                {recentPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{player.name}</p>
                      <p className="text-sm text-slate-600 font-mono">{player.code}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={player.status === "active" ? "success" : "warning"}>
                        {player.status === "active" ? "Activo" : "Pendiente"}
                      </Badge>
                      <p className="text-xs text-slate-500 mt-1">{player.date}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/admin/players">
                <Button variant="outline" className="w-full mt-4">
                  Ver Todos
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Top Clubs */}
          <Card>
            <CardHeader>
              <CardTitle>Clubs Principales</CardTitle>
              <CardDescription>
                Rendimiento por club de poker
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topClubs.map((club, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{club.name}</p>
                        <p className="text-sm text-slate-600">
                          {club.players} jugadores · {club.rakeback}% rakeback
                        </p>
                      </div>
                      <p className="text-lg font-bold text-slate-900">
                        €{club.totalRake.toLocaleString('es-ES')}
                      </p>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
