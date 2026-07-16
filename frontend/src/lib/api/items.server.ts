import { serverApiFetch } from "@/lib/session";
import type { ApiItem, ApiList, Item } from "@/types";

/* Server-only item reads. Imported by Server Components / layouts, which
   forward the session cookie via lib/session.ts (next/headers). Keep these out
   of any client component — next/headers is server-only. */

export function getItem(id: string) {
  return serverApiFetch<ApiItem<Item>>(`/api/item/${id}`);
}

export function getItems(page = 1, limit = 10) {
  return serverApiFetch<ApiList<Item>>(`/api/item?page=${page}&limit=${limit}`);
}
