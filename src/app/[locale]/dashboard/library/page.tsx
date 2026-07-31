"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, SectionTitle, Pill } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import {
  INDUSTRIES,
  LANGUAGES,
  LibraryAsset,
  LibraryCase,
  LibraryItem,
  LibraryScript,
  listLibrary,
  PRODUCT_CATEGORIES,
  SCENARIOS,
} from "@/lib/library";
import {
  BookOpen,
  Copy,
  Check,
  Download,
  Image as ImageIcon,
  Loader2,
  MessageSquareQuote,
  Search,
  Sparkles,
  Stethoscope,
  Video,
} from "lucide-react";

type Tab = "assets" | "scripts" | "cases";

/**
 * /dashboard/library — combined hub for the three sub-libraries:
 *   Assets  — videos / images / copy, filtered by product + language.
 *   Scripts — sales talk-tracks (cold outreach, objection, follow-up, intro)
 *             with one-click copy.
 *   Cases   — anonymized real-world outcomes. Country + treatment filter.
 *
 * Each sub-library is best-effort: if the backend hasn't shipped the
 * /api/affiliate/library/[type] endpoint yet, the page renders the
 * empty-state copy without breaking the dashboard layout.
 */
export default function LibraryPage() {
  const t = useTranslations("library");
  const [tab, setTab] = React.useState<Tab>("assets");
  const [items, setItems] = React.useState<LibraryItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Filters
  const [search, setSearch] = React.useState("");
  const [language, setLanguage] = React.useState<string>("all");
  const [category, setCategory] = React.useState<string>("all");
  const [scenario, setScenario] = React.useState<string>("all");
  const [industry, setIndustry] = React.useState<string>("all");
  const [country, setCountry] = React.useState<string>("all");

  React.useEffect(() => {
    setLoading(true);
    const filters: Record<string, string | undefined> = {
      language: language === "all" ? undefined : language,
      productCategory: category === "all" ? undefined : category,
      scenario: scenario === "all" ? undefined : scenario,
      industry: industry === "all" ? undefined : industry,
      country: country === "all" ? undefined : country,
    };
    listLibrary(tab, filters).then((d) => {
      setItems(d);
      setLoading(false);
    });
  }, [tab, language, category, scenario, industry, country]);

  const tabs: { id: Tab; label: React.ReactNode }[] = [
    { id: "assets", label: t("tabAssets") },
    { id: "scripts", label: t("tabScripts") },
    { id: "cases", label: t("tabCases") },
  ];

  const filtered = items.filter((it) => {
    if (!search) return true;
    const haystack = `${(it as any).titleEn ?? ""} ${(it as any).titleZh ?? ""} ${(it as any).summaryEn ?? ""} ${(it as any).contentEn ?? ""}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
        <p className="text-sm text-slate-500 mt-1">{t("subtitle")}</p>
      </div>

      <div className="flex flex-col gap-4">
        <Tabs tabs={tabs} active={tab} onChange={(id) => setTab(id as Tab)} />

        <Card>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
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
              label={t("filterLanguage")}
              value={language}
              onChange={setLanguage}
              options={[
                { value: "all", label: t("filterAll") },
                ...LANGUAGES.map((l) => ({ value: l, label: l.toUpperCase() })),
              ]}
            />
            {tab === "assets" ? (
              <FilterSelect
                label={t("filterCategory")}
                value={category}
                onChange={setCategory}
                options={[
                  { value: "all", label: t("filterAll") },
                  ...PRODUCT_CATEGORIES.map((c) => ({ value: c, label: c })),
                ]}
              />
            ) : tab === "scripts" ? (
              <FilterSelect
                label={t("filterScenario")}
                value={scenario}
                onChange={setScenario}
                options={[
                  { value: "all", label: t("filterAll") },
                  ...SCENARIOS.map((s) => ({
                    value: s,
                    label: t(`scenario_${s}` as any),
                  })),
                ]}
              />
            ) : (
              <FilterSelect
                label={t("filterCountry")}
                value={country}
                onChange={setCountry}
                options={[
                  { value: "all", label: t("filterAll") },
                  { value: "CN", label: "CN" },
                  { value: "US", label: "US" },
                  { value: "DE", label: "DE" },
                  { value: "JP", label: "JP" },
                  { value: "KR", label: "KR" },
                  { value: "IN", label: "IN" },
                  { value: "TH", label: "TH" },
                ]}
              />
            )}
          </div>
          {tab === "scripts" ? (
            <div className="mt-3">
              <FilterSelect
                label={t("filterIndustry")}
                value={industry}
                onChange={setIndustry}
                options={[
                  { value: "all", label: t("filterAll") },
                  ...INDUSTRIES.map((s) => ({
                    value: s,
                    label: t(`industry_${s}` as any),
                  })),
                ]}
              />
            </div>
          ) : null}
        </Card>
      </div>

      {loading ? (
        <Card className="flex items-center justify-center h-40">
          <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <div className="text-sm text-slate-500">{t("emptyState")}</div>
            <div className="text-xs text-slate-400 mt-1">{t("emptyDesc")}</div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) =>
            item.type === "assets" ? (
              <AssetCard key={item.id} asset={item} />
            ) : item.type === "scripts" ? (
              <ScriptCard key={item.id} script={item} />
            ) : (
              <CaseCard key={item.id} caseItem={item} />
            ),
          )}
        </div>
      )}
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

function AssetCard({ asset }: { asset: LibraryAsset }) {
  const t = useTranslations("library");
  const Icon =
    asset.kind === "video" ? Video : asset.kind === "image" ? ImageIcon : MessageSquareQuote;
  return (
    <Card padded={false} className="overflow-hidden flex flex-col">
      {asset.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={asset.thumbnailUrl}
          alt={asset.titleEn}
          className="w-full h-36 object-cover bg-slate-100"
        />
      ) : (
        <div className="w-full h-36 bg-slate-50 flex items-center justify-center text-slate-400">
          <Icon className="w-8 h-8" />
        </div>
      )}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <Pill tone="emerald">{asset.kind}</Pill>
          <Pill tone="slate">{asset.language.toUpperCase()}</Pill>
          <Pill tone="blue">{asset.productCategory}</Pill>
        </div>
        <h3 className="text-sm font-semibold text-slate-900">{asset.titleEn}</h3>
        {asset.titleZh ? (
          <h4 className="text-xs text-slate-500 mt-0.5">{asset.titleZh}</h4>
        ) : null}
        <div className="mt-auto pt-3 flex items-center gap-2">
          {asset.kind === "copy" ? (
            <CopyButton text={asset.contentUrl} />
          ) : (
            <a
              href={asset.contentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 text-white text-xs font-semibold rounded-lg hover:bg-brand-600"
            >
              <Download className="w-3.5 h-3.5" />
              {t("open")}
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}

function ScriptCard({ script }: { script: LibraryScript }) {
  const t = useTranslations("library");
  const body = script.contentEn;
  return (
    <Card className="flex flex-col">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <Pill tone="blue">{t(`scenario_${script.scenario}` as any)}</Pill>
        <Pill tone="emerald">{t(`industry_${script.industry}` as any)}</Pill>
        <Pill tone="slate">{script.language.toUpperCase()}</Pill>
        {script.followUpDay != null ? (
          <Pill tone="amber">D{script.followUpDay}</Pill>
        ) : null}
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{script.titleEn}</h3>
      {script.titleZh ? (
        <h4 className="text-xs text-slate-500 mt-0.5">{script.titleZh}</h4>
      ) : null}
      <p className="text-xs text-slate-600 mt-2 line-clamp-4 whitespace-pre-wrap leading-relaxed">
        {body}
      </p>
      <div className="mt-auto pt-3">
        <CopyButton text={body} full />
      </div>
    </Card>
  );
}

function CaseCard({ caseItem }: { caseItem: LibraryCase }) {
  const t = useTranslations("library");
  const cost =
    caseItem.costRangeLowCents && caseItem.costRangeHighCents
      ? `$${Math.round(caseItem.costRangeLowCents / 100).toLocaleString()} – $${Math.round(
          caseItem.costRangeHighCents / 100,
        ).toLocaleString()}`
      : null;
  return (
    <Link href={`/dashboard/cases/${caseItem.id}`} className="block">
      <Card className="flex flex-col hover:border-brand-300 transition-colors cursor-pointer">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Pill tone="blue">{caseItem.treatmentCategory}</Pill>
          <Pill tone="slate">{caseItem.country}</Pill>
          <Pill tone="emerald">{caseItem.ageRange}</Pill>
          <Pill tone="amber">{t(`gender_${caseItem.gender}` as any)}</Pill>
        </div>
        <h3 className="text-sm font-semibold text-slate-900">{caseItem.hospital}</h3>
        <p className="text-xs text-slate-600 mt-2 line-clamp-3">{caseItem.summaryEn}</p>
        <p className="text-xs text-slate-500 mt-2 line-clamp-3 italic">
          <span className="font-semibold text-slate-700">{t("outcome")}: </span>
          {caseItem.outcomeEn}
        </p>
        {cost ? (
          <div className="text-xs text-brand-700 font-semibold mt-3">{cost}</div>
        ) : null}
        <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-600">
          <Sparkles className="w-3 h-3" />
          <span>{t("open")} → AI rewrite</span>
        </div>
      </Card>
    </Link>
  );
}

function CopyButton({ text, full }: { text: string; full?: boolean }) {
  const t = useTranslations("library");
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className={
        "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg " +
        (full
          ? "bg-brand-500 text-white hover:bg-brand-600"
          : "border border-slate-200 text-slate-700 hover:bg-slate-50")
      }
    >
      {copied ? (
        <Check className="w-3.5 h-3.5" />
      ) : (
        <BookOpen className="w-3.5 h-3.5" />
      )}
      {copied ? t("copied") : t("copy")}
    </button>
  );
}