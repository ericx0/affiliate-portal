"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";

export default function ChangePasswordForm() {
  const t = useTranslations("account.changePassword");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (next.length < 8) {
      setError(t("errorWeak"));
      return;
    }
    if (next !== confirm) {
      setError(t("errorMismatch"));
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        setError(t("errorGeneric"));
        return;
      }
      const { error: updateErr } = await supabase.auth.updateUser({
        password: next,
      });
      if (updateErr) {
        setError(updateErr.message || t("errorGeneric"));
        return;
      }
      setNext("");
      setConfirm("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorGeneric"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 max-w-md">
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
          {t("newLabel")}
        </label>
        <input
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          placeholder={t("newPlaceholder")}
          required
          minLength={8}
          autoComplete="new-password"
          className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-brand-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
          {t("confirmLabel")}
        </label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={t("confirmPlaceholder")}
          required
          minLength={8}
          autoComplete="new-password"
          className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-brand-500 focus:outline-none"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-green-600 bg-green-50 p-2 rounded border border-green-200">
          {t("success")}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 bg-brand-500 text-white rounded-md text-sm font-semibold hover:bg-brand-600 disabled:opacity-50"
      >
        {submitting ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}