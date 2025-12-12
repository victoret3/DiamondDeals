"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { createClient } from "@/lib/supabase/client";
import { Building2, Plus, Eye, Power, Trash2 } from "lucide-react";
import Link from "next/link";

export default function ClubConditionsPage() {
  const supabase = createClient();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("diamond_club_agreement_templates")
      .select(`
        *,
        rules:diamond_club_agreement_rules(id)
      `)
      .order("name");

    if (data) setTemplates(data);
    setLoading(false);
  };

  const toggleTemplateStatus = async (templateId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("diamond_club_agreement_templates")
      .update({ is_active: !currentStatus })
      .eq("id", templateId);

    if (!error) {
      loadTemplates();
    }
  };

  const deleteTemplate = async (templateId: string, templateName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el template "${templateName}"?`)) {
      return;
    }

    // Primero eliminar las reglas asociadas
    await supabase
      .from("diamond_club_agreement_rules")
      .delete()
      .eq("template_id", templateId);

    // Luego eliminar el template
    const { error } = await supabase
      .from("diamond_club_agreement_templates")
      .delete()
      .eq("id", templateId);

    if (!error) {
      loadTemplates();
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Condiciones Diamond → Club</h1>
            <p className="text-slate-600 mt-1">
              Gestiona los templates de acuerdos dinámicos entre Diamond y Clubs
            </p>
          </div>
          <Link href="/admin/conditions/club/new">
            <Button size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Nuevo Template
            </Button>
          </Link>
        </div>

        {/* Templates Table */}
        <Card>
          <CardHeader>
            <CardTitle>{templates.length} templates</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loading message="Cargando templates..." />
            ) : templates.length === 0 ? (
              <p className="text-center py-8 text-slate-600">
                No hay templates todavía. Crea el primero.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-300">
                      <th className="text-left py-3 px-4 font-semibold">Nombre</th>
                      <th className="text-left py-3 px-4 font-semibold">Descripción</th>
                      <th className="text-center py-3 px-4 font-semibold">Reglas</th>
                      <th className="text-center py-3 px-4 font-semibold">Estado</th>
                      <th className="text-right py-3 px-4 font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((template) => (
                      <tr key={template.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-600" />
                            <span className="font-medium text-slate-900">{template.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {template.description || "-"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="outline">
                            {template.rules?.length || 0} reglas
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={template.is_active ? "success" : "secondary"}>
                            {template.is_active ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleTemplateStatus(template.id, template.is_active)}
                              title={template.is_active ? "Desactivar template" : "Activar template"}
                            >
                              <Power className={`w-4 h-4 ${template.is_active ? 'text-green-600' : 'text-slate-400'}`} />
                            </Button>
                            <Link href={`/admin/conditions/club/${template.id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteTemplate(template.id, template.name)}
                              title="Eliminar template"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
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
