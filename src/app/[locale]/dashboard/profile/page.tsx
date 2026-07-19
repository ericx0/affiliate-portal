"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Profile {
  name: string;
  email: string;
  countryCode: string;
  primaryPlatform: string;
  primaryPlatformUrl: string;
}

export default function ProfilePage() {
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
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-slate-500">Loading...</p>;
  if (!profile) return <p className="text-slate-500">Could not load profile.</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Profile</h1>
      <p className="text-sm text-slate-600 mb-6">
        Update your contact details and primary platform information.
      </p>

      <form onSubmit={handleSave} className="bg-white p-6 rounded-xl border max-w-xl space-y-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Name</label>
          <input
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className="w-full p-3 border rounded-xl"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">Email</label>
          <input
            type="email"
            value={profile.email}
            readOnly
            disabled
            className="w-full p-3 border rounded-xl bg-slate-50 text-slate-400"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Email is your sign-in identity and can&apos;t be changed here.
          </p>
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">Country</label>
          <select
            value={profile.countryCode}
            onChange={(e) => setProfile({ ...profile, countryCode: e.target.value })}
            className="w-full p-3 border rounded-xl"
          >
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
            <option value="AU">Australia</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">Primary Platform</label>
          <select
            value={profile.primaryPlatform}
            onChange={(e) => setProfile({ ...profile, primaryPlatform: e.target.value })}
            className="w-full p-3 border rounded-xl"
          >
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
            <option value="instagram">Instagram</option>
            <option value="x">X (Twitter)</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">Platform URL</label>
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
            {saving ? "Saving..." : "Save Changes"}
          </button>
          {saved && <span className="text-green-600 text-sm">Saved.</span>}
          {saveError && <span className="text-rose-600 text-sm">{saveError}</span>}
        </div>
      </form>
    </div>
  );
}