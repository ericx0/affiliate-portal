"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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

  if (loading) return <div className="p-8">Loading...</div>;

  // Strip the locale prefix so we can compare against the nav links
  // (they're written without a locale — Link adds it back).
  const path = pathname.replace(/^\/(en|zh|ar|ru|es)/, "") || "/";

  const navItems = [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/clients", label: "Clients" },
    { href: "/dashboard/library", label: "Library" },
    { href: "/dashboard/tools/ai-assist", label: "AI Assist" },
    { href: "/dashboard/codes", label: "Codes" },
    { href: "/dashboard/earnings", label: "Earnings" },
    { href: "/dashboard/payouts", label: "Payouts" },
    { href: "/dashboard/settings/stripe", label: "Settings" },
  ];

  return (
    <div className="min-h-screen">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex gap-1 sm:gap-2 items-center overflow-x-auto">
            <Link
              href="/dashboard"
              className="font-bold text-brand-600 mr-4 whitespace-nowrap"
            >
              Affiliate Portal
            </Link>
            {navItems.map((item) => {
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
                  {item.label}
                </Link>
              );
            })}
          </div>
          <button
            onClick={() => supabase.auth.signOut().then(() => router.push("/"))}
            className="text-sm text-slate-500 hover:text-slate-700 whitespace-nowrap"
          >
            Log out
          </button>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}