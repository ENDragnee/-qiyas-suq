import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-display text-foreground">Admin</h1>
      <p className="text-body-sm text-muted">
        Internal tools for managing the platform.
      </p>
      <div className="rounded-md border border-border p-6">
        <h2 className="font-title text-title text-foreground">Shops</h2>
        <p className="mt-1 text-body-sm text-muted">
          Create and manage shops on the platform.
        </p>
        <Link href="/admin/shops" className="mt-4 inline-block">
          <Button>Manage shops</Button>
        </Link>
      </div>
    </div>
  );
}
