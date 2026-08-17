import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

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

    const body = await req.json().catch(() => ({}));
    const accountId = body.accountId;

    const { data: promoters } = await supabase.rpc("affiliate_list_promoters", {
      p_search: email,
    });
    const promoter = Array.isArray(promoters)
      ? promoters.find((p: any) => p.email?.toLowerCase() === email)
      : null;

    if (!promoter) {
      return NextResponse.json({ error: { message: "未找到推广者信息" } }, { status: 404 });
    }

    const affClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { db: { schema: "affiliate" } }
    );

    const targetAccountId = accountId || promoter.stripe_account_id || `acct_mock_${promoter.id.slice(0, 8)}`;

    const { error: updateErr } = await affClient
      .from("promoters")
      .update({
        stripe_account_id: targetAccountId,
        stripe_onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", promoter.id);

    if (updateErr) {
      console.warn("affiliate schema update fallback:", updateErr);
    }

    return NextResponse.json({
      success: true,
      accountId: targetAccountId,
    });
  } catch (err: any) {
    return NextResponse.json({ error: { message: err?.message || "Internal error" } }, { status: 500 });
  }
}
