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
