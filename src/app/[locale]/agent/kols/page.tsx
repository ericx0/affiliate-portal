"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

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
}

interface KolsResponse {
  data: Kol[];
  total: number;
}

export default function AgentKols() {
  const [kols, setKols] = useState<Kol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<KolsResponse>("/api/affiliate/agent/kols");
        setKols(data.data ?? []);
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
      <h1 className="text-2xl font-bold">Recruited KOLs</h1>
      {kols.length === 0 ? (
        <p className="text-slate-500">No KOLs recruited yet.</p>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3 text-xs uppercase">Name</th>
                <th className="text-left p-3 text-xs uppercase">Platform</th>
                <th className="text-right p-3 text-xs uppercase">Rate</th>
                <th className="text-right p-3 text-xs uppercase">Earned</th>
                <th className="text-right p-3 text-xs uppercase">Paid</th>
                <th className="text-center p-3 text-xs uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {kols.map((k) => (
                <tr key={k.id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{k.name}</div>
                    <div className="text-xs text-slate-400">{k.email}</div>
                  </td>
                  <td className="p-3 text-sm">{k.primary_platform ?? "-"}</td>
                  <td className="p-3 text-right font-medium">{k.commission_rate}%</td>
                  <td className="p-3 text-right text-green-600">
                    ${Number(k.total_commission_earned || 0).toFixed(2)}
                  </td>
                  <td className="p-3 text-right text-green-600">
                    ${Number(k.total_commission_paid || 0).toFixed(2)}
                  </td>
                  <td className="p-3 text-center text-sm">{k.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
