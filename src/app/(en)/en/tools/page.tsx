import Link from "next/link";

import { Container } from "@/components/container";
import { createEnglishPageMetadata } from "@/lib/english-metadata";

import styles from "../english.module.css";
import "../../english-tools.css";
import "../../../screeps-planning-tools.css";

export const metadata = createEnglishPageMetadata({
  title: "Free Screeps Tools and Calculators",
  description:
    "Free Screeps tools for Creep bodies, room diagnostics, Market and Terminal costs, Controller downgrade planning, and Lab reaction and Boost production.",
  path: "/en/tools",
  chinesePath: "/tools",
});

const planningTools = [
  {
    eyebrow: "MARKET & TERMINAL",
    title: "Market and Terminal Cost Calculator",
    description: "Calculate transaction Energy, effective Market deal value, maximum Energy payload, and the 5% order creation fee.",
    href: "/en/tools/market-terminal-cost-calculator",
  },
  {
    eyebrow: "CONTROLLER",
    title: "Controller Downgrade and Upgrader Planner",
    description: "Estimate downgrade margin, Upgrader throughput, Boosted progress, RCL8 caps, and time to a target.",
    href: "/en/tools/controller-downgrade-planner",
  },
  {
    eyebrow: "LAB & BOOST",
    title: "Lab Reaction and Boost Planner",
    description: "Expand compound reaction chains and calculate base minerals, Lab runs, production ticks, and Boost batches.",
    href: "/en/tools/lab-reaction-boost-planner",
  },
] as const;

export default function EnglishToolsPage() {
  return (
    <main className={styles.page} lang="en">
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
            <div className="english-tools-copy"><p className="eyebrow">BODY CALCULATOR</p><h2>Creep Body Calculator</h2><p>Combine body parts and calculate Energy cost, spawn time, total hits, carry capacity, and loaded movement speed.</p><ul><li>No account connection</li><li>Immediate recalculation</li><li>Movement and capacity checks</li></ul><Link href="/en/tools/creep-body-calculator">Open calculator →</Link></div>
          </article>

          <article>
            <div className="english-tools-preview english-tools-diagnostic-preview" aria-label="Sample room diagnostic interface preview">
              <span className="english-sample-label">SAMPLE OUTPUT</span>
              <div className="english-tools-diagnostic-meter" aria-hidden="true"><span className="english-tools-diagnostic-meter-fill-82" /></div>
              <div><strong>Example room health</strong><b>82 / 100</b></div>
              <ol><li><span>01</span>Spawn capacity stable</li><li><span>02</span>Controller downgrade safe</li><li><span>03</span>CPU bucket needs review</li></ol>
              <small>Example room · Static preview only</small>
            </div>
            <div className="english-tools-copy"><p className="eyebrow">ROOM DIAGNOSTICS</p><h2>Room Snapshot Diagnostic</h2><p>Enter Spawn, workforce, Energy, Controller, construction, CPU, and bucket values to receive prioritized checks.</p><ul><li>Read-only snapshot</li><li>Prioritized warnings</li><li>Clear operational boundaries</li></ul><Link href="/en/tools/room-diagnostics">Open diagnostics →</Link></div>
          </article>
        </section>

        <section aria-labelledby="planning-tools-title" className="tool-related-guides">
          <p className="eyebrow">PLANNING CALCULATORS</p>
          <h2 id="planning-tools-title">Plan repeated decisions before changing automation</h2>
          <div className="tools-hub-grid">
            {planningTools.map((tool) => (
              <Link className="tools-hub-card" href={tool.href} key={tool.href}>
                <span className="eyebrow">{tool.eyebrow}</span>
                <h2>{tool.title}</h2>
                <p>{tool.description}</p>
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
