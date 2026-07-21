import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6 py-16 text-center gap-6 bg-background text-foreground">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground">404</h1>
        <p className="text-muted-foreground">Page not found</p>
      </div>
      <p className="text-sm text-muted-foreground max-w-xs">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium"
      >
        Back to Monster Ireland
      </Link>
    </div>
  );
}
