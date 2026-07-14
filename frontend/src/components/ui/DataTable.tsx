"use client";

import { ReactNode, useState } from "react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  mono?: boolean;
  sortable?: boolean;
  align?: "left" | "right";
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, i: number) => string;
  empty?: ReactNode;
}) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);

  const sorted = [...rows];
  if (sort) {
    const col = columns.find((c) => c.key === sort.key);
    if (col?.sortable) {
      const get = (row: T) =>
        col.render ? col.render(row) : (row as Record<string, unknown>)[sort.key];
      sorted.sort((a, b) => {
        const av = get(a);
        const bv = get(b);
        if (av == null) return 1;
        if (bv == null) return -1;
        if (typeof av === "number" && typeof bv === "number")
          return (av - bv) * sort.dir;
        return String(av).localeCompare(String(bv)) * sort.dir;
      });
    }
  }

  if (rows.length === 0 && empty) return <>{empty}</>;

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full border-collapse text-body">
        <thead>
          <tr className="bg-surface-sunken text-caption uppercase tracking-[0.03em] text-muted">
            {columns.map((c) => (
              <th
                key={c.key}
                className={`px-4 py-3 text-${c.align === "right" ? "right" : "left"} font-medium`}
              >
                {c.sortable ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-foreground"
                    onClick={() =>
                      setSort((s) =>
                        s?.key === c.key
                          ? { key: c.key, dir: s.dir === 1 ? -1 : 1 }
                          : { key: c.key, dir: 1 },
                      )
                    }
                  >
                    {c.header}
                    <span aria-hidden="true">
                      {sort?.key === c.key ? (sort.dir === 1 ? "▲" : "▼") : "↕"}
                    </span>
                  </button>
                ) : (
                  c.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={rowKey(row, i)}
              className="border-t border-border odd:bg-surface even:bg-surface-sunken/40"
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`px-4 py-3 ${c.mono ? "tabular" : ""} ${
                    c.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {c.render ? c.render(row) : (row as Record<string, ReactNode>)[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
