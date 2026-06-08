'use client'

import { useState, useCallback } from 'react'
import type { Store } from '@/lib/types'

export function useConvenienceStores() {
  const [reportStore, setReportStore] = useState<Store | null>(null)
  const [showRegistration, setShowRegistration] = useState(false)
  const [showReportFlow, setShowReportFlow] = useState(false)

  const openReport = useCallback((store: Store) => {
    setReportStore(store)
    setShowReportFlow(true)
  }, [])

  const closeReport = useCallback(() => {
    setReportStore(null)
    setShowReportFlow(false)
  }, [])

  return {
    reportStore,
    showRegistration,
    setShowRegistration,
    showReportFlow,
    openReport,
    closeReport,
  }
}
