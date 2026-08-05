import Link from "next/link";

import { Container } from "@/components/container";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import { siteConfig } from "@/lib/site";
import { getToolHref, toolCatalog } from "@/lib/tool-catalog";

import styles from "../english.module.css";
import "../../english-tools.css";
import "../../../screeps-planning-tools.css";

export const metadata = createEnglishPageMetadata({
  title: "Free Screeps Tools and Calculators",
  description:
    "Free Screeps tools for Creep bodies, room diagnostics, Market, Controllers, Labs, Spawn queues, hauling throughput, and Tower power.",
  path: "/en/tools",
  chinesePath: "/tools",
});

const bodyTool = toolCatalog[0];
const roomTool = toolCatalog[1];
const planningTools = toolCatalog.slice(2);

export default function EnglishToolsPage() {
  const pageUrl = `${siteConfig.url}/en/tools`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "Free Screeps Tools and Calculators",
        url: pageUrl,
        inLanguage: "en",
        description: "Browser-based Screeps calculators and diagnostics that do not connect to a player account.",
        mainEntity: { "@id": `${pageUrl}#tools` },
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#tools`,
        numberOfItems: toolCatalog.length,
        itemListElement: toolCatalog.map((tool, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: tool.enTitle,
          url: `${siteConfig.url}${getToolHref(tool.slug, "en")}`,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${siteConfig.url}/en` },
          { "@type": "ListItem", position: 2, name: "Tools", item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className={styles.page} lang="en">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/en">Home</Link><span aria-hidden="true">/</span><span>Tools</span></nav>
        <header className={styles.header}>
          <p className="eyebrow">SCREEPS TOOLS</p>
          <h1>Calculate, diagnose, and plan safely</h1>
          <p>These tools run locally in the browser. They do not request a Screeps token, connect to your account, or execute game actions.</p>
        </header>

        <section className="english-tools-showcase" aria-label="Core Screeps tools">
          <article>
            <div className="english-tools-preview english-tools-body-preview" aria-label="Sample Creep body calculator interface preview">
              <span className="english-sample-label">INTERFACE PREVIEW</span>
              <div aria-hidden="true"><span>WORK</span><span>CARRY</span><span>MOVE</span><span>MOVE</span></div>
              <dl aria-label="Example calculator output"><div><dt>Energy</dt><dd>250</dd></div><div><dt>Spawn time</dt><dd>12 ticks</dd></div><div><dt>Carry</dt><dd>50</dd></div></dl>
              <small>Example values · No account connected</small>
            </div>
            <div className="english-tools-copy"><p className="eyebrow">{bodyTool.eyebrow}</p><h2>{bodyTool.enTitle}</h2><p>{bodyTool.enDescription}</p><ul><li>No account connection</li><li>Immediate recalculation</li><li>Movement and capacity checks</li></ul><Link href={getToolHref(bodyTool.slug, "en")}>Open calculator →</Link></div>
          </article>

          <article>
            <div className="english-tools-preview english-tools-diagnostic-preview" aria-label="Sample room diagnostic interface preview">
              <span className="english-sample-label">SAMPLE OUTPUT</span>
              <div className="english-tools-diagnostic-meter" aria-hidden="true"><span className="english-tools-diagnostic-meter-fill-82" /></div>
              <div><strong>Example room health</strong><b>82 / 100</b></div>
              <ol><li><span>01</span>Spawn capacity stable</li><li><span>02</span>Controller downgrade safe</li><li><span>03</span>CPU bucket needs review</li></ol>
              <small>Example room · Static preview only</small>
            </div>
            <div className="english-tools-copy"><p className="eyebrow">{roomTool.eyebrow}</p><h2>{roomTool.enTitle}</h2><p>{roomTool.enDescription}</p><ul><li>Read-only snapshot</li><li>Prioritized warnings</li><li>Clear operational boundaries</li></ul><Link href={getToolHref(roomTool.slug, "en")}>Open diagnostics →</Link></div>
          </article>
        </section>

        <section aria-labelledby="planning-tools-title" className="tool-related-guides">
          <p className="eyebrow">PLANNING CALCULATORS</p>
          <h2 id="planning-tools-title">Plan repeated decisions before changing automation</h2>
          <div className="tools-hub-grid">
            {planningTools.map((tool) => (
              <Link className="tools-hub-card" href={getToolHref(tool.slug, "en")} key={tool.slug}>
                <span className="eyebrow">{tool.eyebrow}</span>
                <h2>{tool.enTitle}</h2>
                <p>{tool.enDescription}</p>
                <strong>Open tool →</strong>
              </Link>
            ))}
          </div>
        </section>

        <div className={styles.notice}>
          <strong>Operational boundary</strong>
          <p>Tool output is a deterministic calculation or static snapshot assessment. Always inspect live return codes, current object identity, stores, cooldowns, and multi-tick behavior before changing production automation.</p>
        </div>
      </Container>
    </main>
  );
}
