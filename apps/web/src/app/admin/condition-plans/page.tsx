"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { Plus, Eye } from "lucide-react";
import Link from "next/link";
import { Loading } from "@/components/ui/loading";

export default function ConditionPlansPage() {
  const supabase = createClient();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("condition_templates")
      .select(`
        *,
        rules:condition_rules(count)
      `)
      .order("created_at", { ascending: false });

    if (data) setPlans(data);
    setLoading(false);
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Planes de Condiciones</h1>
            <p className="text-slate-600 mt-1">
              Gestiona las tablas de condiciones basadas en manos y ratio
            </p>
          </div>
          <Link href="/admin/condition-plans/new">
            <Button size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Nuevo Plan
            </Button>
          </Link>
        </div>

        {/* Plans List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <Card>
              <CardContent className="py-8">
                <Loading message="Cargando..." />
              </CardContent>
            </Card>
          ) : plans.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-slate-600">No hay planes todavía</p>
              </CardContent>
            </Card>
          ) : (
            plans.map((plan) => (
              <Card key={plan.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <Badge variant={plan.is_active ? "success" : "secondary"}>
                      {plan.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  {plan.description && (
                    <p className="text-sm text-slate-600 mt-2">{plan.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Reglas definidas:</span>
                    <span className="font-bold text-slate-900">
                      {plan.rules?.[0]?.count || 0}
                    </span>
                  </div>

                  <Link href={`/admin/condition-plans/${plan.id}`}>
                    <Button variant="outline" className="w-full">
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Tabla
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
