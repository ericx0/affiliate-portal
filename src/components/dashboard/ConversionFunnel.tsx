"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { apiFetch } from "@/lib/api";

// GET /api/affiliate/funnel -> data.summary. `orders` counts orders that
// carry a commission row, i.e. paid orders.
interface FunnelResponse {
  data?: {
    summary?: {
      clicks: number;
      signUps: number;
      orders: number;
    };
  };
}

interface Stage {
  name: string;
  value: number;
}

const STAGE_COLORS = ["#2563eb", "#0891b2", "#059669"];

export default function ConversionFunnel() {
  const t = useTranslations("dashboard");
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    apiFetch<FunnelResponse>("/api/affiliate/funnel")
      .then((res) => {
        const summary = res?.data?.summary;
        if (!alive) return;
        setStages([
          { name: t("chartClicks"), value: summary?.clicks ?? 0 },
          { name: t("chartSignups"), value: summary?.signUps ?? 0 },
          { name: t("chartOrders"), value: summary?.orders ?? 0 },
        ]);
      })
      .catch(() => {
        if (alive) setStages([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // `t` is stable per locale; stage labels only need rebuilding on fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasData = stages.some((s) => s.value > 0);

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
      <h2 className="text-base font-bold text-slate-900">{t("conversionFunnel")}</h2>
      {loading ? (
        <div className="h-[300px] rounded-2xl bg-slate-50 animate-pulse" />
      ) : !hasData ? (
        <div className="h-[300px] flex items-center justify-center text-sm text-slate-400">
          {t("chartEmpty")}
        </div>
      ) : (
        <div role="img" aria-label={t("conversionFunnel")}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stages}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                {stages.map((stage, i) => (
                  <Cell key={stage.name} fill={STAGE_COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
