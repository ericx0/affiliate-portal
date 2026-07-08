import { supabase } from "./supabase";

const API_BASE = process.env.NEXT_PUBLIC_AFFILIATE_API_URL || "";

export type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  /** Set to true for endpoints that must not send Authorization (e.g. the very first call before the user has a session). */
  noAuth?: boolean;
};

/**
 * Thin wrapper around fetch that:
 *  - prefixes the configured NEXT_PUBLIC_AFFILIATE_API_URL
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
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      finalHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...rest,
    headers: finalHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!res.ok) {
    let message = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const errBody = (await res.json()) as { error?: { message?: string } };
      if (errBody?.error?.message) message = errBody.error.message;
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
