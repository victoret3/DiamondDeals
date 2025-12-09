"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  Settings,
  LogOut,
  Shield,
  FileText,
  ChevronRight,
  Calendar,
  ListTree,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const menuItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Jugadores",
    href: "/admin/players",
    icon: Users,
  },
  {
    title: "Clubs",
    href: "/admin/clubs",
    icon: Building2,
  },
  {
    title: "Reportes Semanales",
    href: "/admin/reports/weekly",
    icon: Calendar,
  },
  {
    title: "Condiciones Club",
    href: "/admin/conditions/club",
    icon: Building2,
  },
  {
    title: "Condiciones Jugador",
    href: "/admin/conditions/player",
    icon: User,
  },
  {
    title: "Ajustes",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    }
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col h-screen bg-white border-r border-slate-200 w-64 fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold text-lg text-slate-900">Diamont Deals</h1>
            <p className="text-xs text-purple-600 font-medium">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                isActive
                  ? "bg-purple-50 text-purple-700 font-medium"
                  : "text-slate-700 hover:bg-slate-50"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="flex-1">{item.title}</span>
              {isActive && <ChevronRight className="w-4 h-4" />}
            </Link>
          );
        })}
      </nav>

      {/* User Menu */}
      <div className="p-4 border-t border-slate-200">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 h-auto py-3 px-3 hover:bg-slate-50">
              <Avatar className="w-9 h-9">
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-sm">
                  {getInitials(userEmail)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start flex-1 min-w-0">
                <span className="text-sm font-medium text-slate-900">Admin</span>
                <span className="text-xs text-slate-500 truncate w-full">{userEmail}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">Administrador</p>
                <p className="text-xs text-slate-500">{userEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
