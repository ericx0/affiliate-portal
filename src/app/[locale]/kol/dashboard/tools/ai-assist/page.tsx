"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Bot,
  Copy,
  Check,
  Loader2,
  Send,
  Sparkles,
  User,
  Wand2,
  RefreshCw,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  error?: string | null;
}

const CONTENT_TYPES = [
  { value: "short_video",    emoji: "🎬", label: "短视频脚本" },
  { value: "social_post",    emoji: "📱", label: "社交帖子" },
  { value: "email",          emoji: "📧", label: "邮件模板" },
  { value: "referral_intro", emoji: "🔗", label: "推广介绍" },
  { value: "service_desc",   emoji: "💎", label: "服务说明" },
  { value: "story",          emoji: "✨", label: "Story / 朋友圈" },
];

const PLATFORMS = [
  { value: "tiktok",     emoji: "🎵", label: "TikTok" },
  { value: "instagram",  emoji: "📸", label: "Instagram" },
  { value: "youtube",    emoji: "▶️", label: "YouTube" },
  { value: "facebook",   emoji: "👥", label: "Facebook" },
  { value: "twitter",    emoji: "🐦", label: "X / Twitter" },
  { value: "email",      emoji: "📧", label: "Email" },
];

const QUICK_PROMPTS = [
  { label: "TikTok Hook",          prompt: "Write a powerful TikTok hook (first 3 seconds) for LinkChinaMed's medical travel coordination service. It should grab attention immediately and make overseas Chinese audiences curious." },
  { label: "Instagram Caption",    prompt: "Write an engaging Instagram caption promoting LinkChinaMed's medical coordination services. Include relevant hashtags and a clear CTA with my referral link." },
  { label: "YouTube Intro Script", prompt: "Write a 60-second YouTube intro script explaining how LinkChinaMed helps overseas patients access top hospitals in China with full coordination support." },
  { label: "Referral Link Post",   prompt: "Write a short social media post explaining how my referral link works and what benefit my followers get when they use LinkChinaMed's services." },
  { label: "Email Outreach",       prompt: "Write a professional email outreach template (under 200 words) to overseas Chinese communities explaining how LinkChinaMed simplifies medical care in China for their parents or family." },
  { label: "IVF / Fertility Ad",   prompt: "Write a Facebook ad copy targeting overseas Chinese couples interested in IVF or fertility treatments in China through LinkChinaMed. Emphasize professionalism, cost savings, and full coordination support." },
];

