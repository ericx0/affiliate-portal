// Cloudflare Turnstile global type declarations
interface Window {
  turnstile?: {
    render: (
      container: HTMLElement | string,
      params: {
        sitekey: string;
        callback?: (token: string) => void;
        "expired-callback"?: () => void;
        "error-callback"?: () => void;
        theme?: "light" | "dark" | "auto";
        size?: "normal" | "compact";
      }
    ) => string;
    remove: (widgetId: string) => void;
    reset: (widgetId: string) => void;
  };
  /** Callback stored by page; invoked by TurnstileLoader once SDK loads */
  __lcm_turnstile_cb?: () => void;
}
