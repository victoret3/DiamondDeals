"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Edit } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loading } from "@/components/ui/loading";

export default function ConditionPlanDetailPage() {
  const params = useParams();
  const supabase = createClient();
  const [plan, setPlan] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = async () => {
    setLoading(true);

    // Cargar el plan
    const { data: planData } = await supabase
      .from("condition_templates")
      .select("*")
      .eq("id", params.id)
      .single();

    // Cargar las reglas
    const { data: rulesData } = await supabase
      .from("condition_rules")
      .select("*")
      .eq("template_id", params.id)
      .order("ratio_min", { ascending: true })
      .order("hands_min", { ascending: true });

    if (planData) setPlan(planData);
    if (rulesData) setRules(rulesData);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-8">
        <Loading message="Cargando..." />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="p-8">
        <p className="text-center">Plan no encontrado</p>
      </div>
    );
  }

  // Agrupar reglas por ratio
  const groupedRules = rules.reduce((acc, rule) => {
    const key = `${rule.ratio_min}_${rule.ratio_max || 'inf'}`;
    if (!acc[key]) {
      acc[key] = {
        ratioMin: rule.ratio_min,
        ratioMax: rule.ratio_max,
        rules: []
      };
    }
    acc[key].rules.push(rule);
    return acc;
  }, {} as Record<string, any>);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/condition-plans">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900">{plan.name}</h1>
                <Badge variant={plan.is_active ? "success" : "secondary"}>
                  {plan.is_active ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              {plan.description && (
                <p className="text-slate-600 mt-1">{plan.description}</p>
              )}
            </div>
          </div>
          <Button>
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </div>

        {/* Tabla de condiciones */}
        <Card>
          <CardHeader>
            <CardTitle>Tabla de Condiciones</CardTitle>
            <p className="text-sm text-slate-600">
              Rakeback según ratio (PNL/Rake) y manos jugadas totales
            </p>
          </CardHeader>
          <CardContent>
            {rules.length === 0 ? (
              <p className="text-center py-8 text-slate-600">
                No hay reglas definidas para este plan
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-300">
                      <th className="text-left py-3 px-4 font-semibold">Ratio (PNL/Rake)</th>
                      <th className="text-left py-3 px-4 font-semibold">Manos Mínimas</th>
                      <th className="text-left py-3 px-4 font-semibold">Manos Máximas</th>
                      <th className="text-right py-3 px-4 font-semibold">Rakeback %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((rule) => (
                      <tr key={rule.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <span className="font-medium">
                            {rule.ratio_min} {rule.ratio_max ? `a ${rule.ratio_max}` : 'o mayor'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {rule.hands_min.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {rule.hands_max ? rule.hands_max.toLocaleString() : 'Sin límite'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-bold text-blue-600">
                            {rule.rakeback_percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-slate-600">Total Reglas</p>
                <p className="text-3xl font-bold text-slate-900">{rules.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-slate-600">Rakeback Mínimo</p>
                <p className="text-3xl font-bold text-green-600">
                  {Math.min(...rules.map(r => parseFloat(r.rakeback_percentage)))}%
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-slate-600">Rakeback Máximo</p>
                <p className="text-3xl font-bold text-blue-600">
                  {Math.max(...rules.map(r => parseFloat(r.rakeback_percentage)))}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
