"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Bell, Mail, CheckCircle2, ShieldCheck, DollarSign, Users, CreditCard, AlertCircle } from "lucide-react";
import {
  fetchKolNotificationPrefs,
  updateKolNotificationPrefs,
  type NotificationPreferences,
} from "@/lib/notifications";

export default function NotificationSettingsPage() {
  const t = useTranslations("notificationSettings");
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    email_enabled: true,
    commission_pending: true,
    commission_paid: true,
    commission_reversed: true,
    payout_sent: true,
    payout_failed: true,
    new_referral: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchKolNotificationPrefs()
      .then((data) => setPrefs(data))
      .catch(() => setError(t("loadError")))
      .finally(() => setLoading(false));
  }, [t]);

  const togglePref = async (key: keyof NotificationPreferences) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      await updateKolNotificationPrefs(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError(t("saveError"));
      // Rollback on error
      setPrefs(prefs);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="h-8 w-48 bg-slate-100 rounded animate-pulse mb-4" />
        <div className="h-4 w-96 bg-slate-100 rounded animate-pulse mb-8" />
        <div className="space-y-4">
          <div className="h-24 bg-slate-100 rounded-xl animate-pulse" />
          <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <Bell className="w-6 h-6 text-brand-600" />
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2.5 animate-in fade-in-0 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{t("savedSuccess")}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Global Email Master Switch */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-brand-50 rounded-xl text-brand-600 mt-0.5">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">{t("emailMasterTitle")}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{t("emailMasterDesc")}</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={prefs.email_enabled}
              onChange={() => togglePref("email_enabled")}
              disabled={saving}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
          </label>
        </div>
      </div>

      {/* Event Category Toggles */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            {t("categoriesTitle")}
          </h2>
        </div>

        {/* 1. New Commission Pending */}
        <div className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
          <div className="flex items-start gap-3.5">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 mt-0.5">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-900">{t("commissionPendingTitle")}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{t("commissionPendingDesc")}</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={prefs.commission_pending}
              onChange={() => togglePref("commission_pending")}
              disabled={saving}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
          </label>
        </div>

        {/* 2. Commission Paid */}
        <div className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
          <div className="flex items-start gap-3.5">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-900">{t("commissionPaidTitle")}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{t("commissionPaidDesc")}</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={prefs.commission_paid}
              onChange={() => togglePref("commission_paid")}
              disabled={saving}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
          </label>
        </div>

        {/* 3. Payout Sent */}
        <div className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
          <div className="flex items-start gap-3.5">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600 mt-0.5">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-900">{t("payoutSentTitle")}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{t("payoutSentDesc")}</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={prefs.payout_sent}
              onChange={() => togglePref("payout_sent")}
              disabled={saving}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
          </label>
        </div>

        {/* 4. Payout Failed */}
        <div className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
          <div className="flex items-start gap-3.5">
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600 mt-0.5">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-900">{t("payoutFailedTitle")}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{t("payoutFailedDesc")}</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={prefs.payout_failed}
              onChange={() => togglePref("payout_failed")}
              disabled={saving}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
          </label>
        </div>

        {/* 5. New Referral */}
        <div className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
          <div className="flex items-start gap-3.5">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600 mt-0.5">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-900">{t("newReferralTitle")}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{t("newReferralDesc")}</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={prefs.new_referral}
              onChange={() => togglePref("new_referral")}
              disabled={saving}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
}
