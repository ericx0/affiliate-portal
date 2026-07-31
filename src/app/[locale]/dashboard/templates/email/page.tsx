"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Card, Pill } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import {
  EmailTemplate,
  TemplateCategory,
  TemplateLanguage,
  listTemplates,
  renderTemplate,
  sendTemplate,
} from "@/lib/email-templates";
import {
  CheckCircle2,
  ClipboardCopy,
  Loader2,
  Mail,
  Send,
  Sparkles,
} from "lucide-react";

/**
 * /dashboard/templates/email — Multi-language email/DM templates.
 *
 * Four tabs (Cold DM, Follow-up, Service pitch, Case share) and a
 * language filter. Each card opens a preview pane where the KOL fills
 * in prospect_name / kol_name / case_link / booking_link / referral_link
 * and either copies the rendered text or sends it via Resend.
 */

const CATEGORY_TABS: { id: TemplateCategory; labelKey: string }[] = [
  { id: "dm_invite", labelKey: "tabDmInvite" },
  { id: "follow_up", labelKey: "tabFollowUp" },
  { id: "service_pitch", labelKey: "tabServicePitch" },
  { id: "case_share", labelKey: "tabCaseShare" },
];

const LANGUAGES: TemplateLanguage[] = ["en", "zh", "es", "ar", "ru"];

