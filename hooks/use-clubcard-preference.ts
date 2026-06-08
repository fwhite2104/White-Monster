'use client'

import { useState, useCallback } from 'react'

const CLUBCARD_PREFERENCE_KEY = 'monster_cork_is_clubcard_holder'

export function useClubcardPreference() {
  const [isClubcardHolder, setIsClubcardHolder] = useState(() => {
    try {
      const stored = localStorage.getItem(CLUBCARD_PREFERENCE_KEY)
      return stored === 'true'
    } catch {
      return false
    }
  })

  const toggleClubcard = useCallback(() => {
    setIsClubcardHolder((prev) => {
      const next = !prev
      try {
        localStorage.setItem(CLUBCARD_PREFERENCE_KEY, String(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  return { isClubcardHolder, toggleClubcard }
}
