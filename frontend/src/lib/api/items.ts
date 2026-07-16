import { apiFetch } from "./client";
import type { ApiItem, ApiList, Item } from "@/types";

/* Client-side reads + mutations (browser fetches, credentials included — the
   session cookie is stored by the browser). Server Actions are avoided for
   these so the browser keeps ownership of the HttpOnly cookie; see NOTES.md.
   Server-side reads live in items.server.ts (they import next/headers). */

export function listItems(page = 1, limit = 10) {
  return apiFetch<ApiList<Item>>(`/api/item?page=${page}&limit=${limit}`);
}

export interface CreateItemInput {
  name: string;
  price: number;
  stock: number;
  description: string;
  shopId: string;
  image?: string;
}

export function createItem(input: CreateItemInput) {
  return apiFetch<ApiItem<Item>>("/api/item", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface UpdateItemInput {
  name?: string;
  price?: number;
  stock?: number;
  description?: string;
  image?: string;
}

export function updateItem(id: string, input: UpdateItemInput) {
  return apiFetch<ApiItem<Item>>(`/api/item/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteItem(id: string) {
  return apiFetch<{ message: string }>(`/api/item/${id}`, {
    method: "DELETE",
  });
}
