import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { lucia } from "./lib/auth";
import { cookies } from "next/headers";

const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/api/auth/login",
  "/api/auth/register",
  "/api/csrf",
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

  // Validate session and check if user is active
  if (!isPublicRoute && sessionCookie) {
    try {
      const { session, user } = await lucia.validateSession(sessionCookie);

      // Check if session is invalid or user is inactive
      if (!session || !user || !user.isActive) {
        // Clear invalid session
        const response = NextResponse.redirect(new URL("/login", req.url));
        response.cookies.set("auth_session", "", {
          maxAge: 0,
          path: "/",
        });
        return response;
      }
    } catch (error) {
      // Session validation failed, redirect to login
      const response = NextResponse.redirect(new URL("/login", req.url));
      response.cookies.set("auth_session", "", {
        maxAge: 0,
        path: "/",
      });
      return response;
    }
  }

  // Redirect to dashboard if authenticated and accessing auth pages
  if (isPublicRoute && sessionCookie && pathname !== "/api/auth/logout") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|static|favicon.ico).*)"],
};