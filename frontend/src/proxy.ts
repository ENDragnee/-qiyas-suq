import { NextRequest, NextResponse } from "next/server";

/*
  Fast UX pre-filter: redirects visitors with NO session cookie away from
  protected areas before the request is even rendered. This is NOT
  authorization. The authoritative, real auth check happens in the protected
  layouts via getSession(), which now calls the backend's /api/auth/me
  (implemented 2026-07-15) and redirects to /login on 401. An expired/invalid
  session with a present cookie passes this proxy but is caught by the
  layout's getSession() check. The backend remains the final authority on every
  API call.

  Migrated from middleware.ts -> proxy.ts (Next 16 convention; middleware is
  deprecated). Logic and matcher are unchanged.
*/

const SESSION_COOKIE = "connect.sid";
const PROTECTED = [/^\/account/, /^\/dashboard/, /^\/admin/];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PROTECTED.some((re) => re.test(pathname))) {
    if (!req.cookies.has(SESSION_COOKIE)) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/dashboard/:path*", "/admin/:path*"],
};
