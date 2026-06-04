'use client'

import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  errorMessage: string | null
}

/**
 * Error boundary specifically for the Leaflet map.
 * Catches (NaN, NaN) and other Leaflet initialization errors
 * so they don't crash the entire page.
 */
export class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, errorMessage: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'Map failed to load',
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.warn('MapErrorBoundary caught:', error.message, info.componentStack)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="h-[300px] md:h-[400px] w-full rounded-lg bg-muted flex flex-col items-center justify-center gap-2 px-6 text-center">
            <p className="text-sm text-muted-foreground">
              Map could not be loaded.
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, errorMessage: null })}
              className="text-xs text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
            >
              Try again
            </button>
          </div>
        )
      )
    }

    return this.props.children
  }
}
