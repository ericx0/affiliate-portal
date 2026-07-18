"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface Kol {
  id: string;
  name: string;
  email: string;
  status: string;
  commission_rate: number;
  primary_platform: string | null;
  created_at: string;
  total_commission_earned: number;
  total_commission_paid: number;
  gmv_total: number;
}

interface KolsResponse {
  data: Kol[];
  total: number;
}

/**
 * Mask an email per TRD B5: agents may not see KOLs' full personal info.
 * Renders as `k***@example.com` (first char + `***` + domain).
 * Falls back to the original on malformed emails.
 */
function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at < 1) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at);
  const head = local.charAt(0);
  return `${head}***${domain}`;
}

export default function AgentKols() {
  const [kols, setKols] = useState<Kol[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<KolsResponse>("/api/affiliate/agent/kols");
      setKols(data.data ?? []);
      setTotal(data.total ?? 0);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My KOL Team ({total} KOLs)</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 text-white rounded-lg text-sm font-medium"
          style={{ background: "#7c3aed" }}
        >
          {showForm ? "Cancel" : "+ New KOL"}
        </button>
      </div>

      {showForm && <NewKolForm onCreated={() => { setShowForm(false); load(); }} />}

      {kols.length === 0 ? (
        <p className="text-slate-500">No KOLs recruited yet. Click &quot;+ New KOL&quot; to recruit one.</p>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3 text-xs uppercase">Name</th>
                <th className="text-center p-3 text-xs uppercase">Status</th>
                <th className="text-right p-3 text-xs uppercase">GMV Total</th>
                <th className="text-right p-3 text-xs uppercase">Commission</th>
                <th className="text-right p-3 text-xs uppercase">Joined</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {kols.map((k) => (
                <tr key={k.id} className="border-t hover:bg-slate-50">
                  <td className="p-3">
                    <div className="font-medium">{k.name}</div>
                    <div className="text-xs text-slate-400">{maskEmail(k.email)}</div>
                  </td>
                  <td className="p-3 text-center text-sm">
                    <StatusBadge status={k.status} />
                  </td>
                  <td className="p-3 text-right text-sm text-slate-600">
                    ${Number(k.gmv_total || 0).toFixed(2)}
                  </td>
                  <td className="p-3 text-right font-medium text-green-600">
                    ${Number(k.total_commission_earned || 0).toFixed(2)}
                  </td>
                  <td className="p-3 text-right text-xs text-slate-400">
                    {k.created_at ? new Date(k.created_at).toLocaleDateString() : "-"}
                  </td>
                  <td className="p-3 text-right">
                    <Link href={`/agent/kols/${k.id}`} className="text-blue-600 text-sm font-medium">
                      View -&gt;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-400 italic">
        Agent can view KOL stats but cannot see KOLs&apos; full personal info (email masked).
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    active: { label: "Active", color: "green" },
    pending: { label: "Pending", color: "amber" },
    suspended: { label: "Suspended", color: "red" },
  };
  const info = map[status] ?? { label: status, color: "slate" };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium bg-${info.color}-100 text-${info.color}-700`}>
      {info.label}
    </span>
  );
}

interface NewKolFormProps {
  onCreated: () => void;
}

function NewKolForm({ onCreated }: NewKolFormProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    primary_platform: "",
    primary_platform_url: "",
    commission_rate: 10,
    brand_name: "",
    bio: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErr("");
    try {
      await apiFetch("/api/affiliate/agent/kols", {
        method: "POST",
        body: {
          name: form.name,
          email: form.email,
          primary_platform: form.primary_platform || undefined,
          primary_platform_url: form.primary_platform_url || undefined,
          commission_rate: Number(form.commission_rate),
          brand_name: form.brand_name || undefined,
          bio: form.bio || undefined,
        },
      });
      onCreated();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white p-6 rounded-2xl border space-y-4">
      <h2 className="font-bold">Recruit a new KOL</h2>
      <p className="text-xs text-slate-500">
        The KOL will be bound to you (recruited_by_agent_id). They must self-register a login
        account with the same email to access the KOL portal.
      </p>
      {err && <div className="text-red-600 text-sm">{err}</div>}
      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs text-slate-500">Name *</span>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full mt-1 p-2 border rounded"
          />
        </label>
        <label className="block">
          <span className="text-xs text-slate-500">Email *</span>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full mt-1 p-2 border rounded"
          />
        </label>
        <label className="block">
          <span className="text-xs text-slate-500">Platform</span>
          <input
            value={form.primary_platform}
            onChange={(e) => setForm({ ...form, primary_platform: e.target.value })}
            placeholder="tiktok / youtube / ..."
            className="w-full mt-1 p-2 border rounded"
          />
        </label>
        <label className="block">
          <span className="text-xs text-slate-500">Platform URL</span>
          <input
            type="url"
            value={form.primary_platform_url}
            onChange={(e) => setForm({ ...form, primary_platform_url: e.target.value })}
            className="w-full mt-1 p-2 border rounded"
          />
        </label>
        <label className="block">
          <span className="text-xs text-slate-500">Commission rate (%) - max 10%</span>
          <input
            type="number"
            min={0}
            max={10}
            step={0.5}
            value={form.commission_rate}
            onChange={(e) => setForm({ ...form, commission_rate: Number(e.target.value) })}
            className="w-full mt-1 p-2 border rounded"
          />
        </label>
        <label className="block">
          <span className="text-xs text-slate-500">Brand name</span>
          <input
            value={form.brand_name}
            onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
            className="w-full mt-1 p-2 border rounded"
          />
        </label>
        <label className="block col-span-2">
          <span className="text-xs text-slate-500">Bio</span>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="w-full mt-1 p-2 border rounded"
            rows={2}
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50"
        style={{ background: "#7c3aed" }}
      >
        {submitting ? "Creating..." : "Create KOL"}
      </button>
    </form>
  );
}
