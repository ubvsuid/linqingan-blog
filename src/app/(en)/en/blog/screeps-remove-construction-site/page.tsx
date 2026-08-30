import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/container";
import { siteConfig } from "@/lib/site";

const path = "/en/blog/screeps-remove-construction-site";
const chinesePath = "/blog/screeps-construction-site-remove";
const title = "Screeps ConstructionSite.remove(): Safe Removal Guide";
const headline = "How to Remove a Construction Site Safely in Screeps";
const description =
  "Remove one Screeps ConstructionSite by exact ID, preserve OK or ERR_NOT_OWNER, distinguish it from a completed Structure, and verify the original site on a later visible tick.";
const publishedAt = "2026-07-24";
const modifiedTime = "2026-08-29";
const articleUrl = `${siteConfig.url}${path}`;

export const metadata: Metadata = {
  title: { absolute: `${title} | Linqingan` },
  description,
  keywords: [
    "Screeps remove construction site",
    "ConstructionSite.remove()",
    "Screeps delete construction site",
    "Game.getObjectById()",
    "LOOK_CONSTRUCTION_SITES",
    "ERR_NOT_OWNER",
  ],
  alternates: {
    canonical: path,
    languages: {
      en: path,
      "zh-CN": chinesePath,
      "x-default": path,
    },
  },
  openGraph: {
    type: "article",
    locale: "en_US",
    alternateLocale: ["zh_CN"],
    url: articleUrl,
    siteName: "Linqingan",
    title: `${title} | Linqingan`,
    description,
    publishedTime: publishedAt,
    modifiedTime,
    tags: ["Screeps", "ConstructionSite", "JavaScript", "Debugging"],
    images: [{ url: `${siteConfig.url}/opengraph-image`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} | Linqingan`,
    description,
    images: [`${siteConfig.url}/opengraph-image`],
  },
};

const quickAnswerHtml = String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Use <code>ConstructionSite.remove()</code> on the exact unfinished site you intend to remove. Do not use <code>Structure.destroy()</code> unless construction has already completed.</p>
<pre><code class="language-javascript">const result = site.remove();</code></pre>
<p><code>OK</code> means the removal was scheduled successfully. Keep the original site ID and position, then verify the result on a later tick when the room is visible. <code>ERR_NOT_OWNER</code> means the site is neither yours nor in your room.</p>
`;

const articleHtml = String.raw`
<h2 id="site-or-structure">First confirm that the target is still a Construction Site</h2>
<p>A finished building is a <code>Structure</code>, not a <code>ConstructionSite</code>. The removal APIs are different:</p>
<div class="table-scroll"><table>
<thead><tr><th>Target now</th><th>Use</th><th>Do not substitute</th></tr></thead>
<tbody>
<tr><td>Unfinished Construction Site</td><td><code>site.remove()</code></td><td><code>structure.destroy()</code></td></tr>
<tr><td>Completed Structure</td><td><code>structure.destroy()</code></td><td><code>site.remove()</code></td></tr>
</tbody>
</table></div>
<p>If a Builder could have completed the site since you last inspected it, retrieve the current object again before mutating anything.</p>

<h2 id="inspect-target">Inspect the exact site before removing it</h2>
<p>If you already know the site ID, retrieve it with <code>Game.getObjectById()</code> and review its fields. If you only know the tile, this read-only probe finds Construction Sites at that position. Replace the room name and example coordinates before using it:</p>
<pre><code class="language-javascript">const roomName = 'REPLACE_WITH_ROOM_NAME';
const x = 20; // Example only: replace.
const y = 20; // Example only: replace.
const room = Game.rooms[roomName];

if (!room) {
  console.log('Room is not visible.');
} else {
  const sites = room.lookForAt(
    LOOK_CONSTRUCTION_SITES,
    x,
    y
  );

  console.log(JSON.stringify(
    sites.map(function (site) {
      return {
        id: site.id,
        my: site.my,
        roomName: site.pos.roomName,
        roomControlledByMe:
          site.room.controller?.my === true,
        x: site.pos.x,
        y: site.pos.y,
        structureType: site.structureType,
        progress: site.progress,
        progressTotal: site.progressTotal
      };
    })
  ));
}</code></pre>
<p>Confirm the ID, room, coordinates, <code>structureType</code>, and progress before continuing. The <code>my</code> field is useful context, but <strong><code>site.my === false</code> does not by itself mean <code>remove()</code> must fail</strong>. The official return-code condition is that the site is not yours <em>and</em> is not in your room. Current public engine 4.3.2 implements that boundary by accepting either site ownership or room-controller ownership.</p>

<h2 id="remove-once">Remove the confirmed site once</h2>
<p>After the read-only inspection matches the target you meant to remove, retrieve the same ID again and submit one request:</p>
<pre><code class="language-javascript">const site = Game.getObjectById('REPLACE_WITH_SITE_ID');

if (!(site instanceof ConstructionSite)) {
  console.log('Target is not a visible ConstructionSite.');
} else {
  const snapshot = {
    siteId: site.id,
    roomName: site.pos.roomName,
    x: site.pos.x,
    y: site.pos.y,
    structureType: site.structureType,
    progress: site.progress,
    progressTotal: site.progressTotal
  };

  const result = site.remove();

  console.log(JSON.stringify({
    ...snapshot,
    result
  }));
}</code></pre>
<p>Do not turn an unexpected result into an automatic retry. If the call does not return <code>OK</code>, inspect the target again instead of assuming the same ID and state are still correct.</p>

<h2 id="return-codes">ConstructionSite.remove() return codes</h2>
<div class="table-scroll"><table>
<thead><tr><th>Return code</th><th>What it means</th><th>What to do next</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>The removal operation was scheduled successfully.</td><td>Keep the original ID and position; verify on a later tick.</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>The site is not yours and is not in your room.</td><td>Recheck the exact object and room. Do not use <code>site.my</code> alone as the eligibility test.</td></tr>
</tbody>
</table></div>
<p>Those are the two documented return values for <code>ConstructionSite.remove()</code>. For a broader return-code lookup, use the <a href="/en/screeps-errors">Screeps error-code reference</a>.</p>

<h2 id="verify-later">Verify the original site on a later visible tick</h2>
<p><code>OK</code> is a request result, not the later observation. On a later tick, confirm room vision first. Then check the original ID and inspect the original tile so a replacement site is not mistaken for the removed object.</p>
<pre><code class="language-javascript">function verifyConstructionSiteRemoval(target) {
  const room = Game.rooms[target.roomName];

  if (!room) {
    return {
      status: 'pending-no-room-vision',
      checkedAt: Game.time
    };
  }

  const originalSite =
    Game.getObjectById(target.siteId);

  if (originalSite) {
    return {
      status: 'original-site-still-present',
      checkedAt: Game.time
    };
  }

  const sitesAtPosition = room.lookForAt(
    LOOK_CONSTRUCTION_SITES,
    target.x,
    target.y
  );

  return {
    status: 'verified-original-site-absent',
    checkedAt: Game.time,
    sitesAtPosition: sitesAtPosition.map(
      function (site) {
        return {
          id: site.id,
          my: site.my,
          structureType: site.structureType
        };
      }
    )
  };
}</code></pre>
<p><code>Game.getObjectById()</code> can only access objects in rooms currently visible to you. That is why a bare <code>null</code> is not enough when the room is out of vision. Once the room is visible, an absent original ID verifies that the original site is gone; another site at the same coordinates is a different object and should be reported separately.</p>

<h2 id="automation-guard">If automation can trigger removal, make the request one-shot</h2>
<p>The large Memory workflow is optional. It is useful only when removal is initiated by automation rather than by one deliberate Console action. The confirmation string and expected position below are <strong>linqingan.com safety policy</strong>, not Screeps API requirements.</p>
<pre><code class="language-javascript">function submitRemoveSiteRequestOnce() {
  const request = Memory.removeSiteRequest;

  if (
    !request ||
    request.confirmation !==
      'REMOVE_CONSTRUCTION_SITE'
  ) {
    return;
  }

  delete Memory.removeSiteRequest;

  if (
    typeof request.siteId !== 'string' ||
    typeof request.roomName !== 'string' ||
    !Number.isInteger(request.x) ||
    !Number.isInteger(request.y) ||
    typeof request.expectedType !== 'string'
  ) {
    Memory.lastRemoveSiteResult = {
      submittedAt: Game.time,
      status: 'invalid-request'
    };
    return;
  }

  const site = Game.getObjectById(request.siteId);

  if (!(site instanceof ConstructionSite)) {
    Memory.lastRemoveSiteResult = {
      submittedAt: Game.time,
      status: 'target-not-visible-or-missing'
    };
    return;
  }

  if (
    site.pos.roomName !== request.roomName ||
    site.pos.x !== request.x ||
    site.pos.y !== request.y ||
    site.structureType !== request.expectedType
  ) {
    Memory.lastRemoveSiteResult = {
      submittedAt: Game.time,
      status: 'target-mismatch'
    };
    return;
  }

  const snapshot = {
    siteId: site.id,
    roomName: site.pos.roomName,
    x: site.pos.x,
    y: site.pos.y,
    structureType: site.structureType,
    progress: site.progress,
    progressTotal: site.progressTotal
  };

  const result = site.remove();

  Memory.lastRemoveSiteResult = {
    submittedAt: Game.time,
    status: result === OK
      ? 'accepted'
      : 'rejected',
    result,
    snapshot
  };
}</code></pre>
<p>The request is consumed before the mutation call, so a later tick cannot silently resubmit the same removal. Notice that this guard validates target identity but does not reject <code>site.my === false</code>; <code>remove()</code> itself returns the documented ownership result.</p>

<h2 id="boundaries">Failure and evidence boundaries</h2>
<ul>
<li><strong>ID resolves to <code>null</code>:</strong> the object may be gone, the ID may be wrong, or the room may not be visible. Check room vision before recording success.</li>
<li><strong>The site completed:</strong> stop this workflow. A completed <code>Structure</code> uses <code>destroy()</code>, which has its own return-code boundaries.</li>
<li><strong>Existing progress:</strong> capture <code>progress</code> and <code>progressTotal</code> before removal if the invested work matters to your decision. This guide does not claim that removed progress is transferred or refunded.</li>
<li><strong>Another site appears on the tile:</strong> compare IDs. Coordinate occupancy alone does not prove the original site survived.</li>
<li><strong>Bulk cleanup:</strong> this guide intentionally covers one exact target. Batch deletion needs separate target-selection and confirmation policy.</li>
</ul>
<p>No live Console or official-shard removal trace is claimed here. The API behavior, visibility rule, current engine ownership boundary, and code paths were checked against current official sources and offline logic; live multi-tick verification remains pending.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#ConstructionSite.remove" rel="nofollow">ConstructionSite.remove()</a></li>
<li><a href="https://docs.screeps.com/api/#Game.getObjectById" rel="nofollow">Game.getObjectById()</a></li>
<li><a href="https://docs.screeps.com/api/#Room.lookForAt" rel="nofollow">Room.lookForAt()</a></li>
<li><a href="https://docs.screeps.com/api/#Structure.destroy" rel="nofollow">Structure.destroy()</a></li>
<li><a href="https://github.com/screeps/engine/blob/80977824199a596d174d392fd0cf8c458c21fcbd/src/game/construction-sites.js" rel="nofollow">Official Screeps engine source: ConstructionSite.remove()</a></li>
<li><a href="${chinesePath}">Read the Chinese source article</a></li>
</ul>
`;

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BlogPosting",
      headline,
      description,
      datePublished: publishedAt,
      dateModified: modifiedTime,
      inLanguage: "en-US",
      mainEntityOfPage: articleUrl,
      url: articleUrl,
      author: {
        "@type": "Person",
        name: siteConfig.author.name,
        url: `${siteConfig.url}/en/about`,
      },
      publisher: {
        "@type": "Person",
        name: siteConfig.author.name,
        url: `${siteConfig.url}/en/about`,
      },
      keywords:
        "Screeps remove construction site, ConstructionSite.remove(), JavaScript, debugging, ERR_NOT_OWNER",
      isBasedOn: `${siteConfig.url}${chinesePath}`,
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${siteConfig.url}/en`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Articles",
          item: `${siteConfig.url}/en/blog`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: headline,
          item: articleUrl,
        },
      ],
    },
  ],
};

const toc = [
  ["Construction Site or completed Structure?", "site-or-structure"],
  ["Inspect the exact site", "inspect-target"],
  ["Remove the site once", "remove-once"],
  ["Return codes", "return-codes"],
  ["Verify on a later tick", "verify-later"],
  ["Optional automation guard", "automation-guard"],
  ["Failure and evidence boundaries", "boundaries"],
] as const;

export default function RemoveConstructionSitePage() {
  return (
    <main className="article-shell" lang="en">
      <Container className="article-container">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />

        <article>
          <header className="article-header">
            <nav className="article-breadcrumb" aria-label="Breadcrumb">
              <Link href="/en">Home</Link>
              <span aria-hidden="true">/</span>
              <Link href="/en/blog">Articles</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">ConstructionSite.remove()</span>
            </nav>
            <p className="eyebrow">SCREEPS API SAFETY · CONSTRUCTION</p>
            <h1>{headline}</h1>
            <p className="article-description">{description}</p>
            <div className="post-meta">
              <time dateTime={publishedAt}>Published July 24, 2026</time>
              <span aria-hidden="true">/</span>
              <time dateTime={modifiedTime}>Updated August 29, 2026</time>
              <span aria-hidden="true">/</span>
              <span>9 min read</span>
            </div>
            <div className="tag-list" aria-label="Article tags">
              <span className="tag">Screeps</span>
              <span className="tag">ConstructionSite</span>
              <span className="tag">JavaScript</span>
              <span className="tag">Debugging</span>
            </div>
          </header>

          <div
            className="article-content"
            dangerouslySetInnerHTML={{ __html: quickAnswerHtml }}
          />

          <nav className="article-toc english-toc" aria-label="Table of contents">
            <p className="article-toc-title">Table of contents</p>
            <ol>
              {toc.map(([label, id]) => (
                <li key={id}><a href={`#${id}`}>{label}</a></li>
              ))}
            </ol>
          </nav>

          <div className="article-content" dangerouslySetInnerHTML={{ __html: articleHtml }} />

          <section className="english-verification remove-site-verification" aria-labelledby="verification-status-title">
            <div>
              <p className="eyebrow">VERIFICATION</p>
              <h2 id="verification-status-title">Verification status</h2>
            </div>
            <dl>
              <div><dt>Chinese source</dt><dd>Read in full</dd></div>
              <div><dt>Official documentation</dt><dd>Checked — ConstructionSite.remove(), Game.getObjectById(), Room.lookForAt(), Structure.destroy()</dd></div>
              <div><dt>Official engine source</dt><dd>Checked — screeps/engine 4.3.2, commit 80977824199a596d174d392fd0cf8c458c21fcbd</dd></div>
              <div><dt>JavaScript syntax</dt><dd>Checked</dd></div>
              <div><dt>Offline logic review</dt><dd>Passed — one-shot request consumption, target mismatch, room-vision, original-ID, and replacement-site branches</dd></div>
              <div><dt>Screeps Console</dt><dd>Pending</dd></div>
              <div><dt>Live multi-tick test</dt><dd>Pending</dd></div>
              <div><dt>Last verified</dt><dd>August 29, 2026</dd></div>
            </dl>
          </section>

          <nav className="article-pagination" aria-label="Article navigation">
            <span className="article-pagination-placeholder" />
            <Link className="article-pagination-link article-pagination-next" href="/en/blog">
              <span>Continue reading</span>
              <strong>Return to English articles</strong>
            </Link>
          </nav>
        </article>
      </Container>
    </main>
  );
}
