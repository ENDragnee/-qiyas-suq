"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/client";
import { createShop } from "@/lib/api/shops.client";

export default function ShopForm() {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [accounts, setAccounts] = useState("");
  const [banner, setBanner] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function errFor(field: string) {
    return fieldErrors[field] || fieldErrors[`body.${field}`] || undefined;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    const accountList = accounts
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);

    try {
      await createShop({
        name,
        password,
        accounts: accountList,
        ...(banner.trim() ? { banner: banner.trim() } : {}),
      });
      toast.show("Shop created", "success");
      router.push("/admin/shops");
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
      <Input
        label="Shop password"
        name="password"
        type="password"
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errFor("password")}
        required
        helper="Becomes the staff invite code members use to sign up."
      />
      <Input
        label="Accounts"
        name="accounts"
        value={accounts}
        onChange={(e) => setAccounts(e.target.value)}
        error={errFor("accounts")}
        helper="Comma-separated list of account usernames or IDs. Required by the backend (at least one)."
      />
      <Input
        label="Banner URL"
        name="banner"
        value={banner}
        onChange={(e) => setBanner(e.target.value)}
        error={errFor("banner")}
      />
      {error && (
        <p className="text-caption text-error" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" loading={loading}>
          Create shop
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/shops")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