export default function EmailTemplatesPage() {
  const t = useTranslations("emailTemplates");
  const [category, setCategory] = React.useState<TemplateCategory>("dm_invite");
  const [language, setLanguage] = React.useState<TemplateLanguage | "all">("all");
  const [templates, setTemplates] = React.useState<EmailTemplate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<EmailTemplate | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    const list = await listTemplates({
      category,
      language: language === "all" ? undefined : language,
    });
    setTemplates(list);
    setLoading(false);
    if (list.length > 0 && (!selected || selected.category !== category)) {
      setSelected(list[0]);
    } else if (list.length === 0) {
      setSelected(null);
    }
  }, [category, language, selected]);

  React.useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, language]);

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
        <p className="text-sm text-slate-500 mt-1">{t("subtitle")}</p>
      </div>

      <Card>
        <Tabs
          tabs={CATEGORY_TABS.map((tab) => ({
            id: tab.id,
            label: t(tab.labelKey as any),
          }))}
          active={category}
          onChange={(id: string) => setCategory(id as TemplateCategory)}
        />

        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-600">{t("filterLanguage")}:</span>
          <button
            onClick={() => setLanguage("all")}
            className={
              "px-3 py-1 rounded-lg text-xs font-semibold " +
              (language === "all" ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-700")
            }
          >
            {t("filterAll")}
          </button>
          {LANGUAGES.map((l) => (
            <button
              key={l}
              onClick={() => setLanguage(l)}
              className={
                "px-3 py-1 rounded-lg text-xs font-semibold " +
                (language === l ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-700")
              }
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2">
          {loading ? (
            <Card className="flex items-center justify-center h-40">
              <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
            </Card>
          ) : templates.length === 0 ? (
            <Card>
              <div className="text-sm text-slate-500 text-center py-6">{t("emptyState")}</div>
            </Card>
          ) : (
            templates.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => setSelected(tmpl)}
                className={
                  "w-full text-left p-4 rounded-xl border transition-colors " +
                  (selected?.id === tmpl.id
                    ? "border-brand-500 bg-brand-50"
                    : "border-slate-200 bg-white hover:bg-slate-50")
                }
              >
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Pill tone="blue">{tmpl.language.toUpperCase()}</Pill>
                  {tmpl.variant ? <Pill tone="emerald">{tmpl.variant}</Pill> : null}
                </div>
                <div className="text-sm font-semibold text-slate-900">{tmpl.title}</div>
                <div className="text-xs text-slate-500 mt-1 line-clamp-1">{tmpl.subject}</div>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <TemplateEditor template={selected} />
          ) : (
            <Card>
              <div className="text-center py-12 text-sm text-slate-500">{t("emptyState")}</div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function TemplateEditor({ template }: { template: EmailTemplate }) {
  const t = useTranslations("emailTemplates");
  const [kolName, setKolName] = React.useState("");
  const [prospectName, setProspectName] = React.useState("");
  const [caseLink, setCaseLink] = React.useState("");
  const [bookingLink, setBookingLink] = React.useState("");
  const [referralLink, setReferralLink] = React.useState("");
  const [toEmail, setToEmail] = React.useState("");
  const [rendered, setRendered] = React.useState<{ subject: string; body: string } | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [fallback, setFallback] = React.useState<{ subject: string; body: string } | null>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    setRendered(null);
    setSuccess(null);
    setError(null);
    setFallback(null);
  }, [template.id]);

  const variables = { kol_name: kolName, prospect_name: prospectName, case_link: caseLink, booking_link: bookingLink, referral_link: referralLink };

  async function handlePreview() {
    setSubmitting(true);
    setError(null);
    try {
      const out = await renderTemplate(template.id, variables);
      setRendered(out);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSend() {
    if (!toEmail) {
      setError("Recipient email is required");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    setFallback(null);
    try {
      const out = await sendTemplate(template.id, toEmail, variables);
      setSuccess(t("sendSuccess"));
      setRendered({ subject: out.subject, body: rendered?.body ?? "" });
    } catch (e: any) {
      const code = (e as { code?: string }).code;
      if (code === "MAIL_NOT_READY") {
        setFallback({ subject: e.message.data?.subject ?? "", body: e.message.data?.body ?? "" });
        setError(t("sendFallback"));
      } else {
        setError(t("sendErrorGeneric"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  function copyRendered() {
    if (!rendered) return;
    navigator.clipboard.writeText(`${rendered.subject}\n\n${rendered.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const display = rendered ?? fallback;

  return (
    <Card>
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-brand-500" />
            <div className="text-sm font-semibold text-slate-900">{template.title}</div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Pill tone="blue">{template.language.toUpperCase()}</Pill>
            {template.variant ? <Pill tone="emerald">{template.variant}</Pill> : null}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-slate-700 mb-2">{t("variablesTitle")}</div>
          <p className="text-xs text-slate-500 mb-3">{t("variablesDesc")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label={t("kolNameLabel")} value={kolName} onChange={setKolName} placeholder={t("kolNamePlaceholder")} />
            <Input label={t("prospectNameLabel")} value={prospectName} onChange={setProspectName} placeholder={t("prospectNamePlaceholder")} />
            <Input label={t("caseLinkLabel")} value={caseLink} onChange={setCaseLink} placeholder="https://..." fullWidth />
            <Input label={t("bookingLinkLabel")} value={bookingLink} onChange={setBookingLink} placeholder="https://..." fullWidth />
            <Input label={t("referralLinkLabel")} value={referralLink} onChange={setReferralLink} placeholder="https://linkchinamed.com/?ref=..." fullWidth />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePreview}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {t("previewTitle")}
          </button>
          {display ? (
            <button
              onClick={copyRendered}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-semibold"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <ClipboardCopy className="w-4 h-4" />}
              {copied ? t("copied") : t("sendCopyButton")}
            </button>
          ) : null}
        </div>

        {success ? (
          <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2">
            {success}
          </div>
        ) : null}
        {error ? (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
            {error}
          </div>
        ) : null}

        {display ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              {t("previewSubject")}
            </div>
            <div className="text-sm text-slate-900 font-medium mb-3">{display.subject}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              {t("previewBody")}
            </div>
            <pre className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed font-sans">
              {display.body}
            </pre>
          </div>
        ) : null}

        <div className="border-t border-slate-200 pt-4">
          <div className="text-xs font-semibold text-slate-700 mb-2">{t("sendButton")}</div>
          <div className="flex items-center gap-2">
            <input
              type="email"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              placeholder="prospect@example.com"
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
            />
            <button
              onClick={handleSend}
              disabled={submitting || !toEmail}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {t("sendButton")}
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-400 italic">{t("aiAssistNote")}</div>
      </div>
    </Card>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  fullWidth,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  fullWidth?: boolean;
}) {
  return (
    <label className={"block " + (fullWidth ? "sm:col-span-2" : "")}>
      <span className="block text-xs font-semibold text-slate-600 mb-1">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
      />
    </label>
  );
}
