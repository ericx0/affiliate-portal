"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Loader2,
  Sliders,
  X,
  Building2,
} from "lucide-react";

interface AgentRecord {
  id: string;
  name: string;
  email: string;
  agent_invite_code: string;
  kol_count: number;
  kol_active_count: number;
  gmv_total: number;
  commission_paid: number;
  status: string;
  created_at: string;
}

interface FraudFlag {
  id: string;
  promoter_id: string;
  order_id: string;
  reason: string;
  status: string;
  created_at: string;
}

export default function AdminAffiliateDashboard() {
  const t = useTranslations("admin");
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [fraudFlags, setFraudFlags] = useState<FraudFlag[]>([]);
  const [payouts, setPayouts] = useState<{ promoter_id?: string; commission_amount?: number; status?: string; month_key?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"agents" | "fraud" | "payouts">("agents");

  // Create Agent Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAgentEmail, setNewAgentEmail] = useState("");
  const [newAgentPassword, setNewAgentPassword] = useState("");
  const [newAgentName, setNewAgentName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState("");

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    try {
      setLoading(true);
      const agentData = await apiFetch<AgentRecord[]>(
        "/api/affiliate/admin/agents",
      ).catch(() => []);
      setAgents(agentData || []);

      const flagData = await apiFetch<FraudFlag[]>(
        "/api/affiliate/admin/fraud-flags",
      ).catch(() => []);
      setFraudFlags(flagData || []);

      const payoutData = await apiFetch<
        { promoter_id?: string; commission_amount?: number; status?: string; month_key?: string }[]
      >("/api/affiliate/admin/payouts").catch(() => []);
      setPayouts(payoutData || []);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentEmail || !newAgentPassword) {
      setCreateMsg(t("validationEmailPasswordRequired"));
      return;
    }
    try {
      setCreating(true);
      setCreateMsg("");
      await apiFetch("/api/affiliate/promoters/agent", {
        method: "POST",
        body: {
          email: newAgentEmail,
          password: newAgentPassword,
          name: newAgentName || newAgentEmail.split("@")[0],
          role: "agent",
        },
      });
      setCreateMsg(t("createSuccess"));
      setTimeout(() => {
        setShowCreateModal(false);
        setNewAgentEmail("");
        setNewAgentPassword("");
        setNewAgentName("");
        setCreateMsg("");
        loadAdminData();
      }, 1500);
    } catch (err: any) {
      setCreateMsg(t("createFailed", { reason: err.message || t("unknownError") }));
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t("pageTitle")}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t("pageSubtitle")}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          {t("addAgent")}
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold">{t("statTotalAgents")}</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {t("statTotalAgentsValue", { count: agents.length })}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold">{t("statTotalCommission")}</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              $
              {agents
                .reduce((acc, a) => acc + (a.commission_paid || 0), 0)
                .toFixed(2)}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold">{t("statPendingFraud")}</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {t("statPendingFraudValue", { count: fraudFlags.length })}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-8">
        <button
          onClick={() => setActiveTab("agents")}
          className={`pb-3 font-bold text-sm transition-colors border-b-2 ${
            activeTab === "agents"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          {t("agentListTab", { count: agents.length })}
        </button>
        <button
          onClick={() => setActiveTab("fraud")}
          className={`pb-3 font-bold text-sm transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "fraud"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          {t("fraudQueueTab", { count: fraudFlags.length })}
        </button>
        <button
          onClick={() => setActiveTab("payouts")}
          className={`pb-3 font-bold text-sm transition-colors border-b-2 ${
            activeTab === "payouts"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          {t("payoutManagementTab", { count: payouts.length })}
        </button>
      </div>

      {/* Tab 1: Agent List Table */}
      {activeTab === "agents" && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-4 px-6">{t("thAgentName")}</th>
                <th className="py-4 px-4 text-center">{t("thInviteCode")}</th>
                <th className="py-4 px-4 text-center">{t("thKolCount")}</th>
                <th className="py-4 px-4 text-center">{t("thTierLevel")}</th>
                <th className="py-4 px-4 text-right">{t("thGmv")}</th>
                <th className="py-4 px-4 text-right">{t("thCommissionPaid")}</th>
                <th className="py-4 px-6 text-right">{t("thStatus")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agents.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    {t("emptyAgents")}
                  </td>
                </tr>
              )}
              {agents.map((a) => {
                let tierText = t("tierLevel1");
                if (a.kol_count > 100) tierText = t("tierLevel3");
                else if (a.kol_count > 10) tierText = t("tierLevel2");

                return (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{a.name}</div>
                      <div className="text-xs text-slate-400 font-mono">
                        {a.email}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center font-mono font-bold text-blue-600 text-xs">
                      {a.agent_invite_code}
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-slate-700">
                      {t("kolCountDisplay", { total: a.kol_count, active: a.kol_active_count })}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {tierText}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-medium text-slate-700">
                      ${a.gmv_total.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-emerald-600">
                      ${a.commission_paid.toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                        {t("statusActive")}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Fraud Flags */}
      {activeTab === "fraud" && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center text-slate-400 text-sm">
          {fraudFlags.length === 0 ? (
            <div className="space-y-2 py-8">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto" />
              <div className="font-bold text-slate-900">{t("fraudSafeTitle")}</div>
              <p className="text-xs text-slate-500">
                {t("fraudSafeDescription")}
              </p>
            </div>
          ) : (
            <div className="text-left">
              {/* Fraud flags list */}
              <p>{t("fraudListPlaceholder")}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Payouts */}
      {activeTab === "payouts" && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">{t("pendingPayoutsTitle")}</h3>
            <button
              onClick={async () => {
                try {
                  await apiFetch("/api/affiliate/admin/payout/batch", { method: "POST" });
                  loadAdminData();
                } catch (e: any) {
                  alert(e.message || t("batchPayoutFailed"));
                }
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold"
            >
              {t("batchPayout")}
            </button>
          </div>
          {payouts.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">{t("emptyPayouts")}</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">{t("thPromoter")}</th>
                  <th className="py-3 px-4">{t("thAmount")}</th>
                  <th className="py-3 px-4">{t("thStatus")}</th>
                  <th className="py-3 px-4">{t("thMonth")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payouts.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-4 px-4 font-mono text-xs">{p.promoter_id?.slice(0, 8) || "-"}</td>
                    <td className="py-4 px-4 font-bold">${((p.commission_amount || 0) / 100).toFixed(2)}</td>
                    <td className="py-4 px-4"><span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">{p.status}</span></td>
                    <td className="py-4 px-4 text-slate-500">{p.month_key || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* MODAL: 新增代理 Modal (Create Agent Modal) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full space-y-6 relative shadow-2xl">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {t("createAgentModalTitle")}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {t("createAgentModalDescription")}
              </p>
            </div>

            <form onSubmit={handleCreateAgent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t("labelAgentName")}
                </label>
                <input
                  required
                  placeholder={t("placeholderAgentName")}
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t("labelAgentEmail")}
                </label>
                <input
                  required
                  type="email"
                  placeholder="partner@agency.com"
                  value={newAgentEmail}
                  onChange={(e) => setNewAgentEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t("labelAgentPassword")}
                </label>
                <input
                  required
                  type="text"
                  placeholder={t("placeholderPassword")}
                  value={newAgentPassword}
                  onChange={(e) => setNewAgentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
                <div className="font-bold">{t("noticeTitle")}</div>
                <p>
                  {t("noticeBody")}
                </p>
              </div>

              {createMsg && (
                <div
                  className={`text-xs p-3 rounded-xl font-medium ${
                    createMsg.startsWith("✅")
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {createMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={creating}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t("confirmCreateAgent")
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
