import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-verified auth + role, via the backend's /api/auth/me (Passport
  // session). This matches /account and /dashboard. We deliberately do NOT
  // trust the client-writable kiyas_user cookie for the authorization
  // decision — a regular user can forge it (e.g. via document.cookie) to claim
  // role:"admin". The backend independently re-checks role on every admin
  // mutation (CreateShop / DeleteShopById / DeleteItemAdmin all return 403 for
  // non-admins), so this layout gate is defense-in-depth, not the only control.
  const { authed, user } = await getSession();
  if (!authed) redirect("/login?next=/admin");
  if (user?.role !== "admin") redirect("/dashboard");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">{children}</div>
  );
}
