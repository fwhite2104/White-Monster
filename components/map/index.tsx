'use client'

import dynamic from 'next/dynamic'

const StoreMap = dynamic(() => import('./StoreMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full bg-muted animate-pulse rounded-lg" />
  ),
})

export default StoreMap
