"use client";

import Script from "next/script";

declare global {
  interface Window {
    __lcm_turnstile_cb?: () => void;
  }
}

/**
 * Loads the Cloudflare Turnstile SDK once and bridges the script
 * onLoad event to any page waiting to render its widget.
 *
 * Pattern mirrors linkchinamed-web/src/components/TurnstileLoader.tsx.
 */
export default function TurnstileLoader() {
  return (
    <Script
      id="cf-turnstile"
      strategy="afterInteractive"
      src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
      onLoad={() => {
        if (typeof window.__lcm_turnstile_cb === "function") {
          window.__lcm_turnstile_cb();
          window.__lcm_turnstile_cb = undefined;
        }
      }}
    />
  );
}
