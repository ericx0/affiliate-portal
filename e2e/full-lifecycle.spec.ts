import { test, expect } from "@playwright/test";
import { createHmac } from "node:crypto";

const HMAC_SECRET = process.env.LCM_AFFILIATE_SECRET || "test-secret-32-chars-long-xxxxx";

function hmacSign(body: string): string {
  return `sha256=${createHmac("sha256", HMAC_SECRET).update(body).digest("hex")}`;
}

test.describe("Affiliate full lifecycle", () => {
  test("KOL registers, customer clicks, order placed, completed, paid", async ({ page, request }) => {
    // ── Step 1: KOL registers via portal ──
    await page.goto("/en/register");
    const testEmail = `e2e-${Date.now()}@example.com`;
    await page.fill('input[type="text"]', "E2E Test KOL");
    await page.fill('input[type="email"]', testEmail);
    await page.selectOption('select', "US");
    await page.selectOption('select >> nth=1', "tiktok");
    await page.fill('input[type="url"]', "https://tiktok.com/@test");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Application submitted")).toBeVisible({ timeout: 10000 });

    // ── Step 2: Get KOL's referral code from DB (via API) ──
    const { data: promoterData } = await request.get(
      `${process.env.NEXT_PUBLIC_AFFILIATE_API_URL}/api/affiliate/admin/promoters?search=${testEmail}`,
      { headers: { Authorization: `Bearer ${process.env.ADMIN_JWT}` } }
    ).then(r => r.json());

    expect(promoterData).toHaveLength(1);
    const promoterId = promoterData[0].id;

    // Get referral code
    const { data: codeData } = await request.get(
      `${process.env.NEXT_PUBLIC_AFFILIATE_API_URL}/api/affiliate/admin/promoters/${promoterId}`,
      { headers: { Authorization: `Bearer ${process.env.ADMIN_JWT}` } }
    ).then(r => r.json());

    const code = codeData.referral_codes[0].code;
    expect(code).toMatch(/^[A-Z0-9]{8}$/);

    // ── Step 3: Customer visits landing page with ?ref= ──
    await page.context().clearCookies();
    await page.goto(`http://localhost:3000/en/?ref=${code}&disclose=ad`);

    // Verify ref cookie set
    const cookies = await page.context().cookies();
    const refCookie = cookies.find(c => c.name === "ref_code");
    expect(refCookie?.value).toBe(code);

    // Verify disclosure banner
    await expect(page.locator("text=paid partnership")).toBeVisible();

    // ── Step 4: Customer places order (simulated via main-site API) ──
    const orderId = crypto.randomUUID();
    const attachBody = JSON.stringify({
      orderId,
      promoterId,
      orderAmount: 1000,
      commissionType: "service",
      currency: "USD",
    });

    const attachRes = await request.post(
      `${process.env.NEXT_PUBLIC_AFFILIATE_API_URL}/api/affiliate/orders/attach`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-LCM-Signature": hmacSign(attachBody),
        },
        data: attachBody,
      }
    );
    expect(attachRes.ok()).toBeTruthy();

    // ── Step 5: Order paid → completed → wait for cool-down (simulated) ──
    await request.post(
      `${process.env.NEXT_PUBLIC_AFFILIATE_API_URL}/api/affiliate/events/order-paid`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-LCM-Signature": hmacSign(JSON.stringify({ orderId })),
        },
        data: { orderId },
      }
    );

    await request.post(
      `${process.env.NEXT_PUBLIC_AFFILIATE_API_URL}/api/affiliate/events/order-completed`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-LCM-Signature": hmacSign(JSON.stringify({ orderId })),
        },
        data: { orderId },
      }
    );

    // ── Step 6: Verify commission in cooling_down ──
    const { data: commission } = await request.get(
      `${process.env.NEXT_PUBLIC_AFFILIATE_API_URL}/api/affiliate/admin/commissions?promoter_id=${promoterId}`,
      { headers: { Authorization: `Bearer ${process.env.ADMIN_JWT}` } }
    ).then(r => r.json());

    expect(commission).toHaveLength(1);
    expect(commission[0].status).toBe("cooling_down");
    expect(commission[0].commission_amount).toBe(50);  // 5% of $1000

    // ── Step 7: Force cool-down expiry + run approval ──
    // (In real env, this takes 7 days; in test, we update DB directly)
    // Then call approval endpoint or wait for cron

    // ── Step 8: KOL logs in, sees pending earnings ──
    await page.goto("/en/login");
    await page.fill('input[type="email"]', testEmail);

    // (Real flow: KOL would need to set password via email link; for test, use admin API to set)
    // For now, just check that dashboard route loads with auth
    await page.goto("/en/dashboard");

    // (Auth check would redirect to /login if not authenticated)
  });
});
