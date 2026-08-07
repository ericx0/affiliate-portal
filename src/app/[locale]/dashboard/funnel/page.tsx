"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, Pill } from "@/components/ui/Card";
import { fetchFunnel, FunnelData } from "@/lib/funnel";
import {
  Activity,
  Coins,
  DollarSign,
  Eye,
  Heart,
  Loader2,
  MessageCircle,
  Send,
  Share2,
  TrendingUp,
  Users,
} from "lucide-react";
import { useFormat } from "@/lib/format";

/**
 * /dashboard/funnel — T4 cross-platform UTM funnel dashboard.
 *
 *   - Summary cards (clicks / sign-ups / orders / commission)
 *   - Per-platform breakdown
 *   - Daily trend (stacked area-style — we render as bars)
 *   - Engagement aggregate from published_posts
 */

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export default function FunnelPage() {
  const t = useTranslations("funnel");
  const fmt = useFormat();
  const [data, setData] = React.useState<FunnelData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [days, setDays] = React.useState<number>(30);

  React.useEffect(() => {
    setLoading(true);
    const to = new Date();
    const from = new Date(to.getTime() - days * 86400 * 1000);
    fetchFunnel({ from: from.toISOString(), to: to.toISOString() }).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [days]);

  if (loading) {
    return (
      <div className="space-y-6 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
            <p className="text-sm text-slate-500 mt-1">{t("subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={
                  "px-3 py-1 rounded-lg text-xs font-semibold " +
                  (days === d ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200")
                }
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        <Card>
          <div className="min-h-[300px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            <span className="ml-3 text-sm text-slate-500">{t("loading")}</span>
          </div>
        </Card>
      </div>
    );
  }

  if (!data || (data.summary.clicks === 0 && data.engagement.posts === 0)) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
        <p className="text-sm text-slate-500">{t("noData")}</p>
        <Link
          href="/dashboard/publish/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600"
        >
          <Send className="w-4 h-4" />
          {t("openPublishHub")}
        </Link>
      </div>
    );
  }

  const maxDailyClicks = Math.max(1, ...data.daily.map((d) => d.clicks));

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
          <p className="text-sm text-slate-500 mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={
                "px-3 py-1 rounded-lg text-xs font-semibold " +
                (days === d ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200")
              }
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-bold text-slate-900">{t("summaryTitle")}</div>
            <div className="text-xs text-slate-500">{t("summaryWindow", { days: data.window.days })}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <SummaryCard
            icon={<Activity className="w-5 h-5 text-blue-600" />}
            label={t("summaryClicks")}
            value={fmt.number(data.summary.clicks)}
            tone="bg-blue-50"
          />
          <SummaryCard
            icon={<Users className="w-5 h-5 text-emerald-600" />}
            label={t("summarySignUps")}
            value={fmt.number(data.summary.signUps)}
            sub={pct(data.summary.conversionRate)}
            tone="bg-emerald-50"
          />
          <SummaryCard
            icon={<DollarSign className="w-5 h-5 text-amber-600" />}
            label={t("summaryOrders")}
            value={fmt.number(data.summary.orders)}
            tone="bg-amber-50"
          />
          <SummaryCard
            icon={<Coins className="w-5 h-5 text-emerald-700" />}
            label={t("summaryCommission")}
            value={fmt.currency(data.summary.commissionCents ?? 0)}
            tone="bg-emerald-50"
          />
          <SummaryCard
            icon={<TrendingUp className="w-5 h-5 text-rose-600" />}
            label={t("summaryConversion")}
            value={pct(data.summary.conversionRate)}
            tone="bg-rose-50"
          />
        </div>
      </Card>

      <Card>
        <div className="mb-3">
          <div className="text-sm font-bold text-slate-900">{t("byPlatformTitle")}</div>
          <div className="text-xs text-slate-500">{t("byPlatformDesc")}</div>
        </div>
        {data.byPlatform.length === 0 ? (
          <div className="text-center py-6 text-sm text-slate-400">{t("noData")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2 px-3">{t("platformCol")}</th>
                  <th className="py-2 px-3">{t("clicksCol")}</th>
                  <th className="py-2 px-3">{t("signupsCol")}</th>
                  <th className="py-2 px-3">{t("ordersCol")}</th>
                  <th className="py-2 px-3">{t("commissionCol")}</th>
                  <th className="py-2 px-3">{t("conversionCol")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.byPlatform
                  .sort((a, b) => b.clicks - a.clicks)
                  .map((row) => (
                    <tr key={row.platform} className="hover:bg-slate-50">
                      <td className="py-3 px-3">
                        <Pill tone="blue">{row.platform}</Pill>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">{fmt.number(row.clicks)}</td>
                      <td className="py-3 px-3 font-mono text-slate-700">{fmt.number(row.signUps)}</td>
                      <td className="py-3 px-3 font-mono text-slate-700">{fmt.number(row.orders)}</td>
                      <td className="py-3 px-3 font-mono text-slate-700">{fmt.currency(row.commissionCents ?? 0)}</td>
                      <td className="py-3 px-3 font-mono text-slate-700">{pct(row.conversionRate)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <div className="mb-3">
          <div className="text-sm font-bold text-slate-900">{t("dailyTitle")}</div>
          <div className="text-xs text-slate-500">{t("dailyDesc")}</div>
        </div>
        <div className="flex items-end gap-1 h-40 mt-2">
          {data.daily.map((d) => {
            const clicksH = (d.clicks / maxDailyClicks) * 100;
            const signUpsH = d.clicks > 0 ? (d.signUps / maxDailyClicks) * 100 : 0;
            const ordersH = d.clicks > 0 ? (d.orders / maxDailyClicks) * 100 : 0;
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full" title={`${d.date}: ${d.clicks} clicks / ${d.signUps} sign-ups / ${d.orders} orders`}>
                <div className="w-full flex flex-col justify-end h-full">
                  <div className="bg-blue-200" style={{ height: `${clicksH}%` }} />
                  <div className="bg-emerald-300" style={{ height: `${signUpsH}%` }} />
                  <div className="bg-amber-400" style={{ height: `${ordersH}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 inline-block bg-blue-200 rounded" /> {t("summaryClicks")}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 inline-block bg-emerald-300 rounded" /> {t("summarySignUps")}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 inline-block bg-amber-400 rounded" /> {t("summaryOrders")}
          </span>
        </div>
      </Card>

      <Card>
        <div className="mb-3">
          <div className="text-sm font-bold text-slate-900">{t("engagementTitle")}</div>
          <div className="text-xs text-slate-500">{t("engagementDesc")}</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <EngagementCard icon={<Heart className="w-4 h-4 text-rose-500" />} label={t("metricLikes")} value={data.engagement.likes} />
          <EngagementCard icon={<Share2 className="w-4 h-4 text-emerald-500" />} label={t("metricShares")} value={data.engagement.shares} />
          <EngagementCard icon={<MessageCircle className="w-4 h-4 text-blue-500" />} label={t("metricComments")} value={data.engagement.comments} />
          <EngagementCard icon={<Eye className="w-4 h-4 text-amber-500" />} label={t("metricImpressions")} value={data.engagement.impressions} />
          <EngagementCard icon={<Send className="w-4 h-4 text-slate-500" />} label={t("metricPosts")} value={data.engagement.posts} />
        </div>
      </Card>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone: string;
}) {
  return (
    <div className={"rounded-2xl p-4 border border-slate-100 " + tone}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      {sub ? <div className="text-xs text-slate-500 mt-1">{sub}</div> : null}
    </div>
  );
}

function EngagementCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  const fmt = useFormat();
  return (
    <div className="rounded-xl p-3 bg-slate-50 border border-slate-100">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs font-semibold text-slate-600">{label}</span>
      </div>
      <div className="text-lg font-bold text-slate-900">{fmt.number(value)}</div>
    </div>
  );
}
