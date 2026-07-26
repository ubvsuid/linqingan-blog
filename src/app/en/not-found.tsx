import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/container";

export const metadata: Metadata = {
  title: { absolute: "Page Not Found | Linqingan" },
  description: "The requested English Screeps page could not be found.",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export default function EnglishNotFoundPage() {
  return (
    <main className="not-found" lang="en">
      <Container>
        <p className="eyebrow">ERROR 404</p>
        <h1>This page does not exist</h1>
        <p>The address may be incorrect, or the page may have moved. Return to the English home page or search guides, tools, terms, and return codes.</p>
        <div className="button-row">
          <Link href="/en" className="button button-primary">English home</Link>
          <Link href="/en/search" className="button button-secondary">Search the site</Link>
          <Link href="/en/knowledge" className="button button-secondary">Browse knowledge</Link>
        </div>
      </Container>
    </main>
  );
}
