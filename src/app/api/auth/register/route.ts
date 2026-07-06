import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  countryCode?: string;
  primaryPlatform?: string;
  primaryPlatformUrl?: string;
  redirectTo?: string;
}

export async function POST(req: NextRequest) {
  let body: RegisterPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_BODY", message: "Request body must be valid JSON" } },
      { status: 400 }
    );
  }

  if (!body.email || !body.password || !body.name) {
    return NextResponse.json(
      { error: { code: "MISSING_FIELDS", message: "email, password, and name are required" } },
      { status: 400 }
    );
  }

  const supabase = getServerClient();

  const { data, error } = await supabase.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: false,
    user_metadata: {
      name: body.name,
      country: body.countryCode,
      primary_platform: body.primaryPlatform,
      primary_platform_url: body.primaryPlatformUrl,
    },
  });

  if (error || !data.user) {
    return NextResponse.json(
      {
        error: {
          code: "AUTH_FAILED",
          message: error?.message ?? "Failed to create auth user",
        },
      },
      { status: 400 }
    );
  }

  const affiliateApiUrl = process.env.NEXT_PUBLIC_AFFILIATE_API_URL;
  if (affiliateApiUrl) {
    try {
      const promoterRes = await fetch(`${affiliateApiUrl}/api/affiliate/promoters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authUserId: data.user.id,
          name: body.name,
          email: body.email,
          countryCode: body.countryCode,
          primaryPlatform: body.primaryPlatform,
          primaryPlatformUrl: body.primaryPlatformUrl,
        }),
      });

      if (!promoterRes.ok) {
        const errData = await promoterRes.json().catch(() => ({}));
        return NextResponse.json(
          {
            error: {
              code: "PROMOTER_CREATE_FAILED",
              message: errData.error?.message ?? "Failed to create promoter record",
              authUserId: data.user.id,
            },
          },
          { status: 502 }
        );
      }

      const promoterData = await promoterRes.json();
      return NextResponse.json(
        {
          user: { id: data.user.id, email: data.user.email },
          promoter: promoterData.promoter,
          referralCode: promoterData.code,
        },
        { status: 201 }
      );
    } catch (e: any) {
      return NextResponse.json(
        {
          error: {
            code: "PROMOTER_SERVICE_ERROR",
            message: e?.message ?? "Affiliate service unreachable",
            authUserId: data.user.id,
          },
        },
        { status: 502 }
      );
    }
  }

  return NextResponse.json(
    { user: { id: data.user.id, email: data.user.email } },
    { status: 201 }
  );
}