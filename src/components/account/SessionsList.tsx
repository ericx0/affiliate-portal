"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { signOutOthers } from "@/lib/supabase/auth";

export default function SessionsList() {
  const t = useTranslations("account.sessions");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOutOthers = async () => {
    if (!window.confirm(t("signOutOthersConfirm"))) return;
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      const { error: err } = await signOutOthers();
      if (err) {
        setError(err);
        return;
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-3 border rounded-xl bg-slate-50">
        <span className="text-sm text-slate-700">{t("current")}</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSignOutOthers}
          disabled={submitting}
          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 disabled:opacity-50"
        >
          {submitting ? t("signOutOthers") + "…" : t("signOutOthers")}
        </button>
        {success && <span className="text-green-600 text-sm">{t("success")}</span>}
        {error && <span className="text-rose-600 text-sm">{error}</span>}
      </div>
    </div>
  );
}