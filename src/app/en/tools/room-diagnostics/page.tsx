import Link from "next/link";

import { Container } from "@/components/container";
import { EnglishRoomDiagnostics } from "@/components/room-diagnostics-en";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import { siteConfig } from "@/lib/site";

export const metadata = createEnglishPageMetadata({
  title: "Screeps Room Snapshot Diagnostic",
  description:
    "Enter Spawn, workforce, Energy, Controller, construction, CPU, and bucket values to generate prioritized Screeps room checks without connecting an account.",
  path: "/en/tools/room-diagnostics",
  chinesePath: "/tools/room-diagnostics",
});

export default function EnglishRoomDiagnosticsPage() {
  const pageUrl = `${siteConfig.url}/en/tools/room-diagnostics`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Screeps Room Snapshot Diagnostic",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        url: pageUrl,
        description: "Check Spawn, workforce, Energy, Controller, construction, CPU, and bucket risks from a static Screeps room snapshot.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${siteConfig.url}/en` },
          { "@type": "ListItem", position: 2, name: "Tools", item: `${siteConfig.url}/en/tools` },
          { "@type": "ListItem", position: 3, name: "Room Diagnostics", item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className="page-shell diagnostic-tool-page" lang="en">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container>
        <nav className="diagnostic-breadcrumb" aria-label="Breadcrumb">
          <Link href="/en/tools">Tools</Link><span aria-hidden="true">/</span><span>Room Diagnostics</span>
        </nav>
        <header className="page-header diagnostic-header">
          <p className="eyebrow">SCREEPS TOOL</p>
          <h1>Room Snapshot Diagnostic</h1>
          <p>Check a static room snapshot for workforce collapse, weak Energy input, Controller downgrade pressure, construction overload, CPU pressure, and a falling bucket. The tool never connects to your account or executes game actions.</p>
        </header>

        <EnglishRoomDiagnostics />

        <section className="diagnostic-boundaries" aria-labelledby="diagnostic-boundaries-en-title">
          <div><p className="eyebrow">BOUNDARIES</p><h2 id="diagnostic-boundaries-en-title">How to use the result</h2></div>
          <div>
            <p>The findings come from one snapshot and cannot prove a multi-tick trend. The alert thresholds are maintenance recommendations for prioritizing inspection, not official Screeps constants.</p>
            <p>Replace the example room name before running the Console probe. The generated code only reads values and logs JSON; it does not spawn, move, trade, destroy, or modify Memory.</p>
            <div className="diagnostic-links">
              <Link href="/en/screeps-errors">Review return codes →</Link>
              <Link href="/en/verification">Read the verification method →</Link>
            </div>
          </div>
        </section>
      </Container>
      <style>{`
        .diagnostic-breadcrumb { display: flex; gap: 10px; margin-bottom: 28px; color: var(--muted); font-size: 13px; }
        .diagnostic-header { max-width: 980px; }
        .diagnostic-header > p:last-child { max-width: 840px; }
        .diagnostic-boundaries { display: grid; grid-template-columns: minmax(220px, .65fr) minmax(0, 1.35fr); gap: 58px; margin-top: 78px; border-top: 1px solid var(--border); padding: 68px 0 30px; }
        .diagnostic-boundaries h2 { margin: 8px 0 0; font-size: clamp(34px, 5vw, 50px); letter-spacing: -.045em; }
        .diagnostic-boundaries > div:last-child > p { margin: 0; color: var(--muted); line-height: 1.8; }
        .diagnostic-boundaries > div:last-child > p + p { margin-top: 16px; }
        .diagnostic-links { display: flex; flex-wrap: wrap; gap: 12px 20px; margin-top: 26px; }
        .diagnostic-links a { font-weight: 680; }
        @media (max-width: 800px) { .diagnostic-boundaries { grid-template-columns: 1fr; gap: 32px; } }
      `}</style>
    </main>
  );
}
