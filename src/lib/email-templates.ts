"use client";

import { apiFetch } from "@/lib/api";

/**
 * Email / DM templates client (T3).
 */

export type TemplateCategory = "dm_invite" | "follow_up" | "service_pitch" | "case_share";
export type TemplateLanguage = "en" | "zh" | "es" | "ar" | "ru";

export interface EmailTemplate {
  id: string;
  category: TemplateCategory;
  language: TemplateLanguage;
  title: string;
  subject: string;
  body: string;
  variant: string | null;
  updatedAt: string;
}

export async function listTemplates(filters: {
  category?: TemplateCategory;
  language?: TemplateLanguage;
} = {}): Promise<EmailTemplate[]> {
  const qs = new URLSearchParams();
  if (filters.category) qs.set("category", filters.category);
  if (filters.language) qs.set("language", filters.language);
  try {
    const res = await apiFetch<{ data: EmailTemplate[] }>(
      `/api/affiliate/email-templates?${qs.toString()}`,
    );
    return res.data ?? [];
  } catch {
    return [];
  }
}

export async function renderTemplate(
  id: string,
  variables: Record<string, string>,
): Promise<{ subject: string; body: string }> {
  const res = await apiFetch<{ data: { subject: string; body: string } }>(
    `/api/affiliate/email-templates/${id}/render`,
    { method: "POST", body: { variables } },
  );
  return res.data;
}

export async function sendTemplate(
  id: string,
  to: string,
  variables: Record<string, string>,
): Promise<{ subject: string }> {
  const res = await apiFetch<{ data: { subject: string } }>(
    `/api/affiliate/email-templates/${id}/send`,
    { method: "POST", body: { to, variables } },
  );
  return res.data;
}
