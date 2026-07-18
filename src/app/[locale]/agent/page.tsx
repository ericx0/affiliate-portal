"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface AgentStats {
  totalKols: number;
  activeKols: number;
  totalPaid: number;
  totalPending: number;
  totalApproved: number;
}

interface InviteCodeResponse {
  agent_invite_code: string;
  invite_link: string;
}

const KOL_REGISTER_BASE =
  process.env.NEXT_PUBLIC_KOL_REGISTER_BASE || "https://affiliate.linkchinamed.com/register";

export default function AgentDashboard() {
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [invite, setInvite] = useState<InviteCodeResponse | null>(null);
  const [inviteLoading, setInviteLoading] = useState(true);
  const [inviteError, setInviteError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<AgentStats>("/api/affiliate/agent/stats");
        setStats(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();

    (async () => {
      try {
        const data = await apiFetch<InviteCodeResponse>("/api/affiliate/agent/invite-code");
        setInvite(data);
      } catch (e: unknown) {
        setInviteError(e instanceof Error ? e.message : String(e));
      } finally {
        setInviteLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!stats) return <div>No data</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Agent Dashboard</h1>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Recruited KOLs" value={stats.totalKols} color="brand" />
        <StatCard label="Active KOLs" value={stats.activeKols} color="blue" />
        <StatCard label="Override Paid" value={`$${Number(stats.totalPaid || 0).toFixed(2)}`} color="green" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Pending (cooling down)" value={`$${Number(stats.totalPending || 0).toFixed(2)}`} color="amber" />
        <StatCard label="Approved (awaiting payout)" value={`$${Number(stats.totalApproved || 0).toFixed(2)}`} color="blue" />
      </div>

      <p className="text-xs text-slate-400 italic">
        Agent override commissions are paid on orders placed by KOLs you recruited.
      </p>

      <InviteCodeCard
        invite={invite}
        loading={inviteLoading}
        error={inviteError}
        copied={copied}
        onCopy={async (link) => {
          try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            // clipboard API can fail in insecure contexts; silently ignore
          }
        }}
      />
    </div>
  );
}

function InviteCodeCard({
  invite,
  loading,
  error,
  copied,
  onCopy,
}: {
  invite: InviteCodeResponse | null;
  loading: boolean;
  error: string;
  copied: boolean;
  onCopy: (link: string) => void;
}) {
  // Derive the registration link from the agent's invite code so the
  // link stays correct even if the backend omits invite_link.
  const code = invite?.agent_invite_code ?? "";
  const link = invite?.invite_link || (code ? `${KOL_REGISTER_BASE}?agent=${code}` : "");

  return (
    <section className="bg-white p-6 rounded-2xl border">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <span aria-hidden>📣</span>
        Recruit New KOLs
      </h2>

      {loading ? (
        <p className="text-sm text-slate-400 mt-2">Loading invite code...</p>
      ) : error ? (
        <p className="text-sm text-red-600 mt-2">
          Could not load invite code: {error}
        </p>
      ) : !invite ? (
        <p className="text-sm text-slate-400 mt-2">No invite code available.</p>
      ) : (
        <div className="mt-4 space-y-3">
          <div>
            <div className="text-xs text-slate-400 uppercase font-bold">Your Agent Invite Code</div>
            <div className="text-xl font-mono font-bold mt-1 tracking-wider">{code}</div>
          </div>

          <div>
            <div className="text-xs text-slate-400 uppercase font-bold">KOL Registration Link</div>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 p-2 bg-slate-50 border rounded text-xs break-all">
                {link}
              </code>
              <button
                type="button"
                onClick={() => onCopy(link)}
                className="px-3 py-2 text-white rounded-lg text-sm font-medium shrink-0"
                style={{ background: "#7c3aed" }}
                aria-label="Copy invite link to clipboard"
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Share this link with influencers you want to recruit. When they register,
            they&apos;ll be automatically added to your team.
          </p>
        </div>
      )}
    </section>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border">
      <div className="text-xs text-slate-400 uppercase font-bold">{label}</div>
      <div className={`text-2xl font-bold text-${color}-600 mt-2`}>{value}</div>
    </div>
  );
}
