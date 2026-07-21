// Fail the production build if required public env vars are missing.
// Dev/test is skipped so a fresh checkout without .env still runs (the
// pages fall back to Cloudflare's test sitekey). Production MUST set these
// explicitly: a missing NEXT_PUBLIC_TURNSTILE_SITE_KEY would silently render
// the Turnstile widget with an empty sitekey and break registration with no
// build-time signal (audit 2026-07-20, L166).
const REQUIRED_PROD_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
];
if (process.env.NODE_ENV === "production") {
  const missing = REQUIRED_PROD_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `[affiliate-portal] Refusing production build: missing required env: ${missing.join(", ")}`,
    );
  }
}

const createNextIntlPlugin = require("next-intl/plugin");
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Exclude dev-only mock pages from the production build. /dev/stripe-mock
  // has its own runtime notFound() guard but lacks a root layout required
  // by Next 14, so we route any /dev/* path to 404 at the framework level.
  async redirects() {
    return [
      { source: "/", destination: "/en", permanent: false },
      { source: "/dev/:path*", destination: "/en/404", permanent: false },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
