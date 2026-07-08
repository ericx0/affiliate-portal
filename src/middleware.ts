import createMiddleware from "next-intl/middleware";
import { locales } from "@/navigation";

export default createMiddleware({
  locales,
  defaultLocale: "en",
  localePrefix: "always",
});

export const config = {
  // Match all routes except API, _next internals, _vercel, and files with extensions
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
