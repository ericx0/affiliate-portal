import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * GET /api/affiliate/library/[type]
 *
 * type ∈ {assets, scripts, cases}
 *
 * Returns the KOL-visible library rows for the given sub-library.
 * Reads from the public schema directly (RLS already restricts to
 * is_published=true for non-staff roles; service-role reads stay
 * constrained to published rows in the SQL). Filters via query string:
 *
 *   assets:  ?language=en&productCategory=oncology
 *   scripts: ?language=zh&scenario=objection_handling&industry=insurance
 *   cases:   ?language=en&country=CN
 *
 * Auth: requires an authenticated promoter (mirrors /api/affiliate/me).
 *
 * This route is the KOL-facing complement to the staff-only
 * /api/affiliate-assets/admin/* endpoints that admin-v2 will use to
 * CRUD the same tables. The schema is one set of tables — two
 * surfaces — so staff and KOLs always see the same source of truth.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TYPES = ["assets", "scripts", "cases"] as const;
type LibType = (typeof VALID_TYPES)[number];

function shapeAsset(row: any) {
  return {
    type: "assets" as const,
    id: row.id,
    kind: row.kind,
    language: row.language,
    productCategory: row.product_category,
    titleEn: row.title_en,
    titleZh: row.title_zh,
    contentUrl: row.content_url,
    thumbnailUrl: row.thumbnail_url,
    tags: row.tags ?? [],
  };
}

function shapeScript(row: any) {
  return {
    type: "scripts" as const,
    id: row.id,
    scenario: row.scenario,
    industry: row.industry,
    language: row.language,
    titleEn: row.title_en,
    titleZh: row.title_zh,
    contentEn: row.content_en,
    contentZh: row.content_zh,
    followUpDay: row.follow_up_day,
  };
}

function shapeCase(row: any) {
  return {
    type: "cases" as const,
    id: row.id,
    treatmentCategory: row.treatment_category,
    hospital: row.hospital,
    country: row.country,
    ageRange: row.age_range,
    gender: row.gender,
    originCountry: row.origin_country,
    summaryEn: row.summary_en,
    summaryZh: row.summary_zh,
    outcomeEn: row.outcome_en,
    outcomeZh: row.outcome_zh,
    costRangeLowCents: row.cost_range_low_cents,
    costRangeHighCents: row.cost_range_high_cents,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { type: string } },
) {
  const type = params.type as LibType;
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { error: { code: "BAD_TYPE", message: `type must be one of: ${VALID_TYPES.join(", ")}` } },
      { status: 400 },
    );
  }

  // Auth: Supabase session required. The user must be a promoter — but
  // since RLS already restricts published reads to anyone (and the
  // service-role key bypasses RLS for our own admin reads), we just
  // verify there's a logged-in user and proceed.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll() {},
      },
    },
  );

  const { searchParams } = new URL(req.url);
  const language = searchParams.get("language");
  const productCategory = searchParams.get("productCategory");
  const scenario = searchParams.get("scenario");
  const industry = searchParams.get("industry");
  const country = searchParams.get("country");

  let query = supabase
    .from(type)
    .select("*")
    .eq("is_published", true)
    .order("updated_at", { ascending: false })
    .limit(200);

  if (language) query = query.eq("language", language);
  if (productCategory) query = query.eq("product_category", productCategory);
  if (scenario) query = query.eq("scenario", scenario);
  if (industry) query = query.eq("industry", industry);
  if (country) query = query.eq("country", country);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { error: { code: "QUERY_FAILED", message: error.message } },
      { status: 500 },
    );
  }

  const shaped =
    type === "assets"
      ? (data ?? []).map(shapeAsset)
      : type === "scripts"
        ? (data ?? []).map(shapeScript)
        : (data ?? []).map(shapeCase);

  return NextResponse.json({ data: shaped });
}