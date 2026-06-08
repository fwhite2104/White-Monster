'use client'

import { useState, useCallback } from 'react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('monster_cork_session_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('monster_cork_session_id', id)
  }
  return id
}

interface FavoriteButtonProps {
  productId: string
  storeId?: string
  isFavorited?: boolean
  onToggle?: (favorited: boolean) => void
  className?: string
}

export function FavoriteButton({ productId, storeId, isFavorited = false, onToggle, className }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(isFavorited)
  const [loading, setLoading] = useState(false)

  const handleToggle = useCallback(async () => {
    if (loading) return
    setLoading(true)

    try {
      const sessionId = getSessionId()
      if (!sessionId) return

      if (favorited) {
        const params = new URLSearchParams({ session_id: sessionId, product_id: productId })
        await fetch(`/api/favorites?${params}`, { method: 'DELETE' })
        setFavorited(false)
        onToggle?.(false)
      } else {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, product_id: productId, store_id: storeId }),
        })
        setFavorited(true)
        onToggle?.(true)
      }
    } catch {
      // Silently fail — favorites are non-critical
    } finally {
      setLoading(false)
    }
  }, [favorited, loading, productId, storeId, onToggle])

  return (
    <Button
      variant="ghost"
      size="icon-lg"
      className={cn('h-11 w-11 shrink-0 mt-0.5 text-muted-foreground hover:text-foreground', className)}
      onClick={handleToggle}
      disabled={loading}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        className={cn('h-4 w-4', favorited && 'fill-destructive text-destructive')}
      />
    </Button>
  )
}
