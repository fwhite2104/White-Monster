export function Footer() {
  return (
    <footer className="border-t border-border pb-safe mt-auto bg-background">
      <div className="max-w-7xl mx-auto px-4 text-center text-xs text-muted-foreground">
        <p>
          Monster Cork &mdash; Price comparison for educational purposes.
          Prices may vary. Not affiliated with Monster Energy or retailers.
        </p>
        <p className="mt-1">
          Map data &copy;{' '}
          <a href="https://www.openstreetmap.org/copyright" className="underline hover:text-foreground transition-colors min-h-[44px] inline-flex items-center">
            OpenStreetMap
          </a>{' '}
          contributors &copy;{' '}
          <a href="https://carto.com/attributions" className="underline hover:text-foreground transition-colors min-h-[44px] inline-flex items-center">
            CARTO
          </a>
        </p>
      </div>
    </footer>
  )
}
