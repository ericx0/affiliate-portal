import { defineConfig } from "vitest/config";

// The portal's vitest config deliberately excludes `e2e/` — that's
// Playwright territory (playwright.config.ts) and trying to run
// Playwright specs through Vitest breaks because Playwright uses
// `test.describe` as a global and Vitest doesn't expose that.
export default defineConfig({
  test: {
    exclude: ["node_modules/**", ".next/**", "e2e/**"],
  },
});