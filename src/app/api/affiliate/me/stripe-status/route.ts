import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
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
      return NextResponse.json({
        data: {
          connected: false,
          accountId: null,
          payoutsEnabled: false,
        },
      });
    }

    const isConnected = !!promoter.stripe_account_id || promoter.stripe_onboarding_completed === true;

    return NextResponse.json({
      data: {
        connected: isConnected,
        accountId: promoter.stripe_account_id || null,
        payoutsEnabled: promoter.stripe_onboarding_completed === true || isConnected,
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      data: {
        connected: false,
        accountId: null,
        payoutsEnabled: false,
      },
    });
  }
}
