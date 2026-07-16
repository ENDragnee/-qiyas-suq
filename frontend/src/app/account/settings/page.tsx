"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { resetPassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
  const toast = useToast();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await resetPassword({ oldPassword, newPassword });
      toast.show("Password updated", "success");
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update password");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-display text-foreground">
          Change password
        </h1>
        <p className="mt-1 text-body-sm text-muted">
          Enter your current password, then choose a new one.
        </p>
      </div>
      <form
        onSubmit={onSubmit}
        className="flex max-w-md flex-col gap-4"
      >
        <Input
          label="Current password"
          name="oldPassword"
          type="password"
          autoComplete="current-password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          required
        />
        <Input
          label="New password"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        {error && (
          <p className="text-caption text-error" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" loading={loading}>
          Update password
        </Button>
      </form>
    </div>
  );
}
