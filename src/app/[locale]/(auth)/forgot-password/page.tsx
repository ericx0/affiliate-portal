"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useLocale } from "next-intl";
import { Link } from "@/navigation";
import { supabase } from "@/lib/supabase";

const inputClass =
  "h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

export default function ForgotPasswordPage() {
  const t = useTranslations("forgotPassword");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/${locale}/reset-password`
          : undefined;
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo },
      );
      if (resetErr) {
        setError(resetErr.message || t("errorGeneric"));
        return;
      }
      setSent(true);
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

      {sent ? (
        <div className="space-y-3 text-center">
          <h2 className="text-base font-semibold text-green-700">
            {t("successTitle")}
          </h2>
          <p className="text-sm text-gray-600">{t("successBody")}</p>
          <Link
            href="/login"
            className="inline-block w-full h-10 leading-10 rounded-md bg-brand text-white font-medium hover:opacity-90"
          >
            {t("backToLogin")}
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            required
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-10 rounded-md bg-brand text-white font-medium hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? t("submitting") : t("submit")}
          </button>
          <p className="text-sm text-center">
            <Link href="/login" className="text-brand hover:underline">
              {t("backToLogin")}
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}