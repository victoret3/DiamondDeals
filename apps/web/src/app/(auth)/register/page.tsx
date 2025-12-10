"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

interface Application {
  id: string;
  name: string;
  code: string;
}

interface AppData {
  selected: boolean;
  playerId: string;
  nickname: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [applications, setApplications] = useState<Application[]>([]);
  const [appData, setAppData] = useState<Record<string, AppData>>({});
  const [loadingApps, setLoadingApps] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    const { data } = await supabase
      .from("applications")
      .select("id, name, code")
      .eq("is_active", true)
      .order("name");

    if (data) {
      setApplications(data);
      // Inicializar estado de apps
      const initial: Record<string, AppData> = {};
      data.forEach(app => {
        initial[app.id] = { selected: false, playerId: "", nickname: "" };
      });
      setAppData(initial);
    }
    setLoadingApps(false);
  };

  const toggleApp = (appId: string) => {
    setAppData(prev => ({
      ...prev,
      [appId]: { ...prev[appId], selected: !prev[appId].selected }
    }));
  };

  const updateAppData = (appId: string, field: "playerId" | "nickname", value: string) => {
    setAppData(prev => ({
      ...prev,
      [appId]: { ...prev[appId], [field]: value }
    }));
  };

  const getSelectedApps = () => {
    return Object.entries(appData)
      .filter(([_, data]) => data.selected)
      .map(([appId, data]) => ({
        applicationId: appId,
        playerId: data.playerId,
        nickname: data.nickname
      }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validaciones
    if (!fullName.trim()) {
      setError("El nombre completo es obligatorio");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setLoading(false);
      return;
    }

    const selectedApps = getSelectedApps();
    if (selectedApps.length === 0) {
      setError("Debes seleccionar al menos una aplicación");
      setLoading(false);
      return;
    }

    // Validar que todas las apps seleccionadas tengan ID y nickname
    for (const app of selectedApps) {
      if (!app.playerId.trim() || !app.nickname.trim()) {
        const appName = applications.find(a => a.id === app.applicationId)?.name;
        setError(`Completa el ID y nickname para ${appName}`);
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          password,
          applications: selectedApps
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al registrarse");
      }

      toast.success("¡Registro exitoso!");
      setSuccess(true);
      setError("");
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Error al registrarse");
      toast.error(err.message || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  // Estado: Registro exitoso
  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">
            ¡Registro Exitoso!
          </h2>
          <p className="text-slate-600">
            Tu cuenta ha sido creada correctamente.
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Un administrador verificará tu cuenta y te asignará los clubs correspondientes.
          </p>
        </div>
        <Button onClick={() => router.push("/login")} className="w-full">
          Ir al Login
        </Button>
      </div>
    );
  }

  // Estado: Formulario de registro
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">
          Crear Cuenta
        </h2>
        <p className="text-sm text-slate-600">
          Regístrate para unirte a Diamont Deals
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nombre Completo *</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Ej: Juan García Pérez"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña *</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            minLength={6}
          />
          <p className="text-xs text-slate-500">Mínimo 6 caracteres</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        {/* Aplicaciones */}
        <div className="space-y-3 pt-4 border-t">
          <Label>Aplicaciones donde juegas *</Label>
          <p className="text-xs text-slate-500">
            Selecciona las apps e introduce tu ID y nickname en cada una
          </p>

          {loadingApps ? (
            <div className="text-center py-4 text-slate-500">Cargando aplicaciones...</div>
          ) : (
            <div className="space-y-3">
              {applications.map(app => (
                <div key={app.id} className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={`app-${app.id}`}
                      checked={appData[app.id]?.selected || false}
                      onCheckedChange={() => toggleApp(app.id)}
                      disabled={loading}
                    />
                    <Label htmlFor={`app-${app.id}`} className="font-medium cursor-pointer">
                      {app.name}
                    </Label>
                  </div>

                  {appData[app.id]?.selected && (
                    <div className="ml-7 grid grid-cols-2 gap-2">
                      <div>
                        <Input
                          placeholder="ID (ej: 1234567)"
                          value={appData[app.id]?.playerId || ""}
                          onChange={(e) => updateAppData(app.id, "playerId", e.target.value)}
                          disabled={loading}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Nickname"
                          value={appData[app.id]?.nickname || ""}
                          onChange={(e) => updateAppData(app.id, "nickname", e.target.value)}
                          disabled={loading}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading || loadingApps}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Registrando...
            </>
          ) : (
            "Crear Cuenta"
          )}
        </Button>
      </form>

      <div className="text-center text-sm">
        <span className="text-slate-600">¿Ya tienes una cuenta? </span>
        <Link
          href="/login"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Inicia sesión
        </Link>
      </div>
    </div>
  );
}
