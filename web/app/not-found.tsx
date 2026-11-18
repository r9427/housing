import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-2xl border border-line bg-card p-6">
      <h1 className="text-3xl">Page not found</h1>
      <p className="mt-2 text-muted">That address is not part of the portal.</p>
      <Link href="/" className="mt-4 inline-flex rounded-full bg-teal px-4 py-2 text-sm text-white no-underline">
        Back to overview
      </Link>
    </div>
  );
}
