import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes
  const isAuthRoute = request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/register");
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isPlayerRoute = request.nextUrl.pathname.startsWith("/player");
  const isAgentRoute = request.nextUrl.pathname.startsWith("/agent");
  const isProtectedRoute = isAdminRoute || isPlayerRoute || isAgentRoute;

  // Redirect to login if not authenticated and accessing protected route
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Get user role for role-based redirects
  let userRole: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    userRole = profile?.role || null;
  }

  // Redirect to dashboard if authenticated and accessing auth routes or root
  const isRootRoute = request.nextUrl.pathname === "/";

  if (user && (isAuthRoute || isRootRoute)) {
    if (userRole === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    } else if (userRole === "agent") {
      return NextResponse.redirect(new URL("/agent/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/player/dashboard", request.url));
    }
  }

  // Role-based route protection
  if (user && userRole) {
    // Prevent non-admins from accessing admin routes
    if (isAdminRoute && userRole !== "admin") {
      if (userRole === "agent") {
        return NextResponse.redirect(new URL("/agent/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/player/dashboard", request.url));
    }

    // Prevent non-agents from accessing agent routes
    if (isAgentRoute && userRole !== "agent" && userRole !== "admin") {
      return NextResponse.redirect(new URL("/player/dashboard", request.url));
    }

    // Prevent agents from accessing player routes (they have their own portal)
    if (isPlayerRoute && userRole === "agent") {
      return NextResponse.redirect(new URL("/agent/dashboard", request.url));
    }
  }

  return supabaseResponse;
}
