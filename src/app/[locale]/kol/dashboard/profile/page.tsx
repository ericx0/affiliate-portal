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
        setProfile(d.data ?? null);
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
      const d = await apiFetch<{ data: Profile }>("/api/affiliate/me", {
        method: "PATCH",
        body: {
          name: profile.name,
          countryCode: profile.countryCode,
          primaryPlatform: profile.primaryPlatform,
          primaryPlatformUrl: profile.primaryPlatformUrl,
        },
      });
      setProfile(d.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-slate-500">{t("loading")}</p>;
  if (!profile) return <p className="text-slate-500">{t("couldNotLoadProfile")}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">{t("title")}</h1>
      <p className="text-sm text-slate-600 mb-6">
        {t("subtitle")}
      </p>

      <form onSubmit={handleSave} className="bg-white p-6 rounded-xl border max-w-xl space-y-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1">{t("nameLabel")}</label>
          <input
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className="w-full p-3 border rounded-xl"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">{t("emailLabel")}</label>
          <input
            type="email"
            value={profile.email}
            readOnly
            disabled
            className="w-full p-3 border rounded-xl bg-slate-50 text-slate-400"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            {t("emailNote")}
          </p>
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">{t("countryLabel")}</label>
          <select
            value={profile.countryCode}
            onChange={(e) => setProfile({ ...profile, countryCode: e.target.value })}
            className="w-full p-3 border rounded-xl"
          >
            <option value="US">{t("countryUS")}</option>
            <option value="CA">{t("countryCA")}</option>
            <option value="GB">{t("countryGB")}</option>
            <option value="AU">{t("countryAU")}</option>
            <option value="OTHER">{t("countryOther")}</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">{t("primaryPlatformLabel")}</label>
          <select
            value={profile.primaryPlatform}
            onChange={(e) => setProfile({ ...profile, primaryPlatform: e.target.value })}
            className="w-full p-3 border rounded-xl"
          >
            <option value="tiktok">{t("platformTiktok")}</option>
            <option value="youtube">{t("platformYoutube")}</option>
            <option value="instagram">{t("platformInstagram")}</option>
            <option value="x">{t("platformX")}</option>
            <option value="other">{t("platformOther")}</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">{t("platformUrlLabel")}</label>
          <input
            type="url"
            value={profile.primaryPlatformUrl}
            onChange={(e) => setProfile({ ...profile, primaryPlatformUrl: e.target.value })}
            className="w-full p-3 border rounded-xl"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-brand-500 text-white rounded-xl font-semibold disabled:opacity-50"
          >
            {saving ? t("saving") : t("saveChanges")}
          </button>
          {saved && <span className="text-green-600 text-sm">{t("saved")}</span>}
          {saveError && <span className="text-rose-600 text-sm">{saveError}</span>}
        </div>
      </form>
    </div>
  );
}
