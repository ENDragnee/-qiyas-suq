/*
  Frontend API client (browser-side).
  - Always sends credentials so the express-session cookie is included/stored.
  - Normalizes both backend error shapes into a single ApiError:
      Zod validation:  { status: "fail", errors: [{ path, message }] }
      Controller:       { message, data? }
  - Used by client components / mutations. Server-side reads use
    lib/session.ts (serverApiFetch) instead, which forwards the cookie.
*/

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;
  constructor(
    message: string,
    status: number,
    fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
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
