"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useFormat } from "@/lib/format";

function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at < 1) return email;
  return `${email.charAt(0)}***${email.slice(at)}`;
}

interface Kol {
  id: string;
  name: string;
  email: string;
  status: string;
  commission_rate: number;
  primary_platform: string | null;
  primary_platform_url: string | null;
  brand_name: string | null;
  bio: string | null;
  total_commission_earned: number;
  total_commission_paid: number;
  created_at: string;
}

interface Commission {
  id: string;
  order_id: string;
  commission_type: string;
  order_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
}

export default function KolDetail() {
  const params = useParams();
  const id = params.id as string;
  const t = useTranslations("kolDetail");
  const tNav = useTranslations("nav");
  const fmt = useFormat();
  const [kol, setKol] = useState<Kol | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rateForm, setRateForm] = useState<{ show: boolean; rate: number; submitting: boolean }>({
    show: false,
    rate: 10,
    submitting: false,
  });

  const load = async () => {
    try {
      const [kolResp, commResp] = await Promise.all([
        apiFetch<{ data: Kol }>(`/api/affiliate/agent/kols/${id}`),
        apiFetch<{ data: Commission[]; total: number }>(`/api/affiliate/agent/kols/${id}/commissions`),
      ]);
      setKol(kolResp.data);
      setCommissions(commResp.data ?? []);
      setRateForm((r) => ({ ...r, rate: kolResp.data?.commission_rate ?? 10 }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const suspend = async () => {
    if (!window.confirm(t("suspendConfirm"))) return;
    try {
      await apiFetch(`/api/affiliate/agent/kols/${id}/suspend`, {
        method: "POST",
        // reason is stored in audit logs as English data — not user-facing UI.
        body: { reason: "Suspended by agent" },
      });
      await load();
    } catch (e: unknown) {
      window.alert(e instanceof Error ? e.message : String(e));
    }
  };

  const activate = async () => {
    try {
      await apiFetch(`/api/affiliate/agent/kols/${id}/activate`, { method: "POST" });
      await load();
    } catch (e: unknown) {
      window.alert(e instanceof Error ? e.message : String(e));
    }
  };

  const saveRate = async () => {
    setRateForm((r) => ({ ...r, submitting: true }));
    try {
      await apiFetch(`/api/affiliate/agent/kols/${id}`, {
        method: "PATCH",
        body: { commission_rate: rateForm.rate },
      });
      setRateForm((r) => ({ ...r, show: false, submitting: false }));
      await load();
    } catch (e: unknown) {
      window.alert(e instanceof Error ? e.message : String(e));
      setRateForm((r) => ({ ...r, submitting: false }));
    }
  };

  if (loading) return <div>{tNav("loading")}</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!kol) return <div>{t("notFound")}</div>;

  return (
    <div className="space-y-6">
      <Link href="/agent/kols" className="text-sm text-slate-500">{t("backToKols")}</Link>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{kol.name}</h1>
          <p className="text-sm text-slate-400">{maskEmail(kol.email)}</p>
          {kol.brand_name && <p className="text-sm text-slate-500">{kol.brand_name}</p>}
        </div>
        <div className="flex gap-2">
          {kol.status === "active" ? (
            <button onClick={suspend} className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg">
              {t("suspend")}
            </button>
          ) : (
            <button onClick={activate} className="px-3 py-1.5 text-sm border border-green-300 text-green-600 rounded-lg">
              {t("activate")}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border">
          <div className="text-xs text-slate-400 uppercase">{t("commissionRate")}</div>
          <div className="text-xl font-bold mt-1">{kol.commission_rate}%</div>
          {!rateForm.show && (
            <button
              onClick={() => setRateForm({ show: true, rate: kol.commission_rate, submitting: false })}
              className="text-xs text-blue-600 mt-1"
            >
              {t("change")}
            </button>
          )}
        </div>
        <div className="bg-white p-4 rounded-2xl border">
          <div className="text-xs text-slate-400 uppercase">{t("earned")}</div>
          <div className="text-xl font-bold mt-1 text-green-600">
            ${Number(kol.total_commission_earned || 0).toFixed(2)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border">
          <div className="text-xs text-slate-400 uppercase">{t("paid")}</div>
          <div className="text-xl font-bold mt-1 text-green-600">
            ${Number(kol.total_commission_paid || 0).toFixed(2)}
          </div>
        </div>
      </div>

      {rateForm.show && (
        <div className="bg-white p-4 rounded-2xl border flex items-center gap-3">
          <span className="text-sm">{t("newRate")}</span>
          <input
            type="number"
            min={0}
            max={10}
            step={0.5}
            value={rateForm.rate}
            onChange={(e) => setRateForm({ ...rateForm, rate: Number(e.target.value) })}
            className="p-2 border rounded w-24"
          />
          <button
            onClick={saveRate}
            disabled={rateForm.submitting}
            className="px-3 py-1.5 text-sm text-white rounded-lg disabled:opacity-50"
            style={{ background: "#7c3aed" }}
          >
            {rateForm.submitting ? t("saving") : t("save")}
          </button>
          <button
            onClick={() => setRateForm({ show: false, rate: kol.commission_rate, submitting: false })}
            className="px-3 py-1.5 text-sm border rounded-lg"
          >
            {t("cancel")}
          </button>
        </div>
      )}

      <div>
        <h2 className="font-bold mb-3">{t("commissionHistory", { count: commissions.length })}</h2>
        {commissions.length === 0 ? (
          <p className="text-slate-500">{t("noCommissions")}</p>
        ) : (
          <div className="bg-white rounded-2xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-3 text-xs uppercase">{t("type")}</th>
                  <th className="text-right p-3 text-xs uppercase">{t("orderAmt")}</th>
                  <th className="text-right p-3 text-xs uppercase">{t("rate")}</th>
                  <th className="text-right p-3 text-xs uppercase">{t("commission")}</th>
                  <th className="text-center p-3 text-xs uppercase">{t("status")}</th>
                  <th className="text-right p-3 text-xs uppercase">{t("date")}</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-3 text-sm">{c.commission_type}</td>
                    {/* order_amount / commission_amount are stored in cents (migration 010) */}
                    <td className="p-3 text-right">${(Number(c.order_amount || 0) / 100).toFixed(2)}</td>
                    <td className="p-3 text-right">{c.commission_rate}%</td>
                    <td className="p-3 text-right font-medium text-green-600">
                      ${(Number(c.commission_amount || 0) / 100).toFixed(2)}
                    </td>
                    <td className="p-3 text-center text-sm">{c.status}</td>
                    <td className="p-3 text-right text-xs text-slate-400">
                      {c.created_at ? fmt.date(c.created_at) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}