"use client";

import { apiFetch } from "@/lib/api";

/**
 * Social publishing types + API wrappers for the KOL "Content
 * Publishing" toolbox (T1).
 *
 * The 6 supported platforms share the same status vocabulary:
 *   not_connected — no social_accounts row
 *   pending_review — platform app not yet approved (env flag off)
 *   connected     — OAuth handshake complete, token valid
 *   expiring      — token expires in < 24h (refresh scheduled)
 *   expired       — refresh failed; re-authorise required
 *   revoked       — platform-side disconnect
 */

export type Platform =
  | "ig"
  | "tiktok"
  | "fb"
  | "youtube"
  | "linkedin"
  | "x";

export const PLATFORMS: Platform[] = [
  "ig",
  "tiktok",
  "fb",
  "youtube",
  "linkedin",
  "x",
];

export const PLATFORM_LABELS: Record<Platform, string> = {
  ig: "Instagram",
  tiktok: "TikTok",
  fb: "Facebook",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  x: "X (Twitter)",
};

export const PLATFORM_LOGOS: Record<Platform, string> = {
  ig: "IG",
  tiktok: "TT",
  fb: "FB",
  youtube: "YT",
  linkedin: "LI",
  x: "X",
};

export type AccountStatus =
  | "not_connected"
  | "pending_review"
  | "connected"
  | "expiring"
  | "expired"
  | "revoked";

export interface ConnectedAccount {
  platform: Platform;
  status: AccountStatus;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  scopes: string[];
  connectedAt: string | null;
  expiresAt: string | null;
}

export async function listAccounts(): Promise<ConnectedAccount[]> {
  try {
    const res = await apiFetch<{ data: ConnectedAccount[] }>("/api/social/accounts");
    return res.data ?? [];
  } catch {
    return [];
  }
}

export async function startOAuth(platform: Platform): Promise<string> {
  const res = await apiFetch<{ data: { authUrl: string } }>(
    `/api/social/oauth/${platform}/start`,
  );
  return res.data.authUrl;
}

export async function disconnectPlatform(platform: Platform): Promise<void> {
  await apiFetch(`/api/social/accounts/${platform}`, { method: "DELETE" });
}

export interface PublishInput {
  platform: Platform;
  body: string;
  mediaUrls?: string[];
  mediaTitle?: string;
  language?: "en" | "zh" | "es" | "ar" | "ru";
  utmParams?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
  };
}

export interface PublishResult {
  id: string;
  externalPostId: string;
  externalUrl: string | null;
  status: string;
}

export async function publishNow(input: PublishInput): Promise<PublishResult> {
  const res = await apiFetch<{ data: PublishResult }>("/api/social/publish", {
    method: "POST",
    body: input,
  });
  return res.data;
}

export async function schedulePost(input: PublishInput & { scheduledAt: string }): Promise<unknown> {
  const res = await apiFetch<{ data: unknown }>("/api/social/schedule", {
    method: "POST",
    body: input,
  });
  return res.data;
}

export interface HistoryRow {
  id: string;
  platform: Platform;
  status: "pending" | "scheduled" | "publishing" | "published" | "failed";
  scheduledAt: string | null;
  publishedAt: string | null;
  bodyPreview: string;
  mediaCount: number;
  externalPostId: string | null;
  externalUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
  language: string | null;
  metrics: Record<string, number> | null;
  utmParams: Record<string, string> | null;
}

export interface HistoryFilters {
  platform?: Platform;
  status?: HistoryRow["status"];
  from?: string;
  to?: string;
  limit?: number;
}

export async function listHistory(filters: HistoryFilters = {}): Promise<HistoryRow[]> {
  const qs = new URLSearchParams();
  if (filters.platform) qs.set("platform", filters.platform);
  if (filters.status) qs.set("status", filters.status);
  if (filters.from) qs.set("from", filters.from);
  if (filters.to) qs.set("to", filters.to);
  if (filters.limit) qs.set("limit", String(filters.limit));
  try {
    const res = await apiFetch<{ data: HistoryRow[] }>(
      `/api/social/history?${qs.toString()}`,
    );
    return res.data ?? [];
  } catch {
    return [];
  }
}

export async function refreshMetrics(postId: string): Promise<Record<string, number>> {
  const res = await apiFetch<{ data: { metrics: Record<string, number> } }>(
    "/api/social/refresh-metrics",
    { method: "POST", body: { postId } },
  );
  return res.data.metrics;
}
