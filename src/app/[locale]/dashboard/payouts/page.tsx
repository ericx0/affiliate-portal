"use client";

import { useEffect, useState } from "react";

interface Payout {
  id: string;
  paidAt: string;
  amountUsd: number;
  method: "stripe" | "manual";
  stripeTransferId: string | null;
  earningsCount: number;
}

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPaid, setTotalPaid] = useState(0);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_AFFILIATE_API_URL}/api/affiliate/me/payouts`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        const list: Payout[] = d.data ?? [];
        setPayouts(list);
        setTotalPaid(list.reduce((sum, p) => sum + p.amountUsd, 0));
      })
      .catch(() => setPayouts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Payout History</h1>
      <p className="text-sm text-slate-600 mb-6">
        Affiliate commissions that have been paid out to your connected account.
      </p>

      <div className="mb-4 p-4 bg-white border rounded-xl inline-block">
        <div className="text-xs text-slate-500">Lifetime paid</div>
        <div className="text-2xl font-bold">${totalPaid.toFixed(2)}</div>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : payouts.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border text-center text-slate-500">
          No payouts yet. Payouts are issued after the refund window closes on referred orders.
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3">Paid On</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Earnings</th>
                <th className="px-4 py-3 text-right">Amount (USD)</th>
                <th className="px-4 py-3">Stripe Transfer ID</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(p.paidAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 capitalize">{p.method}</td>
                  <td className="px-4 py-3">{p.earningsCount}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">
                    ${p.amountUsd.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {p.stripeTransferId ?? "—"}
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