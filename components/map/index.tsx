'use client'

import dynamic from 'next/dynamic'

const StoreMap = dynamic(() => import('./StoreMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full rounded-lg shimmer-bar bg-muted" />
  ),
})

export default StoreMap
