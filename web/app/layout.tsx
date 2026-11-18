import type { Metadata } from "next";
import { ViewTransition } from "react";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Harbor Housing", template: "%s · Harbor Housing" },
  description: "Estimate property values and analyse a sample housing market with one shared pricing model.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <SiteHeader />
        <ViewTransition name="page">
          <main id="main" className="mx-auto max-w-6xl px-4 py-8">
            {children}
          </main>
        </ViewTransition>
      </body>
    </html>
  );
}
