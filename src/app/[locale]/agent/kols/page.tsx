"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";
import { Users, Plus, Sliders, Check, AlertCircle, Loader2 } from "lucide-react";

interface Kol {
  id: string;
  name: string;
  email: string;
  status: string;
  commission_rate: number;
  primary_platform: string | null;
  created_at: string;
  total_commission_earned: number;
  total_commission_paid: number;
  gmv_total: number;
}

interface KolsResponse {
  data: Kol[];
  total: number;
}

function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at < 1) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at);
  const head = local.charAt(0);
  return `${head}***${domain}`;
}

export default function AgentKols() {
  const t = useTranslations("agent");
  const [kols, setKols] = useState<Kol[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Edit Commission Modal State
  const [editingKol, setEditingKol] = useState<Kol | null>(null);
  const [newRate, setNewRate] = useState<number>(5);
  const [updatingRate, setUpdatingRate] = useState(false);
  const [updateMsg, setUpdateMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<KolsResponse>("/api/affiliate/agent/kols");
      setKols(data.data ?? []);
      setTotal(data.total ?? 0);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpdateCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKol) return;
    try {
      setUpdatingRate(true);
      setUpdateMsg("");
      // Backend route is PATCH /api/affiliate/agent/kols/:id (no /commission suffix).
      await apiFetch(`/api/affiliate/agent/kols/${editingKol.id}`, {
        method: "PATCH",
        body: { commission_rate: Number(newRate) },
      });
      setUpdateMsg(t("updateSuccess"));
      setTimeout(() => {
        setEditingKol(null);
        setUpdateMsg("");
        load();
      }, 1200);
    } catch (err: any) {
      setUpdateMsg(t("updateFailed", { error: err.message || t("unknownError") }));
    } finally {
      setUpdatingRate(false);
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
            {t("myKolTeam")} ({total} {t("personUnit")})
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t("kolsSubtitle")}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {showForm ? t("cancelRecruit") : t("recruitNewKol")}
        </button>
      </div>

      {showForm && (
        <NewKolForm
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {kols.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <div className="text-slate-900 font-bold text-lg">{t("emptyTitle")}</div>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            {t("emptyDesc")}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-4 px-6">{t("thKol")}</th>
                <th className="py-4 px-4 text-center">{t("thStatus")}</th>
                <th className="py-4 px-4 text-center">{t("thCommissionRate")}</th>
                <th className="py-4 px-4 text-right">{t("thGmv")}</th>
                <th className="py-4 px-4 text-right">{t("thCommissionEarned")}</th>
                <th className="py-4 px-4 text-right">{t("thJoinedAt")}</th>
                <th className="py-4 px-6 text-right">{t("thAction")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {kols.map((k) => (
                <tr key={k.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-900">{k.name}</div>
                    <div className="text-xs text-slate-400 font-mono">
                      {maskEmail(k.email)}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <StatusBadge status={k.status} />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => {
                        setEditingKol(k);
                        setNewRate(k.commission_rate || 5);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-full font-bold text-xs transition-colors"
                    >
                      <Sliders className="w-3 h-3 text-amber-600" />
                      {k.commission_rate}% {t("commission")}
                    </button>
                  </td>
                  <td className="py-4 px-4 text-right font-medium text-slate-700">
                    {/* gmv_total is summed from commissions.order_amount (cents) */}
                    ${(Number(k.gmv_total || 0) / 100).toFixed(2)}
                  </td>
                  <td className="py-4 px-4 text-right font-bold text-emerald-600">
                    ${Number(k.total_commission_earned || 0).toFixed(2)}
                  </td>
                  <td className="py-4 px-4 text-right text-xs text-slate-400">
                    {k.created_at
                      ? new Date(k.created_at).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => {
                        setEditingKol(k);
                        setNewRate(k.commission_rate || 5);
                      }}
                      className="text-blue-600 hover:text-blue-700 text-xs font-bold"
                    >
                      {t("editRate")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Commission Rate Modal */}
      {editingKol && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full space-y-6 relative shadow-2xl">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {t("editRateModalTitle")}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {t("creatorLabel")}<span className="font-bold">{editingKol.name}</span>
              </p>
            </div>

            <form onSubmit={handleUpdateCommission} className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-700">{t("configCommissionRate")}</span>
                  <span className="text-2xl font-black text-amber-500">
                    {newRate}%
                  </span>
                </div>

                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={newRate}
                  onChange={(e) => setNewRate(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />

                <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
                  <span>{t("rangeMin")}</span>
                  <span>{t("rangeRecommended")}</span>
                  <span>{t("rangeMax")}</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl">
                {t("rateHint")}
              </p>

              {updateMsg && (
                <div
                  className={`text-xs p-3 rounded-xl font-medium ${
                    updateMsg.startsWith("✅")
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {updateMsg}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingKol(null)}
                  className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={updatingRate}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5"
                >
                  {updatingRate ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    t("saveSettings")
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("agent");
  const map: Record<string, { label: string; bg: string; text: string }> = {
    active: { label: t("statusActive"), bg: "bg-emerald-50", text: "text-emerald-700" },
    pending: { label: t("statusPending"), bg: "bg-amber-50", text: "text-amber-700" },
    suspended: { label: t("statusSuspended"), bg: "bg-red-50", text: "text-red-600" },
  };
  const info = map[status] ?? {
    label: status,
    bg: "bg-slate-100",
    text: "text-slate-600",
  };
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${info.bg} ${info.text}`}
    >
      {info.label}
    </span>
  );
}

function NewKolForm({ onCreated }: { onCreated: () => void }) {
  const t = useTranslations("agent");
  const [form, setForm] = useState({
    name: "",
    email: "",
    primary_platform: "tiktok",
    commission_rate: 5,
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErr("");
    try {
      await apiFetch("/api/affiliate/agent/kols", {
        method: "POST",
        body: {
          name: form.name,
          email: form.email,
          primary_platform: form.primary_platform,
          commission_rate: Number(form.commission_rate),
        },
      });
      onCreated();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4"
    >
      <h2 className="font-bold text-slate-900">{t("newKolFormTitle")}</h2>
      {err && <div className="text-red-600 text-xs bg-red-50 p-2.5 rounded-lg">{err}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {t("labelKolName")}
          </label>
          <input
            required
            placeholder={t("placeholderKolName")}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {t("labelEmail")}
          </label>
          <input
            required
            type="email"
            placeholder={t("placeholderEmail")}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {t("labelPlatform")}
          </label>
          <select
            value={form.primary_platform}
            onChange={(e) =>
              setForm({ ...form, primary_platform: e.target.value })
            }
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
          >
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram</option>
            <option value="pinterest">Pinterest</option>
            <option value="youtube">YouTube</option>
            <option value="twitter">X (Twitter)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {t("labelInitialRate")}
          </label>
          <input
            type="number"
            min="1"
            max="10"
            step="0.5"
            value={form.commission_rate}
            onChange={(e) =>
              setForm({ ...form, commission_rate: Number(e.target.value) })
            }
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-amber-600"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
      >
        {submitting ? t("submitting") : t("saveAndBind")}
      </button>
    </form>
  );
}
