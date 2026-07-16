"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/user-store";
import { apiFetch } from "@/lib/api/client";
import type { Shop } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export default function AccountPage() {
  const user = getCurrentUser();
  const [shop, setShop] = useState<Shop | null>(null);

  useEffect(() => {
    if (!user?.shopId) return;
    apiFetch<{ message: string; data: Shop }>(`/api/shop/${user.shopId}`)
      .then((r) => setShop(r.data))
      .catch(() => {});
  }, [user?.shopId]);

  if (!user) {
    return (
      <EmptyState
        title="Not signed in"
        body="Sign in to view your account."
        action={
          <Link href="/login">
            <Button>Sign in</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-display text-foreground">Account</h1>
      <dl className="flex max-w-md flex-col divide-y divide-border rounded-md border border-border">
        <Row label="Name" value={user.name} />
        <Row label="Username" value={user.userName} />
        <Row
          label="Role"
          value={
            <Badge tone={user.role === "admin" ? "primary" : "neutral"}>
              {user.role}
            </Badge>
          }
        />
        <Row label="Shop" value={shop ? shop.name : user.shopId} />
      </dl>
      <div className="flex flex-wrap gap-2">
        <Link href="/account/settings">
          <Button variant="secondary">Change password</Button>
        </Link>
        <Link href="/account/sales">
          <Button variant="secondary">Purchase history</Button>
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="text-caption uppercase tracking-[0.03em] text-muted">
        {label}
      </dt>
      <dd className="text-body text-foreground">{value}</dd>
    </div>
  );
}
