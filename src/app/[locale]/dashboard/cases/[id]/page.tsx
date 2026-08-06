"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, Pill } from "@/components/ui/Card";
import { CaseRow, RewriteVariant, fetchCase, rewriteCase } from "@/lib/cases";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCopy,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useFormat } from "@/lib/format";

/**
 * /dashboard/cases/[id] — Single-case detail + AI rewrite panel.
 *
 * The case is loaded from /api/affiliate/cases/:id (published-only,
 * service-role read). The "AI rewrite for my platform" button opens
 * a side panel where the KOL picks platform / audience / language /
 * tone and clicks Generate — the backend returns 3 length variants
 * which the KOL can copy to clipboard.
 */

export default function CaseDetailPage() {
  const t = useTranslations("caseDetail");
  const fmt = useFormat();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const [caseRow, setCaseRow] = React.useState<CaseRow | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [showRewrite, setShowRewrite] = React.useState(false);
  const [platform, setPlatform] = React.useState<"ig" | "tiktok" | "fb" | "youtube" | "linkedin" | "x" | "email" | "dm">("ig");
  const [audience, setAudience] = React.useState<"general" | "patient_us" | "patient_eu" | "patient_ru" | "patient_kr" | "patient_br" | "agent_b2b">("general");
  const [language, setLanguage] = React.useState<"en" | "zh" | "es" | "ar" | "ru">("en");
  const [tone, setTone] = React.useState<"warm" | "factual" | "urgent">("warm");
  const [generating, setGenerating] = React.useState(false);
  const [variants, setVariants] = React.useState<RewriteVariant[]>([]);
  const [generateError, setGenerateError] = React.useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!id) return;
    fetchCase(id).then((c) => {
      if (!c) setError(t("notFound"));
      else setCaseRow(c);
      setLoading(false);
    });
  }, [id, t]);

  async function handleGenerate() {
    setGenerating(true);
    setGenerateError(null);
    setVariants([]);
    try {
      const out = await rewriteCase(id, { platform, audience, language, tone });
      setVariants(out);
    } catch (e: any) {
      const code = (e as { code?: string }).code;
      if (code === "AI_NOT_READY") setGenerateError(t("errorNotReady"));
      else setGenerateError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error || !caseRow) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-slate-500">{error ?? t("notFound")}</p>
        <Link href="/dashboard/library" className="text-brand-600 text-sm mt-3 inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          {t("back")}
        </Link>
      </div>
    );
  }

  const cost =
    caseRow.costRangeLowCents && caseRow.costRangeHighCents
      ? `${fmt.currency(caseRow.costRangeLowCents)} – ${fmt.currency(caseRow.costRangeHighCents)}`
      : null;

  return (
    <div className="space-y-6 pb-16 max-w-4xl">
      <Link
        href="/dashboard/library"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("back")}
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        <Pill tone="blue">{caseRow.treatmentCategory}</Pill>
        <Pill tone="slate">{caseRow.country}</Pill>
        <Pill tone="emerald">{caseRow.ageRange}</Pill>
        <Pill tone="amber">{caseRow.gender}</Pill>
        {caseRow.originCountry ? <Pill tone="slate">{caseRow.originCountry}</Pill> : null}
        {cost ? <Pill tone="emerald">{cost}</Pill> : null}
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">{caseRow.hospital}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            {t("summaryLabel")}
          </div>
          <p className="mt-2 text-sm text-slate-700 leading-relaxed">{caseRow.summaryEn}</p>
          {caseRow.summaryZh ? (
            <p className="mt-3 text-sm text-slate-500 leading-relaxed italic">
              {caseRow.summaryZh}
            </p>
          ) : null}
        </Card>
        <Card>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            {t("outcomeLabel")}
          </div>
          <p className="mt-2 text-sm text-slate-700 leading-relaxed">{caseRow.outcomeEn}</p>
          {caseRow.outcomeZh ? (
            <p className="mt-3 text-sm text-slate-500 leading-relaxed italic">
              {caseRow.outcomeZh}
            </p>
          ) : null}
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-brand-50 to-blue-50 border-brand-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white text-brand-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="text-base font-bold text-slate-900">{t("rewritePanelTitle")}</div>
            <p className="text-xs text-slate-500 mt-1">{t("rewritePanelDesc")}</p>
            {!showRewrite ? (
              <button
                onClick={() => setShowRewrite(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold"
              >
                <Sparkles className="w-4 h-4" />
                {t("rewriteButton")}
              </button>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label={t("platformLabel")}>
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value as typeof platform)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                    >
                      <option value="ig">Instagram</option>
                      <option value="tiktok">TikTok</option>
                      <option value="fb">Facebook</option>
                      <option value="youtube">YouTube</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="x">X (Twitter)</option>
                      <option value="email">Email</option>
                      <option value="dm">DM</option>
                    </select>
                  </Field>
                  <Field label={t("audienceLabel")}>
                    <select
                      value={audience}
                      onChange={(e) => setAudience(e.target.value as typeof audience)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                    >
                      <option value="general">{t("audienceGeneral")}</option>
                      <option value="patient_us">{t("audiencePatientUs")}</option>
                      <option value="patient_eu">{t("audiencePatientEu")}</option>
                      <option value="patient_ru">{t("audiencePatientRu")}</option>
                      <option value="patient_kr">{t("audiencePatientKr")}</option>
                      <option value="patient_br">{t("audiencePatientBr")}</option>
                      <option value="agent_b2b">{t("audienceAgentB2b")}</option>
                    </select>
                  </Field>
                  <Field label={t("languageLabel")}>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as typeof language)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                    >
                      <option value="en">English</option>
                      <option value="zh">中文</option>
                      <option value="es">Español</option>
                      <option value="ar">العربية</option>
                      <option value="ru">Русский</option>
                    </select>
                  </Field>
                  <Field label={t("toneLabel")}>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value as typeof tone)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                    >
                      <option value="warm">{t("toneWarm")}</option>
                      <option value="factual">{t("toneFactual")}</option>
                      <option value="urgent">{t("toneUrgent")}</option>
                    </select>
                  </Field>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                >
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {generating ? t("generating") : t("generate")}
                </button>

                {generateError ? (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800">{generateError}</div>
                  </div>
                ) : null}

                {variants.length > 0 ? (
                  <div className="space-y-3">
                    {variants.map((v, i) => (
                      <VariantCard
                        key={i}
                        variant={v}
                        labelKey={
                          v.length === "short"
                            ? t("shortLabel")
                            : v.length === "long"
                              ? t("longLabel")
                              : t("mediumLabel")
                        }
                        copied={copiedIdx === i}
                        onCopy={() => {
                          navigator.clipboard.writeText(v.body);
                          setCopiedIdx(i);
                          setTimeout(() => setCopiedIdx(null), 1500);
                        }}
                        copyLabel={t("copyVariant")}
                        copiedLabel={t("copied")}
                      />
                    ))}
                  </div>
                ) : null}

                <div className="flex items-start gap-2 p-3 bg-white border border-slate-200 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-500">{t("compliance")}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-600 mb-1">{label}</span>
      {children}
    </label>
  );
}

function VariantCard({
  variant,
  labelKey,
  copied,
  onCopy,
  copyLabel,
  copiedLabel,
}: {
  variant: RewriteVariant;
  labelKey: string;
  copied: boolean;
  onCopy: () => void;
  copyLabel: string;
  copiedLabel: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {labelKey}
        </span>
        <button
          onClick={onCopy}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded"
        >
          {copied ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {copiedLabel}
            </>
          ) : (
            <>
              <ClipboardCopy className="w-3.5 h-3.5" /> {copyLabel}
            </>
          )}
        </button>
      </div>
      <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{variant.body}</p>
      {variant.hashtags?.length ? (
        <div className="mt-2 text-xs text-slate-400">{variant.hashtags.map((h) => `#${h}`).join(" ")}</div>
      ) : null}
    </div>
  );
}
