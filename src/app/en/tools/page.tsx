import Link from "next/link";

import { Container } from "@/components/container";
import { createEnglishPageMetadata } from "@/lib/english-metadata";

import styles from "../english.module.css";

export const metadata = createEnglishPageMetadata({
  title: "Free Screeps Tools",
  description:
    "Free English Screeps tools for calculating Creep bodies and diagnosing room snapshots without connecting your game account.",
  path: "/en/tools",
  chinesePath: "/knowledge#reference-tools",
});

export default function EnglishToolsPage() {
  return (
    <main className={styles.page} lang="en">
      <Container>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/en">Home</Link><span aria-hidden="true">/</span><span>Tools</span></nav>
        <header className={styles.header}>
          <p className="eyebrow">SCREEPS TOOLS</p>
          <h1>Calculate and diagnose safely</h1>
          <p>These tools run locally in the browser. They do not request a Screeps token, connect to your account, or execute game actions.</p>
        </header>

        <section className="english-tool-showcase" aria-label="English Screeps tools">
          <article>
            <div className="tool-preview body-preview" aria-hidden="true">
              <div><span>WORK</span><span>CARRY</span><span>MOVE</span><span>MOVE</span></div>
              <dl><div><dt>Energy</dt><dd>250</dd></div><div><dt>Spawn time</dt><dd>12 ticks</dd></div><div><dt>Carry</dt><dd>50</dd></div></dl>
            </div>
            <div className="tool-copy"><p className="eyebrow">BODY CALCULATOR</p><h2>Creep Body Calculator</h2><p>Combine body parts and calculate Energy cost, spawn time, total hits, carry capacity, and loaded movement speed.</p><ul><li>No account connection</li><li>Immediate recalculation</li><li>Movement and capacity checks</li></ul><Link href="/en/tools/creep-body-calculator">Open calculator →</Link></div>
          </article>

          <article>
            <div className="tool-preview diagnostic-preview" aria-hidden="true">
              <div className="diagnostic-meter"><span style={{ width: "82%" }} /></div>
              <div><strong>Room health</strong><b>82 / 100</b></div>
              <ol><li><span>01</span>Spawn capacity stable</li><li><span>02</span>Controller downgrade safe</li><li><span>03</span>CPU bucket needs review</li></ol>
            </div>
            <div className="tool-copy"><p className="eyebrow">ROOM DIAGNOSTICS</p><h2>Room Snapshot Diagnostic</h2><p>Enter Spawn, workforce, Energy, Controller, construction, CPU, and bucket values to receive prioritized checks.</p><ul><li>Read-only snapshot</li><li>Prioritized warnings</li><li>Clear operational boundaries</li></ul><Link href="/en/tools/room-diagnostics">Open diagnostics →</Link></div>
          </article>
        </section>

        <div className={styles.notice}>
          <strong>Operational boundary</strong>
          <p>Tool output is a calculation or static snapshot assessment. Always inspect live return codes and multi-tick behavior before changing production automation.</p>
        </div>
      </Container>

      <style>{`
        .english-tool-showcase { display: grid; gap: 22px; }
        .english-tool-showcase > article { display: grid; grid-template-columns: minmax(320px, .8fr) minmax(0, 1.2fr); border: 1px solid var(--border); border-radius: 24px; overflow: hidden; background: var(--surface); }
        .tool-preview { display: grid; align-content: center; gap: 22px; min-height: 390px; border-right: 1px solid var(--border); padding: clamp(26px, 5vw, 48px); background: color-mix(in srgb, var(--surface) 84%, var(--background)); }
        .body-preview > div { display: flex; flex-wrap: wrap; gap: 10px; }
        .body-preview > div span { display: grid; width: 72px; height: 72px; place-items: center; border: 1px solid var(--border); border-radius: 999px; background: var(--background); font-family: monospace; font-size: 11px; font-weight: 700; }
        .body-preview dl { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin: 0; }
        .body-preview dl > div { border-top: 1px solid var(--border); padding-top: 13px; }
        .body-preview dt { color: var(--muted); font-size: 11px; }
        .body-preview dd { margin: 6px 0 0; font-size: 19px; font-weight: 750; }
        .diagnostic-meter { height: 8px; overflow: hidden; border-radius: 999px; background: var(--border); }
        .diagnostic-meter span { display: block; height: 100%; border-radius: inherit; background: var(--foreground); }
        .diagnostic-preview > div:nth-child(2) { display: flex; align-items: end; justify-content: space-between; gap: 20px; }
        .diagnostic-preview b { font-size: 30px; }
        .diagnostic-preview ol { display: grid; gap: 9px; margin: 0; padding: 0; list-style: none; }
        .diagnostic-preview li { display: grid; grid-template-columns: 32px minmax(0, 1fr); gap: 10px; border-top: 1px solid var(--border); padding-top: 12px; color: var(--muted); font-size: 13px; }
        .diagnostic-preview li span { font-family: monospace; }
        .tool-copy { display: flex; flex-direction: column; padding: clamp(28px, 5vw, 52px); }
        .tool-copy h2 { margin: 8px 0 0; font-size: clamp(31px, 5vw, 52px); letter-spacing: -.05em; }
        .tool-copy > p:not(.eyebrow) { margin: 18px 0 0; color: var(--muted); line-height: 1.75; }
        .tool-copy ul { display: grid; gap: 9px; margin: 24px 0 30px; padding-left: 20px; color: var(--muted); }
        .tool-copy a { margin-top: auto; font-weight: 720; }
        @media (max-width: 820px) { .english-tool-showcase > article { grid-template-columns: 1fr; } .tool-preview { min-height: 0; border-right: 0; border-bottom: 1px solid var(--border); } }
        @media (max-width: 520px) { .body-preview dl { grid-template-columns: 1fr; } .body-preview > div span { width: 60px; height: 60px; } }
      `}</style>
    </main>
  );
}
