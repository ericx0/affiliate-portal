"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";
import { QRCodeCanvas } from "qrcode.react";
import {
  Users,
  Award,
  TrendingUp,
  Wallet,
  Copy,
  Check,
  Share2,
  ChevronRight,
  Sparkles,
  QrCode,
  Download,
  X,
} from "lucide-react";

// 代理阶梯门槛，与 agent.ruleLevel1-3 文案一致：
// Level 1 = 1-10 KOL (5%)，Level 2 = 11-100 (8%)，Level 3 = 100+ (10%)。
const LEVEL_2_MIN_KOLS = 11;
const LEVEL_3_MIN_KOLS = 101;

interface AgentStats {
  totalKols: number;
  activeKols: number;
  totalPaid: number;
  totalPending: number;
  totalApproved: number;
}

interface InviteCodeResponse {
  agent_invite_code: string;
  invite_link: string;
}

export default function AgentDashboard() {
  const t = useTranslations("agent");
  // Reuse the dashboard QR poster brand/copy keys for the invite QR modal.
  const tDash = useTranslations("dashboard");
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InviteCodeResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const qrWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await apiFetch<AgentStats>("/api/affiliate/agent/stats").catch(
          () => null
        );
        // No fabricated fallback numbers: show real zeros when the API has
        // no data yet.
        setStats(
          data ?? {
            totalKols: 0,
            activeKols: 0,
            totalPaid: 0,
            totalPending: 0,
            totalApproved: 0,
          }
        );

        const inviteData = await apiFetch<InviteCodeResponse>(
          "/api/affiliate/agent/invite-code"
        ).catch(() => null);
        setInvite(inviteData);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const kolCount = stats?.totalKols || 0;

  // Calculate Tier
  let tierName = t("tierBronze");
  let tierRate = "5%";
  let nextGoal = t("goalToLevel2", { count: LEVEL_2_MIN_KOLS - kolCount });
  let progressPercent = (kolCount / (LEVEL_2_MIN_KOLS - 1)) * 100;

  if (kolCount >= LEVEL_3_MIN_KOLS) {
    tierName = t("tierGold");
    tierRate = "10%";
    nextGoal = t("maxTierReached");
    progressPercent = 100;
  } else if (kolCount >= LEVEL_2_MIN_KOLS) {
    tierName = t("tierSilver");
    tierRate = "8%";
    nextGoal = t("goalToLevel3", { count: LEVEL_3_MIN_KOLS - kolCount });
    progressPercent = (kolCount / (LEVEL_3_MIN_KOLS - 1)) * 100;
  }

  const handleCopyLink = () => {
    const link = invite?.invite_link;
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // The QR encodes exactly the same invite link the copy button copies
  // (backend-provided invite_link: <portal>/register?agent=CODE).
  const inviteLink = invite?.invite_link ?? "";

  // Poster-style PNG download (brand block + QR canvas), mirrors the KOL
  // dashboard QR poster.
  const handleDownloadQrPoster = () => {
    const canvas = qrWrapperRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = (canvas as HTMLCanvasElement).toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "linkchinamed-agent-invite-qr.png";
    a.click();
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("pageTitle")}</h1>
        <p className="text-sm text-slate-500 mt-1">
          {t("dashboardSubtitle")}
        </p>
      </div>

      {/* Tier & Level Badge Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-md">
            <Award className="w-4 h-4 text-amber-300" />
            {t("tierBadge")}
          </div>
          <div className="text-3xl font-extrabold flex items-center gap-3">
            {tierName}
            <span className="text-xl bg-amber-400 text-slate-900 px-3 py-1 rounded-xl font-black">
              {tierRate} {t("commission")}
            </span>
          </div>
          <p className="text-xs text-blue-100">{nextGoal}</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full md:w-64 space-y-2 bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
          <div className="flex justify-between text-xs font-bold text-blue-200">
            <span>{t("recruitmentProgress")}</span>
            <span>{t("progressCount", { count: kolCount })}</span>
          </div>
          <div className="w-full bg-blue-950/60 rounded-full h-3 overflow-hidden">
            <div
              className="bg-amber-400 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold">{t("statTotalKols")}</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{stats?.totalKols} {t("personUnit")}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold">{t("statActiveKols")}</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{stats?.activeKols} {t("personUnit")}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold">{t("statTotalPaid")}</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              ${((stats?.totalPaid ?? 0) / 100).toFixed(2)}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold">{t("statPendingCommission")}</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              ${(((stats?.totalPending ?? 0) + (stats?.totalApproved ?? 0)) / 100).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Invite Code Card */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Share2 className="w-5 h-5 text-blue-600" />
          {t("inviteCardTitle")}
        </h2>
        <p className="text-sm text-slate-500">
          {t("inviteCardDesc")}
        </p>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase">{t("inviteCodeLabel")}</div>
            <div className="font-mono text-xl font-extrabold text-blue-600 mt-0.5">
              {invite?.agent_invite_code ?? "—"}
            </div>
          </div>

          <div className="flex-1 max-w-md">
            <div className="text-xs text-slate-400 font-bold uppercase mb-1">{t("inviteLinkLabel")}</div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={invite?.invite_link ?? ""}
                placeholder={t("inviteUnavailable")}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-700 select-all"
              />
              <button
                onClick={handleCopyLink}
                disabled={!invite?.invite_link}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex-shrink-0 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t("copied") : t("copyLink")}
              </button>
              <button
                onClick={() => setShowQrModal(true)}
                disabled={!inviteLink}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex-shrink-0 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                {t("qrButton")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rules Banner */}
      <div className="bg-slate-900 text-slate-300 p-6 rounded-2xl text-xs space-y-2">
        <div className="font-bold text-white text-sm">{t("rulesTitle")}</div>
        <p>{t("ruleLevel1")}</p>
        <p>{t("ruleLevel2")}</p>
        <p>{t("ruleLevel3")}</p>
      </div>

      {/* Invite QR poster modal (mirrors the KOL dashboard QR poster) */}
      {showQrModal && inviteLink && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full space-y-6 relative shadow-2xl">
            <button onClick={() => setShowQrModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full"><X className="w-5 h-5" /></button>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">{t("qrModalTitle")}</h3>
              <p className="text-xs text-slate-500">{t("qrModalDesc")}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-2xl shadow-inner flex flex-col items-center justify-center text-white space-y-4">
              <div className="bg-white p-4 rounded-xl shadow-lg" ref={qrWrapperRef}><QRCodeCanvas value={inviteLink} size={180} level="H" includeMargin={true} /></div>
              <div className="text-center">
                <div className="font-bold text-sm">{tDash("qrBrand")}</div>
                <div className="text-[11px] text-blue-100 mt-0.5">{tDash("qrSubtitle")}</div>
              </div>
            </div>
            <button onClick={handleDownloadQrPoster} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm inline-flex items-center justify-center gap-1.5"><Download className="w-4 h-4" /> {tDash("savePoster")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
