import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authed } = await getSession();
  if (!authed) redirect("/login?next=/account");
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">{children}</div>
  );
}
