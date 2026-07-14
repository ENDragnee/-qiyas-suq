"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { PriceTag } from "@/components/ui/PriceTag";
import { DataTable, Column } from "@/components/ui/DataTable";
import { ToastProvider, useToast } from "@/components/ui/toast";

const swatches = [
  ["background", "var(--color-background)"],
  ["surface", "var(--color-surface)"],
  ["surface-sunken", "var(--color-surface-sunken)"],
  ["foreground", "var(--color-foreground)"],
  ["muted", "var(--color-muted)"],
  ["primary", "var(--color-primary)"],
  ["primary-hover", "var(--color-primary-hover)"],
  ["accent", "var(--color-accent)"],
  ["success", "var(--color-success)"],
  ["error", "var(--color-error)"],
  ["warning", "var(--color-warning)"],
  ["border", "var(--color-border)"],
  ["ink", "var(--color-ink)"],
] as const;

type Row = { id: string; name: string; price: number; stock: number };
const sample: Row[] = [
  { id: "1", name: "Red dates 1kg", price: 1200, stock: 12 },
  { id: "2", name: "Mint tea 200g", price: 350, stock: 3 },
  { id: "3", name: "Olive oil 500ml", price: 2400, stock: 0 },
];
const cols: Column<Row>[] = [
  { key: "name", header: "Item", sortable: true },
  { key: "price", header: "Price", mono: true, align: "right", sortable: true },
  { key: "stock", header: "Stock", mono: true, align: "right", sortable: true },
];

function Demo() {
  const toast = useToast();
  const [modal, setModal] = useState(false);
  return (
    <div className="mx-auto max-w-5xl space-y-10 p-8">
      <h1 className="font-display text-display text-foreground">Style guide</h1>

      <section>
        <h2 className="mb-3 text-title font-semibold">Color tokens</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {swatches.map(([name, val]) => (
            <div key={name} className="rounded-md border border-border p-3">
              <div
                className="mb-2 h-12 w-full rounded-sm border border-border"
                style={{ background: val }}
              />
              <p className="text-caption text-muted">{name}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-title font-semibold">Buttons</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="accent">Accent</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button loading>Loading</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Input label="Name" name="name" placeholder="Item name" />
        <Input label="With error" name="err" error="Name must be at least 3 characters" defaultValue="ab" />
        <Select label="Shop" name="shop" options={[{ value: "1", label: "Shop A" }]} />
        <Input label="With helper" name="help" helper="Ask your shop admin for this" />
        <Textarea label="Description" name="desc" className="sm:col-span-2" />
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <Badge tone="success">In stock</Badge>
        <Badge tone="warning">Low stock</Badge>
        <Badge tone="error">Out of stock</Badge>
        <Badge tone="neutral">Draft</Badge>
        <Badge tone="primary">Verified</Badge>
        <PriceTag value={1200} />
        <PriceTag value={2400} size="lg" />
      </section>

      <section>
        <h2 className="mb-3 text-title font-semibold">DataTable (mono numbers, sortable)</h2>
        <DataTable columns={cols} rows={sample} rowKey={(r) => r.id} />
      </section>

      <section className="space-y-4">
        <h2 className="text-title font-semibold">Overlays</h2>
        <div className="flex gap-3">
          <Button onClick={() => setModal(true)}>Open modal</Button>
          <Button variant="secondary" onClick={() => toast.show("Saved", "success")}>
            Success toast
          </Button>
          <Button variant="secondary" onClick={() => toast.show("Something went wrong", "error")}>
            Error toast
          </Button>
        </div>
        <Modal open={modal} onClose={() => setModal(false)} title="Confirm delete">
          <p className="mb-4 text-body-sm text-muted">
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => setModal(false)}>
              Delete
            </Button>
          </div>
        </Modal>
      </section>

      <section>
        <h2 className="mb-3 text-title font-semibold">Skeleton & EmptyState</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-20 w-full" />
          </div>
          <EmptyState title="No items yet" body="Add your first item to get started." />
        </div>
      </section>
    </div>
  );
}

export default function StyleGuidePage() {
  // Dev-only preview of the design system. Excluded from production builds:
  // in production this renders a short placeholder instead of the component
  // gallery (see build-guide deviation #5).
  if (process.env.NODE_ENV === "production") {
    return (
      <div className="mx-auto max-w-5xl p-8">
        <h1 className="font-display text-display text-foreground">
          Style guide
        </h1>
        <p className="mt-2 text-body-sm text-muted">
          This design-system preview is only available in development.
        </p>
      </div>
    );
  }
  return (
    <ToastProvider>
      <Demo />
    </ToastProvider>
  );
}
