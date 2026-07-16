import ShopForm from "@/components/admin/shop-form";

export const dynamic = "force-dynamic";

export default function NewShopPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-display text-foreground">New shop</h1>
        <p className="mt-1 text-body-sm text-muted">
          Create a shop. Its password acts as the staff invite code at signup.
        </p>
      </div>
      <ShopForm />
    </div>
  );
}
