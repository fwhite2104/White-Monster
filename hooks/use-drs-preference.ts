'use client'

import { useState, useCallback } from 'react'

const DRS_PREFERENCE_KEY = 'monster_cork_show_drs'

export function useDrsPreference() {
  const [showDrs, setShowDrs] = useState(() => {
    try {
      const stored = localStorage.getItem(DRS_PREFERENCE_KEY)
      return stored === 'true'
    } catch {
      return false
    }
  })

  const toggleDrs = useCallback(() => {
    setShowDrs((prev) => {
      const next = !prev
      try {
        localStorage.setItem(DRS_PREFERENCE_KEY, String(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  return { showDrs, toggleDrs }
}
