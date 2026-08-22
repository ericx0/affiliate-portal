"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";

import LocaleSwitcher from "@/components/LocaleSwitcher";

const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
  (process.env.NODE_ENV !== "production" ? "1x00000000000000000000AA" : ""); // test key only outside production

export default function RegisterPage() {
  const t = useTranslations("register");
  const locale = useLocale();
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
  const [agreed, setAgreed] = useState(false);

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

    // An agent invite code is mandatory: either typed into the visible
    // field (sent as referralCode) or auto-filled from ?agent=CODE
    // (sent as agent_invite_code). The backend accepts both paths.
    if (!referralCode.trim() && !agentInviteCode) {
      setError(t("errorInviteRequired"));
      return;
    }

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
          // ESIGN: the typed `name` + this checkbox = electronic signature.
          consent_confirmed: agreed,
          // KOL's UI locale at registration. Persisted to
          // affiliate.promoters.preferred_locale so the notification
          // pipeline picks the right language (i18n Task #7).
          preferredLocale: locale,
        },
      });

      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (e: any) {
      // Map backend invite-code errors to friendly localized copy instead
      // of showing the raw English server message.
      const code = (e as { code?: string })?.code;
      if (code === "INVITE_CODE_REQUIRED") {
        setError(t("errorInviteRequired"));
      } else if (code === "INVALID_INVITE_CODE") {
        setError(t("errorInviteInvalid"));
      } else {
        setError(e.message);
      }
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
      <div className="flex justify-end mb-6">
        <LocaleSwitcher />
      </div>
      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>

      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        {t("roleNotice")}
      </div>

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
        <div>
          <label htmlFor="inviteCode" className="block text-xs font-bold text-slate-700 mb-1.5">
            {t("inviteCodeLabel")}
          </label>
          <input id="inviteCode" type="text" placeholder={t("inviteCodePlaceholder")} value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            className="w-full p-3 border rounded-xl" />
          {agentInviteCode && !referralCode && (
            <p className="text-xs text-emerald-600 mt-1.5">
              {t("inviteCodeAutoFilled", { code: agentInviteCode })}
            </p>
          )}
        </div>

        <div className="flex justify-center my-2">
          {mounted && <div ref={turnstileRef} />}
        </div>

        <div className="flex items-start gap-2 text-sm text-slate-600 my-4">
          <input
            type="checkbox"
            id="agreeTerms"
            required
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          <label htmlFor="agreeTerms" className="leading-snug">
            I agree to the{" "}
            <a href="/legal/affiliate-agreement" target="_blank" className="text-brand-500 underline hover:text-brand-600">
              Affiliate Agreement
            </a>
            ,{" "}
            <a href="/legal/nda" target="_blank" className="text-brand-500 underline hover:text-brand-600">
              Non-Disclosure Agreement (NDA)
            </a>
            , and pledge to follow the{" "}
            <a href="/docs/kol-guidelines/KOL_Onboarding_and_Posting_Guidelines" target="_blank" className="text-brand-500 underline hover:text-brand-600">
              KOL Posting Guidelines
            </a>
            . By typing my name above and checking this box, I am signing
            these agreements electronically under the U.S. ESIGN Act.
          </label>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button type="submit" disabled={loading || !turnstileToken || !agreed}
          className="w-full py-3 bg-brand-500 text-white rounded-xl font-semibold disabled:opacity-50">
          {loading ? "..." : t("submit")}
        </button>
      </form>
    </main>
  );
}
