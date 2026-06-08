'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ShoppingCart, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBasket } from '@/hooks/use-basket'
import { BasketItemRow, BasketItemAdder } from '@/components/dashboard/BasketItemRow'
import { BasketResultCard } from '@/components/dashboard/BasketResultCard'
import { BasketSavingsSummary } from '@/components/dashboard/BasketSavingsSummary'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface BasketOptimizerProps {
  userLat: number
  userLng: number
}

export function BasketOptimizer({ userLat, userLng }: BasketOptimizerProps) {
  const shouldReduceMotion = useReducedMotion()
  const [open, setOpen] = useState(false)
  const {
    items, result, loading, error,
    addItem, removeItem, updateQuantity, clearBasket, optimise, canAddMore,
  } = useBasket()

  const handleOptimise = () => {
    optimise(userLat, userLng, 10)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-10 px-3.5 shrink-0 rounded-full relative transition-all duration-200"
        onClick={() => setOpen(true)}
      >
        <ShoppingCart className="h-4 w-4 mr-1.5" />
        Basket
        {items.length > 0 && (
          <span className="ml-1.5 h-4 min-w-4 px-1 text-[9px] rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center font-semibold">
            {items.length}
          </span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Basket Optimizer
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {items.length === 0 && !result && (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Add Monster variants to your basket to find the cheapest store combination.</p>
              </div>
            )}

            <div className="space-y-2">
              {items.map((item) => (
                <BasketItemRow
                  key={`${item.variant}:${item.pack_size}`}
                  item={item}
                  onRemove={removeItem}
                  onUpdateQuantity={updateQuantity}
                />
              ))}
            </div>

            <BasketItemAdder onAdd={addItem} canAddMore={canAddMore} />

            {items.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleOptimise}
                  disabled={loading}
                  className="flex-1"
                  size="sm"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : null}
                  {loading ? 'Optimizing...' : 'Find cheapest stores'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearBasket}
                  className="text-muted-foreground"
                >
                  Clear
                </Button>
              </div>
            )}

            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}

            {result && result.allocations.length > 0 && (
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <BasketSavingsSummary
                  totalCost={result.total_cost}
                  totalSavings={result.total_savings}
                  worstCaseCost={result.worst_case_cost}
                  storesToVisit={result.stores_to_visit}
                  recommendation={result.recommendation}
                />

                <div className="space-y-2">
                  {result.allocations.map((alloc, idx) => (
                    <BasketResultCard
                      key={alloc.store_id}
                      allocation={alloc}
                      isBest={idx === 0}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {result && result.allocations.length === 0 && items.length > 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                <p>No stores found with matching prices. Try expanding your search radius.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
