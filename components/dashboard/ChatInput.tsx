'use client'

import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChatInputProps {
  onSend: (message: string) => void
  loading: boolean
  disabled?: boolean
}

export function ChatInput({ onSend, loading, disabled }: ChatInputProps) {
  const [value, setValue] = useState('')

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed || loading) return
    onSend(trimmed)
    setValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about prices..."
        disabled={disabled || loading}
        className="flex-1 h-10 px-3.5 rounded-full bg-card ring-1 ring-foreground/10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-primary/30 disabled:opacity-50"
      />
      <Button
        size="icon"
        className="h-10 w-10 rounded-full shrink-0"
        onClick={handleSubmit}
        disabled={!value.trim() || loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
