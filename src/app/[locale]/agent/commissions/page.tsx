"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Commission {
  id: string;
  order_id: string;
  commission_type: string;
  order_amount: number;
  commission_rate: number;
  commission_amount: number;
  currency: string;
  status: string;
  created_at: string;
  paid_at: string | null;
}

interface CommissionsResponse {
  data: Commission[];
  total: number;
}

export default function AgentCommissions() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<CommissionsResponse>("/api/affiliate/agent/commissions");
        setCommissions(data.data ?? []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Override Commissions</h1>
      {commissions.length === 0 ? (
        <p className="text-slate-500">No override commissions yet.</p>
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
  );
}
