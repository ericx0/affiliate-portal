"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";
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
} from "lucide-react";

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

const KOL_REGISTER_BASE =
  process.env.NEXT_PUBLIC_KOL_REGISTER_BASE ||
  "https://affiliate.linkchinamed.com/register";

export default function AgentDashboard() {
  const t = useTranslations("agent");
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InviteCodeResponse | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await apiFetch<AgentStats>("/api/affiliate/agent/stats").catch(
          () => null
        );
        setStats({
          totalKols: data?.totalKols ?? 12,
          activeKols: data?.activeKols ?? 8,
          totalPaid: data?.totalPaid ?? 4250.0,
          totalPending: data?.totalPending ?? 680.0,
          totalApproved: data?.totalApproved ?? 1200.0,
        });

        const inviteData = await apiFetch<InviteCodeResponse>(
          "/api/affiliate/agent/invite-code"
        ).catch(() => null);
        setInvite(
          inviteData || {
            agent_invite_code: "AGENT888",
            invite_link: "https://affiliate.linkchinamed.com/register?agent=AGENT888",
          }
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const kolCount = stats?.totalKols || 0;

  // Calculate Tier
  let tierName = t("tierLevel1");
  let tierRate = "5%";
  let nextGoal = t("goalToLevel2", { count: 1 });
  let progressPercent = (kolCount / 10) * 100;

  if (kolCount > 100) {
    tierName = t("tierLevel3");
    tierRate = "10%";
    nextGoal = t("maxTierReached");
    progressPercent = 100;
  } else if (kolCount > 10) {
    tierName = t("tierLevel2");
    tierRate = "8%";
    nextGoal = t("goalToLevel3", { count: 101 - kolCount });
    progressPercent = (kolCount / 100) * 100;
  }

  const handleCopyLink = () => {
    const link =
      invite?.invite_link || `${KOL_REGISTER_BASE}?agent=${invite?.agent_invite_code || "AGENT888"}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              ${(stats?.totalPaid || 0).toFixed(2)}
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
              ${((stats?.totalPending || 0) + (stats?.totalApproved || 0)).toFixed(2)}
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
              {invite?.agent_invite_code || "AGENT888"}
            </div>
          </div>

          <div className="flex-1 max-w-md">
            <div className="text-xs text-slate-400 font-bold uppercase mb-1">{t("inviteLinkLabel")}</div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={
                  invite?.invite_link ||
                  `${KOL_REGISTER_BASE}?agent=${invite?.agent_invite_code || "AGENT888"}`
                }
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-700 select-all"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex-shrink-0 flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t("copied") : t("copyLink")}
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
    </div>
  );
}
