import { apiFetch } from "./client";
import type { ApiItem, ApiList, Shop } from "@/types";

/* Client-side shop calls (browser fetches, credentials included). The public
   shop directory pages use the server module lib/api/shops.ts; admin/shops is
   a client component, so it lives here to avoid pulling next/headers in. */

function qs(params?: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") sp.set(k, String(v));
    }
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function getShops(
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: "name" | "createdAt";
    order?: "asc" | "desc";
  },
) {
  return apiFetch<ApiList<Shop>>(`/api/shop${qs(params)}`);
}

export interface CreateShopInput {
  name: string;
  accounts: string[];
  password: string;
  banner?: string;
}

export function createShop(input: CreateShopInput) {
  return apiFetch<ApiItem<Shop>>("/api/shop", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deleteShopAdmin(id: string) {
  return apiFetch(`/api/admin/shop/${id}`, { method: "DELETE" });
}
