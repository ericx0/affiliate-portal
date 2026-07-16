"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface AgentStats {
  totalKols: number;
  activeKols: number;
  totalPaid: number;
  totalPending: number;
  totalApproved: number;
}

export default function AgentDashboard() {
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<AgentStats>("/api/affiliate/agent/stats");
        setStats(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!stats) return <div>No data</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Agent Dashboard</h1>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Recruited KOLs" value={stats.totalKols} color="brand" />
        <StatCard label="Active KOLs" value={stats.activeKols} color="blue" />
        <StatCard label="Override Paid" value={`$${Number(stats.totalPaid || 0).toFixed(2)}`} color="green" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Pending (cooling down)" value={`$${Number(stats.totalPending || 0).toFixed(2)}`} color="amber" />
        <StatCard label="Approved (awaiting payout)" value={`$${Number(stats.totalApproved || 0).toFixed(2)}`} color="blue" />
      </div>

      <p className="text-xs text-slate-400 italic">
        Agent override commissions are paid on orders placed by KOLs you recruited.
      </p>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border">
      <div className="text-xs text-slate-400 uppercase font-bold">{label}</div>
      <div className={`text-2xl font-bold text-${color}-600 mt-2`}>{value}</div>
    </div>
  );
}
