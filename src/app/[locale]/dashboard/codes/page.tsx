"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface ReferralCode {
  id: string;
  code: string;
  uses: number;
  active: boolean;
  createdAt: string;
}

export default function CodesPage() {
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const d = await apiFetch<{ data: ReferralCode[] }>("/api/affiliate/me/codes");
        setCodes(d.data ?? []);
      } catch {
        setCodes([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleCopy = (code: string) => {
    const link = `${process.env.NEXT_PUBLIC_SITE_URL}/?ref=${code}`;
    navigator.clipboard.writeText(link);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerateError(null);
    try {
      const d = await apiFetch<{ data: ReferralCode }>("/api/affiliate/me/codes", {
        method: "POST",
      });
      setCodes((prev) => [d.data, ...prev]);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Failed to generate code");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Referral Codes</h1>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
        >
          {generating ? "Generating..." : "Generate New Code"}
        </button>
      </div>

      {generateError && (
        <p className="text-sm text-rose-600 mb-4">{generateError}</p>
      )}

      <p className="text-sm text-slate-600 mb-4">
        Share your unique code or link. You earn affiliate commissions on qualifying purchases referred through these codes.
      </p>

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : codes.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border text-center text-slate-500">
          No referral codes yet. Click "Generate New Code" to get started.
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Uses</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-3 font-mono">{c.code}</td>
                  <td className="px-4 py-3">{c.uses}</td>
                  <td className="px-4 py-3">
                    <span className={c.active ? "text-green-600" : "text-slate-400"}>
                      {c.active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => handleCopy(c.code)}
                      className="px-3 py-1 text-xs bg-slate-100 rounded hover:bg-slate-200"
                    >
                      {copied === c.code ? "Copied!" : "Copy Link"}
                    </button>
                    <button className="px-3 py-1 text-xs bg-slate-100 rounded hover:bg-slate-200">
                      QR
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}