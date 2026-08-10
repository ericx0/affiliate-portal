import createMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { locales } from "@/navigation";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: "en",
  localePrefix: "always",
});

// Protected area: /<locale>/kol[/...] (agent/* paths redirect to agent.linkchinamed.com,
// so they are intentionally NOT protected here — the new domain handles its own auth).
// Built from the locales list so every locale (en/zh/ar/ru/es) is guarded.
const PROTECTED = new RegExp(
  `^/(${locales.join("|")})/kol(?:/|$)`,
);

export async function middleware(request: NextRequest) {
  const response = intlMiddleware(request);

  // Bind a Supabase server client to the request/response cookies so the
  // session is refreshed and readable at the edge (no client-side flash).
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }[],
        ) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  if (PROTECTED.test(pathname) && !user) {
    const locale = pathname.split("/")[1] || "en";
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  // Match all routes except API, _next internals, _vercel, and files with extensions
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
