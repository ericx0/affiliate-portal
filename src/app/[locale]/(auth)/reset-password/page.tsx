"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

const inputClass =
  "h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

export default function ResetPasswordPage() {
  const t = useTranslations("resetPassword");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash.includes("error_code=otp_expired") || hash.includes("error=access_denied")) {
      setError(t("errorExpired"));
    }
  }, [t]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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
      const { error: updateErr } = await supabase.auth.updateUser({
        password: next,
      });
      if (updateErr) {
        setError(updateErr.message || t("errorGeneric"));
        return;
      }
      setDone(true);
      setTimeout(() => {
        window.location.assign("/login");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorGeneric"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
      <div className="flex flex-col items-center gap-3 mb-4">
        <Image
          src="/logo.png"
          alt="LinkChinaMed"
          width={160}
          height={48}
          className="h-12 w-auto object-contain"
          priority
        />
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-gray-600 text-center">{t("subtitle")}</p>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <input
          type="password"
          required
          minLength={8}
          placeholder={t("newPlaceholder")}
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className={inputClass}
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder={t("confirmPlaceholder")}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {done && (
          <p className="text-sm text-green-700">{t("success")}</p>
        )}
        <button
          type="submit"
          disabled={submitting || done}
          className="w-full h-10 rounded-md bg-brand text-white font-medium hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? t("submitting") : t("submit")}
        </button>
      </form>
    </div>
  );
}