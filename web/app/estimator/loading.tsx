export default function Loading() {
  return (
    <div aria-live="polite" className="grid gap-4">
      <div className="h-8 w-48 animate-pulse rounded-full bg-line" />
      <div className="h-12 w-80 animate-pulse rounded-xl bg-line" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-96 animate-pulse rounded-2xl bg-line" />
        <div className="h-96 animate-pulse rounded-2xl bg-line" />
      </div>
    </div>
  );
}
