"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * Admin layout - gates /admin to authenticated platform admins.
 *
 * Mirrors the agent layout pattern: getUser -> redirect to /login if not
 * authed; then verify profiles.is_admin (self-readable via RLS
 * "Users can view own active profile") -> redirect to /dashboard if not an
 * admin. The middleware also guards /admin for auth-required at the edge.
 * API calls enforce is_admin (+2FA) server-side via adminAuthMiddleware
 * regardless, so this is defense-in-depth, not the sole gate.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }
      // profiles self-read RLS (auth.uid() = id AND is_active) allows this.
      // Fail-closed: any error / non-admin -> KOL dashboard.
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", data.user.id)
        .maybeSingle();
      if (!profile?.is_admin) {
        router.push("/dashboard");
        return;
      }
      setLoading(false);
    })();
  }, [router]);

  if (loading) return <div className="p-8">Loading...</div>;
  return <>{children}</>;
}
