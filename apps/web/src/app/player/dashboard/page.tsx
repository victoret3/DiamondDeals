import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, DollarSign, Activity } from "lucide-react";

export default function PlayerDashboard() {
  // TODO: Fetch real data from Supabase based on logged user

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Mi Dashboard</h1>
            <p className="text-slate-600 mt-1">Bienvenido de vuelta</p>
          </div>
          <Button>Ver Estadísticas Completas</Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Clubs Activos
              </CardTitle>
              <Users className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-slate-500 mt-1">GGPoker, PokerStars, 888</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Manos Jugadas (mes)
              </CardTitle>
              <Activity className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8,450</div>
              <p className="text-xs text-slate-500 mt-1">+12% vs mes anterior</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Rakeback Total
              </CardTitle>
              <DollarSign className="w-4 h-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€1,240</div>
              <p className="text-xs text-slate-500 mt-1">Este mes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Ratio Actual
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0.35</div>
              <p className="text-xs text-slate-500 mt-1">Resultado/Rake</p>
            </CardContent>
          </Card>
        </div>

        {/* Clubs Section */}
        <Card>
          <CardHeader>
            <CardTitle>Mis Clubs</CardTitle>
            <CardDescription>Clubs donde juegas actualmente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "GGPoker", rakeback: "60%", condition: "Dinámica - 15%", status: "active" },
                { name: "PokerStars", rakeback: "55%", condition: "Fija - 20%", status: "active" },
                { name: "888poker", rakeback: "50%", condition: "Dinámica - 10%", status: "active" },
              ].map((club) => (
                <div
                  key={club.name}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{club.name}</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Club Rakeback: {club.rakeback} | Diamont: {club.condition}
                    </p>
                  </div>
                  <Badge variant="success">Activo</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Últimas Sesiones</CardTitle>
              <CardDescription>Tus sesiones más recientes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { date: "23 Oct 2024", hands: 450, result: "+€120", club: "GGPoker" },
                  { date: "22 Oct 2024", hands: 380, result: "-€45", club: "PokerStars" },
                  { date: "21 Oct 2024", hands: 520, result: "+€280", club: "GGPoker" },
                ].map((session, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{session.club}</p>
                      <p className="text-sm text-slate-500">{session.date} • {session.hands} manos</p>
                    </div>
                    <span
                      className={`font-semibold ${
                        session.result.startsWith("+") ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {session.result}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Próximos Pagos</CardTitle>
              <CardDescription>Rakeback pendiente de pago</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">Octubre 2024</span>
                    <Badge variant="warning">Pendiente</Badge>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">€1,240.50</div>
                  <p className="text-xs text-blue-700 mt-1">Pago estimado: 5 Nov 2024</p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-900">Septiembre 2024</span>
                    <Badge variant="success">Pagado</Badge>
                  </div>
                  <div className="text-2xl font-bold text-green-900">€980.00</div>
                  <p className="text-xs text-green-700 mt-1">Pagado: 5 Oct 2024</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
