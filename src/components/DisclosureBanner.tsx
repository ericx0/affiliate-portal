"use client";

import { useLocale, useTranslations } from "next-intl";

export function DisclosureBanner() {
  const locale = useLocale();
  const t = useTranslations("disclosure");

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-xs text-amber-900">
      <div className="max-w-6xl mx-auto">
        <p>
          <span className="font-bold">⚠️ </span>
          {t("message", {
            entity: "Ionverge LLC (Wyoming, USA)",
            serviceType: locale === "zh" ? "行政与差旅协助" : "administrative and travel coordination services only"
          })}
        </p>
      </div>
    </div>
  );
}