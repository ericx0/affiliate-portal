"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";

/**
 * Agent layout.
 *
 * Mirrors the KOL dashboard layout but verifies the caller is an agent
 * (role='agent') by hitting /api/affiliate/agent/stats - the agent-auth
 * middleware returns 403 NOT_AN_AGENT for KOLs, in which case we redirect
 * to the KOL dashboard.
 */
export default function AgentLayout({ children }: { children: React.ReactNode }) {
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
        router.push("/dashboard");
      }
    })();
  }, [router]);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen">
      <nav className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex gap-6">
            <Link href="/agent" className="font-bold">Agent Portal</Link>
            <Link href="/agent/kols">KOLs</Link>
            <Link href="/agent/commissions">Commissions</Link>
            <Link href="/dashboard/settings/stripe">Settings</Link>
          </div>
          <button
            onClick={() => supabase.auth.signOut().then(() => router.push("/"))}
            className="text-sm text-slate-500"
          >
            Log out
          </button>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
