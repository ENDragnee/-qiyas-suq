"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { setCurrentUser } from "@/lib/user-store";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await login({ userName, password });
      setCurrentUser(res.user);
      const next =
        new URLSearchParams(window.location.search).get("next") ||
        "/dashboard";
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="font-display text-display text-foreground">Sign in</h1>
        <p className="mt-1 text-body-sm text-muted">
          Use your shop account credentials.
        </p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          label="Username"
          name="userName"
          autoComplete="username"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          required
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && (
          <p className="text-caption text-error" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" loading={loading}>
          Sign in
        </Button>
      </form>
      <p className="text-body-sm text-muted">
        Need an account?{" "}
        <Link href="/signup" className="text-primary hover:underline">
          Join a shop
        </Link>
      </p>
    </div>
  );
}
