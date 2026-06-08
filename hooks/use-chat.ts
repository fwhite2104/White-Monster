'use client'

import { useState, useCallback } from 'react'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (message: string, lat: number, lng: number, radius: number) => {
    const userMsg: ChatMessage = { role: 'user', content: message }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, lat, lng, radius }),
      })

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error('Too many requests. Please wait a moment.')
        }
        throw new Error('Failed to get response.')
      }

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      const assistantMsg: ChatMessage = { role: 'assistant', content: data.response }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Something went wrong.'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return { messages, loading, error, sendMessage, clearMessages }
}
