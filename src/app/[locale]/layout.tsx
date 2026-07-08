import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { DisclosureBanner } from "@/components/DisclosureBanner";
import TurnstileLoader from "@/components/TurnstileLoader";
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
      <body className="min-h-screen bg-slate-50">
        <NextIntlClientProvider messages={messages}>
          <DisclosureBanner />
          {children}
          <TurnstileLoader />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
