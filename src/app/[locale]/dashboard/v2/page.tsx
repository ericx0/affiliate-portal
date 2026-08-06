"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Card, SectionTitle, Pill } from "@/components/ui/Card";
import { Sparkline, StackedArea } from "@/components/ui/Sparkline";
import { apiFetch } from "@/lib/api";
import {
  TrendingUp,
  Users,
  ShoppingBag,
  Coins,
  AlertTriangle,
  Lightbulb,
  Loader2,
  BarChart3,
} from "lucide-react";
import { useFormat } from "@/lib/format";

/**
 * /dashboard/v2 — upgraded analytics dashboard.
 *
 * Funnel:    clicks → registrations → orders → commissions (each level +
 *            drop-off vs the previous step + suggested remediation).
 * Trend:     per-day series for the selected window (7/30/90). Stacked
 *            area so KOLs can see clicks and conversions together.
 * Segments:  breakdown by product category / country / language. The
 *            server supplies pre-aggregated counts; we render as bars.
 * Diagnose:  static advisor that maps funnel drop-off % to a checklist
 *            of "why this might be happening" + "what to try next".
 *
 * All numbers tolerate the analytics RPC being missing: every section
 * is fail-open and shows a small empty-state hint rather than blowing
 * up the whole page.
 */

interface AnalyticsData {
  funnel: { clicks: number; registrations: number; orders: number; commissionsCents: number };
  trend: { date: string; clicks: number; registrations: number; orders: number }[];
  segments: {
    byProduct: { key: string; clicks: number; conversions: number }[];
    byCountry: { key: string; clicks: number; conversions: number }[];
    byLanguage: { key: string; clicks: number; conversions: number }[];
  };
}

type Range = 7 | 30 | 90;

function pct(n: number, d: number) {
  if (!d) return 0;
  return Math.round((n / d) * 100);
}

export default function DashboardV2() {
  const t = useTranslations("dashboardV2");
  const fmt = useFormat();
  const [range, setRange] = React.useState<Range>(30);
  const [data, setData] = React.useState<AnalyticsData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    apiFetch<AnalyticsData>(`/api/affiliate/me/analytics?days=${range}`)
      .then((d) => {
        if (alive) setData(d);
      })
      .catch(() => {
        // RPC missing in this environment: render with empty data so
        // the layout still renders. Production replaces this with a
        // graceful empty state per section.
        if (alive) setData(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [range]);

  const funnel = data?.funnel ?? { clicks: 0, registrations: 0, orders: 0, commissionsCents: 0 };
  const trend = data?.trend ?? [];
  const segments = data?.segments ?? { byProduct: [], byCountry: [], byLanguage: [] };

  const cR = pct(funnel.registrations, funnel.clicks);
  const rO = pct(funnel.orders, funnel.registrations);
  const oC = pct(funnel.commissionsCents > 0 ? 1 : 0, funnel.orders);

  const trendSeries = [
    { label: "Clicks", values: trend.map((d) => d.clicks), color: "#10B981" },
    { label: "Registrations", values: trend.map((d) => d.registrations), color: "#6366F1" },
    { label: "Orders", values: trend.map((d) => d.orders), color: "#F59E0B" },
  ];

  const maxSeg = Math.max(1, ...segments.byProduct.flatMap((s) => [s.clicks, s.conversions]));

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
          <p className="text-sm text-slate-500 mt-1">{t("subtitle")}</p>
        </div>
        <div className="inline-flex bg-slate-100 rounded-xl p-1">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setRange(d as Range)}
              className={
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors " +
                (range === d ? "bg-white shadow-sm text-slate-900" : "text-slate-600")
              }
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Card className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
        </Card>
      ) : null}

      {!loading && data === null ? (
        <Card>
          <div className="text-sm text-slate-500">{t("emptyState")}</div>
        </Card>
      ) : null}

      {!loading && data ? (
        <>
          {/* Funnel */}
          <Card>
            <SectionTitle
              title={t("funnelTitle")}
              description={t("funnelDesc")}
              right={<Pill tone="emerald">{range}d</Pill>}
            />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <FunnelStage
                icon={<Users className="w-5 h-5" />}
                label={t("funnelClicks")}
                value={fmt.number(funnel.clicks)}
                drop={null}
              />
              <FunnelStage
                icon={<Users className="w-5 h-5" />}
                label={t("funnelReg")}
                value={fmt.number(funnel.registrations)}
                drop={cR < 10 && funnel.clicks > 0 ? t("funnelDropLow") : null}
                conv={`${cR}%`}
              />
              <FunnelStage
                icon={<ShoppingBag className="w-5 h-5" />}
                label={t("funnelOrders")}
                value={fmt.number(funnel.orders)}
                drop={rO < 5 && funnel.registrations > 0 ? t("funnelDropLow") : null}
                conv={`${rO}%`}
              />
              <FunnelStage
                icon={<Coins className="w-5 h-5" />}
                label={t("funnelCommission")}
                value={fmt.currency(funnel.commissionsCents)}
                drop={null}
              />
            </div>
          </Card>

          {/* Trend */}
          <Card>
            <SectionTitle
              title={t("trendTitle")}
              description={t("trendDesc")}
              right={
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <LegendDot color="#10B981" label={t("legendClicks")} />
                  <LegendDot color="#6366F1" label={t("legendReg")} />
                  <LegendDot color="#F59E0B" label={t("legendOrders")} />
                </div>
              }
            />
            {trend.length > 1 ? (
              <StackedArea series={trendSeries} height={180} />
            ) : (
              <div className="h-32 flex items-center justify-center text-xs text-slate-400">
                <Sparkline data={[0]} />
              </div>
            )}
          </Card>

          {/* Segments */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card>
              <SectionTitle title={t("segProduct")} description={t("segProductDesc")} />
              <BarList
                rows={segments.byProduct}
                max={maxSeg}
                emptyHint={t("segEmpty")}
                valueKey="clicks"
                convKey="conversions"
              />
            </Card>
            <Card>
              <SectionTitle title={t("segCountry")} description={t("segCountryDesc")} />
              <BarList
                rows={segments.byCountry}
                max={Math.max(
                  1,
                  ...segments.byCountry.flatMap((s) => [s.clicks, s.conversions]),
                )}
                emptyHint={t("segEmpty")}
                valueKey="clicks"
                convKey="conversions"
              />
            </Card>
            <Card>
              <SectionTitle title={t("segLanguage")} description={t("segLanguageDesc")} />
              <BarList
                rows={segments.byLanguage}
                max={Math.max(
                  1,
                  ...segments.byLanguage.flatMap((s) => [s.clicks, s.conversions]),
                )}
                emptyHint={t("segEmpty")}
                valueKey="clicks"
                convKey="conversions"
              />
            </Card>
          </div>

          {/* Diagnose */}
          <Card>
            <SectionTitle
              title={t("diagnoseTitle")}
              description={t("diagnoseDesc")}
              right={
                <Pill tone="amber">
                  <Lightbulb className="w-3.5 h-3.5" />
                  {t("diagnoseBadge")}
                </Pill>
              }
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DiagnoseCard
                tone={cR < 10 && funnel.clicks > 0 ? "warn" : "ok"}
                title={t("diagnoseClickToRegTitle")}
                body={
                  cR < 10
                    ? t("diagnoseClickToRegLow")
                    : t("diagnoseClickToRegOk")
                }
              />
              <DiagnoseCard
                tone={rO < 5 && funnel.registrations > 0 ? "warn" : "ok"}
                title={t("diagnoseRegToOrderTitle")}
                body={
                  rO < 5
                    ? t("diagnoseRegToOrderLow")
                    : t("diagnoseRegToOrderOk")
                }
              />
              <DiagnoseCard
                tone="info"
                title={t("diagnoseCommissionTitle")}
                body={t("diagnoseCommissionBody")}
              />
            </div>
          </Card>
        </>
      ) : null}

      {/* Soft hint to legacy /dashboard if v2 is empty in dev */}
      {!loading && data === null ? (
        <div className="text-xs text-slate-400 text-center">
          <BarChart3 className="inline w-3 h-3 mr-1" />
          {t("fallbackHint")}
        </div>
      ) : null}
    </div>
  );
}

