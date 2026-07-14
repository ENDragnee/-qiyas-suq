import { serverApiFetch } from "@/lib/session";
import type { ApiItem, ApiList, Shop } from "@/types";

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
  return serverApiFetch<ApiList<Shop>>(`/api/shop${qs(params)}`);
}

export function getShop(id: string) {
  return serverApiFetch<ApiItem<Shop>>(`/api/shop/${id}`);
}
