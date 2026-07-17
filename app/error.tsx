'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error boundary caught:', error)
  }, [error])

  return (
    <div className="min-h-full flex flex-col items-center justify-center gap-6 p-8 text-center bg-background text-foreground">
      <div className="flex items-center justify-center size-16 rounded-2xl bg-primary/10 ring-1 ring-primary/20">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="size-8 text-primary"
          aria-hidden="true"
        >
          <path
            d="M13 2L4.5 13.5H11L10 22L19.5 10H13L13 2Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Something went wrong
        </h2>
        <p className="text-muted-foreground max-w-sm mx-auto text-sm leading-relaxed">
          {error.message || "This page couldn't load. Please try again."}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/50 font-mono">
            Error ID: {error.digest}
          </p>
        )}
      </div>

      <button
        onClick={reset}
        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium min-w-[140px]"
      >
        Try again
      </button>
    </div>
  )
}
