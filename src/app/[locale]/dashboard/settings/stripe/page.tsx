"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface StripeStatus {
  connected: boolean;
  accountId: string | null;
  payoutsEnabled: boolean;
  mode?: "dev-mock" | "live";
  devMockNote?: string;
}

export default function StripeSettingsPage() {
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
      setError(e?.message || "Failed to load status");
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
      setError(e?.message || "Failed to start onboarding");
      setConnecting(false);
    }
  }

  if (loading) return <p className="text-slate-500">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Payout Settings</h1>
      <p className="text-sm text-slate-600 mb-6">
        Connect a Stripe account to receive affiliate commission payouts.
      </p>

      <div className="bg-white p-6 rounded-xl border max-w-xl">
        <div className="mb-4">
          <div className="text-xs text-slate-500 mb-1">Connection status</div>
          <div className="text-sm font-semibold">
            {status?.connected ? (
              <span className="text-green-600">Connected</span>
            ) : (
              <span className="text-amber-600">Not connected</span>
            )}
            {status?.mode === "dev-mock" && (
              <span className="ml-2 text-xs text-purple-600 font-mono">
                [dev-mock]
              </span>
            )}
          </div>
          {status?.accountId && (
            <div className="text-xs text-slate-500 mt-1 font-mono">
              Account: {status.accountId}
            </div>
          )}
          {status?.connected && (
            <div className="text-xs text-slate-500 mt-1">
              Payouts enabled:{" "}
              {status.payoutsEnabled ? (
                <span className="text-green-600">yes</span>
              ) : (
                <span className="text-amber-600">pending verification</span>
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
            {status?.connected ? "Stripe Dashboard" : "Connect with Stripe"}
          </h2>
          <p className="text-xs text-slate-600 mb-4">
            {status?.connected
              ? "Re-open the Stripe dashboard to update bank account, tax info, or verification documents."
              : "You will be redirected to Stripe to complete account onboarding. Stripe handles identity verification and payout method setup. On return, your account ID is saved and payouts are enabled once verification completes."}
          </p>

          <button
            onClick={handleConnect}
            disabled={connecting}
            className="px-4 py-2 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {connecting
              ? "Connecting…"
              : status?.connected
                ? "Open Stripe Dashboard"
                : "Connect with Stripe"}
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