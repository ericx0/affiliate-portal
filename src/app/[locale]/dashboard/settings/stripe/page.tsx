"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface StripeStatus {
  connected: boolean;
  accountId: string | null;
  payoutsEnabled: boolean;
}

export default function StripeSettingsPage() {
  const [status, setStatus] = useState<StripeStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const d = await apiFetch<{ data: StripeStatus }>("/api/affiliate/me/stripe-status");
        setStatus(d.data ?? { connected: false, accountId: null, payoutsEnabled: false });
      } catch {
        setStatus({ connected: false, accountId: null, payoutsEnabled: false });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
          </div>
          {status?.accountId && (
            <div className="text-xs text-slate-500 mt-1 font-mono">
              Account: {status.accountId}
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <h2 className="text-sm font-semibold mb-2">Connect with Stripe</h2>
          <p className="text-xs text-slate-600 mb-4">
            You will be redirected to Stripe to complete account onboarding. Stripe handles identity
            verification and payout method setup. On return, your account ID is saved and payouts are
            enabled once verification completes.
          </p>

          <button
            disabled
            title="Coming soon — Stripe Connect onboarding pending live keys"
            className="px-4 py-2 bg-brand-500 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Connect with Stripe (test mode)
          </button>

          <p className="text-xs text-slate-400 mt-3">
            Dry-run: live Stripe API calls are disabled in this build.
          </p>
        </div>
      </div>
    </div>
  );
}