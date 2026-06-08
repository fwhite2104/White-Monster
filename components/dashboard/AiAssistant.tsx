'use client'

import { useState } from 'react'
import { MessageCircle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useChat } from '@/hooks/use-chat'
import { ChatMessage } from '@/components/dashboard/ChatMessage'
import { ChatInput } from '@/components/dashboard/ChatInput'
import { QuickPrompts } from '@/components/dashboard/QuickPrompts'

interface AiAssistantProps {
  lat: number
  lng: number
  radius: number
}

export function AiAssistant({ lat, lng, radius }: AiAssistantProps) {
  const [open, setOpen] = useState(false)
  const { messages, loading, error, sendMessage, clearMessages } = useChat()

  const handleSend = (message: string) => {
    sendMessage(message, lat, lng, radius)
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
        aria-label="Ask about prices"
      >
        <MessageCircle className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md h-[520px] flex flex-col gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-4 py-3 border-b border-border flex flex-row items-center justify-between">
            <DialogTitle className="text-sm font-semibold">
              Price Assistant
            </DialogTitle>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={clearMessages}
                aria-label="Clear chat"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Ask me anything about Monster drink prices in Cork.
                </p>
                <QuickPrompts onSelect={handleSend} disabled={loading} />
              </div>
            )}

            {messages.map((msg, i) => (
              <ChatMessage key={i} role={msg.role} content={msg.content} />
            ))}

            {loading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
              <div className="flex gap-2.5">
                <div className="shrink-0 h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center">
                  <div className="h-3.5 w-3.5 rounded-full bg-primary animate-pulse" />
                </div>
                <div className="bg-card ring-1 ring-foreground/10 rounded-xl px-3.5 py-2.5 text-sm">
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce [animation-delay:0ms]">.</span>
                    <span className="animate-bounce [animation-delay:150ms]">.</span>
                    <span className="animate-bounce [animation-delay:300ms]">.</span>
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 text-destructive rounded-xl px-3.5 py-2.5 text-sm">
                {error}
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-border">
            <ChatInput onSend={handleSend} loading={loading} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
