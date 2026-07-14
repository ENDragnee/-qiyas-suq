import { apiFetch } from "./client";
import type { User } from "@/types";

/*
  Auth calls run CLIENT-SIDE (not Server Actions) on purpose: the backend sets
  an HttpOnly express-session cookie, and only a browser fetch with
  credentials:"include" lets the browser store it. A Server Action would receive
  the Set-Cookie on its own server-side fetch and would have to forward it
  manually. See NOTES.md.
*/

export interface LoginInput {
  userName: string;
  password: string;
}

export async function login(input: LoginInput) {
  return apiFetch<{ message: string; user: User }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface SignupInput {
  name: string;
  userName: string;
  password: string;
  shopId: string;
  shopPassword: string;
}

export async function signup(input: SignupInput) {
  return apiFetch<{ message: string; data: User }>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      userName: input.userName,
      password: input.password,
      role: "user",
      shop: { shopId: input.shopId, password: input.shopPassword },
    }),
  });
}

export async function logout() {
  // Backend responds with res.redirect("/"); the caller navigates afterwards.
  return apiFetch("/api/auth/logout", { method: "POST" });
}

export async function resetPassword(input: {
  oldPassword: string;
  newPassword: string;
}) {
  return apiFetch<{ message: string; data: User }>(
    "/api/auth/reset-password",
    { method: "PATCH", body: JSON.stringify(input) },
  );
}
