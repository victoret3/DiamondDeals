"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Smartphone, Building2, Plus, Settings, Save, Trash2, Pencil } from "lucide-react";
import { Loading } from "@/components/ui/loading";

interface Club {
  id: string;
  name: string;
  code: string;
  application_id: string | null;
}

interface Application {
  id: string;
  name: string;
  code: string;
  logo_url: string | null;
  is_active: boolean;
  clubs: Club[];
}

export default function ApplicationsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [allClubs, setAllClubs] = useState<Club[]>([]);

  // Modal state
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [assignedClubIds, setAssignedClubIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // New app modal
  const [showNewAppModal, setShowNewAppModal] = useState(false);
  const [newAppName, setNewAppName] = useState("");
  const [newAppCode, setNewAppCode] = useState("");
  const [newAppLogo, setNewAppLogo] = useState("");

  // Edit app modal
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [editAppName, setEditAppName] = useState("");
  const [editAppLogo, setEditAppLogo] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    // Load applications
    const { data: apps } = await supabase
      .from("applications")
      .select("*")
      .order("name");

    // Load all clubs
    const { data: clubs } = await supabase
      .from("clubs")
      .select("id, name, code, application_id")
      .eq("is_active", true)
      .order("name");

    if (apps && clubs) {
      // Group clubs by application
      const appsWithClubs = apps.map(app => ({
        ...app,
        clubs: clubs.filter(c => c.application_id === app.id)
      }));
      setApplications(appsWithClubs);
      setAllClubs(clubs);
    }

    setLoading(false);
  };

  const openAssignModal = (app: Application) => {
    setSelectedApp(app);
    setAssignedClubIds(app.clubs.map(c => c.id));
  };

  const toggleClub = (clubId: string) => {
    if (assignedClubIds.includes(clubId)) {
      setAssignedClubIds(assignedClubIds.filter(id => id !== clubId));
    } else {
      setAssignedClubIds([...assignedClubIds, clubId]);
    }
  };

  const saveClubAssignments = async () => {
    if (!selectedApp) return;

    setSaving(true);
    try {
      // Get clubs that were assigned to this app
      const currentClubIds = selectedApp.clubs.map(c => c.id);

      // Clubs to remove from this app
      const toRemove = currentClubIds.filter(id => !assignedClubIds.includes(id));

      // Clubs to add to this app
      const toAdd = assignedClubIds.filter(id => !currentClubIds.includes(id));

      // Remove clubs
      if (toRemove.length > 0) {
        await supabase
          .from("clubs")
          .update({ application_id: null })
          .in("id", toRemove);
      }

      // Add clubs
      if (toAdd.length > 0) {
        await supabase
          .from("clubs")
          .update({ application_id: selectedApp.id })
          .in("id", toAdd);
      }

      toast.success("Clubs asignados correctamente");
      setSelectedApp(null);
      loadData();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Error al asignar clubs: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const createApplication = async () => {
    if (!newAppName.trim() || !newAppCode.trim()) {
      toast.error("Nombre y código son obligatorios");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("applications")
        .insert({
          name: newAppName.trim(),
          code: newAppCode.trim().toLowerCase(),
          logo_url: newAppLogo.trim() || null,
          is_active: true
        });

      if (error) throw error;

      toast.success("Aplicación creada correctamente");
      setShowNewAppModal(false);
      setNewAppName("");
      setNewAppCode("");
      setNewAppLogo("");
      loadData();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Error al crear: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (app: Application) => {
    setEditingApp(app);
    setEditAppName(app.name);
    setEditAppLogo(app.logo_url || "");
  };

  const updateApplication = async () => {
    if (!editingApp || !editAppName.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("applications")
        .update({
          name: editAppName.trim(),
          logo_url: editAppLogo.trim() || null,
        })
        .eq("id", editingApp.id);

      if (error) throw error;

      toast.success("Aplicación actualizada");
      setEditingApp(null);
      loadData();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Error al actualizar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteApplication = async (app: Application) => {
    if (app.clubs.length > 0) {
      toast.error(`No se puede eliminar: tiene ${app.clubs.length} club(s) asignados`);
      return;
    }

    const confirmed = window.confirm(`¿Estás seguro de eliminar "${app.name}"? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    const { error } = await supabase
      .from("applications")
      .delete()
      .eq("id", app.id);

    if (error) {
      toast.error("Error al eliminar la aplicación");
      console.error(error);
    } else {
      toast.success("Aplicación eliminada");
      loadData();
    }
  };

  // Get clubs not assigned to any app
  const unassignedClubs = allClubs.filter(c => !c.application_id);

  // Get clubs available for assignment (unassigned + currently assigned to selected app)
  const getAvailableClubs = () => {
    if (!selectedApp) return [];
    return allClubs.filter(c => !c.application_id || c.application_id === selectedApp.id);
  };

  if (loading) {
    return (
      <div className="p-8">
        <Loading message="Cargando aplicaciones..." />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Aplicaciones</h1>
            <p className="text-slate-600 mt-1">
              Gestiona las aplicaciones de poker y sus clubs
            </p>
          </div>
          <Button onClick={() => setShowNewAppModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Aplicación
          </Button>
        </div>

        {/* Applications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {applications.map(app => (
            <Card key={app.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 flex items-center justify-center flex-shrink-0">
                      {app.logo_url ? (
                        <img
                          src={app.logo_url}
                          alt={app.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full rounded-lg bg-purple-100 flex items-center justify-center">
                          <Smartphone className="w-7 h-7 text-purple-600" />
                        </div>
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{app.name}</CardTitle>
                      <p className="text-xs text-slate-500 font-mono">{app.code}</p>
                    </div>
                  </div>
                  <Badge variant={app.is_active ? "success" : "secondary"}>
                    {app.is_active ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Clubs asignados:</span>
                    <span className="font-semibold">{app.clubs.length}</span>
                  </div>

                  {app.clubs.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {app.clubs.slice(0, 3).map(club => (
                        <Badge key={club.id} variant="outline" className="text-xs">
                          {club.name}
                        </Badge>
                      ))}
                      {app.clubs.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{app.clubs.length - 3} más
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => openAssignModal(app)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Asignar Clubs
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => openEditModal(app)}
                      title="Editar aplicación"
                    >
                      <Pencil className="w-4 h-4 text-slate-600" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => deleteApplication(app)}
                      className="hover:bg-red-50 hover:border-red-300"
                      title="Eliminar aplicación"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Unassigned Clubs Warning */}
        {unassignedClubs.length > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-amber-800 text-lg">Clubs sin asignar</CardTitle>
              <CardDescription className="text-amber-700">
                Estos clubs no están asignados a ninguna aplicación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {unassignedClubs.map(club => (
                  <Badge key={club.id} variant="outline" className="bg-white">
                    {club.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Assign Clubs Modal */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar Clubs a {selectedApp?.name}</DialogTitle>
            <DialogDescription>
              Selecciona los clubs que pertenecen a esta aplicación
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[400px] overflow-y-auto py-4">
            {getAvailableClubs().map(club => (
              <div key={club.id} className="flex items-center space-x-3">
                <Checkbox
                  id={`club-${club.id}`}
                  checked={assignedClubIds.includes(club.id)}
                  onCheckedChange={() => toggleClub(club.id)}
                />
                <Label htmlFor={`club-${club.id}`} className="flex-1 cursor-pointer">
                  <span className="font-medium">{club.name}</span>
                  <span className="text-xs text-slate-500 ml-2">({club.code})</span>
                </Label>
              </div>
            ))}

            {getAvailableClubs().length === 0 && (
              <p className="text-center text-slate-500 py-4">
                No hay clubs disponibles para asignar
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setSelectedApp(null)}>
              Cancelar
            </Button>
            <Button onClick={saveClubAssignments} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Application Modal */}
      <Dialog open={showNewAppModal} onOpenChange={setShowNewAppModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Aplicación</DialogTitle>
            <DialogDescription>
              Añade una nueva aplicación de poker
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="app-name">Nombre *</Label>
              <Input
                id="app-name"
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
                placeholder="Ej: PokerBros"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-code">Código *</Label>
              <Input
                id="app-code"
                value={newAppCode}
                onChange={(e) => setNewAppCode(e.target.value)}
                placeholder="Ej: pokerbros"
                className="font-mono"
              />
              <p className="text-xs text-slate-500">
                Identificador único en minúsculas
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-logo">Logo URL</Label>
              <Input
                id="app-logo"
                value={newAppLogo}
                onChange={(e) => setNewAppLogo(e.target.value)}
                placeholder="https://..."
              />
              {newAppLogo && (
                <div className="flex justify-center p-2 bg-slate-50 rounded-lg">
                  <img src={newAppLogo} alt="Preview" className="max-h-16 object-contain" />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowNewAppModal(false)}>
              Cancelar
            </Button>
            <Button onClick={createApplication} disabled={saving}>
              <Plus className="w-4 h-4 mr-2" />
              {saving ? "Creando..." : "Crear"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Application Modal */}
      <Dialog open={!!editingApp} onOpenChange={() => setEditingApp(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Aplicación</DialogTitle>
            <DialogDescription>
              Modifica los datos de {editingApp?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-app-name">Nombre *</Label>
              <Input
                id="edit-app-name"
                value={editAppName}
                onChange={(e) => setEditAppName(e.target.value)}
                placeholder="Ej: PokerBros"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-app-logo">Logo URL</Label>
              <Input
                id="edit-app-logo"
                value={editAppLogo}
                onChange={(e) => setEditAppLogo(e.target.value)}
                placeholder="https://..."
              />
              {editAppLogo && (
                <div className="flex justify-center p-2 bg-slate-50 rounded-lg">
                  <img src={editAppLogo} alt="Preview" className="max-h-16 object-contain" />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setEditingApp(null)}>
              Cancelar
            </Button>
            <Button onClick={updateApplication} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
