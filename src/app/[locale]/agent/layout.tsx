"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import LocaleSwitcher from "@/components/LocaleSwitcher";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";
// @/navigation 而非 next/link + next/navigation：后者导航时会丢掉当前 locale。
import { Link, useRouter } from "@/navigation";

/**
 * Agent layout.
 *
 * Mirrors the KOL dashboard layout but verifies the caller is an agent
 * (role='agent') by hitting /api/affiliate/agent/stats - the agent-auth
 * middleware returns 403 NOT_AN_AGENT for KOLs, in which case we redirect
 * to the KOL dashboard.
 */
export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("nav");
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email?: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }
      setUser(data.user);
      try {
        // agent-auth validates role='agent'; 403 -> not an agent.
        await apiFetch("/api/affiliate/agent/stats");
        setLoading(false);
      } catch {
        // Not an agent (or unauthorized) -> KOL dashboard.
        router.push("/kol/dashboard");
      }
    })();
  }, [router]);

  if (loading) return <div className="p-8">{t("loading")}</div>;

  return (
    <div className="min-h-screen">
      <nav className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex gap-6">
            <Link href="/agent" className="font-bold">{t("agentPortalTitle")}</Link>
            <Link href="/agent/kols">{t("kols")}</Link>
            <Link href="/agent/commissions">{t("commissions")}</Link>
            <Link href="/agent/dashboard/settings/stripe">{t("settings")}</Link>
          </div>
          <div className="flex items-center gap-3">
            <LocaleSwitcher />
            <button
              onClick={() => supabase.auth.signOut().then(() => router.push("/"))}
              className="text-sm text-slate-500"
            >
              {t("logout")}
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
