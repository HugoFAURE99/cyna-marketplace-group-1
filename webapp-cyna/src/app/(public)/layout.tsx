import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "../globals.css";
import { cn } from "@/lib/utils";
import PublicHeader from "@/components/layout/public-header/PublicHeader";
import PublicFooter from "@/components/layout/public-footer/PublicFooter";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CYNA",
  description: "Enterprise cybersecurity marketplace for modern businesses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <PublicHeader />
      {/* Spacer offsets the fixed header (h-[72px]). */}
      <div aria-hidden="true" className="h-[72px] shrink-0" />
      <div className="flex flex-1 flex-col">{children}</div>
      <PublicFooter />
    </div>
  );
}
