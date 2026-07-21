// PROTOTYPE — throwaway. Answers: how should a null-coord national retailer row render?
// See wayfinder #19. Delete this entire directory once a variant is folded into the real components.

import { PrototypeSwitcher } from "./switcher"
import { mockNationalCurrent, mockNationalPostUpdate, mockPhysical, mockProduct } from "./mocks"
import { VariantCurrent } from "./variants/VariantCurrent"
import { VariantBadge } from "./variants/VariantBadge"
import { VariantRibbon } from "./variants/VariantRibbon"
import { VariantOffMap } from "./variants/VariantOffMap"

export const metadata = { title: "Prototype: national null-coord row" }

export default async function PrototypeNationalRowPage({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>
}) {
  const { variant: v } = await searchParams
  const variant = v ?? "current"

  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            Wayfinder #19 · Prototype
          </p>
          <h1 className="text-xl font-semibold">National null-coord row presentation</h1>
          <p className="text-sm text-muted-foreground">
            Three treatments for a national-row (no physical store in radius). All three use{" "}
            <strong>the same mock data</strong> &mdash; national retailer with <code>lat: 0, lng: 0</code>,
            suburb <code>&quot;Ireland (national)&quot;</code>, distance <code>0</code>. The &quot;current&quot;
            variant shows today&rsquo;s misleading <code>Cork City &middot; 0.0 km</code> presentation as control.
            There&rsquo;s also a physical-store row below each national one (the build will hide national when a
            physical is in radius, but showing both lets you check the visual coexistence &mdash; real flow hides the national one).
          </p>
        </header>

        {variant === "current" && <VariantCurrent national={mockNationalCurrent} physical={mockPhysical} product={mockProduct} />}
        {variant === "badge" && <VariantBadge national={mockNationalPostUpdate} physical={mockPhysical} product={mockProduct} />}
        {variant === "ribbon" && <VariantRibbon national={mockNationalPostUpdate} physical={mockPhysical} product={mockProduct} />}
        {variant === "offmap" && <VariantOffMap national={mockNationalPostUpdate} physical={mockPhysical} product={mockProduct} />}

        <PrototypeSwitcher
          variants={[
            { key: "current", label: "Current (control)" },
            { key: "badge", label: "A — Nationwide badge" },
            { key: "ribbon", label: "B — National ribbon" },
            { key: "offmap", label: "C — Off-map panel" },
          ]}
          current={variant}
        />
      </div>
    </main>
  )
}