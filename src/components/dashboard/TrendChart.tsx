"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  CartesianGrid,
  Line,
  LineChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { apiFetch } from "@/lib/api";

// Shape of one bucket in GET /api/affiliate/me/analytics -> trend[].
// The endpoint zero-fills every day in the window, so the line never
// breaks on a day with no activity.
interface TrendPoint {
  date: string;
  clicks: number;
  signups: number;
  orders: number;
}

interface AnalyticsResponse {
  trend?: TrendPoint[];
}

const ALLOWED_DAYS = [7, 30, 90];
const DEFAULT_DAYS = 30;

/** "30d" -> 30. The analytics endpoint only accepts 7 | 30 | 90. */
export function rangeToDays(range: string): number {
  const days = Number.parseInt(range, 10);
  return ALLOWED_DAYS.includes(days) ? days : DEFAULT_DAYS;
}

export default function TrendChart({ range = "30d" }: { range?: string }) {
  const t = useTranslations("dashboard");
  const [data, setData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    apiFetch<AnalyticsResponse>(
      `/api/affiliate/me/analytics?days=${rangeToDays(range)}`
    )
      .then((res) => {
        if (alive) setData(res?.trend ?? []);
      })
      .catch(() => {
        // Fail open: an empty chart with the empty-state hint beats
        // taking the whole dashboard down.
        if (alive) setData([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [range]);

  const hasData = data.some((d) => d.clicks > 0 || d.orders > 0);

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
      <h2 className="text-base font-bold text-slate-900">{t("trendChart")}</h2>
      {loading ? (
        <div className="h-[300px] rounded-2xl bg-slate-50 animate-pulse" />
      ) : !hasData ? (
        <div className="h-[300px] flex items-center justify-center text-sm text-slate-400">
          {t("chartEmpty")}
        </div>
      ) : (
        <div role="img" aria-label={t("trendChart")}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip />
              <Legend />
              {/* Animation off: satisfies prefers-reduced-motion without a
                  media-query hook, and a static chart reads fine. */}
              <Line
                type="monotone"
                dataKey="clicks"
                name={t("chartClicks")}
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="orders"
                name={t("chartOrders")}
                stroke="#059669"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
