import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let email = user?.email?.toLowerCase();
    if (!email) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const { data: jwtUser } = await supabase.auth.getUser(token);
        email = jwtUser?.user?.email?.toLowerCase();
      }
    }

    if (!email) {
      return NextResponse.json({ error: { message: "未登录" } }, { status: 401 });
    }

    const { data: promoters } = await supabase.rpc("affiliate_list_promoters", {
      p_search: email,
    });
    const promoter = Array.isArray(promoters)
      ? promoters.find((p: any) => p.email?.toLowerCase() === email)
      : null;

    if (!promoter) {
      return NextResponse.json({ error: { message: "未找到推广者信息" } }, { status: 404 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const isLive = stripeKey && !stripeKey.startsWith("PLACEHOLDER") && !stripeKey.includes("placeholder");

    if (!isLive) {
      const mockAccountId = promoter.stripe_account_id || `acct_mock_${promoter.id.slice(0, 8)}`;
      return NextResponse.json({
        data: {
          url: `/dev/stripe-mock?account=${mockAccountId}&return=${encodeURIComponent("/zh/kol/dashboard/settings/stripe")}`,
          mode: "dev-mock",
          accountId: mockAccountId,
        },
      });
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" as any });

    let accountId = promoter.stripe_account_id;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: promoter.country_code || "US",
        email: promoter.email,
        capabilities: {
          transfers: { requested: true },
        },
        business_type: "individual",
        metadata: {
          promoter_id: promoter.id,
          role: promoter.role || "kol",
        },
      });
      accountId = account.id;
    }

    const origin = req.nextUrl.origin || "https://affiliate.linkchinamed.com";
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/zh/kol/dashboard/settings/stripe`,
      return_url: `${origin}/zh/kol/dashboard/settings/stripe?status=success`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      data: {
        url: accountLink.url,
        mode: "live",
        accountId,
      },
    });
  } catch (err: any) {
    console.error("stripe-connect error:", err);
    return NextResponse.json(
      { error: { message: err?.message || "Stripe Connect 连接失败" } },
      { status: 500 }
    );
  }
}
