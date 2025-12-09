"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import ClubForm from "@/components/forms/ClubForm";

export default function NewClubPage() {
  const router = useRouter();
  const supabase = createClient();

  const handleSave = async (clubData: any) => {
    const { error } = await supabase
      .from("clubs")
      .insert(clubData);

    if (error) throw error;

    toast.success("Club creado correctamente");
    router.push("/admin/clubs");
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/clubs">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Nuevo Club</h1>
            <p className="text-slate-600 mt-1">
              Añade un nuevo club de poker al sistema
            </p>
          </div>
        </div>

        {/* Formulario */}
        <ClubForm onSave={handleSave} isEditing={false} />
      </div>
    </div>
  );
}
