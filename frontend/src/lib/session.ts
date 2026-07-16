import { cookies } from "next/headers";
import { ApiError } from "./api/client";
import type { User } from "@/types";

/* Server-side fetch that forwards the browser's session cookie to the backend.
   Used by Server Components / Route Handlers (reads). Mutations that need the
   browser to store the HttpOnly session cookie must run client-side via
   apiFetch instead (see lib/api/auth.ts and NOTES.md). */
export async function serverApiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const store = await cookies();
  const cookie = store.toString();
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await res.json() : null;

  if (!res.ok) {
    let message = "Something went wrong on our end — try again";
    let fieldErrors: Record<string, string> | undefined;
    if (body?.status === "fail" && Array.isArray(body.errors)) {
      fieldErrors = {};
      for (const e of body.errors) fieldErrors[e.path] = e.message;
      message = body.errors[0]?.message ?? message;
    } else if (body?.message) {
      message = body.message;
    }
    throw new ApiError(message, res.status, fieldErrors);
  }
  return body as T;
}

export type SessionState = {
  user: User | null;
  authed: boolean;
  meAvailable: boolean;
};

const SESSION_COOKIE = "connect.sid";

/*
  Returns the current auth state for Server Components / layouts.
  Primary check is the real /api/auth/me endpoint (added as a backend fix):
  a 200 with a user means authed; a 401 means not. If /api/auth/me is
  unreachable (backend down / network error), it degrades to cookie
  *presence* only as a last-resort UX gate — the backend remains the
  authority. `meAvailable` distinguishes a real 401 (endpoint up, not
  logged in) from an endpoint failure (so layouts don't wrongly block).
*/
export async function getSession(): Promise<SessionState> {
  try {
    const json = await serverApiFetch<{ user?: User; data?: User }>(
      "/api/auth/me",
    );
    const user = json.user ?? json.data ?? null;
    return { user, authed: !!user, meAvailable: true };
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      return { user: null, authed: false, meAvailable: true };
    }
    // Endpoint missing or backend error: degrade to cookie presence.
    const store = await cookies();
    const authed = store.has(SESSION_COOKIE);
    return { user: null, authed, meAvailable: false };
  }
}
