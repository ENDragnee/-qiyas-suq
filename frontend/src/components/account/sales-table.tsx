"use client";

import { useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { PriceTag } from "@/components/ui/PriceTag";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { fetchSales } from "@/lib/api/sales.graphql";
import { ApiError } from "@/lib/api/client";
import type { Sale, SaleStatus } from "@/types";

function statusTone(status: SaleStatus) {
  if (status === "success") return "success" as const;
  if (status === "failed" || status === "canceled") return "error" as const;
  return "warning" as const;
}

export default function SalesTable() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchSales()
      .then((r) => {
        if (active) setSales(r.fetchSales.data);
      })
      .catch((e) => {
        if (active)
          setError(
            e instanceof ApiError ? e.message : "Could not load purchases",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <p className="text-body-sm text-muted">Loading purchases…</p>;
  }
  if (error) {
    return <EmptyState title="Couldn't load purchases" body={error} />;
  }
  if (sales.length === 0) {
    return (
      <EmptyState
        title="No purchases yet"
        body="Buy an item from a shop and it'll show up here."
      />
    );
  }

  const columns: Column<Sale>[] = [
    {
      key: "itemId",
      header: "Item",
      render: (r) => (
        <span className="font-mono text-num">{r.itemId.slice(0, 8)}</span>
      ),
    },
    {
      key: "price",
      header: "Price",
      mono: true,
      align: "right",
      render: (r) => <PriceTag value={r.price} />,
    },
    {
      key: "quantity",
      header: "Qty",
      mono: true,
      align: "right",
      render: (r) => r.quantity,
    },
    {
      key: "code",
      header: "Code",
      mono: true,
      render: (r) => <span className="font-mono">{r.code}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge tone={statusTone(r.status)}>{r.status}</Badge>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={sales}
      rowKey={(r) => r.code || r.itemId}
    />
  );
}
