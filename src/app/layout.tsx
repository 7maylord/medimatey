import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MediMate — Your Medication Companion",
  description:
    "A privacy-first, AI-powered medication management companion. Scan pills, track schedules, check interactions, and journal symptoms — all offline on your device.",
  keywords: [
    "medication management",
    "pill scanner",
    "drug interactions",
    "health companion",
    "offline health app",
    "AI medication assistant",
  ],
  authors: [{ name: "MediMate" }],
  openGraph: {
    title: "MediMate — Your Medication Companion",
    description:
      "AI-powered medication management that works completely offline. Scan pills, check interactions, and never miss a dose.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0e1a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
