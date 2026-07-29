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

const relatedGuides = [
  {
    href: "/en/blog/screeps-cpu-getused-bucket",
    label: "CPU",
    title: "Inspect CPU Usage and the Bucket",
    description: "Interpret CPU pressure and decide whether the snapshot reflects a temporary spike or a sustained risk.",
  },
  {
    href: "/en/blog/screeps-controller-downgrade",
    label: "CONTROLLER",
    title: "Monitor Controller Downgrade Pressure",
    description: "Turn a low ticksToDowngrade reading into an observable recovery workflow.",
  },
  {
    href: "/en/blog/screeps-emergency-harvester-recovery",
    label: "RECOVERY",
    title: "Recover from a Broken Room Economy",
    description: "Restore a minimal worker when the room no longer has a reliable Energy loop.",
  },
];

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

        <section className="tool-related-guides" aria-labelledby="diagnostic-related-title">
          <p className="eyebrow">FOLLOW THE FINDING</p>
          <h2 id="diagnostic-related-title">Continue from snapshot to root cause</h2>
          <div className="tool-related-grid">
            {relatedGuides.map((guide) => (
              <Link href={guide.href} key={guide.href}>
                <span>{guide.label}</span>
                <strong>{guide.title}</strong>
                <small>{guide.description}</small>
              </Link>
            ))}
          </div>
        </section>
      </Container>
    </main>
  );
}
