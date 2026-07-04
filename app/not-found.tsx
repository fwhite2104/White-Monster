'use client'
import Link from "next/link";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-full flex flex-col">
      <Header onReportPrice={() => {}} />
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">404</h1>
          <p className="text-muted-foreground">Page not found</p>
        </div>
        <p className="text-sm text-muted-foreground max-w-xs">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/">
          <Button>Back to Monster Cork</Button>
        </Link>
      </main>
      <Footer />
    </div>
  );
}
