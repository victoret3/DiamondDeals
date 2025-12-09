"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const supabase = createClient();

  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [playerData, setPlayerData] = useState<any>(null);

  const [fullName, setFullName] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [phone, setPhone] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setValidatingToken(false);
      setTokenValid(false);
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const { data: player, error } = await supabase
        .from("players")
        .select("*")
        .eq("registration_token", token)
        .single();

      if (error || !player) {
        setTokenValid(false);
        setError("Enlace de registro no válido");
        return;
      }

      if (player.token_used) {
        setTokenValid(false);
        setError("Este enlace ya ha sido utilizado");
        return;
      }

      // Token válido
      setPlayerData(player);
      setTokenValid(true);
    } catch (err) {
      setTokenValid(false);
      setError("Error al validar el enlace");
    } finally {
      setValidatingToken(false);
    }
  };

  const validatePlayerId = (value: string): boolean => {
    const regex = /^\d{4}-\d{4}$/;
    return regex.test(value);
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

    if (!validatePlayerId(playerId)) {
      setError("El ID debe tener el formato XXXX-XXXX (solo números)");
      setLoading(false);
      return;
    }

    if (!nickname.trim()) {
      setError("El nickname es obligatorio");
      setLoading(false);
      return;
    }

    if (nickname.length < 3) {
      setError("El nickname debe tener al menos 3 caracteres");
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

    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error("Error al crear usuario");

      // 2. Esperar un momento para que el trigger cree el perfil
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. Verificar y crear perfil si es necesario
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (!existingProfile) {
        await supabase
          .from("profiles")
          .insert({
            id: authData.user.id,
            email: email,
            nickname: nickname,
            role: "player"
          });
      } else {
        // Actualizar perfil con nickname
        await supabase
          .from("profiles")
          .update({ nickname: nickname })
          .eq("id", authData.user.id);
      }

      // 4. Vincular player con usuario y marcar token como usado
      const { error: updateError } = await supabase
        .from("players")
        .update({
          user_id: authData.user.id,
          full_name: fullName,
          player_id: playerId,
          phone: phone || null,
          email: email,
          nickname: nickname,
          token_used: true,
          status: "active"
        })
        .eq("id", playerData.id);

      if (updateError) throw updateError;

      toast.success("¡Registro exitoso! Revisa tu email para confirmar tu cuenta");
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

  // Estado: Validando token
  if (validatingToken) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-slate-600">Validando enlace de registro...</p>
      </div>
    );
  }

  // Estado: Token inválido o sin token
  if (!token || !tokenValid) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">
            Enlace No Válido
          </h2>
          <p className="text-slate-600">
            {error || "Este enlace de registro no es válido o ha expirado"}
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Por favor, contacta a tu administrador para obtener un nuevo enlace.
          </p>
        </div>
        <Button onClick={() => router.push("/login")} variant="outline">
          Ir al Login
        </Button>
      </div>
    );
  }

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
            Hemos enviado un email de confirmación a tu correo.
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Por favor, revisa tu bandeja de entrada y confirma tu cuenta.
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
          Completa tu Registro
        </h2>
        <p className="text-sm text-slate-600">
          Rellena tus datos para crear tu cuenta
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
          <Label htmlFor="playerId">ID del Jugador *</Label>
          <Input
            id="playerId"
            type="text"
            placeholder="1234-5678"
            value={playerId}
            onChange={(e) => {
              let value = e.target.value.replace(/[^\d-]/g, '');
              if (value.length === 4 && !value.includes('-')) {
                value = value + '-';
              }
              if (value.length <= 9) {
                setPlayerId(value);
              }
            }}
            required
            disabled={loading}
            maxLength={9}
            className="font-mono"
          />
          <p className="text-xs text-slate-500">
            Formato: XXXX-XXXX (solo números)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono (opcional)</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="Ej: +34 600 000 000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nickname">Nickname / Apodo *</Label>
          <Input
            id="nickname"
            type="text"
            placeholder="Ej: PokerPro99"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
            disabled={loading}
            minLength={3}
          />
          <p className="text-xs text-slate-500">
            Mínimo 3 caracteres. Podrás usar tu nickname para iniciar sesión
          </p>
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
          <p className="text-xs text-slate-500">
            Mínimo 6 caracteres
          </p>
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

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Registrando...
            </>
          ) : (
            "Completar Registro"
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
