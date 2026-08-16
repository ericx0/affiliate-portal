"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";

export default function ChangePasswordForm() {
  const t = useTranslations("account.changePassword");
  const [current, setCurrent] = useState("");
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
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: current,
      });
      if (signInErr) {
        setError(t("errorCurrent"));
        return;
      }
      const { error: updateErr } = await supabase.auth.updateUser({
        password: next,
      });
      if (updateErr) {
        setError(updateErr.message || t("errorGeneric"));
        return;
      }
      setCurrent("");
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
    <form onSubmit={submit} className="space-y-3">
      <input
        type="password"
        autoComplete="current-password"
        placeholder={t("currentPlaceholder")}
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        required
        className="w-full p-3 border rounded-xl"
      />
      <input
        type="password"
        autoComplete="new-password"
        placeholder={t("newPlaceholder")}
        value={next}
        onChange={(e) => setNext(e.target.value)}
        required
        minLength={8}
        className="w-full p-3 border rounded-xl"
      />
      <input
        type="password"
        autoComplete="new-password"
        placeholder={t("confirmPlaceholder")}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
        minLength={8}
        className="w-full p-3 border rounded-xl"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-brand-500 text-white rounded-xl font-semibold disabled:opacity-50"
        >
          {submitting ? t("submitting") : t("submit")}
        </button>
        {success && <span className="text-green-600 text-sm">{t("success")}</span>}
        {error && <span className="text-rose-600 text-sm">{error}</span>}
      </div>
    </form>
  );
}