import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { DisclosureBanner } from "@/components/DisclosureBanner";

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
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
