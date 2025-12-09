"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { Sliders, Plus, Eye } from "lucide-react";
import Link from "next/link";

export default function ConditionsPage() {
  const supabase = createClient();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("condition_templates")
      .select(`
        *,
        condition_rules (
          id
        )
      `)
      .order("created_at", { ascending: false });

    if (data) setTemplates(data);
    setLoading(false);
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Templates de Condiciones</h1>
            <p className="text-slate-600 mt-1">
              Gestiona los templates de condiciones dinámicas
            </p>
          </div>
          <Link href="/admin/conditions/new">
            <Button size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Nuevo Template
            </Button>
          </Link>
        </div>

        {/* Templates List */}
        {loading ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-slate-600">Cargando templates...</p>
            </CardContent>
          </Card>
        ) : templates.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-slate-600">
                No hay templates todavía. Crea el primero.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-slate-600" />
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        {template.description && (
                          <CardDescription className="mt-1">
                            {template.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <Badge variant={template.is_active ? "success" : "secondary"}>
                      {template.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-600">Reglas definidas:</span>
                    <span className="font-bold text-slate-900">
                      {template.condition_rules?.length || 0}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500">
                    Creado el {new Date(template.created_at).toLocaleDateString('es-ES')}
                  </div>

                  <Link href={`/admin/conditions/${template.id}`}>
                    <Button variant="outline" className="w-full">
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Reglas
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
