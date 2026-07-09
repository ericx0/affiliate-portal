"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Dev-only mock for Stripe Connect onboarding.
 *
 * The affiliate-service returns this page's URL when STRIPE_SECRET_KEY
 * is a placeholder — so KOLs can exercise the connect flow locally
 * without real Stripe keys.
 *
 * In production (live mode), Stripe hosts the real onboarding URL
 * and this page is never visited.
 */
function StripeMockInner() {
  const router = useRouter();
  const search = useSearchParams();
  const account = search.get("account") || "unknown";
  const returnTo = search.get("return") || "/dashboard/settings/stripe";
  const [completed, setCompleted] = useState(false);

  function handleComplete() {
    setCompleted(true);
    setTimeout(() => {
      router.push(returnTo);
    }, 500);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 max-w-md w-full">
        <h1 className="text-xl font-bold text-slate-900 mb-2">
          🧪 Dev Mock — Stripe Connect
        </h1>
        <p className="text-sm text-slate-600 mb-4">
          This page simulates Stripe Connect onboarding for local
          development. It is only used when <code>STRIPE_SECRET_KEY</code>{" "}
          is unset or a placeholder.
        </p>

        <div className="bg-slate-50 rounded-lg p-3 mb-6">
          <div className="text-xs text-slate-500 mb-1">Mock Account ID</div>
          <code className="text-xs font-mono break-all">{account}</code>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          In production, Stripe would host identity verification, bank
          setup, and tax forms here. For local testing, click the button
          below to simulate a successful onboarding.
        </p>

        <button
          onClick={handleComplete}
          disabled={completed}
          className="w-full px-4 py-3 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600 disabled:opacity-50"
        >
          {completed ? "✓ Completed — redirecting…" : "Simulate completion"}
        </button>
      </div>
    </div>
  );
}

export default function StripeMockPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading…</div>}>
      <StripeMockInner />
    </Suspense>
  );
}