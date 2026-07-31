"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, Pill } from "@/components/ui/Card";
import {
  ConnectedAccount,
  PLATFORM_LABELS,
  PLATFORMS,
  Platform,
  listAccounts,
  publishNow,
  schedulePost,
} from "@/lib/social";
import {
  AlertTriangle,
  CalendarClock,
  Loader2,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

/**
 * /dashboard/publish/new — Compose + publish (or schedule) a post
 * to one or more connected platforms.
 *
 * UX:
 *   - Platform multi-select (only platforms the KOL has connected can
 *     be toggled on)
 *   - Body + media fields (media optional for text-only)
 *   - UTM params auto-attach from current referral code + the platform
 *     short code (ig / x / etc.)
 *   - Two submit modes:
 *       "Publish now"    -> POST /api/social/publish (one row per platform)
 *       "Schedule"       -> POST /api/social/schedule
 *   - AI pre-flight button (calls the same endpoint as the AI assist
 *     for a compliance sanity-check — flagged words like 'cure',
 *     'guaranteed', etc.).
 */

const FLAGGED_WORDS = [
  "guaranteed",
  "guarantee",
  "cure",
  "miracle",
  "100% safe",
  "risk-free",
  "no side effects",
];

export default function NewPublishPage() {
  const t = useTranslations("publishNew");
  const router = useRouter();

  const [accounts, setAccounts] = React.useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const [body, setBody] = React.useState("");
  const [mediaUrl, setMediaUrl] = React.useState("");
  const [mediaTitle, setMediaTitle] = React.useState("");
  const [language, setLanguage] = React.useState<"en" | "zh" | "es" | "ar" | "ru">("en");
  const [selectedPlatforms, setSelectedPlatforms] = React.useState<Platform[]>([]);
  const [scheduledAt, setScheduledAt] = React.useState<string>("");

  const [preflight, setPreflight] = React.useState<string[]>([]);

  React.useEffect(() => {
    listAccounts().then((d) => {
      setAccounts(d);
      setLoading(false);
    });
  }, []);

  const readyAccounts = accounts.filter(
    (a) => a.status === "connected" || a.status === "expiring",
  );

  function togglePlatform(p: Platform) {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  }

  function runPreflight() {
    const lower = body.toLowerCase();
    const flags = FLAGGED_WORDS.filter((w) => lower.includes(w));
    setPreflight(flags);
  }

  async function submit(action: "now" | "schedule") {
    setError(null);
    setSuccess(null);
    if (!body.trim()) {
      setError(t("errorBody"));
      return;
    }
    if (selectedPlatforms.length === 0) {
      setError(t("errorPlatforms"));
      return;
    }
    if (action === "schedule" && !scheduledAt) {
      setError(t("errorSchedule"));
      return;
    }
    setSubmitting(true);
    try {
      const results: unknown[] = [];
      for (const p of selectedPlatforms) {
        const utmParams = {
          utm_source: `kol_${p}`,
          utm_medium: "social",
          utm_content: `publish_${Date.now()}`,
        };
        const payload = {
          platform: p,
          body,
          mediaUrls: mediaUrl ? [mediaUrl] : [],
          mediaTitle: mediaTitle || undefined,
          language,
          utmParams,
        };
        const res =
          action === "now"
            ? await publishNow(payload)
            : await schedulePost({ ...payload, scheduledAt: new Date(scheduledAt).toISOString() });
        results.push(res);
      }
      setSuccess(
        action === "now"
          ? t("successPublish", { count: results.length })
          : t("successSchedule", { count: results.length }),
      );
      setTimeout(() => {
        router.push(action === "now" ? "/dashboard/publish/history" : "/dashboard/publish/scheduled");
      }, 1500);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (readyAccounts.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
        <p className="text-sm text-slate-500">{t("noAccounts")}</p>
        <a
          href="/dashboard/publish/accounts"
          className="inline-flex items-center justify-center px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600"
        >
          {t("ctaConnect")}
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
        <p className="text-sm text-slate-500 mt-1">{t("subtitle")}</p>
      </div>

      {error ? (
        <Card className="border-rose-200 bg-rose-50">
          <div className="text-sm text-rose-700">{error}</div>
        </Card>
      ) : null}
      {success ? (
        <Card className="border-emerald-200 bg-emerald-50">
          <div className="text-sm text-emerald-800">{success}</div>
        </Card>
      ) : null}

      <Card>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("bodyLabel")}
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t("bodyPlaceholder")}
              rows={6}
              maxLength={5000}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium leading-relaxed"
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-slate-400">
                {body.length}/5000
              </span>
              <button
                type="button"
                onClick={runPreflight}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-brand-600"
              >
                <Sparkles className="w-3 h-3" /> {t("preflight")}
              </button>
            </div>
            {preflight.length > 0 ? (
              <div className="mt-2 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  {t("preflightHits", { words: preflight.join(", ") })}
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("mediaLabel")}
              </label>
              <input
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("mediaTitle")}
              </label>
              <input
                value={mediaTitle}
                onChange={(e) => setMediaTitle(e.target.value)}
                placeholder={t("mediaTitlePlaceholder")}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("languageLabel")}
              </label>
              <select
                value={language}
                onChange={(e) =>
                  setLanguage(e.target.value as typeof language)
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="en">English</option>
                <option value="zh">中文</option>
                <option value="es">Español</option>
                <option value="ar">العربية</option>
                <option value="ru">Русский</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("scheduledAtLabel")}
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-3 text-sm font-semibold text-slate-700">
          {t("platformsLabel")}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PLATFORMS.map((p) => {
            const acc = accounts.find((a) => a.platform === p);
            const isReady = acc?.status === "connected" || acc?.status === "expiring";
            const selected = selectedPlatforms.includes(p);
            return (
              <button
                key={p}
                disabled={!isReady}
                onClick={() => togglePlatform(p)}
                className={
                  "p-3 rounded-xl border text-left transition-colors " +
                  (selected
                    ? "border-brand-500 bg-brand-50"
                    : "border-slate-200 bg-white hover:bg-slate-50") +
                  (!isReady ? " opacity-40 cursor-not-allowed" : "")
                }
              >
                <div className="text-xs font-semibold text-slate-900">
                  {PLATFORM_LABELS[p]}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {!acc
                    ? t("platformNotConnected")
                    : acc.status === "pending_review"
                      ? t("platformPendingReview")
                      : acc.status === "expired" || acc.status === "revoked"
                        ? t("platformReconnect")
                        : t("platformReady")}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 sticky bottom-4">
        <button
          onClick={() => submit("now")}
          disabled={submitting || selectedPlatforms.length === 0}
          className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 shadow-lg"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {t("publishNow")}
        </button>
        <button
          onClick={() => submit("schedule")}
          disabled={submitting || selectedPlatforms.length === 0 || !scheduledAt}
          className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-semibold disabled:opacity-50"
        >
          <CalendarClock className="w-4 h-4" />
          {t("schedule")}
        </button>
      </div>

      <Card className="bg-slate-50">
        <div className="flex items-start gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>{t("compliance")}</div>
        </div>
      </Card>
    </div>
  );
}
