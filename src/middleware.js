import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-middleware";

const roleHome = {
  admin: "/admin/dashboard",
  staff: "/staff/dashboard",
  patient: "/patient/dashboard",
};

const publicPaths = ["/", "/login", "/favicon.ico"];

function isPublicPath(pathname) {
  return publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function getRequiredRoleForPath(pathname) {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/staff")) return "staff";
  if (pathname.startsWith("/patient")) return "patient";
  return null;
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // PWA + static assets must not be redirected to /login (would break SW/manifest/icons).
  if (
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname.startsWith("/icons/") ||
    /^\/workbox-[^/]+\.js(\.map)?$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(request);

  const isAuthRoute = pathname === "/login";
  const requiredRole = getRequiredRoleForPath(pathname);

  // If user is logged in and hits login page, bounce to their dashboard
  if (isAuthRoute && session?.role) {
    const redirectTo =
      roleHome[session.role] || "/";
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  // Public routes are always allowed
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Everything else requires authentication
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If route has a required role, enforce it (admin routes allow both admin and staff)
  if (requiredRole) {
    if (requiredRole === "admin" && (session.role === "admin" || session.role === "staff")) {
      return NextResponse.next();
    }
    if (session.role !== requiredRole) {
      const redirectTo = roleHome[session.role] || "/";
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|icons/|workbox-|images|api/health).*)",
  ],
};

