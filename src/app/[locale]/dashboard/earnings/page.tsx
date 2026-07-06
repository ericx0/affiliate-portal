"use client";

import { useEffect, useMemo, useState } from "react";

interface Earning {
  id: string;
  date: string;
  amountUsd: number;
  status: "pending" | "approved" | "paid" | "reversed";
  referredOrderId: string;
  timeline: { label: string; at: string | null }[];
}

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_AFFILIATE_API_URL}/api/affiliate/me/earnings`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setEarnings(d.data ?? []))
      .catch(() => setEarnings([]))
      .finally(() => setLoading(false));
  }, []);

  const months = useMemo(() => {
    const set = new Set(earnings.map((e) => e.date.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [earnings]);

  const filtered = earnings.filter((e) => {
    if (statusFilter !== "all" && e.status !== statusFilter) return false;
    if (monthFilter !== "all" && !e.date.startsWith(monthFilter)) return false;
    return true;
  });

  const total = filtered.reduce((sum, e) => sum + e.amountUsd, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Earnings</h1>
      <p className="text-sm text-slate-600 mb-6">
        Affiliate commissions on qualifying purchases. Status updates as referred orders progress.
      </p>

      <div className="flex gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-xl text-sm bg-white"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="paid">Paid</option>
          <option value="reversed">Reversed</option>
        </select>
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="px-3 py-2 border rounded-xl text-sm bg-white"
        >
          <option value="all">All months</option>
          {months.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <div className="ml-auto px-4 py-2 bg-white border rounded-xl text-sm">
          Total: <span className="font-bold">${total.toFixed(2)}</span>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border text-center text-slate-500">
          No earnings yet.
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Amount (USD)</th>
                <th className="px-4 py-3">Timeline</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="px-4 py-3 text-slate-500">{e.date}</td>
                  <td className="px-4 py-3 font-mono text-xs">{e.referredOrderId.slice(0, 8)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        e.status === "paid"
                          ? "text-green-600"
                          : e.status === "reversed"
                          ? "text-red-600"
                          : "text-slate-600"
                      }
                    >
                      {e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">${e.amountUsd.toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {e.timeline
                      .filter((t) => t.at)
                      .map((t) => t.label)
                      .join(" → ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}