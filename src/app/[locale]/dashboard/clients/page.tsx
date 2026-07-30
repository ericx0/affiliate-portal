"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, SectionTitle, Pill } from "@/components/ui/Card";
import {
  AGE_RANGES,
  BUDGET_BUCKETS,
  HEALTH_CONCERNS,
  KolClient,
  listClients,
} from "@/lib/clients";
import { Loader2, Plus, Search, Filter, UserPlus } from "lucide-react";

const STATUS_TONES: Record<KolClient["status"], "slate" | "blue" | "amber" | "emerald" | "rose"> = {
  lead: "slate",
  engaged: "blue",
  qualified: "amber",
  converted: "emerald",
  inactive: "rose",
};

export default function ClientsListPage() {
  const t = useTranslations("clients");
  const [clients, setClients] = React.useState<KolClient[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [countryFilter, setCountryFilter] = React.useState<string>("all");
  const [ageFilter, setAgeFilter] = React.useState<string>("all");
  const [budgetFilter, setBudgetFilter] = React.useState<string>("all");

  React.useEffect(() => {
    listClients().then((d) => {
      setClients(d);
      setLoading(false);
    });
  }, []);

  const filtered = clients.filter((c) => {
    if (search && !c.displayName.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (countryFilter !== "all" && c.countryCode !== countryFilter) return false;
    if (ageFilter !== "all" && c.ageRange !== ageFilter) return false;
    if (budgetFilter !== "all" && c.budgetBracket !== budgetFilter) return false;
    return true;
  });

  const countryOptions = React.useMemo(
    () => Array.from(new Set(clients.map((c) => c.countryCode).filter(Boolean))) as string[],
    [clients],
  );

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("listTitle")}</h1>
          <p className="text-sm text-slate-500 mt-1">{t("listSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/clients/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600"
          >
            <UserPlus className="w-4 h-4" />
            {t("proxyRegisterCta")}
          </Link>
          <Link
            href="/dashboard/clients/new"
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50"
          >
            <Plus className="w-4 h-4" />
            {t("addClientCta")}
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>
          <FilterSelect
            label={t("filterStatus")}
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: t("filterAll") },
              { value: "lead", label: t("statusLead") },
              { value: "engaged", label: t("statusEngaged") },
              { value: "qualified", label: t("statusQualified") },
              { value: "converted", label: t("statusConverted") },
              { value: "inactive", label: t("statusInactive") },
            ]}
          />
          <FilterSelect
            label={t("filterCountry")}
            value={countryFilter}
            onChange={setCountryFilter}
            options={[
              { value: "all", label: t("filterAll") },
              ...countryOptions.map((c) => ({ value: c, label: c })),
            ]}
          />
          <FilterSelect
            label={t("filterAge")}
            value={ageFilter}
            onChange={setAgeFilter}
            options={[
              { value: "all", label: t("filterAll") },
              ...AGE_RANGES.map((a) => ({ value: a, label: a })),
            ]}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <Filter className="w-3.5 h-3.5" />
          <span>{t("filterExtra")}</span>
          <select
            value={budgetFilter}
            onChange={(e) => setBudgetFilter(e.target.value)}
            className="px-2 py-1 border border-slate-200 rounded-md text-xs bg-white"
          >
            <option value="all">{t("filterAllBudgets")}</option>
            {BUDGET_BUCKETS.map((b) => (
              <option key={b} value={b}>
                {t(`budget_${b}` as any)}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card padded={false}>
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <div className="text-sm">{t("emptyTitle")}</div>
            <div className="text-xs text-slate-400 mt-1">{t("emptyDesc")}</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4 text-left">{t("thName")}</th>
                  <th className="py-3 px-4 text-left">{t("thStatus")}</th>
                  <th className="py-3 px-4 text-left">{t("thCountry")}</th>
                  <th className="py-3 px-4 text-left">{t("thAge")}</th>
                  <th className="py-3 px-4 text-left">{t("thBudget")}</th>
                  <th className="py-3 px-4 text-left">{t("thNextFollowUp")}</th>
                  <th className="py-3 px-4 text-left">{t("thActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{c.displayName}</div>
                      {c.contactChannel ? (
                        <div className="text-xs text-slate-500">
                          {c.contactChannel}: {c.contactHandle}
                        </div>
                      ) : null}
                    </td>
                    <td className="py-3 px-4">
                      <Pill tone={STATUS_TONES[c.status]}>{t(`status_${c.status}` as any)}</Pill>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{c.countryCode ?? "—"}</td>
                    <td className="py-3 px-4 text-slate-600">{c.ageRange ?? "—"}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {c.budgetBracket ? t(`budget_${c.budgetBracket}` as any) : "—"}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {c.nextFollowUpAt ? new Date(c.nextFollowUpAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/dashboard/clients/${c.id}`}
                        className="text-brand-600 hover:text-brand-700 text-xs font-semibold"
                      >
                        {t("openCta")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Discoverability — surface the health-concern filter as inline chips so the
          KOL can spot patterns across their book ("half my leads are fertility"). */}
      <Card>
        <SectionTitle title={t("byConcernTitle")} description={t("byConcernDesc")} />
        <div className="flex flex-wrap gap-2">
          {HEALTH_CONCERNS.map((h) => {
            const count = clients.filter((c) =>
              (c.healthConcerns ?? []).includes(h),
            ).length;
            return (
              <span
                key={h}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs"
              >
                <span className="font-semibold text-slate-700">{t(`concern_${h}` as any)}</span>
                <span className="text-slate-400">{count}</span>
              </span>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-600 mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}