import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1e1e1e",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Monster Cork | Find Cheapest Monster Energy Nearby",
  description: "Find the cheapest Monster Energy drinks near you in Cork, Ireland. Compare prices across Tesco, Dunnes, SuperValu, Lidl, Aldi, Centra, and more. Live prices, store locator, and price reporting.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${instrumentSerif.variable} dark h-full antialiased`}>
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
