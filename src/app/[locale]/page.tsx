"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/navigation";

export default function LandingPage() {
  const t = useTranslations("landing");

  return (
    <main className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-slate-900 mb-4">
        {t("title")}
      </h1>
      <p className="text-lg text-slate-600 mb-8">
        {t("subtitle")}
      </p>
      <div className="flex gap-4">
        <Link href="/register" className="px-6 py-3 bg-brand-500 text-white rounded-xl font-semibold">
          {t("registerCta")}
        </Link>
        <Link href="/login" className="px-6 py-3 border border-slate-300 rounded-xl font-semibold">
          {t("loginCta")}
        </Link>
      </div>
    </main>
  );
}
