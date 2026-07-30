"use client";

import { apiFetch } from "@/lib/api";

/**
 * Types & helpers shared by the KOL client-management surfaces.
 *
 * The /api/affiliate/clients/* endpoints are designed to be best-effort:
 * if the backend isn't deployed yet, every helper returns a sensible
 * empty/default and the UI degrades to empty-state copy. The portal
 * must not break a KOL's existing flow while the new backend ships.
 */

export interface KolClient {
  id: string;
  displayName: string;
  contactChannel?: string | null;
  contactHandle?: string | null;
  ageRange?: string | null;
  countryCode?: string | null;
  healthConcerns?: string[];
  familyHistory?: string | null;
  budgetBracket?: string | null;
  status: "lead" | "engaged" | "qualified" | "converted" | "inactive";
  lastContactAt?: string | null;
  nextFollowUpAt?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface FollowupTask {
  id: string;
  clientId: string;
  day: number;
  taskType: string;
  dueAt: string;
  completedAt?: string | null;
  suggestedScriptId?: string | null;
}

export interface ContactLogEntry {
  id: string;
  clientId: string;
  channel: string;
  direction: "outbound" | "inbound";
  summary: string;
  occurredAt: string;
}

export async function listClients(): Promise<KolClient[]> {
  try {
    const res = await apiFetch<{ data: KolClient[] }>("/api/affiliate/clients");
    return res.data ?? [];
  } catch {
    return [];
  }
}

export async function getClient(id: string): Promise<{
  client: KolClient | null;
  tasks: FollowupTask[];
  contacts: ContactLogEntry[];
}> {
  try {
    const res = await apiFetch<{
      data: { client: KolClient; tasks: FollowupTask[]; contacts: ContactLogEntry[] };
    }>(`/api/affiliate/clients/${id}`);
    return res.data;
  } catch {
    return { client: null, tasks: [], contacts: [] };
  }
}

export async function createClient(payload: Partial<KolClient>): Promise<KolClient | null> {
  try {
    const res = await apiFetch<{ data: KolClient }>("/api/affiliate/clients", {
      method: "POST",
      body: payload,
    });
    return res.data;
  } catch {
    return null;
  }
}

export async function logContact(
  clientId: string,
  payload: { channel: string; direction: "outbound" | "inbound"; summary: string },
): Promise<ContactLogEntry | null> {
  try {
    const res = await apiFetch<{ data: ContactLogEntry }>(
      `/api/affiliate/clients/${clientId}/contacts`,
      { method: "POST", body: payload },
    );
    return res.data;
  } catch {
    return null;
  }
}

export async function completeTask(taskId: string): Promise<boolean> {
  try {
    await apiFetch(`/api/affiliate/tasks/${taskId}/complete`, { method: "POST" });
    return true;
  } catch {
    return false;
  }
}

export const AGE_RANGES = ["0-17", "18-29", "30-44", "45-59", "60-74", "75+"] as const;
export const BUDGET_BUCKETS = [
  "under_10k",
  "10k_25k",
  "25k_50k",
  "50k_100k",
  "over_100k",
] as const;
export const HEALTH_CONCERNS = [
  "oncology",
  "cardiology",
  "fertility",
  "orthopedics",
  "neurology",
  "wellness",
  "dental",
  "cosmetic",
  "general",
] as const;