/*
  Frontend type definitions, mirroring the backend Mongoose models.
  SOURCE OF TRUTH: backend/src/models/{user,shop,item,sale,file}.ts
  Keep these in sync manually — there is no shared package / codegen.
  REST responses serialize Mongo `_id` (not `id`) and `createdAt`/`updatedAt`.
*/

export type Role = "user" | "admin";
export type SaleStatus = "pending" | "canceled" | "success" | "failed";

export interface User {
  _id: string;
  name: string;
  userName: string;
  role: Role;
  shopId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Shop {
  _id: string;
  name: string;
  accounts: string[];
  banner?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Item {
  _id: string;
  name: string;
  price: number;
  stock: number;
  image?: string;
  description?: string;
  shopId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Sale {
  _id: string;
  id?: string; // GraphQL responses use `id` (= _id.toString())
  userId: string;
  itemId: string;
  price: number;
  quantity: number;
  code: string;
  status: SaleStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface FileRecord {
  _id: string;
  fid: string;
  name: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  status: "pending" | "failed" | "uploaded";
  createdAt?: string;
  updatedAt?: string;
}

/* Response envelopes returned by the REST controllers. */
export interface ApiList<T> {
  message: string;
  data: T[];
  metadata?: {
    count: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ApiItem<T> {
  message: string;
  data: T;
}

export interface SaleMetadata {
  totalDocuments: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface SaleList {
  data: Sale[];
  metadata: SaleMetadata;
}
