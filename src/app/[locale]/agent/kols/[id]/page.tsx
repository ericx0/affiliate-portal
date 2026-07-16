"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

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
    if (!window.confirm("Suspend this KOL? They will stop earning commissions.")) return;
    try {
      await apiFetch(`/api/affiliate/agent/kols/${id}/suspend`, {
        method: "POST",
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!kol) return <div>KOL not found.</div>;

  return (
    <div className="space-y-6">
      <Link href="/agent/kols" className="text-sm text-slate-500">← Back to KOLs</Link>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{kol.name}</h1>
          <p className="text-sm text-slate-400">{kol.email}</p>
          {kol.brand_name && <p className="text-sm text-slate-500">{kol.brand_name}</p>}
        </div>
        <div className="flex gap-2">
          {kol.status === "active" ? (
            <button onClick={suspend} className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg">
              Suspend
            </button>
          ) : (
            <button onClick={activate} className="px-3 py-1.5 text-sm border border-green-300 text-green-600 rounded-lg">
              Activate
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border">
          <div className="text-xs text-slate-400 uppercase">Commission rate</div>
          <div className="text-xl font-bold mt-1">{kol.commission_rate}%</div>
          {!rateForm.show && (
            <button
              onClick={() => setRateForm({ show: true, rate: kol.commission_rate, submitting: false })}
              className="text-xs text-blue-600 mt-1"
            >
              Change
            </button>
          )}
        </div>
        <div className="bg-white p-4 rounded-2xl border">
          <div className="text-xs text-slate-400 uppercase">Earned</div>
          <div className="text-xl font-bold mt-1 text-green-600">
            ${Number(kol.total_commission_earned || 0).toFixed(2)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border">
          <div className="text-xs text-slate-400 uppercase">Paid</div>
          <div className="text-xl font-bold mt-1 text-green-600">
            ${Number(kol.total_commission_paid || 0).toFixed(2)}
          </div>
        </div>
      </div>

      {rateForm.show && (
        <div className="bg-white p-4 rounded-2xl border flex items-center gap-3">
          <span className="text-sm">New rate (%):</span>
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
            {rateForm.submitting ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => setRateForm({ show: false, rate: kol.commission_rate, submitting: false })}
            className="px-3 py-1.5 text-sm border rounded-lg"
          >
            Cancel
          </button>
        </div>
      )}

      <div>
        <h2 className="font-bold mb-3">Commission history ({commissions.length})</h2>
        {commissions.length === 0 ? (
          <p className="text-slate-500">No commissions yet.</p>
        ) : (
          <div className="bg-white rounded-2xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-3 text-xs uppercase">Type</th>
                  <th className="text-right p-3 text-xs uppercase">Order Amt</th>
                  <th className="text-right p-3 text-xs uppercase">Rate</th>
                  <th className="text-right p-3 text-xs uppercase">Commission</th>
                  <th className="text-center p-3 text-xs uppercase">Status</th>
                  <th className="text-right p-3 text-xs uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-3 text-sm">{c.commission_type}</td>
                    <td className="p-3 text-right">${Number(c.order_amount || 0).toFixed(2)}</td>
                    <td className="p-3 text-right">{c.commission_rate}%</td>
                    <td className="p-3 text-right font-medium text-green-600">
                      ${Number(c.commission_amount || 0).toFixed(2)}
                    </td>
                    <td className="p-3 text-center text-sm">{c.status}</td>
                    <td className="p-3 text-right text-xs text-slate-400">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : "-"}
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
