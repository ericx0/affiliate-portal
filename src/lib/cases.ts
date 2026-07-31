"use client";

import { apiFetch } from "@/lib/api";

/**
 * Case-library + AI rewrite client (T2).
 */

export interface CaseRow {
  id: string;
  treatmentCategory: string;
  hospital: string;
  country: string;
  ageRange: string;
  gender: "female" | "male" | "other" | "undisclosed";
  originCountry: string | null;
  summaryEn: string;
  summaryZh: string | null;
  outcomeEn: string;
  outcomeZh: string | null;
  anonymizedData: Record<string, unknown>;
  costRangeLowCents: number | null;
  costRangeHighCents: number | null;
  updatedAt: string;
}

export interface RewriteVariant {
  length: "short" | "medium" | "long";
  body: string;
  hashtags?: string[];
}

export async function fetchCase(id: string): Promise<CaseRow | null> {
  try {
    const res = await apiFetch<{ data: CaseRow }>(`/api/affiliate/cases/${id}`);
    return res.data;
  } catch {
    return null;
  }
}

export async function rewriteCase(
  id: string,
  opts: {
    platform: "ig" | "tiktok" | "fb" | "youtube" | "linkedin" | "x" | "email" | "dm";
    audience: "general" | "patient_us" | "patient_eu" | "patient_ru" | "patient_kr" | "patient_br" | "agent_b2b";
    language: "en" | "zh" | "es" | "ar" | "ru";
    tone: "warm" | "factual" | "urgent";
  },
): Promise<RewriteVariant[]> {
  const res = await apiFetch<{ data: RewriteVariant[] }>(
    `/api/affiliate/cases/${id}/rewrite`,
    { method: "POST", body: opts },
  );
  return res.data ?? [];
}
