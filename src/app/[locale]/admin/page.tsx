"use client";

import { useEffect, useState } from "react";
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
      setCreateMsg("❌ 邮箱和密码为必填项");
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
      setCreateMsg("✅ 代理账号创建成功！初始等级: Level 1 (5%)");
      setTimeout(() => {
        setShowCreateModal(false);
        setNewAgentEmail("");
        setNewAgentPassword("");
        setNewAgentName("");
        setCreateMsg("");
        loadAdminData();
      }, 1500);
    } catch (err: any) {
      setCreateMsg(`❌ 创建失败: ${err.message || "未知错误"}`);
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
            联盟平台管理员控制台 (Admin Portal)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            独立管理全球代理机构、审核打款、进行防刷风控与 KYC 审查
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          新增代理 (Add Agent)
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold">全平台代理数</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {agents.length} 家
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold">全平台代发总佣金</div>
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
            <div className="text-xs text-slate-400 font-bold">待处理风控预警</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {fraudFlags.length} 件
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
          代理机构列表 ({agents.length})
        </button>
        <button
          onClick={() => setActiveTab("fraud")}
          className={`pb-3 font-bold text-sm transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "fraud"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          风控预警队列 ({fraudFlags.length})
        </button>
        <button
          onClick={() => setActiveTab("payouts")}
          className={`pb-3 font-bold text-sm transition-colors border-b-2 ${
            activeTab === "payouts"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          打款管理 ({payouts.length})
        </button>
      </div>

      {/* Tab 1: Agent List Table */}
      {activeTab === "agents" && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-4 px-6">代理机构名称 / 账号</th>
                <th className="py-4 px-4 text-center">专属邀请码</th>
                <th className="py-4 px-4 text-center">下属 KOL 数</th>
                <th className="py-4 px-4 text-center">代理点位等级</th>
                <th className="py-4 px-4 text-right">带货总额 (GMV)</th>
                <th className="py-4 px-4 text-right">已发佣金</th>
                <th className="py-4 px-6 text-right">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agents.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    暂无代理机构，点击右上角「新增代理」创建
                  </td>
                </tr>
              )}
              {agents.map((a) => {
                let tierText = "Level 1 (5%)";
                if (a.kol_count > 100) tierText = "Level 3 (10%)";
                else if (a.kol_count > 10) tierText = "Level 2 (8%)";

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
                      {a.kol_count} 人 (活跃: {a.kol_active_count})
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
                        正常活跃
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
              <div className="font-bold text-slate-900">风控审计安全</div>
              <p className="text-xs text-slate-500">
                暂无异常碰撞或自推自买涉嫌违规订单
              </p>
            </div>
          ) : (
            <div className="text-left">
              {/* Fraud flags list */}
              <p>风控列表</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Payouts */}
      {activeTab === "payouts" && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">待打款佣金</h3>
            <button
              onClick={async () => {
                try {
                  await apiFetch("/api/affiliate/admin/payout/batch", { method: "POST" });
                  loadAdminData();
                } catch (e: any) {
                  alert(e.message || "批量打款失败");
                }
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold"
            >
              批量打款
            </button>
          </div>
          {payouts.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">暂无待打款记录</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">推广者</th>
                  <th className="py-3 px-4">金额</th>
                  <th className="py-3 px-4">状态</th>
                  <th className="py-3 px-4">月份</th>
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
                新建代理机构账号
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                创建独立代理账号（分配角色 `role='agent'`），代理可直接登录招募 KOL
              </p>
            </div>

            <form onSubmit={handleCreateAgent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  代理机构/公司名称 *
                </label>
                <input
                  required
                  placeholder="例如: Dubai Health Agency LLC"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  代理登录邮箱 *
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
                  初始登录密码 * (线下将密码告知代理)
                </label>
                <input
                  required
                  type="text"
                  placeholder="初始密码 (至少8位)"
                  value={newAgentPassword}
                  onChange={(e) => setNewAgentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
                <div className="font-bold">初始佣金与规则提示：</div>
                <p>
                  新代理默认起始点位为 **Level 1 (5%)**。当招募 KOL 满 10 个后系统自动升级为 **8%**，满 100 个升级为 **10%**。
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
                  "确认创建代理"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
