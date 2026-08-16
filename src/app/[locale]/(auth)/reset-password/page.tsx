"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

const inputClass =
  "h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

const RECOVERY_TIMEOUT_MS = 30000;

export default function ResetPasswordPage() {
  const t = useTranslations("resetPassword");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // `ready` flips true once Supabase has detected the recovery tokens from
  // the URL hash and established a session. Without this gate, updateUser
  // fires before the browser client finishes setSession and fails silently.
  const [ready, setReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let resolved = false;

    // 0) Manual setSession from the recovery URL hash. @supabase/ssr 0.5.2's
    //    detectSessionInUrl silently no-ops under the Cloudflare proxy
    //    (storageKey origin `api.linkchinamed.com` ≠ JWT issuer
    //    `bqjbvnkdhbrkdaraxnvm.supabase.co`), so drive setSession ourselves.
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hashType = hashParams.get("type");
    const hashAccess = hashParams.get("access_token");
    const hashRefresh = hashParams.get("refresh_token");
    if (hashType === "recovery" && hashAccess && hashRefresh) {
      supabase.auth
        .setSession({ access_token: hashAccess, refresh_token: hashRefresh })
        .then(({ error: setErr }) => {
          if (resolved || setErr) return;
          resolved = true;
          setReady(true);
        });
    }

    // 1) Some SSR cookie flows already set a session before mount.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (resolved) return;
      if (session) {
        resolved = true;
        setReady(true);
      }
    });

    // 2) Implicit recovery flow: tokens arrive via URL hash, then ssr
    //    fires PASSWORD_RECOVERY once it has set the session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
          resolved = true;
          setReady(true);
          subscription.unsubscribe();
        }
      },
    );

    const timeoutId = window.setTimeout(() => {
      if (resolved) return;
      resolved = true;
      subscription.unsubscribe();
      setTimedOut(true);
    }, RECOVERY_TIMEOUT_MS);

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(timeoutId);
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!ready) return;
    if (next.length < 8) {
      setError(t("errorWeak"));
      return;
    }
    if (next !== confirm) {
      setError(t("errorMismatch"));
      return;
    }
    setSubmitting(true);
    try {
      const { error: updateErr } = await supabase.auth.updateUser({
        password: next,
      });
      if (updateErr) {
        setError(updateErr.message || t("errorGeneric"));
        return;
      }
      setDone(true);
      setTimeout(() => {
        window.location.assign("/login");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorGeneric"));
    } finally {
      setSubmitting(false);
    }
  };

  if (timedOut) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="flex flex-col items-center gap-3 mb-4">
          <Image
            src="/logo.png"
            alt="LinkChinaMed"
            width={160}
            height={48}
            className="h-12 w-auto object-contain"
            priority
          />
          <h1 className="text-xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-gray-600 text-center">{t("errorExpired")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
      <div className="flex flex-col items-center gap-3 mb-4">
        <Image
          src="/logo.png"
          alt="LinkChinaMed"
          width={160}
          height={48}
          className="h-12 w-auto object-contain"
          priority
        />
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-gray-600 text-center">{t("subtitle")}</p>
      </div>

      {!ready ? (
        <div className="flex items-center justify-center py-6">
          <span className="text-sm text-gray-600">Verifying reset link…</span>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <input
            type="password"
            required
            minLength={8}
            placeholder={t("newPlaceholder")}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder={t("confirmPlaceholder")}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputClass}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {done && (
            <p className="text-sm text-green-700">{t("success")}</p>
          )}
          <button
            type="submit"
            disabled={submitting || done}
            className="w-full h-10 rounded-md bg-brand text-white font-medium hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? t("submitting") : t("submit")}
          </button>
        </form>
      )}
    </div>
  );
}