import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { DisclosureBanner } from "@/components/DisclosureBanner";
import TurnstileLoader from "@/components/TurnstileLoader";
import LegalFooter from "@/components/LegalFooter";
import "../globals.css";

const locales = ["en", "zh"];

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale)) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale}>
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
