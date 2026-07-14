import { apiFetch } from "./client";
import type { FileRecord } from "@/types";

export function requestUploadTicket(input: {
  name: string;
  mimeType: string;
  size: number;
}) {
  return apiFetch<{ uploadUrl: string; fid: string; dbResult: FileRecord }>(
    "/api/file/upload/request-ticket",
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function deleteFile(fid: string) {
  return apiFetch(`/api/file/${fid}`, { method: "DELETE" });
}
