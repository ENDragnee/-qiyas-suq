"use client";

import { useState } from "react";
import Link from "next/link";
import type { Item } from "@/types";
import { PriceTag } from "@/components/ui/PriceTag";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/toast";
import { createSale, updateSalesStatus } from "@/lib/api/sales.graphql";

export function ItemDetailPanel({
  item,
  authed,
}: {
  item: Item;
  authed: boolean;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);

  const outOfStock = (item.stock ?? 0) <= 0;
  const total = item.price * qty;

  async function confirm() {
    setLoading(true);
    try {
      const code = Math.random().toString(36).slice(2, 10);
      const res = await createSale({
        itemId: item._id,
        price: total,
        quantity: qty,
        code,
      });
      const sale = res.createSale.data;
      if (!sale.id) throw new Error("Purchase did not return a sale id");
      // Option A (Fix 2): Buy-now is an immediate, complete purchase. Mark the
      // sale "success" right away so it appears in /account/sales and so stock
      // decrements at purchase time (updateSalesStatus is the only path that
      // decrements stock). Done before showing success so a failure surfaces.
      await updateSalesStatus(sale.id, "success");
      toast.show(`Purchase recorded — code ${sale.code}`, "success");
      setOpen(false);
    } catch (err) {
      // Buy now is wired end-to-end (backend createSale returns { message, data }).
      // Genuine failures (e.g. insufficient stock) surface honestly here.
      toast.show(
        err instanceof Error ? err.message : "Purchase failed",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="aspect-[4/5] w-full overflow-hidden rounded-md border border-border bg-surface-sunken">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-tint to-accent-tint text-muted">
            No image
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-display text-display text-foreground">
            {item.name}
          </h1>
          {item.shopId && (
            <Link
              href={`/shops/${item.shopId}`}
              className="text-body-sm text-primary hover:underline"
            >
              View shop
            </Link>
          )}
        </div>

        <PriceTag value={item.price} size="lg" />
        <p className="text-body-sm text-muted">
          {outOfStock
            ? "Out of stock"
            : `${item.stock} in stock`}
        </p>
        {item.description && (
          <p className="text-body text-foreground">{item.description}</p>
        )}

        {authed ? (
          <div className="mt-2">
            <Button
              variant="accent"
              onClick={() => setOpen(true)}
              disabled={outOfStock}
            >
              Buy now
            </Button>
          </div>
        ) : (
          <Link
            href={`/login?next=/items/${item._id}`}
            className="inline-flex h-11 w-fit items-center justify-center rounded-md bg-accent px-4 text-body font-medium text-foreground hover:bg-accent-hover"
          >
            Sign in to buy
          </Link>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Buy ${item.name}`}
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Quantity"
            name="qty"
            type="number"
            min={1}
            max={item.stock || 1}
            value={qty}
            onChange={(e) =>
              setQty(Math.max(1, Math.min(item.stock || 1, Number(e.target.value) || 1)))
            }
          />
          <div className="flex items-center justify-between text-body">
            <span className="text-muted">Total (estimate)</span>
            <PriceTag value={total} />
          </div>
          <p className="text-caption text-muted">
            Total is a client-side estimate; nothing is reserved until you
            confirm.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" loading={loading} onClick={confirm}>
              Confirm purchase
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
