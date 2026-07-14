"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/toast";
import {
  createItem,
  updateItem,
  type CreateItemInput,
  type UpdateItemInput,
} from "@/lib/api/items";
import { requestUploadTicket } from "@/lib/api/files";
import { getCurrentUser } from "@/lib/user-store";
import { ApiError } from "@/lib/api/client";
import type { Item } from "@/types";

export default function ItemForm({
  mode,
  item,
}: {
  mode: "create" | "edit";
  item?: Item;
}) {
  const router = useRouter();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(item?.name ?? "");
  const [price, setPrice] = useState(item ? String(item.price) : "");
  const [stock, setStock] = useState(item ? String(item.stock) : "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [imageUrl, setImageUrl] = useState<string | undefined>(item?.image);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function errFor(field: string) {
    return fieldErrors[field] || fieldErrors[`body.${field}`] || undefined;
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setImageError(null);
    try {
      const ticket = await requestUploadTicket({
        name: file.name,
        mimeType: file.type || "image/jpeg",
        size: file.size,
      });
      const put = await fetch(ticket.uploadUrl, { method: "PUT", body: file });
      if (!put.ok) throw new Error("Upload failed");
      setImageUrl(ticket.uploadUrl);
    } catch {
      setImageError(
        "Image upload failed — you can still save the item without an image.",
      );
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    const payload = {
      name,
      price: Number(price),
      stock: Number(stock),
      description,
      ...(imageUrl ? { image: imageUrl } : {}),
    };

    try {
      if (mode === "create") {
        const u = getCurrentUser();
        if (!u?.shopId) {
          throw new ApiError(
            "Your session info is missing — please log out and back in.",
            401,
          );
        }
        await createItem({ ...(payload as CreateItemInput), shopId: u.shopId });
        toast.show("Item created", "success");
      } else if (item) {
        await updateItem(item._id, payload as UpdateItemInput);
        toast.show("Item updated", "success");
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors) setFieldErrors(err.fieldErrors);
        setError(err.message);
      } else {
        setError("Something went wrong — please try again.");
      }
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-5">
      <Input
        label="Name"
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errFor("name")}
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Price"
          name="price"
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          error={errFor("price")}
          required
        />
        <Input
          label="Stock"
          name="stock"
          type="number"
          min="0"
          step="1"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          error={errFor("stock")}
          required
        />
      </div>
      <Textarea
        label="Description"
        name="description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={errFor("description")}
        required
      />

      <div className="flex flex-col gap-2">
        <span className="text-caption uppercase tracking-[0.03em] text-muted">
          Image
        </span>
        {imageUrl ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Item preview"
              className="h-20 w-20 rounded-md border border-border object-cover"
            />
            <button
              type="button"
              className="text-caption font-medium text-error hover:underline"
              onClick={() => setImageUrl(undefined)}
            >
              Remove
            </button>
          </div>
        ) : (
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onFileChange}
            disabled={uploading}
            className="text-body-sm text-foreground file:mr-3 file:rounded-sm file:border-0 file:bg-surface-sunken file:px-3 file:py-2 file:text-body-sm file:text-foreground"
          />
        )}
        {uploading && (
          <span className="text-caption text-muted">Uploading…</span>
        )}
        {imageError && (
          <span className="text-caption text-warning">{imageError}</span>
        )}
      </div>

      {error && (
        <p className="text-caption text-error" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" loading={loading}>
          {mode === "create" ? "Create item" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/dashboard")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
