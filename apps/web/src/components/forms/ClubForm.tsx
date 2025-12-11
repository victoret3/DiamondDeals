"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Save } from "lucide-react";

interface ClubFormProps {
  initialData?: {
    name: string;
    code: string;
    logoUrl: string;
    actionPercentage: string;
    diamondClubAgreementType: "fixed" | "dynamic";
    diamondClubFixedPercentage: string;
    diamondClubTemplateId: string;
  };
  onSave: (data: any) => Promise<void>;
  isEditing?: boolean;
}

export default function ClubForm({ initialData, onSave, isEditing = false }: ClubFormProps) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [clubTemplates, setClubTemplates] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    code: initialData?.code || "",
    logoUrl: initialData?.logoUrl || "",
    actionPercentage: initialData?.actionPercentage || "",
    diamondClubAgreementType: (initialData?.diamondClubAgreementType || "fixed") as "fixed" | "dynamic",
    diamondClubFixedPercentage: initialData?.diamondClubFixedPercentage || "",
    diamondClubTemplateId: initialData?.diamondClubTemplateId || "",
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        code: initialData.code,
        logoUrl: initialData.logoUrl,
        actionPercentage: initialData.actionPercentage,
        diamondClubAgreementType: initialData.diamondClubAgreementType,
        diamondClubFixedPercentage: initialData.diamondClubFixedPercentage,
        diamondClubTemplateId: initialData.diamondClubTemplateId,
      });
    }
  }, [initialData]);

  const loadTemplates = async () => {
    // Cargar templates Diamond-Club
    const { data: clubData } = await supabase
      .from("diamond_club_agreement_templates")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (clubData) setClubTemplates(clubData);
  };

  const handleNameChange = (name: string) => {
    if (!isEditing) {
      // Auto-generar código a partir del nombre solo al crear
      const code = name.toUpperCase().replace(/[^A-Z0-9]/g, "");
      setFormData({ ...formData, name, code });
    } else {
      setFormData({ ...formData, name });
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor selecciona una imagen válida');
        return;
      }

      // Validar tamaño (máx 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('La imagen no debe superar 2MB');
        return;
      }

      setUploading(true);

      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `club-logos/${fileName}`;

      // Subir archivo a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      setFormData({ ...formData, logoUrl: publicUrl });
      toast.success('Logo subido correctamente');
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error(error.message || 'Error al subir el logo');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("El nombre del club es obligatorio");
      return;
    }

    if (!formData.code.trim()) {
      toast.error("El código del club es obligatorio");
      return;
    }

    if (!formData.actionPercentage || parseFloat(formData.actionPercentage) < 0) {
      toast.error("El porcentaje de action es obligatorio");
      return;
    }

    setSaving(true);
    try {
      const clubData: any = {
        name: formData.name,
        code: formData.code,
        logo_url: formData.logoUrl || null,
        action_percentage: parseFloat(formData.actionPercentage),
        is_active: true,
        diamond_club_agreement_type: formData.diamondClubAgreementType,
      };

      // Diamond-Club agreement (lo que el club paga a Diamond)
      if (formData.diamondClubAgreementType === "fixed") {
        clubData.diamond_club_fixed_percentage = parseFloat(formData.diamondClubFixedPercentage) || 0;
        clubData.diamond_club_template_id = null;
      } else {
        clubData.diamond_club_template_id = formData.diamondClubTemplateId || null;
        clubData.diamond_club_fixed_percentage = null;
      }

      await onSave(clubData);
    } catch (error: any) {
      console.error('Error saving club:', error);
      toast.error(error.message || 'Error al guardar el club');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información del Club</CardTitle>
        <CardDescription>
          Configura los datos básicos del club de poker
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre del Club *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Ej: GGPoker, PokerStars"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="code">Código Único *</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="Ej: GGPOKER, POKERSTARS"
            disabled={isEditing}
          />
          {!isEditing && (
            <p className="text-xs text-slate-500">
              Se genera automáticamente del nombre, pero puedes personalizarlo
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="logo">Logo del Club</Label>
          <div className="flex items-center gap-4">
            {formData.logoUrl && (
              <img
                src={formData.logoUrl}
                alt="Logo"
                className="w-16 h-16 object-contain rounded border"
              />
            )}
            <div className="flex-1">
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploading}
              />
              <p className="text-xs text-slate-500 mt-1">
                {uploading ? 'Subiendo imagen...' : 'Sube una imagen para identificar el club (máx 2MB)'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="action">Action *</Label>
          <div className="relative">
            <Input
              id="action"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formData.actionPercentage}
              onChange={(e) => setFormData({ ...formData, actionPercentage: e.target.value })}
              placeholder="Ej: 20"
              className="pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
              %
            </span>
          </div>
          <p className="text-xs text-slate-500">
            % del PNL para action
          </p>
        </div>

        {/* Sección: Acuerdo Club → Diamond */}
        <div className="border-t pt-4 mt-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Acuerdo Club → Diamond</h3>
          <p className="text-xs text-slate-500 mb-3">
            Configura el porcentaje que el club paga a Diamond del rake action
          </p>

          <div className="space-y-2">
            <Label>Tipo de Acuerdo *</Label>
            <Select
              value={formData.diamondClubAgreementType}
              onValueChange={(value: "fixed" | "dynamic") =>
                setFormData({ ...formData, diamondClubAgreementType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Porcentaje Fijo</SelectItem>
                <SelectItem value="dynamic">Dinámico (basado en rendimiento)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.diamondClubAgreementType === "fixed" ? (
            <div className="space-y-2 mt-3">
              <Label htmlFor="diamondClubFixed">Porcentaje que paga el Club a Diamond</Label>
              <div className="relative">
                <Input
                  id="diamondClubFixed"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.diamondClubFixedPercentage}
                  onChange={(e) => setFormData({ ...formData, diamondClubFixedPercentage: e.target.value })}
                  placeholder="Ej: 60"
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                  %
                </span>
              </div>
              <p className="text-xs text-slate-500">
                % del Rake Action que el club paga a Diamond
              </p>
            </div>
          ) : (
            <div className="space-y-2 mt-3">
              <Label>Template de Condiciones</Label>
              <Select
                value={formData.diamondClubTemplateId}
                onValueChange={(value) => setFormData({ ...formData, diamondClubTemplateId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un template" />
                </SelectTrigger>
                <SelectContent>
                  {clubTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Club"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
