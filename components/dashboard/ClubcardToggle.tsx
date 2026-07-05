'use client'

import { useClubcardPreference } from '@/hooks/use-clubcard-preference'
import { Badge } from '@/components/ui/badge'
import { CreditCard } from 'lucide-react'

export function ClubcardToggle() {
  const { isClubcardHolder, toggleClubcard } = useClubcardPreference()

  return (
    <button
      type="button"
      onClick={toggleClubcard}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
        isClubcardHolder
          ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30'
          : 'bg-card ring-1 ring-foreground/8 text-foreground hover:ring-blue-500/30 hover:bg-[#1e293b]'
      }`}
      aria-pressed={isClubcardHolder}
      title="Toggle Clubcard holder status to show Clubcard prices"
    >
      <CreditCard className="h-3 w-3" />
      Clubcard
      {isClubcardHolder && (
        <Badge variant="info" className="text-xs px-1 py-0 ml-0.5">
          ON
        </Badge>
      )}
    </button>
  )
}
