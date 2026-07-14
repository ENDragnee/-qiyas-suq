"use client";

/* Small client-side store for the logged-in user, sourced from the login /
   signup responses (which include the user, with `shopId`). The backend has no
   `/api/auth/me` yet (build guide §11), and the item-create body requires
   `shopId`, so we keep it here between sessions. This is a UX convenience only
   — the backend remains the authority, and this upgrades automatically once
   `/api/auth/me` ships and `getSession` can read real state.
   Not HttpOnly on purpose: the create form needs to read `shopId` from script. */

import type { User } from "@/types";

const KEY = "kiyas_user";

export function setCurrentUser(u: User) {
  if (typeof document === "undefined") return;
  document.cookie = `${KEY}=${encodeURIComponent(
    JSON.stringify(u),
  )}; path=/; max-age=86400; samesite=lax`;
}

export function getCurrentUser(): User | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)kiyas_user=([^;]+)/);
  if (!m) return null;
  try {
    return JSON.parse(decodeURIComponent(m[1])) as User;
  } catch {
    return null;
  }
}

export function clearCurrentUser() {
  if (typeof document === "undefined") return;
  document.cookie = `${KEY}=; path=/; max-age=0`;
}
