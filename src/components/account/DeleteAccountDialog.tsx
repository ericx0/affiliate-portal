"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/navigation";
import { deleteOwnAccount } from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase";

export default function DeleteAccountDialog() {
  const t = useTranslations("account.deleteAccount");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [actualEmail, setActualEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    supabase.auth.getUser().then(({ data }) => {
      setActualEmail(data.user?.email ?? "");
    });
  }, [open]);

  const handleDelete = async () => {
    setError(null);
    if (confirmEmail.trim().toLowerCase() !== actualEmail.toLowerCase()) {
      setError(t("errorMismatch"));
      return;
    }
    setSubmitting(true);
    try {
      const { error: err } = await deleteOwnAccount();
      if (err) {
        setError(err);
        return;
      }
      router.push("/login");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-4 py-2 border border-rose-300 text-rose-700 rounded-xl font-medium hover:bg-rose-50"
      >
        {t("button")}
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="bg-white rounded-xl border max-w-sm w-full p-6 space-y-4">
        <h2 id="delete-account-title" className="text-lg font-semibold">
          {t("confirmTitle")}
        </h2>
        <p className="text-sm text-slate-600">{t("confirmBody")}</p>
        <p className="text-xs text-slate-500 break-all">{actualEmail}</p>
        <input
          type="email"
          placeholder={t("emailPlaceholder")}
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.target.value)}
          className="w-full p-3 border rounded-xl"
        />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex items-center gap-3 justify-end">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setConfirmEmail("");
              setError(null);
            }}
            disabled={submitting}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={submitting || !confirmEmail}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl font-semibold disabled:opacity-50"
          >
            {submitting ? t("confirmButton") + "…" : t("confirmButton")}
          </button>
        </div>
      </div>
    </div>
  );
}