'use client'

import { type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'

interface MapBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
}

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]

export function MapBottomSheet({ isOpen, onClose, title, children, footer }: MapBottomSheetProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="map-sheet-backdrop"
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.2, ease: EASE_OUT }
            }
            className="fixed inset-0 z-40 bg-black/40"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            key="map-sheet-panel"
            role="dialog"
            aria-modal="true"
            aria-label={title ?? 'Map view'}
            initial={
              shouldReduceMotion
                ? false
                : { y: '100%', scale: 0.95, opacity: 0 }
            }
            animate={
              shouldReduceMotion
                ? { y: 0, scale: 1, opacity: 1 }
                : { y: 0, scale: 1, opacity: 1 }
            }
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { y: '100%', scale: 0.95, opacity: 0, transition: { duration: 0.2, ease: EASE_OUT } }
            }
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : {
                    type: 'tween',
                    duration: 0.3,
                    ease: EASE_OUT,
                  }
            }
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl bg-card ring-1 ring-border"
            style={{
              maxHeight: '70vh',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            <div className="flex flex-col items-center pt-3 pb-2">
              <button
                type="button"
                onClick={onClose}
                className="flex w-full items-center justify-center cursor-pointer"
                aria-label="Close map"
              >
                <span className="h-1 w-10 rounded-full bg-muted-foreground/30" />
              </button>

              <div className="flex w-full items-center justify-between px-4 pt-2">
                <span className="text-sm font-semibold text-foreground">
                  {title ?? 'Map'}
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              {children}
            </div>
            {footer && (
              <div className="shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
