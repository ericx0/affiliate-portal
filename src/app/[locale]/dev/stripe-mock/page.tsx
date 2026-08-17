"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function safeInternalPath(raw: string | null): string {
  const fallback = "/kol/dashboard/settings/stripe";
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return fallback;
  return raw;
}

function StripeMockInner() {
  const router = useRouter();
  const search = useSearchParams();
  const account = search.get("account") || "unknown";
  const returnTo = safeInternalPath(search.get("return"));
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleComplete() {
    setLoading(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const email = userRes?.user?.email?.trim().toLowerCase();
      if (email) {
        const { data: list } = await supabase.rpc("affiliate_list_promoters", { p_search: email });
        const p = Array.isArray(list) ? list.find((item: any) => item.email?.toLowerCase() === email) : null;
        if (p) {
          await supabase.from("promoters").update({
            stripe_account_id: account,
            stripe_onboarding_completed: true,
          }).eq("id", p.id);
        }
      }
    } catch (e) {
      console.warn("Mock update warning:", e);
    }
    setCompleted(true);
    setTimeout(() => {
      router.push(returnTo);
    }, 600);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 max-w-md w-full">
        <h1 className="text-xl font-bold text-slate-900 mb-2">
          🧪 Stripe Connect 认证模拟环境 (Dev Mock)
        </h1>
        <p className="text-sm text-slate-600 mb-4">
          用于在未配置正式 Stripe 密钥时，快速体验 Stripe 身份核验与银行卡收款绑定流程（KYC）。
        </p>

        <div className="bg-slate-50 rounded-lg p-3 mb-6">
          <div className="text-xs text-slate-500 mb-1">Stripe 账户 ID</div>
          <code className="text-xs font-mono break-all text-emerald-700">{account}</code>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          在正式生产中（配置 <code>STRIPE_SECRET_KEY</code> 后），点击会直接跳转至 Stripe 官方托管页面进行身份证件识别、银行账号及税表签署。
        </p>

        <button
          onClick={handleComplete}
          disabled={loading || completed}
          className="w-full px-4 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 transition"
        >
          {completed ? "✓ 认证完成 — 正在跳转…" : loading ? "正在处理…" : "点击完成模拟认证 (KYC & 银行绑定)"}
        </button>
      </div>
    </div>
  );
}

export default function StripeMockPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">加载中...</div>}>
      <StripeMockInner />
    </Suspense>
  );
}
