"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, Pill } from "@/components/ui/Card";
import {
  CheckCircle2,
  ExternalLink,
  History,
  Plug,
  Plus,
  Send,
} from "lucide-react";

/**
 * /dashboard/publish — Landing page that links to the three sub-pages
 * (accounts / new / history). Acts as a "command center" so the KOL
 * can see at-a-glance what's connected, what's queued, and what's
 * already live.
 */

export default function PublishHubPage() {
  const t = useTranslations("publishHub");
  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
        <p className="text-sm text-slate-500 mt-1">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <HubCard
          href="/dashboard/publish/accounts"
          icon={<Plug className="w-6 h-6" />}
          title={t("accountsTitle")}
          desc={t("accountsDesc")}
          openLabel={t("open")}
          tone="emerald"
        />
        <HubCard
          href="/dashboard/publish/new"
          icon={<Plus className="w-6 h-6" />}
          title={t("newTitle")}
          desc={t("newDesc")}
          openLabel={t("open")}
          tone="blue"
        />
        <HubCard
          href="/dashboard/publish/history"
          icon={<History className="w-6 h-6" />}
          title={t("historyTitle")}
          desc={t("historyDesc")}
          openLabel={t("open")}
          tone="slate"
        />
      </div>

      <Card>
        <div className="text-xs text-slate-500 leading-relaxed">
          {t("disclosure")}
        </div>
      </Card>

      <Card className="bg-slate-50">
        <div className="text-xs text-slate-600 leading-relaxed space-y-2">
          <div className="font-semibold text-slate-900">{t("tip")}</div>
          <div>{t("tipBody")}</div>
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
  openLabel,
  tone,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  openLabel: string;
  tone: "emerald" | "blue" | "slate";
}) {
  const bg = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    slate: "bg-slate-100 text-slate-600",
  }[tone];
  return (
    <Link
      href={href}
      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col hover:border-brand-300 transition-colors"
    >
      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center mb-3`}>{icon}</div>
      <div className="text-base font-bold text-slate-900">{title}</div>
      <div className="text-xs text-slate-500 mt-1 leading-relaxed flex-1">{desc}</div>
      <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-600">
        <span>{openLabel}</span>
        <ExternalLink className="w-3 h-3" />
      </div>
    </Link>
  );
}
