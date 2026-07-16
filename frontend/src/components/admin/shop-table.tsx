"use client";

import { useState } from "react";
import Link from "next/link";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/EmptyState";
import { getShops, deleteShopAdmin } from "@/lib/api/shops.client";
import type { Shop } from "@/types";

export default function ShopTable({
  initialShops,
  initialHasNext,
  initialPage,
}: {
  initialShops: Shop[];
  initialHasNext: boolean;
  initialPage: number;
}) {
  const toast = useToast();
  const [shops, setShops] = useState<Shop[]>(initialShops);
  const [page, setPage] = useState(initialPage);
  const [hasNext, setHasNext] = useState(initialHasNext);
  const [loading, setLoading] = useState(false);
  const [toDelete, setToDelete] = useState<Shop | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadMore() {
    setLoading(true);
    try {
      const next = page + 1;
      const res = await getShops({ page: next, limit: 10 });
      setShops((p) => [...p, ...res.data]);
      setPage(next);
      setHasNext(res.metadata?.hasNextPage ?? false);
    } catch {
      toast.show("Couldn't load more shops", "error");
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteShopAdmin(toDelete._id);
      setShops((p) => p.filter((s) => s._id !== toDelete._id));
      toast.show("Shop deleted", "success");
    } catch {
      toast.show("Couldn't delete shop", "error");
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  }

  const columns: Column<Shop>[] = [
    { key: "name", header: "Name", sortable: true },
    {
      key: "accounts",
      header: "Accounts",
      mono: true,
      align: "right",
      sortable: true,
      render: (r) => (r.accounts ?? []).length,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <button
          type="button"
          className="text-caption font-medium text-error hover:underline"
          onClick={() => setToDelete(r)}
        >
          Delete
        </button>
      ),
    },
  ];

  if (shops.length === 0) {
    return (
      <EmptyState
        title="No shops yet"
        body="Create the first shop on the platform."
        action={
          <Link href="/admin/shops/new">
            <Button>New shop</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Link href="/admin/shops/new">
          <Button>New shop</Button>
        </Link>
      </div>
      <DataTable columns={columns} rows={shops} rowKey={(r) => r._id} />
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
        title="Delete shop"
      >
        <p className="text-body-sm text-muted">
          Delete “{toDelete?.name}”? This also removes its inventory and
          can’t be undone.
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
