"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";

interface Profile {
  name: string;
  email: string;
  countryCode: string;
  primaryPlatform: string;
  primaryPlatformUrl: string;
  bio: string;
  phone: string;
  socialAccounts: Record<string, string>;
  preferredLocale: "en" | "zh" | "ar" | "ru" | "es";
  avatarUrl: string;
}

const locales = ["en", "zh", "ar", "ru", "es"] as const;

function normalizeProfile(profile: Partial<Profile>): Profile {
  return {
    name: profile.name ?? "",
    email: profile.email ?? "",
    countryCode: profile.countryCode ?? "",
    primaryPlatform: profile.primaryPlatform ?? "",
    primaryPlatformUrl: profile.primaryPlatformUrl ?? "",
    bio: profile.bio ?? "",
    phone: profile.phone ?? "",
    socialAccounts: profile.socialAccounts ?? {},
    preferredLocale: profile.preferredLocale ?? "en",
    avatarUrl: profile.avatarUrl ?? "",
  };
}

export default function ProfilePage() {
  const t = useTranslations("profile");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const d = await apiFetch<{ data: Profile | null }>("/api/affiliate/me");
        setProfile(d.data ? normalizeProfile(d.data) : null);
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      // Email is intentionally excluded: kol-auth matches identity by
      // auth_user_id/email — backend UpdateMeSchema is .strict() and
      // rejects unknown keys. Send only the 10 whitelisted fields.
      const d = await apiFetch<{ data: Profile }>("/api/affiliate/me", {
        method: "PATCH",
        body: {
          name: profile.name,
          countryCode: profile.countryCode,
          primaryPlatform: profile.primaryPlatform,
          primaryPlatformUrl: profile.primaryPlatformUrl,
          bio: profile.bio,
          phone: profile.phone,
          socialAccounts: profile.socialAccounts,
          preferredLocale: profile.preferredLocale,
          avatarUrl: profile.avatarUrl,
        },
      });
      setProfile(normalizeProfile(d.data));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const updateSocial = (index: number, key: "platform" | "handle", value: string) => {
    if (!profile) return;
    const entries = Object.entries(profile.socialAccounts);
    const next = entries.map(([platform, handle], currentIndex) => {
      if (currentIndex !== index) return [platform, handle] as const;
      return key === "platform" ? [value, handle] as const : [platform, value] as const;
    });
    setProfile({ ...profile, socialAccounts: Object.fromEntries(next) });
  };

  if (loading) return <p className="text-slate-500">{t("loading")}</p>;
  if (!profile) return <p className="text-slate-500">{t("couldNotLoadProfile")}</p>;
  const socialEntries = Object.entries(profile.socialAccounts);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">{t("title")}</h1>
      <p className="text-sm text-slate-600 mb-6">{t("subtitle")}</p>
      <form onSubmit={handleSave} className="bg-white p-6 rounded-xl border max-w-xl space-y-4">
        <div><label className="block text-xs text-slate-500 mb-1">{t("nameLabel")}</label><input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="w-full p-3 border rounded-xl" /></div>
        <div><label className="block text-xs text-slate-500 mb-1">{t("emailLabel")}</label><input type="email" value={profile.email} readOnly disabled className="w-full p-3 border rounded-xl bg-slate-50 text-slate-400" /><p className="text-[11px] text-slate-400 mt-1">{t("emailNote")}</p></div>
        <div><label className="block text-xs text-slate-500 mb-1">{t("countryLabel")}</label><select value={profile.countryCode} onChange={(e) => setProfile({ ...profile, countryCode: e.target.value })} className="w-full p-3 border rounded-xl"><option value="US">{t("countryUS")}</option><option value="CA">{t("countryCA")}</option><option value="GB">{t("countryGB")}</option><option value="AU">{t("countryAU")}</option><option value="OTHER">{t("countryOther")}</option></select></div>
        <div><label className="block text-xs text-slate-500 mb-1">{t("primaryPlatformLabel")}</label><select value={profile.primaryPlatform} onChange={(e) => setProfile({ ...profile, primaryPlatform: e.target.value })} className="w-full p-3 border rounded-xl"><option value="tiktok">{t("platformTiktok")}</option><option value="youtube">{t("platformYoutube")}</option><option value="instagram">{t("platformInstagram")}</option><option value="x">{t("platformX")}</option><option value="other">{t("platformOther")}</option></select></div>
        <div><label className="block text-xs text-slate-500 mb-1">{t("platformUrlLabel")}</label><input type="url" value={profile.primaryPlatformUrl} onChange={(e) => setProfile({ ...profile, primaryPlatformUrl: e.target.value })} className="w-full p-3 border rounded-xl" /></div>
        <div><label className="block text-xs text-slate-500 mb-1">{t("bioLabel")}</label><textarea maxLength={500} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder={t("bioPlaceholder")} className="w-full p-3 border rounded-xl" /><p className="text-[11px] text-slate-400 mt-1">{t("bioHelp")}</p></div>
        <div><label className="block text-xs text-slate-500 mb-1">{t("phoneLabel")}</label><input type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder={t("phonePlaceholder")} className="w-full p-3 border rounded-xl" /></div>
        <fieldset><legend className="block text-xs text-slate-500 mb-1">{t("socialAccountsLabel")}</legend>{socialEntries.map(([platform, handle], index) => <div className="flex gap-2 mb-2" key={`${index}-${platform}`}><input value={platform} placeholder={t("socialAccountsPlatformPlaceholder")} onChange={(e) => updateSocial(index, "platform", e.target.value)} className="w-1/3 p-3 border rounded-xl" /><input value={handle} placeholder={t("socialAccountsHandlePlaceholder")} onChange={(e) => updateSocial(index, "handle", e.target.value)} className="flex-1 p-3 border rounded-xl" /><button type="button" onClick={() => { const next = Object.entries(profile.socialAccounts).filter((_, i) => i !== index); setProfile({ ...profile, socialAccounts: Object.fromEntries(next) }); }} className="px-3 border rounded-xl">{t("socialAccountsRemove")}</button></div>)}<button type="button" onClick={() => setProfile({ ...profile, socialAccounts: { ...profile.socialAccounts, "": "" } })} className="text-sm text-brand-600">{t("socialAccountsAdd")}</button></fieldset>
        <div><label className="block text-xs text-slate-500 mb-1">{t("preferredLocaleLabel")}</label><select value={profile.preferredLocale} onChange={(e) => setProfile({ ...profile, preferredLocale: e.target.value as Profile["preferredLocale"] })} className="w-full p-3 border rounded-xl">{locales.map((locale) => <option key={locale} value={locale}>{locale}</option>)}</select><p className="text-[11px] text-slate-400 mt-1">{t("preferredLocaleHelp")}</p></div>
        <div><label className="block text-xs text-slate-500 mb-1">{t("avatarUrlLabel")}</label><input type="url" value={profile.avatarUrl} onChange={(e) => setProfile({ ...profile, avatarUrl: e.target.value })} className="w-full p-3 border rounded-xl" />{profile.avatarUrl && <img src={profile.avatarUrl} alt={t("avatarUrlLabel")} className="mt-2 h-16 w-16 rounded-full object-cover" />}<p className="text-[11px] text-slate-400 mt-1">{t("avatarUrlHelp")}</p></div>
        <div className="flex items-center gap-3"><button type="submit" disabled={saving} className="px-4 py-2 bg-brand-500 text-white rounded-xl font-semibold disabled:opacity-50">{saving ? t("saving") : t("saveChanges")}</button>{saved && <span className="text-green-600 text-sm">{t("saved")}</span>}{saveError && <span className="text-rose-600 text-sm">{saveError}</span>}</div>
      </form>
    </div>
  );
}
