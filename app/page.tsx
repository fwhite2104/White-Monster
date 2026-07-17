"use client"

import { Header } from "@/components/app/Header"
import { LocationSection } from "@/components/app/LocationSection"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <LocationSection />
      <main className="max-w-7xl mx-auto p-4">
        <p className="text-muted-foreground">Price list coming soon.</p>
      </main>
    </div>
  )
}