export default function AiAssistPage() {
  const locale = useLocale();

  const [contentType, setContentType] = React.useState("short_video");
  const [platform, setPlatform] = React.useState("tiktok");
  const [context, setContext] = React.useState("");
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setStreaming(true);

    const assistantId = `a-${Date.now()}`;
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "", streaming: true }]);

    try {
      const res = await fetch("/api/affiliate-ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          contentType,
          platform,
          context: context.trim() || undefined,
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: "AI request failed" } }));
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, streaming: false, error: err?.error?.message, content: "⚠️ " + (err?.error?.message ?? "请求失败") }
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
                prev.map((m) => m.id === assistantId ? { ...m, content: m.content + parsed.delta } : m),
              );
            }
            if (parsed.done) {
              setMessages((prev) =>
                prev.map((m) => m.id === assistantId ? { ...m, streaming: false } : m),
              );
            }
            if (parsed.error) {
              setMessages((prev) =>
                prev.map((m) => m.id === assistantId ? { ...m, streaming: false, error: parsed.error } : m),
              );
            }
          } catch { /* skip */ }
        }
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, streaming: false, error: err?.message, content: "⚠️ " + (err?.message ?? "网络错误") }
            : m,
        ),
      );
    } finally {
      setStreaming(false);
    }
  }

  function handleCopy(id: string, content: string) {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Wand2 className="w-6 h-6 text-brand-500" />
            AI 营销文案助手
          </h1>
          <p className="text-sm text-slate-500 mt-1">帮你快速生成各平台推广文案，一键复制直接发布</p>
        </div>
        <button
          onClick={() => { setMessages([]); setInput(""); setContext(""); }}
          className="self-start flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700"
        >
          <RefreshCw className="w-3.5 h-3.5" /> 清空对话
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-1 space-y-5">
          {/* Content type */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
            <div className="text-sm font-bold text-slate-800">📝 内容类型</div>
            <div className="grid grid-cols-2 gap-2">
              {CONTENT_TYPES.map((ct) => (
                <button
                  key={ct.value}
                  onClick={() => setContentType(ct.value)}
                  className={
                    "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors " +
                    (contentType === ct.value
                      ? "bg-brand-500 text-white border-brand-500"
                      : "bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:bg-brand-50")
                  }
                >
                  <span>{ct.emoji}</span> {ct.label}
                </button>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
            <div className="text-sm font-bold text-slate-800">📡 发布平台</div>
            <div className="grid grid-cols-2 gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPlatform(p.value)}
                  className={
                    "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors " +
                    (platform === p.value
                      ? "bg-brand-500 text-white border-brand-500"
                      : "bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:bg-brand-50")
                  }
                >
                  <span>{p.emoji}</span> {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Extra context */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
            <div className="text-sm font-bold text-slate-800">💡 补充说明（选填）</div>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={3}
              placeholder="例如：目标受众是30-45岁海外华人；重点推肿瘤科服务；需要加入我的优惠码 REF123…"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs resize-none focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
          </div>
        </div>

        {/* Chat Panel */}
        <div className="lg:col-span-2 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[420px] max-h-[580px]">
            {messages.length === 0 ? (
              <div className="space-y-5">
                <div className="text-center py-6">
                  <Sparkles className="w-10 h-10 text-brand-400 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700 mt-3">快速开始</p>
                  <p className="text-xs text-slate-400 mt-1">选择左边的类型和平台，或者直接点击下方模板</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {QUICK_PROMPTS.map((qp) => (
                    <button
                      key={qp.label}
                      onClick={() => setInput(qp.prompt)}
                      className="text-left p-3 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50 text-xs text-slate-700 transition-colors"
                    >
                      <span className="font-semibold text-brand-600 block mb-0.5">{qp.label}</span>
                      <span className="text-slate-400 line-clamp-2">{qp.prompt.slice(0, 50)}…</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => <MessageBubble key={m.id} message={m} onCopy={handleCopy} copiedId={copiedId} />)
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="border-t border-slate-100 p-4 flex items-end gap-2 bg-slate-50"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="描述你需要的文案，或直接告诉 AI 你要推广什么服务、面向哪些受众…"
              rows={2}
              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-300"
              disabled={streaming}
            />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 disabled:opacity-50 transition-colors"
            >
              {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              发送
            </button>
          </form>
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 leading-relaxed">
            ⚠️ AI 生成内容仅供参考，请在发布前检查事实准确性。宣传时请确保遵守各平台规则及当地广告法规。
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  onCopy,
  copiedId,
}: {
  message: ChatMessage;
  onCopy: (id: string, content: string) => void;
  copiedId: string | null;
}) {
  const isUser = message.role === "user";
  return (
    <div className={"flex items-start gap-3 " + (isUser ? "flex-row-reverse" : "")}>
      <div
        className={
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 " +
          (isUser ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-600")
        }
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div className={"group relative max-w-[82%] " + (isUser ? "items-end" : "items-start")}>
        <div
          className={
            "rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap " +
            (isUser
              ? "bg-brand-500 text-white"
              : message.error
              ? "bg-rose-50 border border-rose-200 text-rose-900"
              : "bg-white border border-slate-200 text-slate-800")
          }
        >
          {message.content}
          {message.streaming ? <span className="inline-block w-1.5 h-3 bg-slate-400 ml-1 animate-pulse rounded-sm" /> : null}
        </div>
        {/* Copy button for AI messages */}
        {!isUser && !message.streaming && message.content && !message.error && (
          <button
            onClick={() => onCopy(message.id, message.content)}
            className="absolute -bottom-7 left-0 flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {copiedId === message.id ? (
              <><Check className="w-3 h-3 text-emerald-500" /> 已复制</>
            ) : (
              <><Copy className="w-3 h-3" /> 复制文案</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}