"use client";

import { apiFetch } from "@/lib/api";

/**
 * Funnel dashboard client (T4). Aggregates clicks/sign-ups/orders by
 * platform + daily trend + published-post engagement.
 */

export interface FunnelData {
  window: { from: string; to: string; days: number };
  summary: {
    clicks: number;
    signUps: number;
    orders: number;
    conversionRate: number;
    commissionCents: number;
  };
  byPlatform: Array<{
    platform: string;
    clicks: number;
    signUps: number;
    orders: number;
    commissionCents: number;
    conversionRate: number;
  }>;
  daily: Array<{ date: string; clicks: number; signUps: number; orders: number }>;
  engagement: {
    likes: number;
    shares: number;
    comments: number;
    impressions: number;
    posts: number;
  };
}

export async function fetchFunnel(range: { from?: string; to?: string } = {}): Promise<FunnelData | null> {
  const qs = new URLSearchParams();
  if (range.from) qs.set("from", range.from);
  if (range.to) qs.set("to", range.to);
  try {
    const res = await apiFetch<{ data: FunnelData }>(`/api/affiliate/funnel?${qs.toString()}`);
    return res.data;
  } catch {
    return null;
  }
}
