import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { routing } from "@/i18n/routing";
import { supabaseAnonKey, supabaseConfigured, supabaseUrl } from "@/lib/supabase/env";
import { sessionCookieOptions } from "@/lib/supabase/cookies";

const intlMiddleware = createIntlMiddleware(routing);
const isDev = process.env.NODE_ENV !== "production";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "frame-src 'none'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

/** Admin pages are not localized. Here we only keep the Supabase session
 * fresh and bounce signed-out visitors to the login page early. This is a
 * convenience, not the security boundary: every admin page and Server Action
 * re-checks the user and the admins table itself. */
async function adminProxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const isLogin = request.nextUrl.pathname === "/admin/login";

  if (!supabaseConfigured) {
    return isLogin ? response : NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: sessionCookieOptions,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isLogin) {
    const redirect = NextResponse.redirect(new URL("/admin/login", request.url));
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  return response;
}

export default async function proxy(request: NextRequest) {
  const isAdmin = request.nextUrl.pathname === "/admin" || request.nextUrl.pathname.startsWith("/admin/");
  const response = isAdmin ? await adminProxy(request) : intlMiddleware(request);
  response.headers.set("Content-Security-Policy", csp);
  if (isAdmin) {
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next|_vercel|favicon.ico|logo.jpg|.*\\..*).*)",
  ],
};
