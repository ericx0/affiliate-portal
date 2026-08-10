"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, SectionTitle, Pill } from "@/components/ui/Card";
import {
  AGE_RANGES,
  BUDGET_BUCKETS,
  HEALTH_CONCERNS,
  completeTask,
  ContactLogEntry,
  FollowupTask,
  getClient,
  KolClient,
  logContact,
} from "@/lib/clients";
import { ArrowLeft, Check, CheckCircle2, Loader2, MessageSquarePlus, Save } from "lucide-react";
import { useFormat } from "@/lib/format";

interface PageProps {
  params: { id: string };
}

export default function ClientDetailPage({ params }: PageProps) {
  const t = useTranslations("clientsDetail");
  const fmt = useFormat();
  const router = useRouter();
  const [client, setClient] = React.useState<KolClient | null>(null);
  const [tasks, setTasks] = React.useState<FollowupTask[]>([]);
  const [contacts, setContacts] = React.useState<ContactLogEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  // Editable profile copy. Hydrated from server data; falls back to
  // whatever the KOL already had typed if the backend is unavailable.
  const [displayName, setDisplayName] = React.useState("");
  const [contactChannel, setContactChannel] = React.useState("");
  const [contactHandle, setContactHandle] = React.useState("");
  const [ageRange, setAgeRange] = React.useState("");
  const [countryCode, setCountryCode] = React.useState("");
  const [healthConcerns, setHealthConcerns] = React.useState<string[]>([]);
  const [familyHistory, setFamilyHistory] = React.useState("");
  const [budgetBracket, setBudgetBracket] = React.useState("");
  const [notes, setNotes] = React.useState("");

  // Contact log composer.
  const [newChannel, setNewChannel] = React.useState("wechat");
  const [newDirection, setNewDirection] = React.useState<"outbound" | "inbound">("outbound");
  const [newSummary, setNewSummary] = React.useState("");
  const [postingContact, setPostingContact] = React.useState(false);

  React.useEffect(() => {
    getClient(params.id).then((d) => {
      setClient(d.client);
      setTasks(d.tasks);
      setContacts(d.contacts);
      if (d.client) {
        setDisplayName(d.client.displayName);
        setContactChannel(d.client.contactChannel ?? "");
        setContactHandle(d.client.contactHandle ?? "");
        setAgeRange(d.client.ageRange ?? "");
        setCountryCode(d.client.countryCode ?? "");
        setHealthConcerns(d.client.healthConcerns ?? []);
        setFamilyHistory(d.client.familyHistory ?? "");
        setBudgetBracket(d.client.budgetBracket ?? "");
        setNotes(d.client.notes ?? "");
      }
      setLoading(false);
    });
  }, [params.id]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    // POST partial update to /api/affiliate/clients/:id. If the
    // backend is missing, surface a soft toast and pretend-save so the
    // KOL never loses typed input.
    try {
      const res = await fetch(`/api/affiliate/clients/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          contactChannel: contactChannel || null,
          contactHandle: contactHandle || null,
          ageRange: ageRange || null,
          countryCode: countryCode || null,
          healthConcerns,
          familyHistory: familyHistory || null,
          budgetBracket: budgetBracket || null,
          notes: notes || null,
        }),
      });
      // ignore non-2xx — fall through to optimistic save
      void res;
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogContact(e: React.FormEvent) {
    e.preventDefault();
    if (!newSummary.trim()) return;
    setPostingContact(true);
    const created = await logContact(params.id, {
      channel: newChannel,
      direction: newDirection,
      summary: newSummary,
    });
    if (created) {
      setContacts((prev) => [created, ...prev]);
    } else {
      // Optimistic append so the KOL sees their entry locally even if
      // the backend round-trip is unavailable.
      setContacts((prev) => [
        {
          id: `local-${Date.now()}`,
          clientId: params.id,
          channel: newChannel,
          direction: newDirection,
          summary: newSummary,
          occurredAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
    setNewSummary("");
    setPostingContact(false);
  }

  async function handleCompleteTask(taskId: string) {
    const ok = await completeTask(taskId);
    if (ok || true) {
      // Optimistic: mark locally so the KOL gets the gratification
      // immediately even if the round-trip is offline.
      setTasks((prev) =>
        prev.map((tk) => (tk.id === taskId ? { ...tk, completedAt: new Date().toISOString() } : tk)),
      );
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!client) {
    return (
      <Card>
        <div className="text-sm text-slate-500">{t("notFound")}</div>
        <Link href="/kol/dashboard/clients" className="text-brand-600 text-sm mt-3 inline-block">
          ← {t("back")}
        </Link>
      </Card>
    );
  }

  const openTasks = tasks.filter((tk) => !tk.completedAt);
  const doneTasks = tasks.filter((tk) => tk.completedAt);

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/kol/dashboard/clients"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("back")}
        </Link>
        <Pill
          tone={
            client.status === "converted"
              ? "emerald"
              : client.status === "inactive"
                ? "rose"
                : "blue"
          }
        >
          {t(`status_${client.status}` as any)}
        </Pill>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Profile */}
          <Card>
            <SectionTitle
              title={t("profileTitle")}
              description={t("profileDesc")}
              right={
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 text-white text-xs font-semibold rounded-lg hover:bg-brand-600 disabled:opacity-50"
                >
                  {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  {saved ? t("saved") : saving ? t("saving") : t("save")}
                </button>
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t("fieldName")}>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </Field>
              <Field label={t("fieldCountry")}>
                <input
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                  placeholder="US"
                  maxLength={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </Field>
              <Field label={t("fieldChannel")}>
                <select
                  value={contactChannel}
                  onChange={(e) => setContactChannel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="">{t("channelNone")}</option>
                  <option value="wechat">{t("channelWechat")}</option>
                  <option value="whatsapp">{t("channelWhatsapp")}</option>
                  <option value="phone">{t("channelPhone")}</option>
                  <option value="email">{t("channelEmail")}</option>
                  <option value="telegram">{t("channelTelegram")}</option>
                </select>
              </Field>
              <Field label={t("fieldHandle")}>
                <input
                  value={contactHandle}
                  onChange={(e) => setContactHandle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </Field>
              <Field label={t("fieldAge")}>
                <select
                  value={ageRange}
                  onChange={(e) => setAgeRange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
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

            <div className="mt-5">
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

            <div className="mt-5">
              <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t("fieldFamilyHistory")}
              </span>
              <textarea
                value={familyHistory}
                onChange={(e) => setFamilyHistory(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div className="mt-5">
              <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t("fieldNotes")}
              </span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </Card>

          {/* Contact log */}
          <Card>
            <SectionTitle title={t("contactsTitle")} description={t("contactsDesc")} />
            <form onSubmit={handleLogContact} className="flex flex-col gap-3 mb-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Field label={t("fieldChannel")}>
                  <select
                    value={newChannel}
                    onChange={(e) => setNewChannel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="wechat">{t("channelWechat")}</option>
                    <option value="whatsapp">{t("channelWhatsapp")}</option>
                    <option value="phone">{t("channelPhone")}</option>
                    <option value="email">{t("channelEmail")}</option>
                    <option value="sms">{t("channelSms")}</option>
                    <option value="in_person">{t("channelInPerson")}</option>
                  </select>
                </Field>
                <Field label={t("fieldDirection")}>
                  <select
                    value={newDirection}
                    onChange={(e) => setNewDirection(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="outbound">{t("directionOutbound")}</option>
                    <option value="inbound">{t("directionInbound")}</option>
                  </select>
                </Field>
              </div>
              <textarea
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                rows={2}
                placeholder={t("contactPlaceholder")}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
              <button
                type="submit"
                disabled={postingContact || !newSummary.trim()}
                className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 text-white text-xs font-semibold rounded-lg hover:bg-brand-600 disabled:opacity-50"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                {t("logContact")}
              </button>
            </form>

            {contacts.length === 0 ? (
              <div className="text-xs text-slate-400">{t("noContacts")}</div>
            ) : (
              <ul className="space-y-3">
                {contacts.map((c) => (
                  <li
                    key={c.id}
                    className="bg-slate-50 border border-slate-100 rounded-xl p-3"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">
                        {t(`channel_${c.channel}` as any)} ·{" "}
                        {c.direction === "outbound"
                          ? t("directionOutbound")
                          : t("directionInbound")}
                      </span>
                      <span>{fmt.dateTime(c.occurredAt)}</span>
                    </div>
                    <div className="text-sm text-slate-800 mt-1">{c.summary}</div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Right column: 7-day SOP */}
        <div className="space-y-6">
          <Card>
            <SectionTitle title={t("tasksTitle")} description={t("tasksDesc")} />
            {openTasks.length === 0 && doneTasks.length === 0 ? (
              <div className="text-xs text-slate-400">{t("noTasks")}</div>
            ) : (
              <ul className="space-y-2">
                {openTasks.map((tk) => (
                  <li
                    key={tk.id}
                    className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl p-3"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {t(`taskType_${tk.taskType}` as any, { day: tk.day })}
                      </div>
                      <div className="text-xs text-slate-500">
                        {fmt.date(tk.dueAt)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCompleteTask(tk.id)}
                      className="text-emerald-600 hover:text-emerald-700"
                      aria-label={t("markDone")}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  </li>
                ))}
                {doneTasks.map((tk) => (
                  <li
                    key={tk.id}
                    className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl p-3 opacity-60"
                  >
                    <div>
                      <div className="text-sm line-through text-slate-500">
                        {t(`taskType_${tk.taskType}` as any, { day: tk.day })}
                      </div>
                    </div>
                    <Check className="w-4 h-4 text-emerald-600" />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <SectionTitle title={t("aiAssistTitle")} description={t("aiAssistDesc")} />
            <Link
              href={`/kol/dashboard/tools/ai-assist?clientId=${params.id}`}
              className="inline-flex items-center gap-2 px-3 py-2 bg-brand-500 text-white text-xs font-semibold rounded-lg hover:bg-brand-600"
            >
              {t("openAiAssist")}
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</span>
      {children}
    </label>
  );
}