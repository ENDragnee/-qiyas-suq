import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authed } = await getSession();
  if (!authed) redirect("/login?next=/dashboard");
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">{children}</div>
  );
}
