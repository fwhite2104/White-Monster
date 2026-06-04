'use client'

import { useState, useEffect } from 'react'

export function useHasMapRealEstate(): boolean {
  const [hasRealEstate, setHasRealEstate] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    function check() {
      const width = window.innerWidth
      const height = window.innerHeight
      const isTouch = window.matchMedia('(pointer: coarse)').matches

      const enoughWidth = width >= 768
      const enoughHeight = height >= 600
      const notTouchSmall = !(isTouch && width < 1024)

      setHasRealEstate(enoughWidth && enoughHeight && notTouchSmall)
    }

    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return hasRealEstate
}
