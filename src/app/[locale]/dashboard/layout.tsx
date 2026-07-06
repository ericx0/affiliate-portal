"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
      } else {
        setUser(data.user);
        setLoading(false);
      }
    });
  }, [router]);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen">
      <nav className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex gap-6">
            <Link href="/dashboard" className="font-bold">Affiliate Portal</Link>
            <Link href="/dashboard/codes">Codes</Link>
            <Link href="/dashboard/earnings">Earnings</Link>
            <Link href="/dashboard/payouts">Payouts</Link>
            <Link href="/dashboard/settings/stripe">Settings</Link>
          </div>
          <button onClick={() => supabase.auth.signOut().then(() => router.push("/"))} className="text-sm text-slate-500">
            Log out
          </button>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}