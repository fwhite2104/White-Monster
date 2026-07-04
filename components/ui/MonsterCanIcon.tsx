export function MonsterCanIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="56"
      height="80"
      viewBox="0 0 56 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="6" y="12" width="44" height="56" rx="4" fill="currentColor" className="text-primary" />
      <ellipse cx="28" cy="12" rx="22" ry="6" fill="currentColor" className="text-primary/60" />
      <ellipse cx="28" cy="68" rx="22" ry="6" fill="currentColor" className="text-primary/40" />
      <ellipse cx="28" cy="10" rx="6" ry="2" fill="currentColor" className="text-foreground/40" />
      <rect x="26" y="4" width="4" height="8" rx="2" fill="currentColor" className="text-foreground/40" />
      <path d="M18 32 L22 48 L28 36 L34 48 L38 32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-background" fill="none" />
    </svg>
  )
}
