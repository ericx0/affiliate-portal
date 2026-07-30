"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";
import { Card, SectionTitle, Pill } from "@/components/ui/Card";
import { Sparkline } from "@/components/ui/Sparkline";
import { Calculator, FileDown, Loader2, Receipt, Wallet } from "lucide-react";

interface Earning {
  id: string;
  date: string;
  amountCents: number;
  status: "pending" | "approved" | "paid" | "reversed";
  referredOrderId: string;
  timeline: { label: string; at: string | null }[];
}

interface TaxFormStatus {
  formType: "w9" | "w8ben" | null;
  status: "approved" | "pending" | "rejected" | "missing";
  year: number;
}

interface TaxDoc {
  year: number;
  url: string | null;
  kind: "1099-NEC" | "summary";
  generatedAt: string;
}

interface Projection {
  dailyAvgCents: number;
  projected30Cents: number;
  trend: number[];
}

/**
 * /dashboard/earnings — upgraded with:
 *   - 1099-NEC download (US persons) + annual summary (non-US).
 *   - Payout history in-line.
 *   - Projection calculator: input a daily-traffic assumption → projected
 *     30-day commission. Uses recent rolling average as the baseline so
 *     KOLs can plan their cashflow.
 *
 * Tax docs come from GET /api/affiliate/me/tax-docs (returns URLs to
 * pre-rendered PDFs in storage). If the endpoint is not yet deployed,
 * the section falls back to "available soon" without breaking the page.
 */
