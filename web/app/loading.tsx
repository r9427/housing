export default function Loading() {
  return (
    <div aria-live="polite" className="grid gap-4">
      <p className="text-sm text-muted">Loading the portal…</p>
      <div className="h-28 animate-pulse rounded-2xl bg-line" />
      <div className="h-64 animate-pulse rounded-2xl bg-line" />
    </div>
  );
}
