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

export default function DiamondClubPlanDetailPage() {
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

    const { data: planData } = await supabase
      .from("diamond_club_agreement_templates")
      .select("*")
      .eq("id", params.id)
      .single();

    const { data: rulesData } = await supabase
      .from("diamond_club_agreement_rules")
      .select("*")
      .eq("template_id", params.id)
      .order("ratio_min", { ascending: true })
      .order("rake_min", { ascending: true });

    if (planData) setPlan(planData);
    if (rulesData) setRules(rulesData);
    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return "$" + amount.toLocaleString("en-US");
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
        <p className="text-center">Tabla no encontrada</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/diamond-club-plans">
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

        {/* Tabla Diamond → Club */}
        <Card>
          <CardHeader>
            <CardTitle>Tabla Diamond → Club</CardTitle>
            <p className="text-sm text-slate-600">
              % que Diamond cobra al club según ratio (PNL/Rake) y rake total en $
            </p>
          </CardHeader>
          <CardContent>
            {rules.length === 0 ? (
              <p className="text-center py-8 text-slate-600">
                No hay reglas definidas para esta tabla
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-300">
                      <th className="text-left py-3 px-4 font-semibold">Ratio (PNL/Rake)</th>
                      <th className="text-left py-3 px-4 font-semibold">Rake Mínimo</th>
                      <th className="text-left py-3 px-4 font-semibold">Rake Máximo</th>
                      <th className="text-right py-3 px-4 font-semibold">Diamond %</th>
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
                          {formatCurrency(parseFloat(rule.rake_min))}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {rule.rake_max ? formatCurrency(parseFloat(rule.rake_max)) : 'Sin límite'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-bold text-purple-600">
                            {rule.diamond_percentage}%
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
                <p className="text-sm text-slate-600">% Mínimo Diamond</p>
                <p className="text-3xl font-bold text-green-600">
                  {rules.length > 0 ? Math.min(...rules.map(r => parseFloat(r.diamond_percentage))) : 0}%
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-slate-600">% Máximo Diamond</p>
                <p className="text-3xl font-bold text-purple-600">
                  {rules.length > 0 ? Math.max(...rules.map(r => parseFloat(r.diamond_percentage))) : 0}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
