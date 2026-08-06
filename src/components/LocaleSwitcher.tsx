"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import { locales, usePathname, useRouter } from "@/navigation";

type Locale = (typeof locales)[number];

const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

// 全部 5 个语言已完成人工校对（i18n Task #8），全部开放到选择器。
// allowed-identical 仍在 enforced 列表里把关，未翻译键会被 CI 卡住。
const SWITCHABLE_LOCALES = ["en", "zh", "ar", "es", "ru"];

const LOCALE_NAMES: Record<string, string> = {
  en: "English",
  zh: "中文",
  ar: "العربية",
  es: "Español",
  ru: "Русский",
};

export default function LocaleSwitcher() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 用户直接访问 /ar/... 时当前语言不在可切换列表里，把它临时补进选项，
  // 否则 select 会回落到第一项，看起来像语言被系统改掉了。
  const options = SWITCHABLE_LOCALES.includes(locale)
    ? SWITCHABLE_LOCALES
    : [locale, ...SWITCHABLE_LOCALES];

  const handleChange = (nextLocale: string) => {
    if (!isLocale(nextLocale)) return;
    // createSharedPathnamesNavigation 会自己替换 locale 前缀，路径保持不变。
    startTransition(() => router.replace(pathname, { locale: nextLocale }));
  };

  return (
    <label className="inline-flex items-center">
      <span className="sr-only">{t("language")}</span>
      <select
        value={locale}
        disabled={isPending}
        onChange={(event) => handleChange(event.target.value)}
        className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {LOCALE_NAMES[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}
