"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";

interface StripeStatus {
  connected: boolean;
  accountId: string | null;
  payoutsEnabled: boolean;
  mode?: "dev-mock" | "live";
  devMockNote?: string;
}

export default function StripeSettingsPage() {
  const t = useTranslations("stripe");
  const [status, setStatus] = useState<StripeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const d = await apiFetch<{ data: StripeStatus }>(
        "/api/affiliate/me/stripe-status",
      );
      setStatus(
        d.data ?? {
          connected: false,
          accountId: null,
          payoutsEnabled: false,
        },
      );
    } catch (e: any) {
      setError(e?.message || t("errorLoadFailed"));
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    setConnecting(true);
    setError(null);
    try {
      const d = await apiFetch<{
        data: { url: string; mode: string; accountId: string };
      }>("/api/affiliate/me/stripe-connect", { method: "POST" });
      // In dev-mock mode the URL points at our local mock page;
      // in live mode it's the Stripe account-link URL.
      window.location.href = d.data.url;
    } catch (e: any) {
      setError(e?.message || t("errorOnboardingFailed"));
      setConnecting(false);
    }
  }

  if (loading) return <p className="text-slate-500">{t("loading")}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">{t("title")}</h1>
      <p className="text-sm text-slate-600 mb-6">
        {t("subtitle")}
      </p>

      <div className="bg-white p-6 rounded-xl border max-w-xl">
        <div className="mb-4">
          <div className="text-xs text-slate-500 mb-1">{t("connectionStatusLabel")}</div>
          <div className="text-sm font-semibold">
            {status?.connected ? (
              <span className="text-green-600">{t("connected")}</span>
            ) : (
              <span className="text-amber-600">{t("notConnected")}</span>
            )}
            {status?.mode === "dev-mock" && (
              <span className="ml-2 text-xs text-purple-600 font-mono">
                {t("devMockTag")}
              </span>
            )}
          </div>
          {status?.accountId && (
            <div className="text-xs text-slate-500 mt-1 font-mono">
              {t("accountLabel", { accountId: status.accountId })}
            </div>
          )}
          {status?.connected && (
            <div className="text-xs text-slate-500 mt-1">
              {t("payoutsEnabledLabel")}:{" "}
              {status.payoutsEnabled ? (
                <span className="text-green-600">{t("yes")}</span>
              ) : (
                <span className="text-amber-600">{t("pendingVerification")}</span>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="border-t pt-4">
          <h2 className="text-sm font-semibold mb-2">
            {status?.connected ? t("stripeDashboard") : t("connectWithStripe")}
          </h2>
          <p className="text-xs text-slate-600 mb-4">
            {status?.connected
              ? t("connectedDesc")
              : t("notConnectedDesc")}
          </p>

          <button
            onClick={handleConnect}
            disabled={connecting}
            className="px-4 py-2 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {connecting
              ? t("connecting")
              : status?.connected
                ? t("openStripeDashboard")
                : t("connectWithStripe")}
          </button>

          {status?.devMockNote && (
            <p className="text-xs text-purple-600 mt-3 italic">
              {status.devMockNote}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