export default function EarningsPage() {
  const t = useTranslations("earnings");
  const tProj = useTranslations("earningsProjection");
  const tTax = useTranslations("earningsTax");
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [taxForm, setTaxForm] = useState<TaxFormStatus | null>(null);
  const [taxDocs, setTaxDocs] = useState<TaxDoc[]>([]);
  const [projection, setProjection] = useState<Projection | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [dailyTraffic, setDailyTraffic] = useState<number>(5);

  useEffect(() => {
    (async () => {
      try {
        const d = await apiFetch<{ data: Earning[] }>("/api/affiliate/me/earnings");
        setEarnings(d.data ?? []);
      } catch {
        setEarnings([]);
      }
      // Each of these endpoints is best-effort — fail-open so the page
      // works even if the backend hasn't shipped the new routes yet.
      apiFetch<{ data: TaxFormStatus | null }>("/api/affiliate/me/tax-form")
        .then((d) => setTaxForm(d.data ?? null))
        .catch(() => setTaxForm(null));
      apiFetch<{ data: TaxDoc[] }>("/api/affiliate/me/tax-docs")
        .then((d) => setTaxDocs(d.data ?? []))
        .catch(() => setTaxDocs([]));
      apiFetch<Projection>("/api/affiliate/me/commission-projection?days=30")
        .then((p) => setProjection(p))
        .catch(() => setProjection(null));
      setLoading(false);
    })();
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

  const total = filtered.reduce((sum, e) => sum + e.amountCents / 100, 0);

  const projected = useMemo(() => {
    if (!projection) return null;
    // Linear extrapolation: user-supplied daily traffic × $/click ratio.
    const dailyAvg = projection.dailyAvgCents / 100;
    const perTrafficUnit = projection.dailyAvgCents / Math.max(1, dailyTraffic);
    const next = perTrafficUnit * dailyTraffic * 30;
    return { nextCents: Math.round(next), dailyAvg };
  }, [projection, dailyTraffic]);

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
        <p className="text-sm text-slate-500 mt-1">{t("description")}</p>
      </div>

      {/* Projection calculator */}
      <Card>
        <SectionTitle
          title={tProj("title")}
          description={tProj("desc")}
          right={<Pill tone="emerald"><Calculator className="w-3.5 h-3.5" />{tProj("badge")}</Pill>}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {tProj("inputLabel")}
            </label>
            <input
              type="number"
              min={0}
              value={dailyTraffic}
              onChange={(e) => setDailyTraffic(Number(e.target.value) || 0)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
            />
            <p className="text-xs text-slate-400 mt-1.5">{tProj("inputHint")}</p>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-700 mb-1.5">
              {tProj("currentAvg")}
            </div>
            <div className="text-2xl font-bold text-slate-900">
              ${projection ? (projection.dailyAvgCents / 100).toFixed(2) : "—"}
              <span className="text-xs font-normal text-slate-400 ml-1">/day</span>
            </div>
            <div className="mt-2 h-12">
              {projection && projection.trend.length > 1 ? (
                <Sparkline data={projection.trend} height={48} />
              ) : (
                <div className="text-xs text-slate-400">{tProj("loadingTrend")}</div>
              )}
            </div>
          </div>
          <div className="bg-brand-50 border border-brand-100 rounded-xl p-4">
            <div className="text-xs font-semibold text-brand-700 mb-1">
              {tProj("projectedLabel")}
            </div>
            <div className="text-2xl font-bold text-brand-700">
              ${projected ? (projected.nextCents / 100).toFixed(2) : "—"}
            </div>
            <div className="text-xs text-brand-700/70 mt-1">
              {tProj("next30Label")}
            </div>
          </div>
        </div>
      </Card>

      {/* Tax docs */}
      <Card>
        <SectionTitle
          title={tTax("title")}
          description={tTax("desc")}
          right={<Pill tone="amber"><Receipt className="w-3.5 h-3.5" />{tTax("badge")}</Pill>}
        />
        {taxForm === null ? (
          <div className="text-xs text-slate-400">{tTax("loadingStatus")}</div>
        ) : taxForm.status === "missing" ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            {tTax("missingWarning")}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-slate-500">
              {tTax("currentStatus", {
                formType: taxForm.formType ?? "—",
                status: taxForm.status,
              })}
            </div>
            <ul className="divide-y divide-slate-100 border border-slate-100 rounded-xl">
              {taxDocs.length === 0 ? (
                <li className="p-4 text-xs text-slate-400">{tTax("noDocs")}</li>
              ) : (
                taxDocs.map((doc) => (
                  <li key={doc.year} className="flex items-center justify-between p-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {doc.kind} · {doc.year}
                      </div>
                      <div className="text-xs text-slate-500">
                        {tTax("generatedAt", {
                          date: new Date(doc.generatedAt).toLocaleDateString(),
                        })}
                      </div>
                    </div>
                    {doc.url ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 text-white text-xs font-semibold rounded-lg hover:bg-brand-600"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        {tTax("download")}
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">{tTax("processing")}</span>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </Card>

      {/* Payout history */}
      <Card>
        <SectionTitle
          title={t("payoutHistory")}
          description={t("payoutHistoryDesc")}
          right={<Pill tone="blue"><Wallet className="w-3.5 h-3.5" />{t("badge")}</Pill>}
        />
        <PayoutHistoryTable />
      </Card>

      {/* Earnings table */}
      <Card>
        <SectionTitle title={t("title")} description={t("description")} />
        <div className="flex gap-3 mb-4 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
          >
            <option value="all">{t("filterAllStatuses")}</option>
            <option value="pending">{t("statusPending")}</option>
            <option value="approved">{t("statusApproved")}</option>
            <option value="paid">{t("statusPaid")}</option>
            <option value="reversed">{t("statusReversed")}</option>
          </select>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
          >
            <option value="all">{t("filterAllMonths")}</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <div className="ml-auto px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm">
            {t("totalLabel")} <span className="font-bold">${total.toFixed(2)}</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-slate-50 p-8 rounded-xl border border-slate-100 text-center text-slate-500 text-sm">
            {t("emptyState")}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="px-4 py-3">{t("thDate")}</th>
                  <th className="px-4 py-3">{t("thOrder")}</th>
                  <th className="px-4 py-3">{t("thStatus")}</th>
                  <th className="px-4 py-3 text-right">{t("thAmount")}</th>
                  <th className="px-4 py-3">{t("thTimeline")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500">{e.date}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {e.referredOrderId.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          e.status === "paid"
                            ? "text-emerald-600 font-medium"
                            : e.status === "reversed"
                              ? "text-rose-600 font-medium"
                              : "text-slate-600"
                        }
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      ${(e.amountCents / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {e.timeline
                        .filter((item) => item.at)
                        .map((item) => item.label)
                        .join(" → ") || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function PayoutHistoryTable() {
  const t = useTranslations("payouts");
  const [payouts, setPayouts] = useState<
    { id: string; paidAt: string; amountCents: number; method: string; stripeTransferId: string | null; earningsCount: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ data: typeof payouts }>("/api/affiliate/me/payouts")
      .then((d) => setPayouts(d.data ?? []))
      .catch(() => setPayouts([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
      </div>
    );
  }
  if (payouts.length === 0) {
    return <div className="text-xs text-slate-400">{t("emptyState")}</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-100 text-xs text-slate-400 uppercase font-semibold">
          <tr>
            <th className="py-3 px-4 text-left">{t("thPaidOn")}</th>
            <th className="py-3 px-4 text-left">{t("thMethod")}</th>
            <th className="py-3 px-4 text-left">{t("thEarnings")}</th>
            <th className="py-3 px-4 text-left">{t("thAmount")}</th>
            <th className="py-3 px-4 text-left">{t("thStripeTransferId")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {payouts.map((p) => (
            <tr key={p.id}>
              <td className="py-3 px-4 text-slate-500">{new Date(p.paidAt).toLocaleDateString()}</td>
              <td className="py-3 px-4 text-slate-600 capitalize">{p.method}</td>
              <td className="py-3 px-4 text-slate-500">{p.earningsCount}</td>
              <td className="py-3 px-4 font-bold text-slate-900">${(p.amountCents / 100).toFixed(2)}</td>
              <td className="py-3 px-4 font-mono text-xs text-slate-500">{p.stripeTransferId ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}