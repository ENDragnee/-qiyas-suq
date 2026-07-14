"use client";

import { useState } from "react";
import Link from "next/link";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { PriceTag } from "@/components/ui/PriceTag";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/EmptyState";
import { deleteItem, listItems } from "@/lib/api/items";
import type { Item } from "@/types";

function stockStatus(stock: number) {
  if (stock <= 0) return { label: "Out of stock", tone: "error" as const };
  if (stock <= 10) return { label: "Low", tone: "warning" as const };
  return { label: "In stock", tone: "success" as const };
}

export default function ItemTable({
  initialItems,
  initialHasNext,
  initialPage,
}: {
  initialItems: Item[];
  initialHasNext: boolean;
  initialPage: number;
}) {
  const toast = useToast();
  const [items, setItems] = useState<Item[]>(initialItems);
  const [page, setPage] = useState(initialPage);
  const [hasNext, setHasNext] = useState(initialHasNext);
  const [loading, setLoading] = useState(false);
  const [toDelete, setToDelete] = useState<Item | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadMore() {
    setLoading(true);
    try {
      const next = page + 1;
      const res = await listItems(next, 10);
      setItems((p) => [...p, ...res.data]);
      setPage(next);
      setHasNext(res.metadata?.hasNextPage ?? false);
    } catch {
      toast.show("Couldn't load more items", "error");
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteItem(toDelete._id);
      setItems((p) => p.filter((i) => i._id !== toDelete._id));
      toast.show("Item deleted", "success");
    } catch {
      toast.show("Couldn't delete item", "error");
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  }

  const columns: Column<Item>[] = [
    { key: "name", header: "Name", sortable: true },
    {
      key: "price",
      header: "Price",
      mono: true,
      align: "right",
      sortable: true,
      render: (r) => <PriceTag value={r.price} />,
    },
    {
      key: "stock",
      header: "Stock",
      mono: true,
      align: "right",
      sortable: true,
      render: (r) => <span className="font-mono">{r.stock}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        const s = stockStatus(r.stock);
        return <Badge tone={s.tone}>{s.label}</Badge>;
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="flex gap-3">
          <Link
            href={`/dashboard/items/${r._id}/edit`}
            className="text-caption font-medium text-primary hover:underline"
          >
            Edit
          </Link>
          <button
            type="button"
            className="text-caption font-medium text-error hover:underline"
            onClick={() => setToDelete(r)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  if (items.length === 0) {
    return (
      <EmptyState
        title="No items yet"
        body="Add your first item to start tracking this shop's inventory."
        action={
          <Link href="/dashboard/items/new">
            <Button>New item</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <DataTable columns={columns} rows={items} rowKey={(r) => r._id} />
      {hasNext && (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={loadMore} loading={loading}>
            Load more
          </Button>
        </div>
      )}
      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Delete item"
      >
        <p className="text-body-sm text-muted">
          Delete “{toDelete?.name}”? This can’t be undone.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setToDelete(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            loading={deleting}
            onClick={confirmDelete}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
