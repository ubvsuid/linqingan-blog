import type { Metadata } from "next";

import { EnglishArticlePage } from "@/components/english-article-page";
import { getEnglishDiscoveryArticle } from "@/lib/english-discovery";
import { siteConfig } from "@/lib/site";

const path = "/en/blog/screeps-cpu-bucket-degradation";
const chinesePath = "/blog/screeps-cpu-bucket-degradation";
const headline = "Screeps CPU Bucket Degradation: Protect Critical Tasks and Recover Gradually";
const description =
  "Use a hysteresis-based NORMAL, CONSERVE, EMERGENCY, and RECOVERY scheduler when Game.cpu.bucket keeps falling, so Spawn, harvesting, Controller safety, and defense run before optional work.";
const publishedAt = "2026-08-05";
const publishedLabel = "August 5, 2026";
const modifiedTime = "2026-08-05";
const discovery = getEnglishDiscoveryArticle(path);
const articleUrl = `${siteConfig.url}${path}`;

export const metadata: Metadata = {
  title: { absolute: `${headline} | Linqingan` },
  description,
  keywords: [
    "Screeps CPU bucket falling",
    "Screeps CPU degradation",
    "Screeps CPU scheduler",
    "Game.cpu.bucket recovery",
    "Screeps optional task throttling",
  ],
  alternates: {
    canonical: path,
    languages: { en: path, "zh-CN": chinesePath, "x-default": path },
    types: { "application/rss+xml": "/en/feed.xml" },
  },
  openGraph: {
    type: "article",
    locale: "en_US",
    alternateLocale: ["zh_CN"],
    url: articleUrl,
    siteName: "Linqingan",
    title: `${headline} | Linqingan`,
    description,
    publishedTime: publishedAt,
    modifiedTime,
    tags: discovery?.tags ?? ["CPU", "Debugging", "JavaScript"],
    images: [{ url: `${siteConfig.url}${path}/opengraph-image`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${headline} | Linqingan`,
    description,
    images: [`${siteConfig.url}${path}/opengraph-image`],
  },
};

const toc: Array<[string, string]> = [
  ["scope", "Separate measurement from degradation policy"],
  ["modes", "Use four operating modes"],
  ["tiers", "Protect critical tasks first"],
  ["hysteresis", "Prevent threshold flapping"],
  ["decision", "Use a testable transition function"],
  ["cadence", "Throttle and stagger lower-tier work"],
  ["evidence", "Measure whether degradation helped"],
  ["boundaries", "Evidence boundaries"],
];

const articleHtml = String.raw`
<h2 id="scope">Separate measurement from degradation policy</h2>
<p>The existing <a href="/en/blog/screeps-cpu-getused-bucket">CPU measurement guide</a> explains <code>Game.cpu.getUsed()</code>, <code>limit</code>, <code>tickLimit</code>, and <code>bucket</code>. This guide owns a different intent: what the loop should stop, slow down, or preserve after the measurements show a sustained decline.</p>
<p>An occasional bucket drop is not enough evidence by itself. Pathfinding, a global reset, the first Memory parse, combat, or a larger visible object set can make individual ticks expensive. The production risk is a persistent decline while market scans, path rebuilds, statistics, and RoomVisual work continue at their normal cadence.</p>

<h2 id="modes">Use four operating modes</h2>
<table>
<thead><tr><th>Mode</th><th>Purpose</th><th>Default policy</th></tr></thead>
<tbody>
<tr><td><code>NORMAL</code></td><td>Healthy operation</td><td>Run planned work</td></tr>
<tr><td><code>CONSERVE</code></td><td>Slow the decline</td><td>Keep critical work, throttle important work, heavily throttle optional work</td></tr>
<tr><td><code>EMERGENCY</code></td><td>Preserve room survival</td><td>Keep critical work, run important work rarely, disable optional work</td></tr>
<tr><td><code>RECOVERY</code></td><td>Verify that recovery is stable</td><td>Restore important work first and delay optional work</td></tr>
</tbody>
</table>
<p><code>RECOVERY</code> prevents every expensive subsystem from restarting on the first healthy-looking tick. Without a recovery stage, one market scan, path rebuild, and visual pass can create a second spike immediately.</p>

<h2 id="tiers">Protect critical tasks first</h2>
<p>Typical critical work includes emergency Spawn recovery, normal Spawn ownership, core harvesting and hauling, hostile detection, Tower defense, and Controller downgrade protection. These tasks must not be wrapped in a high-bucket condition.</p>
<p>Important work may run less often: non-emergency construction, Link or Lab coordination, remote-room refreshes, and ordinary maintenance. Optional work can stop in emergency mode: broad market scans, bulk path precomputation, detailed RoomVisual output, and reports that do not affect the current tick.</p>
<p>The tier is a local business decision. During combat, remote intelligence that is normally optional may need to become critical.</p>

<h2 id="hysteresis">Prevent threshold flapping</h2>
<p>A single threshold such as <code>bucket &lt; 5000</code> will repeatedly disable and enable work near that value. Use different entry and exit thresholds, consecutive-tick confirmation, and a minimum mode duration.</p>
<pre><code class="language-text">enter CONSERVE below 7000
leave CONSERVE above 8500
confirm degradation for 3 ticks
confirm recovery for 20 ticks</code></pre>
<p>These numbers are local examples, not official recommendations. The official API provides the measurements; your room count, CPU allocation, war state, and task costs determine the policy.</p>

<h2 id="decision">Use a testable transition function</h2>
<pre><code class="language-js">function selectDesiredCpuMode(state, metrics, policy) {
  const { bucket, usedRatio } = metrics;

  if (!Number.isFinite(bucket) || !Number.isFinite(usedRatio)) {
    return { mode: 'EMERGENCY', reason: 'invalid-cpu-metrics', immediate: true };
  }
  if (bucket &lt;= policy.hardEmergencyBucket || usedRatio &gt;= policy.hardUsedRatio) {
    return { mode: 'EMERGENCY', reason: 'hard-cpu-risk', immediate: true };
  }
  if (bucket &lt;= policy.emergencyBelow) {
    return { mode: 'EMERGENCY', reason: 'bucket-emergency', immediate: false };
  }

  if (state.mode === 'NORMAL') {
    return bucket &lt; policy.conserveBelow || usedRatio &gt;= policy.conserveUsedRatio
      ? { mode: 'CONSERVE', reason: 'conserve-threshold', immediate: false }
      : { mode: 'NORMAL', reason: 'healthy', immediate: false };
  }
  if (state.mode === 'CONSERVE') {
    return bucket &gt;= policy.normalAbove &amp;&amp; usedRatio &lt;= policy.normalUsedRatio
      ? { mode: 'NORMAL', reason: 'normal-threshold', immediate: false }
      : { mode: 'CONSERVE', reason: 'conserve-hold', immediate: false };
  }
  if (state.mode === 'EMERGENCY') {
    return bucket &gt;= policy.recoveryAbove &amp;&amp; usedRatio &lt;= policy.recoveryUsedRatio
      ? { mode: 'RECOVERY', reason: 'recovery-threshold', immediate: false }
      : { mode: 'EMERGENCY', reason: 'emergency-hold', immediate: false };
  }
  if (bucket &lt; policy.conserveBelow || usedRatio &gt;= policy.conserveUsedRatio) {
    return { mode: 'CONSERVE', reason: 'recovery-regressed', immediate: false };
  }
  return bucket &gt;= policy.normalAbove &amp;&amp; usedRatio &lt;= policy.normalUsedRatio
    ? { mode: 'NORMAL', reason: 'recovery-complete', immediate: false }
    : { mode: 'RECOVERY', reason: 'recovery-hold', immediate: false };
}</code></pre>
<p>The full Chinese implementation adds candidate counters, minimum hold time, bounded transition and failure history, stable task offsets, remaining-CPU headroom checks, and a complete integration scaffold.</p>
<p>Malformed task entries are partitioned before sorting. A null entry, missing name, missing callback, or unknown tier cannot throw in the comparator before critical work runs.</p>

<h2 id="cadence">Throttle and stagger lower-tier work</h2>
<p>Critical work keeps its original cadence in every mode. Important work may move from every tick to every 2 or 10 ticks. Optional work may move to every 20 ticks in conserve mode, stop in emergency mode, and restart only after a recovery warm-up.</p>
<p>Do not schedule every 100-tick task on <code>Game.time % 100 === 0</code>. Derive a stable offset from the task name so market scans, path rebuilding, and statistics do not return on the same tick.</p>
<p>Before starting a noncritical task, compare current <code>getUsed()</code> with <code>tickLimit</code>. This is a start guard, not a prediction of final tick cost. A task can still cost more than expected, so critical work belongs earlier in the loop.</p>

<h2 id="evidence">Measure whether degradation helped</h2>
<p>Track whether bucket stopped declining, rolling average and peak CPU changed, critical-task failures increased, and modes are switching too often. A recovering bucket does not prove harvesting, spawning, Controller safety, or defense still behaves correctly; CPU evidence and room-behavior evidence are separate.</p>
<p>Record notifications only on real transitions such as <code>NORMAL → CONSERVE</code> or <code>EMERGENCY → RECOVERY</code>. Use the <a href="/en/blog/screeps-game-notify">notification guide</a> for rate limiting instead of sending a low-bucket message every tick.</p>

<h2 id="boundaries">Evidence boundaries</h2>
<p>Thirty offline cases passed: hard emergency entry, three-tick degradation confirmation, twenty-tick recovery confirmation, minimum mode duration, candidate reset, recovery regression, task intervals across all four modes, malformed task isolation, and stable critical-first ordering. The complete Chinese scheduler passed JavaScript syntax checking.</p>
<p>Node.js does not reproduce Screeps CPU units. Live Console measurements, official-shard bucket trends, multi-room costs, combat load, private-server settings, and proof that critical room behavior remains healthy are still pending.</p>
`;

export default function CpuBucketDegradationPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline,
      description,
      datePublished: publishedAt,
      dateModified: modifiedTime,
      inLanguage: "en-US",
      mainEntityOfPage: articleUrl,
      author: { "@type": "Person", name: "Linqingan", url: `${siteConfig.url}/en/about` },
      publisher: { "@type": "Organization", name: "Linqingan", url: siteConfig.url },
      isBasedOn: `${siteConfig.url}${chinesePath}`,
      about: discovery?.tags,
      articleSection: discovery?.moduleTitle,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${siteConfig.url}/en` },
        { "@type": "ListItem", position: 2, name: "Articles", item: `${siteConfig.url}/en/blog` },
        { "@type": "ListItem", position: 3, name: headline, item: articleUrl },
      ],
    },
  ];

  return (
    <EnglishArticlePage
      articleHref={path}
      chinesePath={chinesePath}
      headline={headline}
      description={description}
      breadcrumbLabel="CPU degradation"
      category="OPERATIONS · CPU DEGRADATION"
      publishedAt={publishedAt}
      publishedLabel={publishedLabel}
      modifiedAt={modifiedTime}
      readingTime="16 min read"
      tags={["CPU", "Debugging", "JavaScript"]}
      verification={[
        { term: "Documentation", value: "Official CPU limit, Game.cpu, game-loop, and Memory references checked" },
        { term: "Syntax", value: "Complete Chinese scheduler checked offline" },
        { term: "Offline cases", value: "30 passed" },
        { term: "Live shard", value: "Pending" },
      ]}
      toc={toc}
      articleHtml={articleHtml}
      jsonLd={jsonLd}
    />
  );
}
