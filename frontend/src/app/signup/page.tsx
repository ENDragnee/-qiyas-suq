"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signup } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { setCurrentUser } from "@/lib/user-store";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    userName: "",
    password: "",
    shopId: "",
    shopPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await signup(form);
      setCurrentUser(res.data);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign up failed");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="font-display text-display text-foreground">
          Join a shop
        </h1>
        <p className="mt-1 text-body-sm text-muted">
          Kiyas is per-shop. Ask your shop admin for the shop ID and shop
          password.
        </p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input label="Your name" name="name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
        <Input label="Username" name="userName" value={form.userName} onChange={(e) => set("userName", e.target.value)} required />
        <Input label="Password" name="password" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} required />

        <fieldset className="flex flex-col gap-4 rounded-md border border-border p-4">
          <legend className="px-1 text-caption uppercase tracking-[0.03em] text-muted">
            Shop invite
          </legend>
          <Input label="Shop ID" name="shopId" value={form.shopId} onChange={(e) => set("shopId", e.target.value)} helper="Ask your shop admin for these" required />
          <Input label="Shop password" name="shopPassword" type="password" value={form.shopPassword} onChange={(e) => set("shopPassword", e.target.value)} required />
        </fieldset>

        {error && (
          <p className="text-caption text-error" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" loading={loading}>
          Create account
        </Button>
      </form>
      <p className="text-body-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
