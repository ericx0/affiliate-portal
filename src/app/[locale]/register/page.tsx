"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const t = useTranslations("register");
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("US");
  const [platform, setPlatform] = useState("tiktok");
  const [platformUrl, setPlatformUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Sign up via Supabase Auth
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password: crypto.randomUUID(),  // KOL will set password after email verification
        options: {
          data: { name, country, primary_platform: platform, primary_platform_url: platformUrl },
        },
      });

      if (authErr) throw authErr;

      // 2. Call affiliate-service to create promoter record
      const res = await fetch(`${process.env.NEXT_PUBLIC_AFFILIATE_API_URL}/api/affiliate/promoters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authUserId: authData.user!.id,
          name,
          email,
          countryCode: country,
          primaryPlatform: platform,
          primaryPlatformUrl: platformUrl,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Registration failed");
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-4">{t("success")}</h1>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder={t("name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full p-3 border rounded-xl"
        />
        <input
          type="email"
          placeholder={t("email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-3 border rounded-xl"
        />
        <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full p-3 border rounded-xl">
          <option value="US">United States</option>
          <option value="CA">Canada</option>
          <option value="GB">United Kingdom</option>
          <option value="AU">Australia</option>
          <option value="OTHER">Other</option>
        </select>
        <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full p-3 border rounded-xl">
          <option value="tiktok">TikTok</option>
          <option value="youtube">YouTube</option>
          <option value="instagram">Instagram</option>
          <option value="x">X (Twitter)</option>
          <option value="other">Other</option>
        </select>
        <input
          type="url"
          placeholder={t("platformUrl")}
          value={platformUrl}
          onChange={(e) => setPlatformUrl(e.target.value)}
          required
          className="w-full p-3 border rounded-xl"
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-brand-500 text-white rounded-xl font-semibold disabled:opacity-50"
        >
          {loading ? "..." : t("submit")}
        </button>
      </form>
    </main>
  );
}