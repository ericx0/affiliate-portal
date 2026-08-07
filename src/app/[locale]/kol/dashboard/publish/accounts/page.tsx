"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  AccountStatus,
  ConnectedAccount,
  PLATFORM_LABELS,
  PLATFORM_LOGOS,
  PLATFORMS,
  Platform,
  disconnectPlatform,
  listAccounts,
  startOAuth,
} from "@/lib/social";
import { useFormat } from "@/lib/format";
import { Card, Pill } from "@/components/ui/Card";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Hourglass,
  Loader2,
  Power,
  RefreshCcw,
  XCircle,
} from "lucide-react";

/**
 * /dashboard/publish/accounts — Connected platforms grid.
 *
 * Shows all 6 platforms. Each card surfaces:
 *   - connection status (with icon)
 *   - profile picture / display name when connected
 *   - permission scopes
 *   - connect / disconnect / re-authorise buttons
 *
 * On a successful OAuth callback the URL contains ?connected=ig (or
 * similar). We read that flag and show a one-time confirmation toast.
 */

function statusBadge(status: AccountStatus): {
  icon: React.ReactNode;
  tone: "emerald" | "amber" | "rose" | "slate" | "blue";
  key: string;
} {
  switch (status) {
    case "connected":
      return { icon: <CheckCircle2 className="w-3.5 h-3.5" />, tone: "emerald", key: "statusConnected" };
    case "expiring":
      return { icon: <Hourglass className="w-3.5 h-3.5" />, tone: "amber", key: "statusExpiring" };
    case "expired":
      return { icon: <AlertTriangle className="w-3.5 h-3.5" />, tone: "amber", key: "statusExpired" };
    case "revoked":
      return { icon: <XCircle className="w-3.5 h-3.5" />, tone: "rose", key: "statusRevoked" };
    case "pending_review":
      return { icon: <Hourglass className="w-3.5 h-3.5" />, tone: "blue", key: "statusPendingReview" };
    default:
      return { icon: <Power className="w-3.5 h-3.5" />, tone: "slate", key: "statusNotConnected" };
  }
}

export default function AccountsPage() {
  const t = useTranslations("publishAccounts");
  const fmt = useFormat();
  const params = useSearchParams();
  const justConnected = params.get("connected");
  const oauthError = params.get("error");
  const [accounts, setAccounts] = React.useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState<Platform | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    const data = await listAccounts();
    setAccounts(data);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleConnect(platform: Platform) {
    setBusy(platform);
    setError(null);
    try {
      const authUrl = await startOAuth(platform);
      // Redirect the KOL to the platform OAuth screen.
      window.location.href = authUrl;
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
    }
  }

  async function handleDisconnect(platform: Platform) {
    if (!window.confirm(t("confirmDisconnect", { platform: PLATFORM_LABELS[platform] }))) return;
    setBusy(platform);
    setError(null);
    try {
      await disconnectPlatform(platform);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const byPlatform = new Map(accounts.map((a) => [a.platform, a]));

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-start gap-4">
        <Link
          href="/dashboard/publish"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t("back")}
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
        <p className="text-sm text-slate-500 mt-1">{t("subtitle")}</p>
      </div>

      {justConnected ? (
        <Card className="border-emerald-200 bg-emerald-50">
          <div className="flex items-center gap-3 text-sm text-emerald-800">
            <CheckCircle2 className="w-5 h-5" />
            {t("connectedToast", { platform: PLATFORM_LABELS[justConnected as Platform] ?? justConnected })}
          </div>
        </Card>
      ) : null}
      {oauthError ? (
        <Card className="border-rose-200 bg-rose-50">
          <div className="flex items-center gap-3 text-sm text-rose-700">
            <XCircle className="w-5 h-5" />
            {t("errorToast", { error: oauthError })}
          </div>
        </Card>
      ) : null}
      {error ? (
        <Card className="border-rose-200 bg-rose-50">
          <div className="text-sm text-rose-700">{error}</div>
        </Card>
      ) : null}

      {loading ? (
        <Card className="flex items-center justify-center h-40">
          <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLATFORMS.map((p) => {
            const acc = byPlatform.get(p);
            const status: AccountStatus = acc?.status ?? "not_connected";
            const badge = statusBadge(status);
            return (
              <Card key={p} className="flex flex-col">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-base font-bold text-slate-700">
                    {PLATFORM_LOGOS[p]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900">{PLATFORM_LABELS[p]}</div>
                    <div className="mt-1">
                      <Pill tone={badge.tone}>
                        {badge.icon}
                        {t(badge.key)}
                      </Pill>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-xs text-slate-500 space-y-1">
                  {acc?.displayName ? (
                    <div>
                      <span className="font-semibold text-slate-700">{t("displayName")}:</span>{" "}
                      {acc.displayName}
                    </div>
                  ) : null}
                  {acc?.username ? (
                    <div>
                      <span className="font-semibold text-slate-700">@:</span> {acc.username}
                    </div>
                  ) : null}
                  {acc?.connectedAt ? (
                    <div>
                      <span className="font-semibold text-slate-700">{t("connectedAt")}:</span>{" "}
                      {fmt.date(acc.connectedAt)}
                    </div>
                  ) : null}
                  {acc?.scopes?.length ? (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {acc.scopes.slice(0, 4).map((s) => (
                        <Pill key={s} tone="slate">
                          {s}
                        </Pill>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="mt-auto pt-4 flex items-center gap-2">
                  {status === "connected" || status === "expiring" ? (
                    <>
                      <button
                        onClick={() => handleConnect(p)}
                        disabled={busy === p}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold disabled:opacity-50"
                      >
                        <RefreshCcw className="w-3.5 h-3.5" /> {t("reauth")}
                      </button>
                      <button
                        onClick={() => handleDisconnect(p)}
                        disabled={busy === p}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold disabled:opacity-50"
                      >
                        <Power className="w-3.5 h-3.5" /> {t("disconnect")}
                      </button>
                    </>
                  ) : status === "pending_review" ? (
                    <Pill tone="blue">{t("pendingReviewNote")}</Pill>
                  ) : (
                    <button
                      onClick={() => handleConnect(p)}
                      disabled={busy === p}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-500 text-white hover:bg-brand-600 rounded-lg text-xs font-semibold disabled:opacity-50"
                    >
                      {busy === p ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      {t("connect")}
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <div className="text-xs text-slate-500 leading-relaxed">{t("disclosure")}</div>
      </Card>
    </div>
  );
}
