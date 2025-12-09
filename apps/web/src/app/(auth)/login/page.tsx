"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState(""); // puede ser email o nickname
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let emailToUse = identifier;

      // Si no contiene @, asumimos que es un nickname y buscamos el email
      if (!identifier.includes("@")) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("email")
          .eq("nickname", identifier)
          .single();

        if (profileError || !profile) {
          throw new Error("Nickname no encontrado");
        }

        emailToUse = profile.email;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });

      if (signInError) throw signInError;

      // Obtener el rol del usuario
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      toast.success("¡Bienvenido!");

      // Redirigir según el rol
      if (profile?.role === "admin") {
        router.push("/admin/dashboard");
      } else if (profile?.role === "agent") {
        router.push("/agent/dashboard");
      } else {
        router.push("/player/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
      toast.error("Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">
          Iniciar Sesión
        </h2>
        <p className="text-sm text-slate-600">
          Ingresa tus credenciales para acceder
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="identifier">Email o Nickname</Label>
          <Input
            id="identifier"
            type="text"
            placeholder="tu@email.com o tu_nickname"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            disabled={loading}
          />
          <p className="text-xs text-slate-500">
            Puedes usar tu email o tu nickname para iniciar sesión
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
        </Button>
      </form>
    </div>
  );
}
