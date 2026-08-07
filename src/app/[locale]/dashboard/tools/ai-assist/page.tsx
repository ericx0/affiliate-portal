"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Card, SectionTitle, Pill } from "@/components/ui/Card";
import {
  AlertCircle,
  Bot,
  Loader2,
  Send,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";

/**
 * /dashboard/tools/ai-assist
 *
 * Streaming chat UI for the KOL AI customer-consultation assistant.
 * Composes three inputs from the KOL:
 *   - free-form case description (the customer's story)
 *   - structured client profile (auto-filled from ?clientId=…)
 *   - prior conversation turns (carried across renders)
 *
 * Streams the model's reply via fetch + ReadableStream so we don't
 * depend on a vendor SDK. The assistant's reply is rendered with a
 * persistent footer disclaimer so the medical boundary is always
 * visible (not just the last message).
 */

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  error?: string | null;
}

interface ClientContext {
  displayName?: string;
  ageRange?: string;
  countryCode?: string;
  healthConcerns?: string[];
  budgetBracket?: string;
}

const DISCLAIMER_KEY = "__disclaimer__";

export default function AiAssistPage() {
  const t = useTranslations("aiAssist");
  const locale = useLocale();

  const [clientContext, setClientContext] = React.useState<ClientContext>({});
  const [profileText, setProfileText] = React.useState("");
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // If ?clientId=X is passed, hydrate clientContext from the local
  // store. We don't have a GET endpoint yet, so we read from local
  // state the list page would have populated (best-effort).
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const clientId = params.get("clientId");
    if (!clientId) return;
    const cached = window.localStorage.getItem(`kol-client-${clientId}`);
    if (!cached) return;
    try {
      const parsed = JSON.parse(cached);
      setClientContext({
        displayName: parsed.displayName,
        ageRange: parsed.ageRange,
        countryCode: parsed.countryCode,
        healthConcerns: parsed.healthConcerns ?? [],
        budgetBracket: parsed.budgetBracket,
      });
    } catch {
      // ignore — empty context is fine.
    }
  }, []);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setStreaming(true);

    const assistantId = `a-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", streaming: true },
    ]);

    try {
      const res = await fetch("/api/affiliate-ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          clientContext,
          messages: [
            ...(profileText
              ? [{ role: "user" as const, content: `Customer profile: ${profileText}` }]
              : []),
            ...nextMessages.map((m) => ({ role: m.role, content: m.content })),
          ],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: "AI request failed" } }));
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  streaming: false,
                  error: err?.error?.message ?? "AI request failed",
                  content:
                    (m.content || "") +
                    (m.content ? "\n\n" : "") +
                    "⚠️ " +
                    (err?.error?.message ?? "AI request failed"),
                }
              : m,
          ),
        );
        setStreaming(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const evt of events) {
          const line = evt.split("\n").find((l) => l.startsWith("data:")) ?? "";
          if (!line) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const parsed = JSON.parse(payload);
            if (parsed.delta) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + parsed.delta }
                    : m,
                ),
              );
            }
            if (parsed.error) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, error: parsed.error, streaming: false }
                    : m,
                ),
              );
            }
            if (parsed.done) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, streaming: false } : m,
                ),
              );
            }
          } catch {
            // skip malformed event
          }
        }
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                streaming: false,
                error: err?.message ?? "Network error",
                content: m.content + "\n\n⚠️ " + (err?.message ?? "Network error"),
              }
            : m,
        ),
      );
    } finally {
      setStreaming(false);
      void DISCLAIMER_KEY; // keep key referenced for future use
    }
  }

  function handleReset() {
    setMessages([]);
    setInput("");
    setProfileText("");
    setClientContext({});
  }

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-brand-500" />
            {t("title")}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{t("subtitle")}</p>
        </div>
        <button
          onClick={handleReset}
          className="self-start text-xs text-slate-500 hover:text-slate-700 underline"
        >
          {t("reset")}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Context panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <SectionTitle title={t("contextTitle")} description={t("contextDesc")} />
            <div className="space-y-3 text-sm">
              <Row label={t("fieldName")} value={clientContext.displayName ?? "—"} />
              <Row label={t("fieldAge")} value={clientContext.ageRange ?? "—"} />
              <Row label={t("fieldCountry")} value={clientContext.countryCode ?? "—"} />
              <Row
                label={t("fieldConcerns")}
                value={
                  clientContext.healthConcerns?.length
                    ? clientContext.healthConcerns.join(", ")
                    : "—"
                }
              />
              <Row label={t("fieldBudget")} value={clientContext.budgetBracket ?? "—"} />
            </div>
            <div className="mt-4">
              <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t("contextOverride")}
              </span>
              <textarea
                value={profileText}
                onChange={(e) => setProfileText(e.target.value)}
                rows={3}
                placeholder={t("contextOverridePlaceholder")}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </Card>

          <Card>
            <SectionTitle title={t("guardrailsTitle")} description={t("guardrailsDesc")} />
            <ul className="text-xs text-slate-600 space-y-2">
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{t("guardrail1")}</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{t("guardrail2")}</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{t("guardrail3")}</span>
              </li>
            </ul>
          </Card>

          <Card>
            <SectionTitle title={t("handoffTitle")} description={t("handoffDesc")} />
            <Link
              href="/dashboard/clients/new"
              className="inline-flex items-center gap-2 px-3 py-2 bg-brand-500 text-white text-xs font-semibold rounded-lg hover:bg-brand-600"
            >
              {t("handoffCta")}
            </Link>
          </Card>
        </div>

        {/* Chat panel */}
        <Card className="lg:col-span-2 flex flex-col" padded={false}>
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[400px] max-h-[600px]"
          >
            {messages.length === 0 ? (
              <div className="text-center py-10">
                <Bot className="w-10 h-10 text-brand-400 mx-auto" />
                <p className="text-sm text-slate-500 mt-3">{t("emptyTitle")}</p>
                <p className="text-xs text-slate-400 mt-1">{t("emptyDesc")}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-5 text-left">
                  <SuggestionChip
                    label={t("suggestion1")}
                    onClick={() => setInput(t("suggestion1Prompt"))}
                  />
                  <SuggestionChip
                    label={t("suggestion2")}
                    onClick={() => setInput(t("suggestion2Prompt"))}
                  />
                  <SuggestionChip
                    label={t("suggestion3")}
                    onClick={() => setInput(t("suggestion3Prompt"))}
                  />
                  <SuggestionChip
                    label={t("suggestion4")}
                    onClick={() => setInput(t("suggestion4Prompt"))}
                  />
                </div>
              </div>
            ) : (
              messages.map((m) => <MessageBubble key={m.id} message={m} />)
            )}
          </div>

          <form
            onSubmit={handleSend}
            className="border-t border-slate-100 p-4 flex items-end gap-2 bg-slate-50"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={t("inputPlaceholder")}
              rows={2}
              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm resize-none"
              disabled={streaming}
            />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 disabled:opacity-50"
            >
              {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {t("send")}
            </button>
          </form>
          <div className="px-4 py-2 bg-amber-50 border-t border-amber-100 text-[11px] text-amber-800 leading-relaxed">
            <AlertCircle className="inline w-3 h-3 mr-1 -mt-0.5" />
            {t("footerDisclaimer")}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 text-xs">
      <span className="text-slate-500 font-semibold">{label}</span>
      <span className="text-slate-800 text-right">{value}</span>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={"flex items-start gap-3 " + (isUser ? "flex-row-reverse text-right" : "")}>
      <div
        className={
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 " +
          (isUser ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-700")
        }
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div
        className={
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap " +
          (isUser
            ? "bg-brand-500 text-white"
            : message.error
              ? "bg-rose-50 border border-rose-200 text-rose-900"
              : "bg-white border border-slate-200 text-slate-800")
        }
      >
        {message.content}
        {message.streaming ? <span className="inline-block w-1.5 h-3 bg-slate-400 ml-1 animate-pulse" /> : null}
      </div>
    </div>
  );
}

function SuggestionChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left p-3 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50 text-xs text-slate-700 transition-colors"
    >
      <Pill tone="emerald">
        <Sparkles className="w-3 h-3" />
        {label}
      </Pill>
    </button>
  );
}