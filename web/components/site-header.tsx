"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/estimator", label: "Value estimator" },
  { href: "/market", label: "Market analysis" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-line bg-card/90">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="no-underline">
          <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-teal">Property portal</span>
          <span className="font-serif text-xl text-ink">Harbor Housing</span>
        </Link>
        <nav aria-label="Applications">
          <ul className="flex gap-2">
            {LINKS.map((link) => {
              const current = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={current ? "page" : undefined}
                    className={`inline-flex rounded-full px-3 py-2 text-sm no-underline ${current ? "bg-teal text-white" : "text-ink hover:bg-paper"}`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
