import type { Metadata, Viewport } from "next";
import { Fira_Sans, Fira_Code } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const firaSans = Fira_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const firaCode = Fira_Code({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#020617",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Monster Cork | Find Cheapest Monster Energy Nearby",
  description: "Find the cheapest Monster Energy drinks near you in Cork, Ireland. Compare prices across Tesco, Dunnes, SuperValu, Lidl, Aldi, Centra, and more. Live prices, store locator, and price reporting.",
  openGraph: {
    title: "Monster Cork — Compare Monster Energy Prices in Cork",
    description:
      "Find the cheapest Monster Energy drink prices across Irish retailers in Cork. Compare Tesco, Dunnes, SuperValu, Lidl, Aldi, Centra, and more.",
    url: "https://white-monster-tracker.vercel.app",
    siteName: "Monster Cork",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Monster Cork — Compare Monster Energy Prices in Cork",
    description:
      "Find the cheapest Monster Energy drink prices across Irish retailers in Cork.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${firaSans.variable} ${firaCode.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[var(--z-dialog)] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary focus:text-primary-foreground focus:font-medium focus:text-sm"
        >
          Skip to content
        </a>
        {children}
        <Toaster richColors position="bottom-center" />
      </body>
    </html>
  );
}
