import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { AuthSessionProvider } from "@/components/session-provider";
import { UserMenu } from "@/components/user-menu";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CostYou",
  description: "CostYou – Restaurant recipe and menu costing",
  applicationName: "CostYou",
};

export const viewport: Viewport = {
  themeColor: "#14b8a6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <AuthSessionProvider>
          <header className="border-b border-border/60 sticky top-0 z-40 w-full backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3">
                <div className="size-2.5 rounded-full bg-primary shadow-[0_0_24px_#14b8a6]" />
                <span className="text-sm font-semibold tracking-wide text-primary">CostYou</span>
              </Link>
              <div className="ml-auto">
                <UserMenu />
              </div>
            </div>
          </header>
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}
