"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { ExternalLink, Mail } from "lucide-react";

/**
 * /kol/dashboard/templates — landing page for the templates hub. Currently
 * only email/DM templates (T3) ship; future batches can add landing
 * pages, ad scripts, video storyboards, etc.
 */
export default function TemplatesHubPage() {
  const t = useTranslations("emailTemplates");
  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
        <p className="text-sm text-slate-500 mt-1">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <HubCard
          href="/kol/dashboard/templates/email"
          icon={<Mail className="w-6 h-6" />}
          title={t("title")}
          desc={t("subtitle")}
        />
      </div>

      <Card className="bg-slate-50">
        <div className="text-xs text-slate-500 leading-relaxed">
          Templates stay in sync with the LCM brand voice and compliance checklist. To personalise a template for a specific conversation, open the AI Assist tool from a customer record or paste the conversation into the AI Assist chat.
        </div>
      </Card>
    </div>
  );
}

function HubCard({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col hover:border-brand-300 transition-colors"
    >
      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
        {icon}
      </div>
      <div className="text-base font-bold text-slate-900">{title}</div>
      <div className="text-xs text-slate-500 mt-1 leading-relaxed flex-1">{desc}</div>
      <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-600">
        <span>Open</span>
        <ExternalLink className="w-3 h-3" />
      </div>
    </Link>
  );
}
