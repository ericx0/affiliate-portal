"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_AFFILIATE_API_URL}/api/affiliate/me`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setProfile(d.data ?? null))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    try {
      // Placeholder: would PATCH /api/affiliate/me
      await new Promise((res) => setTimeout(res, 500));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
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
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            className="w-full p-3 border rounded-xl"
          />
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
        </div>
      </form>
    </div>
  );
}