export function Footer() {
  return (
    <footer className="border-t py-6 pb-6 pb-safe mt-auto">
      <div className="max-w-6xl mx-auto px-4 text-center text-xs text-muted-foreground">
        <p>
          Monster Cork &mdash; Price comparison for educational purposes.
          Prices may vary. Not affiliated with Monster Energy or retailers.
        </p>
        <p className="mt-1">
          Map data &copy;{' '}
          <a href="https://www.openstreetmap.org/copyright" className="underline min-h-[44px] inline-flex items-center">
            OpenStreetMap
          </a>{' '}
          contributors.
        </p>
      </div>
    </footer>
  )
}
