import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/api/auth/login",
  "/api/auth/register",
  "/api/csrf",
  "/api/restore-db",
  "/api/migrate-notes",
  "/api/debug/notes",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Check for session cookie
  const sessionCookie = req.cookies.get("auth_session")?.value;

  // Redirect to login if not authenticated and accessing protected route
  if (!isPublicRoute && !sessionCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Redirect to dashboard if authenticated and accessing auth pages
  const API_EXCEPTIONS = [
    "/api/auth/logout",
    "/api/restore-db",
    "/api/migrate-notes",
    "/api/csrf",
    "/api/debug/notes"
  ];

  if (isPublicRoute && sessionCookie && !API_EXCEPTIONS.includes(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|static|favicon.ico).*)"],
};