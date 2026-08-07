"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import LocaleSwitcher from "@/components/LocaleSwitcher";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";
// next/link + next/navigation 会丢掉当前 locale（导航到 /dashboard 后由
// middleware 按 cookie/accept-language 重新判定语言，而不是沿用当前页）。
// @/navigation 的同名导出会自动带上 locale 前缀。
import { Link, usePathname, useRouter } from "@/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", labelKey: "overview" },
  { href: "/dashboard/clients", labelKey: "clients" },
  { href: "/dashboard/library", labelKey: "library" },
  { href: "/dashboard/tools/ai-assist", labelKey: "aiAssist" },
  { href: "/dashboard/publish", labelKey: "publish" },
  { href: "/dashboard/templates", labelKey: "templates" },
  { href: "/dashboard/funnel", labelKey: "funnel" },
  { href: "/dashboard/earnings", labelKey: "earnings" },
  { href: "/dashboard/payouts", labelKey: "payouts" },
  { href: "/dashboard/settings/stripe", labelKey: "settings" },
] as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("nav");
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
      } else {
        setUser(data.user);
        setLoading(false);
        // AS-P1-8 followup: sync the KOL profile (email, etc.) with
        // the verified JWT identity. Idempotent; runs once per
        // session. Failures are silent (analytics-only — the
        // /sync endpoint is best-effort; promoter lookup falls back
        // to email if it fails).
        const session = data.user.id;
        if (typeof session === "string") {
          apiFetch("/api/affiliate/auth/sync", {
            method: "POST",
            body: {},
          }).catch(() => {});
        }
      }
    });
  }, [router]);

  // @/navigation 的 usePathname 返回的已经是去掉 locale 前缀的路径，
  // 可直接与 NAV_ITEMS 的 href 比较。
  const path = pathname || "/";

  return (
    <div className="min-h-screen">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex gap-1 sm:gap-2 items-center overflow-x-auto">
            <Link
              href="/dashboard"
              className="font-bold text-brand-600 mr-4 whitespace-nowrap"
            >
              {t("portalTitle")}
            </Link>
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? path === "/dashboard"
                  : path === item.href || path.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    "px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors " +
                    (active
                      ? "bg-brand-50 text-brand-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-100")
                  }
                >
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </div>
          <div className="flex items-center gap-3">
            <LocaleSwitcher />
            <button
              onClick={() => supabase.auth.signOut().then(() => router.push("/"))}
              className="text-sm text-slate-500 hover:text-slate-700 whitespace-nowrap"
            >
              {t("logout")}
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
