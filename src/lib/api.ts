import { supabase } from "./supabase";

export type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  /** Set to true for endpoints that must not send Authorization (e.g. the very first call before the user has a session). */
  noAuth?: boolean;
};

let cachedSessionPromise: ReturnType<typeof supabase.auth.getSession> | null = null;
let cachedSessionTime = 0;

function getCachedSession() {
  const now = Date.now();
  // Cache the session promise for 2 seconds to collapse concurrent calls
  if (cachedSessionPromise && now - cachedSessionTime < 2000) {
    return cachedSessionPromise;
  }
  cachedSessionPromise = supabase.auth.getSession();
  cachedSessionTime = now;
  return cachedSessionPromise;
}

/**
 * Thin wrapper around fetch that:
 *  - uses relative URLs (resolved by Next.js rewrites() in next.config.js)
 *  - JSON-encodes `body` if it's an object
 *  - attaches `Authorization: Bearer <supabase session access_token>` unless `noAuth: true`
 *  - throws an Error with the server's `error.message` on non-2xx
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { body, noAuth, headers, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    ...(headers as Record<string, string> | undefined),
  };
  if (body !== undefined && !finalHeaders["Content-Type"]) {
    finalHeaders["Content-Type"] = "application/json";
  }

  if (!noAuth) {
    const { data } = await getCachedSession();
    const token = data.session?.access_token;
    if (token) {
      finalHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  const url = path.startsWith("http") ? path : path;
  const res = await fetch(url, {
    ...rest,
    headers: finalHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!res.ok) {
    let message = `Request failed: ${res.status} ${res.statusText}`;
    let code: string | undefined;
    try {
      const errBody = (await res.json()) as {
        error?: { message?: string; code?: string };
      };
      if (errBody?.error?.message) message = errBody.error.message;
      code = errBody?.error?.code;
    } catch {
      // ignore JSON parse errors
    }
    const err = new Error(message) as Error & { code?: string };
    if (code) err.code = code;
    throw err;
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
