"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Stats {
  totalPaid: number;
  totalPending: number;
  totalApproved: number;
  totalClicks: number;
  activeCodes: number;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_AFFILIATE_API_URL}/api/affiliate/me/stats`, {
        headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
      });
      const data = await res.json();
      setStats(data);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!stats) return <div>No data</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Overview</h1>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Paid (affiliate earnings)" value={`$${stats.totalPaid.toFixed(2)}`} color="green" />
        <StatCard label="Pending (not yet paid)" value={`$${(stats.totalPending + stats.totalApproved).toFixed(2)}`} color="blue" />
        <StatCard label="Active codes" value={stats.activeCodes} color="brand" />
      </div>

      <p className="text-xs text-slate-400 italic">
        Affiliate earnings are referral fees for promoting administrative services. LCM does not provide medical advice, diagnosis, or treatment.
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