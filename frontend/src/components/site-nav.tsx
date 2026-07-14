"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/api/auth";
import { Button } from "@/components/ui/Button";

export function SiteNav({ authed }: { authed: boolean }) {
  const router = useRouter();
  const pathname = usePathname();

  async function onLogout() {
    try {
      await logout();
    } catch {
      // ignore — backend clears the cookie regardless
    }
    router.push("/");
    router.refresh();
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)
      ? ("page" as const)
      : undefined;

  return (
    <header className="border-b border-border bg-surface">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3"
      >
        <Link
          href="/"
          aria-current={isActive("/")}
          className="font-display text-title text-foreground"
        >
          Kiyas
        </Link>
        <div className="flex items-center gap-4 text-body-sm">
          <Link
            href="/shops"
            aria-current={isActive("/shops")}
            className="text-foreground hover:text-primary"
          >
            Shops
          </Link>
          {authed ? (
            <>
              <Link
                href="/dashboard"
                aria-current={isActive("/dashboard")}
                className="text-foreground hover:text-primary"
              >
                Dashboard
              </Link>
              <Link
                href="/account"
                aria-current={isActive("/account")}
                className="text-foreground hover:text-primary"
              >
                Account
              </Link>
              <Button variant="ghost" size="sm" onClick={onLogout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                aria-current={isActive("/login")}
                className="text-foreground hover:text-primary"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                aria-current={isActive("/signup")}
                className="text-foreground hover:text-primary"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
