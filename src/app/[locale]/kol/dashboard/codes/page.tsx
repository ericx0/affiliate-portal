"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";
import { useFormat } from "@/lib/format";

interface ReferralCode {
  id: string;
  code: string;
  uses: number;
  active: boolean;
  createdAt: string;
}

export default function CodesPage() {
  const t = useTranslations("codes");
  const fmt = useFormat();
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [accountPending, setAccountPending] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Pending KOLs (awaiting admin approval) cannot create codes — the
        // backend rejects POST /me/codes with 403 PROMOTER_NOT_ACTIVE. Read
        // the status from the profile endpoint; fail-open on error.
        const profile = await apiFetch<{ data: { status?: string } | null }>(
          "/api/affiliate/me/profile",
        ).catch(() => null);
        if (profile?.data?.status === "pending") {
          setAccountPending(true);
          return;
        }
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

  const [downloadingQr, setDownloadingQr] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const handleDownloadQr = async (codeId: string) => {
    setDownloadingQr(codeId);
    setQrError(null);
    try {
      const res = await fetch(`/api/affiliate/me/codes/${codeId}/qr`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qr-${codeId}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setQrError(err instanceof Error ? err.message : t("downloadQrFailed"));
    } finally {
      setDownloadingQr(null);
    }
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
      setGenerateError(err instanceof Error ? err.message : t("failedToGenerate"));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        {!accountPending && (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            {generating ? t("generating") : t("generateNewCode")}
          </button>
        )}
      </div>

      {accountPending && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl p-4 mb-4">
          {t("pendingNotice")}
        </div>
      )}

      {generateError && (
        <p className="text-sm text-rose-600 mb-4">{generateError}</p>
      )}

      {qrError && (
        <p className="text-sm text-rose-600 mb-4">{qrError}</p>
      )}

      <p className="text-sm text-slate-600 mb-4">
        {t("description")}
      </p>

      {loading ? (
        <p className="text-slate-500">{t("loading")}</p>
      ) : codes.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border text-center text-slate-500">
          {t("emptyState")}
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3">{t("thCode")}</th>
                <th className="px-4 py-3">{t("thUses")}</th>
                <th className="px-4 py-3">{t("thStatus")}</th>
                <th className="px-4 py-3">{t("thCreated")}</th>
                <th className="px-4 py-3 text-right">{t("thActions")}</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-3 font-mono">{c.code}</td>
                  <td className="px-4 py-3">{c.uses}</td>
                  <td className="px-4 py-3">
                    <span className={c.active ? "text-green-600" : "text-slate-400"}>
                      {c.active ? t("statusActive") : t("statusDisabled")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {fmt.date(c.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => handleCopy(c.code)}
                      className="px-3 py-1 text-xs bg-slate-100 rounded hover:bg-slate-200"
                    >
                      {copied === c.code ? t("copied") : t("copyLink")}
                    </button>
                    <button
                      onClick={() => handleDownloadQr(c.id)}
                      disabled={downloadingQr === c.id}
                      className="px-3 py-1 text-xs bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-50"
                    >
                      {downloadingQr === c.id ? t("downloadingQr") : t("downloadQr")}
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