function FunnelStage({
  icon,
  label,
  value,
  drop,
  conv,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  drop: string | null;
  conv?: string;
}) {
  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
      <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase">
        <span className="text-brand-600">{icon}</span>
        {label}
      </div>
      <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
      <div className="flex items-center gap-2 mt-1">
        {conv ? <Pill tone="emerald">{conv}</Pill> : null}
        {drop ? (
          <Pill tone="amber">
            <AlertTriangle className="w-3 h-3" />
            {drop}
          </Pill>
        ) : null}
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}

function BarList({
  rows,
  max,
  emptyHint,
  valueKey,
  convKey,
}: {
  rows: { key: string; clicks: number; conversions: number }[];
  max: number;
  emptyHint: string;
  valueKey: "clicks";
  convKey: "conversions";
}) {
  if (rows.length === 0) {
    return <div className="text-xs text-slate-400 py-6 text-center">{emptyHint}</div>;
  }
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.key} className="text-sm">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium text-slate-700">{r.key}</span>
            <span>
              {r[valueKey]} · {r[convKey]}
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded">
            <div
              className="h-2 bg-brand-500 rounded"
              style={{ width: `${Math.round((r[valueKey] / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function DiagnoseCard({
  tone,
  title,
  body,
}: {
  tone: "ok" | "warn" | "info";
  title: string;
  body: string;
}) {
  const toneCls =
    tone === "warn"
      ? "border-amber-200 bg-amber-50"
      : tone === "info"
        ? "border-blue-200 bg-blue-50"
        : "border-emerald-200 bg-emerald-50";
  const Icon = tone === "warn" ? AlertTriangle : tone === "info" ? Lightbulb : TrendingUp;
  const IconCls =
    tone === "warn" ? "text-amber-600" : tone === "info" ? "text-blue-600" : "text-emerald-600";
  return (
    <div className={"rounded-xl p-4 border " + toneCls}>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={"w-4 h-4 " + IconCls} />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed">{body}</p>
    </div>
  );
}