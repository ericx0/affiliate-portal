import { test, expect } from "@playwright/test";

/**
 * Login pre-check E2E (Task 6).
 *
 * Covers the three Phase 1 flows introduced by the pre-check:
 *   1. Existing KOL email → OTP step appears (no error).
 *   2. Unregistered email → "未找到此邮箱对应的 KOL 账号" error, no OTP step.
 *   3. Existing Agent email → "此邮箱已注册为 Agent" error, no OTP step.
 *
 * Turnstile auto-passes via the dev fallback sitekey
 * (`1x00000000000000000000AA`); tests must run against a non-production
 * server, which is what `playwright.config.ts` `webServer` provides.
 *
 * The KOL/Agent happy-path emails must exist in the DB the portal talks
 * to. The unregistered test uses a `Date.now()`-suffixed random email so
 * it never collides with DB state.
 */

test.describe("affiliate login pre-check", () => {
  test("KOL email happy path: existing KOL receives OTP", async ({ page }) => {
    await page.goto("/zh/login");
    await page.fill('input[type="email"]', "kol-test@linkchinamed.com");
    await page.click('button[type="submit"]');

    // OTP step renders the 6-digit code input (placeholder is "000000"
    // in every locale — see src/i18n/messages/*.json codePlaceholder).
    await expect(
      page.locator('input[placeholder="000000"]'),
    ).toBeVisible({ timeout: 10_000 });

    await expect(page.getByText(/验证码已发送至/)).toBeVisible();
  });

  test("unregistered email shows error, no OTP sent", async ({ page }) => {
    await page.goto("/zh/login");
    await page.fill(
      'input[type="email"]',
      `nobody-${Date.now()}@test.com`,
    );
    await page.click('button[type="submit"]');

    await expect(
      page.getByText(/未找到此邮箱对应的 KOL 账号/),
    ).toBeVisible({ timeout: 10_000 });

    // Must NOT have transitioned to the OTP step.
    await expect(
      page.locator('input[placeholder="000000"]'),
    ).toHaveCount(0);
  });

  test("email registered as Agent shows cross-role error, no OTP", async ({ page }) => {
    await page.goto("/zh/login");
    await page.fill('input[type="email"]', "agent-test@linkchinamed.com");
    await page.click('button[type="submit"]');

    await expect(
      page.getByText(/此邮箱已注册为 Agent/),
    ).toBeVisible({ timeout: 10_000 });

    await expect(
      page.locator('input[placeholder="000000"]'),
    ).toHaveCount(0);
  });
});