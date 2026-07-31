"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Card, Pill } from "@/components/ui/Card";
import {
  HistoryFilters,
  HistoryRow,
  PLATFORM_LABELS,
  PLATFORMS,
  Platform,
  listHistory,
  refreshMetrics,
} from "@/lib/social";
import {
  ExternalLink,
  Filter,
  Heart,
  Loader2,
  MessageCircle,
  RefreshCcw,
  Send,
  Share2,
} from "lucide-react";

/**
 * /dashboard/publish/history — Published + scheduled posts.
 *
 * Filters: platform / status / range. Each row shows the body preview,
 * status, engagement metrics (likes / shares / comments / clicks),
 * and the external URL (when published).
 *
 * "Refresh metrics" calls POST /api/social/refresh-metrics which
 * re-hits each platform's insight endpoint and updates published_posts.
 */

const STATUS_TONE: Record<
  HistoryRow["status"],
  { tone: "emerald" | "amber" | "blue" | "slate" | "rose"; key: string }
> = {
  pending: { tone: "slate", key: "statusPending" },
  scheduled: { tone: "blue", key: "statusScheduled" },
  publishing: { tone: "amber", key: "statusPublishing" },
  published: { tone: "emerald", key: "statusPublished" },
  failed: { tone: "rose", key: "statusFailed" },
};

export default function HistoryPage() {
  const t = useTranslations("publishHistory");
  const [rows, setRows] = React.useState<HistoryRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filters, setFilters] = React.useState<HistoryFilters>({});
  const [refreshing, setRefreshing] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    const d = await listHistory(filters);
    setRows(d);
    setLoading(false);
  }, [filters]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleRefresh(id: string) {
    setRefreshing(id);
    try {
      await refreshMetrics(id);
      await refresh();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setRefreshing(null);
    }
  }

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
          <p className="text-sm text-slate-500 mt-1">{t("subtitle")}</p>
        </div>
        <a
          href="/dashboard/publish/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600"
        >
          <Send className="w-4 h-4" />
          {t("ctaNew")}
        </a>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-3 text-xs text-slate-500">
          <Filter className="w-3.5 h-3.5" />
          {t("filters")}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={filters.platform ?? ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                platform: (e.target.value || undefined) as Platform | undefined,
              }))
            }
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
          >
            <option value="">{t("allPlatforms")}</option>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {PLATFORM_LABELS[p]}
              </option>
            ))}
          </select>
          <select
            value={filters.status ?? ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                status: (e.target.value || undefined) as HistoryRow["status"] | undefined,
              }))
            }
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
          >
            <option value="">{t("allStatuses")}</option>
            <option value="scheduled">{t("statusScheduled")}</option>
            <option value="publishing">{t("statusPublishing")}</option>
            <option value="published">{t("statusPublished")}</option>
            <option value="failed">{t("statusFailed")}</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={filters.from?.slice(0, 10) ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  from: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                }))
              }
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
            <input
              type="date"
              value={filters.to?.slice(0, 10) ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  to: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                }))
              }
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="flex items-center justify-center h-40">
          <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-sm text-slate-500">{t("emptyState")}</div>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <HistoryCard
              key={r.id}
              row={r}
              refreshing={refreshing === r.id}
              onRefresh={() => handleRefresh(r.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryCard({
  row,
  refreshing,
  onRefresh,
}: {
  row: HistoryRow;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const t = useTranslations("publishHistory");
  const status = STATUS_TONE[row.status];
  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Pill tone="blue">{PLATFORM_LABELS[row.platform]}</Pill>
            <Pill tone={status.tone}>{t(status.key)}</Pill>
            {row.language ? <Pill tone="slate">{row.language.toUpperCase()}</Pill> : null}
            {row.scheduledAt ? (
              <span className="text-xs text-slate-400">
                {row.publishedAt
                  ? new Date(row.publishedAt).toLocaleString()
                  : new Date(row.scheduledAt).toLocaleString()}
              </span>
            ) : null}
          </div>
          <p className="text-sm text-slate-800 whitespace-pre-wrap line-clamp-3">
            {row.bodyPreview}
            {row.bodyPreview.length >= 240 ? "…" : ""}
          </p>

          {row.metrics ? (
            <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                {row.metrics.likes ?? 0}
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5 text-blue-500" />
                {row.metrics.comments ?? 0}
              </span>
              <span className="inline-flex items-center gap-1">
                <Share2 className="w-3.5 h-3.5 text-emerald-500" />
                {row.metrics.shares ?? 0}
              </span>
              {row.metrics.impressions != null ? (
                <span className="text-slate-400">
                  {row.metrics.impressions.toLocaleString()} {t("impressions")}
                </span>
              ) : null}
            </div>
          ) : null}

          {row.errorMessage ? (
            <div className="mt-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2">
              {row.errorMessage}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {row.externalUrl ? (
            <a
              href={row.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {t("open")}
            </a>
          ) : null}
          {row.status === "published" ? (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold disabled:opacity-50"
            >
              {refreshing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCcw className="w-3.5 h-3.5" />
              )}
              {t("refreshMetrics")}
            </button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
