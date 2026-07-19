import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { NavServer } from "@/components/NavServer";
import { Footer } from "@/components/Footer";
import { Feedback } from "@/components/Feedback";
import { AuthModal } from "@/components/AuthModal";
import { Telemetry } from "@/components/Telemetry";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://atxuxr.com",
  ),
  title: {
    default: "ATX UXR — The people-people of Austin",
    template: "%s · ATX UXR",
  },
  description:
    "A home for Austin's UXR and CXR professionals to connect, learn, and reflect.",
  openGraph: {
    title: "ATX UXR — The people-people of Austin",
    description:
      "A home for Austin's UXR and CXR professionals to connect, learn, and reflect.",
    type: "website",
    siteName: "ATX UXR",
  },
  twitter: {
    card: "summary_large_image",
    title: "ATX UXR — The people-people of Austin",
    description:
      "A home for Austin's UXR and CXR professionals to connect, learn, and reflect.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F8F4EE",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
        <link
          rel="icon"
          href="/assets/mark-skyline-square.png"
          type="image/png"
        />
      </head>
      <body>
        <Suspense fallback={null}>
          <NavServer />
        </Suspense>
        <main>{children}</main>
        <Footer />
        <Feedback />
        <Suspense fallback={null}>
          <AuthModal />
        </Suspense>
        <Suspense fallback={null}>
          <Telemetry />
        </Suspense>
      </body>
    </html>
  );
}
