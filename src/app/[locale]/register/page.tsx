"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";

const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
  (process.env.NODE_ENV !== "production" ? "1x00000000000000000000AA" : ""); // test key only outside production

export default function RegisterPage() {
  const t = useTranslations("register");
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [agentInviteCode, setAgentInviteCode] = useState("");

  // Auto-fill from invite links: ?ref=CODE (referral) or ?agent=CODE (agent invite).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) setReferralCode(ref.toUpperCase());
    const agent = params.get("agent");
    if (agent) setAgentInviteCode(agent.toUpperCase());
  }, []);
  const [country, setCountry] = useState("US");
  const [platform, setPlatform] = useState("tiktok");
  const [platformUrl, setPlatformUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Render the Turnstile widget imperatively after the SDK has loaded.
  useEffect(() => {
    if (!mounted) return;
    const render = () => {
      if (!turnstileRef.current || !window.turnstile) return;
      if (widgetIdRef.current) {
        try { window.turnstile.remove(widgetIdRef.current); } catch {}
      }
      widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token: string) => setTurnstileToken(token),
        "expired-callback": () => setTurnstileToken(""),
        "error-callback": () => setTurnstileToken(""),
      });
    };
    if (window.turnstile) {
      render();
    } else {
      window.__lcm_turnstile_cb = render;
    }
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [mounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!turnstileToken) {
      setError("Please complete the security check.");
      return;
    }

    setLoading(true);
    try {
      // 1. Sign up via Supabase Auth, attaching the Turnstile token
      //    (Supabase verifies the captcha server-side, configured in
      //    Supabase Dashboard → Auth → Captcha).
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password: crypto.randomUUID(),
        options: {
          captchaToken: turnstileToken,
          data: { name, country, primary_platform: platform, primary_platform_url: platformUrl },
        },
      });

      if (authErr) throw authErr;

      // 2. Call affiliate-service to create the promoter record.
      //    apiFetch attaches the Supabase session Bearer token so the
      //    backend can verify the email matches the authenticated user.
      await apiFetch("/api/affiliate/auth/register", {
        method: "POST",
        body: {
          authUserId: authData.user!.id,
          name,
          email,
          countryCode: country,
          primaryPlatform: platform,
          primaryPlatformUrl: platformUrl,
          referralCode,
          ...(agentInviteCode ? { agent_invite_code: agentInviteCode } : {}),
        },
      });

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
        <input type="text" placeholder={t("name")} value={name}
          onChange={(e) => setName(e.target.value)} required
          className="w-full p-3 border rounded-xl" />
        <input type="email" placeholder={t("email")} value={email}
          onChange={(e) => setEmail(e.target.value)} required
          className="w-full p-3 border rounded-xl" />
        <select value={country} onChange={(e) => setCountry(e.target.value)}
          className="w-full p-3 border rounded-xl">
          <option value="US">United States</option>
          <option value="CA">Canada</option>
          <option value="GB">United Kingdom</option>
          <option value="AU">Australia</option>
          <option value="OTHER">Other</option>
        </select>
        <select value={platform} onChange={(e) => setPlatform(e.target.value)}
          className="w-full p-3 border rounded-xl">
          <option value="tiktok">TikTok</option>
          <option value="youtube">YouTube</option>
          <option value="instagram">Instagram</option>
          <option value="x">X (Twitter)</option>
          <option value="other">Other</option>
        </select>
        <input type="url" placeholder={t("platformUrl")} value={platformUrl}
          onChange={(e) => setPlatformUrl(e.target.value)} required
          className="w-full p-3 border rounded-xl" />
        <input type="text" placeholder="邀请码 (Referral Code) *" value={referralCode}
          onChange={(e) => setReferralCode(e.target.value.toUpperCase())} required
          className="w-full p-3 border rounded-xl" />

        <div className="flex justify-center my-2">
          {mounted && <div ref={turnstileRef} />}
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button type="submit" disabled={loading || !turnstileToken}
          className="w-full py-3 bg-brand-500 text-white rounded-xl font-semibold disabled:opacity-50">
          {loading ? "..." : t("submit")}
        </button>
      </form>
    </main>
  );
}
