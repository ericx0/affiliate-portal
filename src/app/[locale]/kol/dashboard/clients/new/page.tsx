"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, SectionTitle, Pill } from "@/components/ui/Card";
import {
  AGE_RANGES,
  BUDGET_BUCKETS,
  HEALTH_CONCERNS,
  createClient,
} from "@/lib/clients";
import { ArrowLeft, CheckCircle2, Loader2, Send, UserPlus } from "lucide-react";

/**
 * /kol/dashboard/clients/new
 *
 * Two modes:
 *  - "proxy" : KOL pre-fills the registration form on behalf of a customer
 *              who won't (or can't) fill the main-site form themselves.
 *              We POST to /api/affiliate/clients/pre-register which the
 *              affiliate-service forwards to the main-site registration
 *              endpoint with the KOL's referral code already attached.
 *  - "lead"  : KOL wants to track a customer before they're signed up.
 *
 * Required fields mirror the main-site registration (name, country, email
 * OR phone) per the KOL SOP. Optional profile fields (age range, health
 * concerns, family history, budget) are saved to affiliate.clients so the
 * KOL can personalize outreach immediately.
 */
export default function NewClientPage() {
  const t = useTranslations("clientsNew");
  const router = useRouter();

  const [mode, setMode] = React.useState<"proxy" | "lead">("proxy");
  const [displayName, setDisplayName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [countryCode, setCountryCode] = React.useState("US");
  const [language, setLanguage] = React.useState("en");
  const [ageRange, setAgeRange] = React.useState("");
  const [healthConcerns, setHealthConcerns] = React.useState<string[]>([]);
  const [familyHistory, setFamilyHistory] = React.useState("");
  const [budgetBracket, setBudgetBracket] = React.useState("");
  const [consentConfirmed, setConsentConfirmed] = React.useState(false);
  const [notes, setNotes] = React.useState("");

  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState<null | { id: string; mode: "proxy" | "lead" }>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!displayName.trim()) {
      setError(t("errorName"));
      return;
    }
    if (mode === "proxy" && !email.trim() && !phone.trim()) {
      setError(t("errorContact"));
      return;
    }
    if (mode === "proxy" && !consentConfirmed) {
      setError(t("errorConsent"));
      return;
    }
    setSubmitting(true);
    try {
      const created = await createClient({
        displayName,
        contactChannel: phone ? "phone" : "email",
        contactHandle: phone || email,
        ageRange: ageRange || null,
        countryCode,
        healthConcerns,
        familyHistory: familyHistory || null,
        budgetBracket: budgetBracket || null,
        status: mode === "proxy" ? "engaged" : "lead",
        notes: notes || null,
      });
      // If proxy, also POST to the main-site pre-registration endpoint.
      if (mode === "proxy") {
        try {
          await fetch("/api/affiliate/clients/pre-register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              displayName,
              email: email || undefined,
              phone: phone || undefined,
              countryCode,
              language,
              sourceKolId: created?.id,
            }),
          });
        } catch {
          // Soft-fail: the lead is saved in our DB; main-site pre-reg
          // can be retried by the customer via the KOL's referral link.
        }
      }
      setDone({ id: created?.id ?? `local-${Date.now()}`, mode });
    } catch (e: any) {
      setError(e?.message ?? t("errorGeneric"));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <Card>
        <div className="flex items-start gap-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {done.mode === "proxy" ? t("successProxyTitle") : t("successLeadTitle")}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {done.mode === "proxy" ? t("successProxyDesc") : t("successLeadDesc")}
            </p>
            <div className="flex gap-2 mt-4">
              <Link
                href={done.id && !done.id.startsWith("local-") ? `/kol/dashboard/clients/${done.id}` : "/kol/dashboard/clients"}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600"
              >
                {done.mode === "proxy" ? t("openClient") : t("backToList")}
              </Link>
              <button
                onClick={() => {
                  setDone(null);
                  setDisplayName("");
                  setEmail("");
                  setPhone("");
                  setFamilyHistory("");
                  setNotes("");
                  setHealthConcerns([]);
                  setConsentConfirmed(false);
                }}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50"
              >
                {t("addAnother")}
              </button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-3xl">
      <div className="flex items-center justify-between">
        <Link
          href="/kol/dashboard/clients"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("back")}
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
        <p className="text-sm text-slate-500 mt-1">{t("subtitle")}</p>
      </div>

      {/* Mode tabs */}
      <div className="inline-flex bg-slate-100 rounded-xl p-1">
        <button
          onClick={() => setMode("proxy")}
          className={
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors " +
            (mode === "proxy" ? "bg-white shadow-sm text-slate-900" : "text-slate-600")
          }
        >
          {t("modeProxy")}
        </button>
        <button
          onClick={() => setMode("lead")}
          className={
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors " +
            (mode === "lead" ? "bg-white shadow-sm text-slate-900" : "text-slate-600")
          }
        >
          {t("modeLead")}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <SectionTitle
            title={t("sectionRequired")}
            description={t("sectionRequiredDesc")}
            right={<Pill tone="emerald">{t("required")}</Pill>}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t("fieldName")} required>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                required
              />
            </Field>
            <Field label={t("fieldCountry")} required>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="US">US</option>
                <option value="CA">CA</option>
                <option value="GB">GB</option>
                <option value="AU">AU</option>
                <option value="RU">RU</option>
                <option value="OTHER">Other</option>
              </select>
            </Field>
            <Field label={t("fieldEmail")}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </Field>
            <Field label={t("fieldPhone")}>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </Field>
            <Field label={t("fieldLanguage")}>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="en">English</option>
                <option value="zh">中文</option>
                <option value="ru">Русский</option>
                <option value="es">Español</option>
                <option value="ar">العربية</option>
              </select>
            </Field>
          </div>
        </Card>

        <Card>
          <SectionTitle
            title={t("sectionProfile")}
            description={t("sectionProfileDesc")}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t("fieldAge")}>
              <select
                value={ageRange}
                onChange={(e) => setAgeRange(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="">{t("none")}</option>
                {AGE_RANGES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("fieldBudget")}>
              <select
                value={budgetBracket}
                onChange={(e) => setBudgetBracket(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="">{t("none")}</option>
                {BUDGET_BUCKETS.map((b) => (
                  <option key={b} value={b}>
                    {t(`budget_${b}` as any)}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-4">
            <span className="block text-xs font-semibold text-slate-700 mb-2">
              {t("fieldConcerns")}
            </span>
            <div className="flex flex-wrap gap-2">
              {HEALTH_CONCERNS.map((h) => {
                const on = healthConcerns.includes(h);
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() =>
                      setHealthConcerns((prev) =>
                        prev.includes(h) ? prev.filter((p) => p !== h) : [...prev, h],
                      )
                    }
                    className={
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors " +
                      (on
                        ? "bg-brand-50 border-brand-200 text-brand-700"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")
                    }
                  >
                    {t(`concern_${h}` as any)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4">
            <span className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t("fieldFamilyHistory")}
            </span>
            <textarea
              value={familyHistory}
              onChange={(e) => setFamilyHistory(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div className="mt-4">
            <span className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t("fieldNotes")}
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>
        </Card>

        {mode === "proxy" ? (
          <Card>
            <label className="flex items-start gap-3 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={consentConfirmed}
                onChange={(e) => setConsentConfirmed(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600"
              />
              <span className="leading-relaxed">{t("consentText")}</span>
            </label>
          </Card>
        ) : null}

        {error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === "proxy" ? (
              <Send className="w-4 h-4" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            {mode === "proxy" ? t("submitProxy") : t("submitLead")}
          </button>
          <Link
            href="/kol/dashboard/clients"
            className="px-5 py-2.5 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50"
          >
            {t("cancel")}
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-700 mb-1.5">
        {label}
        {required ? <span className="text-rose-500 ml-0.5">*</span> : null}
      </span>
      {children}
    </label>
  );
}