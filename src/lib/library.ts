"use client";

import { apiFetch } from "@/lib/api";

/**
 * Library types — shared by /dashboard/library and the API routes.
 */

export interface LibraryAsset {
  id: string;
  kind: "video" | "image" | "copy";
  language: string;
  productCategory: string;
  titleEn: string;
  titleZh?: string | null;
  contentUrl: string;
  thumbnailUrl?: string | null;
  tags?: string[];
}

export interface LibraryScript {
  id: string;
  scenario: "cold_outreach" | "objection_handling" | "follow_up" | "intro";
  industry: "insurance" | "kol_post" | "health_content" | "general";
  language: string;
  titleEn: string;
  titleZh?: string | null;
  contentEn: string;
  contentZh?: string | null;
  followUpDay?: number | null;
}

export interface LibraryCase {
  id: string;
  treatmentCategory: string;
  hospital: string;
  country: string;
  ageRange: string;
  gender: "female" | "male" | "other" | "undisclosed";
  originCountry?: string | null;
  summaryEn: string;
  summaryZh?: string | null;
  outcomeEn: string;
  outcomeZh?: string | null;
  costRangeLowCents?: number | null;
  costRangeHighCents?: number | null;
}

export type LibraryItem =
  | ({ type: "assets" } & LibraryAsset)
  | ({ type: "scripts" } & LibraryScript)
  | ({ type: "cases" } & LibraryCase);

export async function listLibrary(
  type: "assets" | "scripts" | "cases",
  filters: Record<string, string | undefined> = {},
): Promise<LibraryItem[]> {
  const qs = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v) qs.set(k, v);
  });
  try {
    const res = await apiFetch<{ data: LibraryItem[] }>(
      `/api/affiliate/library/${type}?${qs.toString()}`,
    );
    return res.data ?? [];
  } catch {
    return [];
  }
}

export const PRODUCT_CATEGORIES = [
  "fertility",
  "oncology",
  "cardiology",
  "orthopedics",
  "neurology",
  "wellness",
  "dental",
  "cosmetic",
  "general",
] as const;

export const LANGUAGES = ["en", "zh", "ru", "es", "ar"] as const;
export const SCENARIOS = ["cold_outreach", "objection_handling", "follow_up", "intro"] as const;
export const INDUSTRIES = ["insurance", "kol_post", "health_content", "general"] as const;