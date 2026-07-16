import SalesTable from "@/components/account/sales-table";

export default function AccountSalesPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-display text-foreground">
        Purchase history
      </h1>
      <p className="text-body-sm text-muted">
        Your purchases across this shop.
      </p>
      <SalesTable />
    </div>
  );
}
