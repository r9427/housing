"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="rounded-2xl border border-danger/30 bg-danger-bg p-6">
      <h1 className="text-2xl text-danger">The estimator is unavailable</h1>
      <p className="mt-2 text-sm">{error.message}</p>
      <button type="button" onClick={reset} className="mt-4 rounded-full bg-ink px-4 py-2 text-sm text-white">Try again</button>
    </div>
  );
}
