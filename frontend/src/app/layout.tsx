import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { SiteNav } from "@/components/site-nav";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kiyas — shop inventory & sales",
  description:
    "Kiyas (qiyas-suq) — a tenant-scoped shop inventory and sales tool.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Cookie presence only — enough for nav state. Real checks happen in the
  // protected layouts via getSession() (which upgrades once /api/auth/me exists).
  const store = await cookies();
  const authed = store.has("connect.sid");

  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ToastProvider>
          <SiteNav authed={authed} />
          <main className="flex-1">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
