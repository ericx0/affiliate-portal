import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { DisclosureBanner } from "@/components/DisclosureBanner";
import TurnstileLoader from "@/components/TurnstileLoader";
import LegalFooter from "@/components/LegalFooter";
import { locales } from "@/navigation";
import "../globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://linkchinamed.com";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  // Per Next.js: alternates.canonical + alternates.languages get resolved
  // against metadataBase. Each locale lives at `/{locale}`; the per-page
  // path is appended automatically by the framework when child routes
  // inherit these alternates. `x-default` points at the English root
  // because that is the version Google indexes when a query has no
  // language preference.
  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[l] = `/${l}`;
  }
  languages["x-default"] = "/en";

  return {
    metadataBase: new URL(SITE_URL),
    title: "LinkChinaMed Affiliate Portal",
    description:
      "Promoter dashboard for the LinkChinaMed partner program — track referrals, payouts and marketing assets.",
    alternates: {
      canonical: `/${locale}`,
      languages,
    },
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as (typeof locales)[number])) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body className="min-h-screen bg-slate-50 flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <DisclosureBanner />
          <div className="flex-1">{children}</div>
          <LegalFooter />
          <TurnstileLoader />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}