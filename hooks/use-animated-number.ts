'use client'

import { useEffect, useRef, useState } from 'react'
import { useMotionValue, animate } from 'framer-motion'

export function useAnimatedNumber(value: number, decimals = 2): string {
  const motionValue = useMotionValue(value)
  const prevRef = useRef(value)
  const [display, setDisplay] = useState(() => value.toFixed(decimals))

  useEffect(() => {
    return motionValue.on('change', (v) => setDisplay(v.toFixed(decimals)))
  }, [motionValue, decimals])

  useEffect(() => {
    if (prevRef.current === value) return
    prevRef.current = value
    const controls = animate(motionValue, value, {
      type: 'spring',
      stiffness: 120,
      damping: 20,
      mass: 0.5,
    })
    return controls.stop
  }, [value, motionValue])

  return display
}
