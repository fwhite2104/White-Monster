'use client'

const QUICK_PROMPTS = [
  'Cheapest zero sugar near me',
  'Any 4-pack deals?',
  'Compare Tesco vs Dunnes',
  'What flavours are available?',
  'How much for 10 cans?',
  'Best store in Douglas',
]

interface QuickPromptsProps {
  onSelect: (prompt: string) => void
  disabled?: boolean
}

export function QuickPrompts({ onSelect, disabled }: QuickPromptsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {QUICK_PROMPTS.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onSelect(prompt)}
          disabled={disabled}
          className="inline-flex items-center h-8 px-3 rounded-full text-xs font-medium bg-card ring-1 ring-foreground/8 text-foreground hover:ring-primary/30 hover:bg-primary/5 transition-all duration-200 disabled:opacity-50"
        >
          {prompt}
        </button>
      ))}
    </div>
  )
}
