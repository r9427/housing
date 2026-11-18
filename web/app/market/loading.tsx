export default function Loading() {
  return (
    <div aria-live="polite" className="grid gap-4">
      <div className="h-8 w-56 animate-pulse rounded-full bg-line" />
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="h-24 animate-pulse rounded-2xl bg-line" />
        <div className="h-24 animate-pulse rounded-2xl bg-line" />
        <div className="h-24 animate-pulse rounded-2xl bg-line" />
        <div className="h-24 animate-pulse rounded-2xl bg-line" />
      </div>
      <div className="h-80 animate-pulse rounded-2xl bg-line" />
    </div>
  );
}
