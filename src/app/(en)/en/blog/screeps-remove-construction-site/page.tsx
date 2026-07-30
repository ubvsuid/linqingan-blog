import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/container";
import { siteConfig } from "@/lib/site";

const path = "/en/blog/screeps-remove-construction-site";
const chinesePath = "/blog/screeps-construction-site-remove";
const title = "Screeps ConstructionSite.remove(): Safe Removal Guide";
const headline = "How to Remove a Construction Site Safely in Screeps";
const description =
  "Remove a misplaced Screeps construction site safely with read-only checks, ID validation, one-shot JavaScript, return-code handling, and next-tick verification.";
const publishedAt = "2026-07-24";
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
    modifiedTime: publishedAt,
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

const articleHtml = `
  <h2 id="quick-answer">Quick answer</h2>
  <p>Use <code>ConstructionSite.remove()</code> to remove an unfinished Construction Site. Before calling it, confirm the site's ID, ownership, room, coordinates, structure type, and current progress. Submit the request only once, store the return code, and verify the original ID and position on a later tick.</p>
  <p>The minimum API call is:</p>
  <pre><code class="language-javascript">const result = site.remove();</code></pre>
  <p>That line changes game state. A safer workflow separates the operation into three stages:</p>
  <ol>
    <li>Inspect the target without changing anything.</li>
    <li>Validate the target and submit one removal request.</li>
    <li>Verify the original object and coordinates on the next visible tick.</li>
  </ol>

  <h2 id="site-or-structure">Construction Site or completed Structure?</h2>
  <p>A Construction Site becomes a completed Structure when construction finishes. The object type and removal method are different.</p>
  <div class="table-scroll"><table>
    <thead><tr><th>Target state</th><th>Object type</th><th>Relevant method</th></tr></thead>
    <tbody>
      <tr><td>Still under construction</td><td><code>ConstructionSite</code></td><td><code>site.remove()</code></td></tr>
      <tr><td>Construction completed</td><td><code>Structure</code></td><td><code>structure.destroy()</code></td></tr>
    </tbody>
  </table></div>
  <p>Do not create a generic function that destroys whatever occupies a coordinate. A target-selection mistake could then affect completed buildings as well as unfinished sites.</p>

  <h2 id="inspect-target">Stage 1: Inspect the target without changing the game</h2>
  <p><strong>State impact:</strong> Read-only. This Console snippet does not remove an object or write to Memory.</p>
  <p>Replace the example room and coordinates before running it.</p>
  <pre><code class="language-javascript">const room = Game.rooms.W1N1;

if (!room) {
  console.log('Room W1N1 is not visible.');
} else {
  const sites = room.lookForAt(
    LOOK_CONSTRUCTION_SITES,
    20,
    20
  );

  console.log(JSON.stringify(
    sites.map((site) =&gt; ({
      id: site.id,
      my: site.my,
      roomName: site.pos.roomName,
      x: site.pos.x,
      y: site.pos.y,
      structureType: site.structureType,
      progress: site.progress,
      progressTotal: site.progressTotal
    }))
  ));
}</code></pre>
  <p>Before continuing, confirm that the result contains the intended site, <code>my</code> is <code>true</code>, the room and coordinates are correct, the structure type matches, and the progress snapshot has been reviewed.</p>
  <p>If the lookup returns no site, stop. Do not replace the check with code that removes the first unrelated object found in the room.</p>

  <h2 id="create-request">Stage 2: Create an explicit one-time request</h2>
  <p><strong>State impact:</strong> The next snippet writes a request to Memory. It does not call <code>remove()</code> by itself.</p>
  <pre><code class="language-javascript">Memory.removeSiteRequest = {
  enabled: true,
  siteId: 'REPLACE_WITH_SITE_ID',
  roomName: 'W1N1',
  x: 20,
  y: 20,
  expectedType: STRUCTURE_ROAD,
  confirmation: 'REMOVE_CONSTRUCTION_SITE'
};</code></pre>
  <div class="table-scroll"><table>
    <thead><tr><th>Field</th><th>Purpose</th></tr></thead>
    <tbody>
      <tr><td><code>siteId</code></td><td>Retrieves the exact object inspected earlier.</td></tr>
      <tr><td><code>roomName</code></td><td>Rejects an object in an unexpected room.</td></tr>
      <tr><td><code>x</code> and <code>y</code></td><td>Confirm that the recovered object is still at the expected position.</td></tr>
      <tr><td><code>expectedType</code></td><td>Rejects a different Construction Site type.</td></tr>
      <tr><td><code>confirmation</code></td><td>Requires a deliberate and exact confirmation phrase.</td></tr>
    </tbody>
  </table></div>

  <h2 id="complete-code">Complete one-time removal and verification code</h2>
  <p><strong>State impact:</strong> This code modifies Memory and calls <code>remove()</code> once when every precheck passes. It does not automatically retry a failed operation.</p>
  <p>Call both functions from your existing <code>module.exports.loop</code>. Replace the example request values before enabling it.</p>
  <pre><code class="language-javascript">const REMOVE_SITE_CONFIRMATION = 'REMOVE_CONSTRUCTION_SITE';

function evaluateRemoveSiteRequest(request, site) {
  if (!request || request.enabled !== true) {
    return { ready: false, reason: 'disabled' };
  }

  const validCoordinates =
    Number.isInteger(request.x) &amp;&amp;
    Number.isInteger(request.y) &amp;&amp;
    request.x &gt;= 0 &amp;&amp;
    request.x &lt;= 49 &amp;&amp;
    request.y &gt;= 0 &amp;&amp;
    request.y &lt;= 49;

  if (
    typeof request.siteId !== 'string' ||
    typeof request.roomName !== 'string' ||
    !validCoordinates ||
    typeof request.expectedType !== 'string' ||
    request.confirmation !== REMOVE_SITE_CONFIRMATION
  ) {
    return { ready: false, reason: 'invalid-request' };
  }

  if (!site) {
    return { ready: false, reason: 'site-missing' };
  }

  if (site.my !== true) {
    return { ready: false, reason: 'not-owner' };
  }

  if (site.pos.roomName !== request.roomName) {
    return { ready: false, reason: 'room-mismatch' };
  }

  if (site.pos.x !== request.x || site.pos.y !== request.y) {
    return { ready: false, reason: 'position-mismatch' };
  }

  if (site.structureType !== request.expectedType) {
    return { ready: false, reason: 'type-mismatch' };
  }

  return { ready: true, reason: 'ready' };
}

function submitRemoveSiteRequest() {
  const request = Memory.removeSiteRequest;

  if (!request || request.enabled !== true) {
    return;
  }

  const site = typeof request.siteId === 'string'
    ? Game.getObjectById(request.siteId)
    : null;

  const plan = evaluateRemoveSiteRequest(request, site);

  if (!plan.ready) {
    request.enabled = false;
    request.status = 'precheck-' + plan.reason;
    request.checkedAt = Game.time;
    return;
  }

  request.enabled = false;
  request.status = 'submitted';
  request.submittedAt = Game.time;
  request.snapshot = {
    siteId: site.id,
    roomName: site.pos.roomName,
    x: site.pos.x,
    y: site.pos.y,
    structureType: site.structureType,
    progress: site.progress,
    progressTotal: site.progressTotal
  };

  const result = site.remove();

  request.result = result;
  request.resultAt = Game.time;
  request.status = result === OK
    ? 'accepted'
    : 'failed-review-required';

  console.log(JSON.stringify({
    type: 'remove-site-result',
    siteId: site.id,
    roomName: site.pos.roomName,
    x: site.pos.x,
    y: site.pos.y,
    structureType: site.structureType,
    result
  }));
}

function verifyRemoveSiteRequest() {
  const request = Memory.removeSiteRequest;

  if (
    !request ||
    request.status !== 'accepted' ||
    typeof request.resultAt !== 'number' ||
    Game.time &lt;= request.resultAt
  ) {
    return;
  }

  const originalSite = Game.getObjectById(request.siteId);

  if (originalSite) {
    request.status = 'verification-review-required';
    request.verification = {
      checkedAt: Game.time,
      reason: 'original-site-still-present'
    };
    return;
  }

  const room = Game.rooms[request.roomName];

  if (!room) {
    request.verification = {
      checkedAt: Game.time,
      reason: 'pending-no-room-vision'
    };
    return;
  }

  const sitesAtPosition = room.lookForAt(
    LOOK_CONSTRUCTION_SITES,
    request.x,
    request.y
  );

  request.verification = {
    checkedAt: Game.time,
    reason: sitesAtPosition.length === 0
      ? 'original-site-absent-and-position-clear'
      : 'original-site-absent-but-position-occupied',
    sitesAtPosition: sitesAtPosition.map((site) =&gt; ({
      id: site.id,
      my: site.my,
      structureType: site.structureType
    }))
  };

  request.status = sitesAtPosition.length === 0
    ? 'verified-removed'
    : 'verified-original-removed-position-occupied';
}

module.exports.loop = function () {
  submitRemoveSiteRequest();
  verifyRemoveSiteRequest();
};</code></pre>

  <h2 id="tick-behavior">How the code behaves across ticks</h2>
  <h3 id="submission-tick">On the submission tick</h3>
  <p>The handler retrieves the site by ID and validates the request. A failed precheck disables the request and stores a reason such as <code>precheck-site-missing</code>, <code>precheck-not-owner</code>, <code>precheck-position-mismatch</code>, or <code>precheck-type-mismatch</code>.</p>
  <p>When every check passes, the code disables the request before calling <code>remove()</code>. This prevents the same enabled flag from submitting another operation on a later tick.</p>
  <h3 id="verification-tick">On the next visible tick</h3>
  <p>The verifier waits until <code>Game.time</code> is greater than the submission tick. It then checks the original ID and the original position.</p>
  <ul>
    <li>If the original object still exists, the request is marked for review.</li>
    <li>If the original object is absent but the room is not visible, verification remains pending.</li>
    <li>If the room is visible and the position is clear, the status becomes <code>verified-removed</code>.</li>
    <li>If another Construction Site occupies the position, the code records it instead of treating it as the original site.</li>
  </ul>

  <h2 id="return-codes">ConstructionSite.remove() return codes</h2>
  <div class="table-scroll"><table>
    <thead><tr><th>Return code</th><th>Meaning</th><th>Recommended response</th></tr></thead>
    <tbody>
      <tr><td><code>OK</code></td><td>The removal was scheduled successfully.</td><td>Verify the original ID and coordinates on a later tick.</td></tr>
      <tr><td><code>ERR_NOT_OWNER</code></td><td>You are not the owner of the site, and the site is not in your room.</td><td>Stop and recheck the ID, ownership, room, and request data.</td></tr>
    </tbody>
  </table></div>
  <p>Do not convert an unexpected result into an automatic retry. A failed request may contain stale or incorrect target information.</p>

  <h2 id="null-result">Why Game.getObjectById() returning null is not enough</h2>
  <p><code>Game.getObjectById()</code> returns an object or <code>null</code>, but it only accesses objects in rooms currently visible to you. A <code>null</code> result can therefore mean that the object no longer exists or that the room is not visible.</p>
  <p>The verifier checks <code>Game.rooms[roomName]</code> before declaring the removal verified.</p>

  <h2 id="progress">What happens to existing construction progress?</h2>
  <p>The site exposes <code>progress</code> and <code>progressTotal</code>. The code saves both values before submitting the operation. Review this snapshot before enabling the request, especially when substantial work has already been invested.</p>
  <p>This example does not transfer progress to a replacement site and does not claim that invested resources will be recovered in a specific form.</p>

  <h2 id="common-mistakes">Common mistakes</h2>
  <h3 id="null-method">Calling remove() on null</h3>
  <p><code>Game.getObjectById(id)</code> can return <code>null</code>. Retrieve the object first and check it before calling a method.</p>
  <h3 id="coordinate-only">Deleting only by coordinate</h3>
  <p>Coordinates are useful for inspection, but the operation should use a confirmed ID and additional target checks.</p>
  <h3 id="wrong-object-type">Using remove() on a completed building</h3>
  <p>A completed object is a <code>Structure</code>, not a <code>ConstructionSite</code>.</p>
  <h3 id="automatic-retry">Leaving the request enabled</h3>
  <p>A Builder may finish the site, another module may remove it, or a new site may later appear at the same position. Disable failed requests and inspect again.</p>
  <h3 id="same-tick">Assuming OK means immediate disappearance</h3>
  <p><code>OK</code> reports that the operation was scheduled. Use a later tick as the verification boundary.</p>

  <h2 id="checklist">Debugging checklist</h2>
  <ul>
    <li>Confirm the target is an unfinished <code>ConstructionSite</code>.</li>
    <li>Run the read-only coordinate inspection first.</li>
    <li>Copy the exact site ID.</li>
    <li>Confirm <code>site.my === true</code>.</li>
    <li>Confirm the room, coordinates, and expected structure type.</li>
    <li>Review the progress snapshot.</li>
    <li>Use the exact confirmation string.</li>
    <li>Disable the request before submitting <code>remove()</code>.</li>
    <li>Save and inspect the return code.</li>
    <li>Do not automatically retry failures.</li>
    <li>Verify only after the submission tick.</li>
    <li>Confirm room visibility before declaring success.</li>
  </ul>

  <h2 id="boundaries">Safety boundaries</h2>
  <p>This guide does not implement batch deletion, automatic blueprint cleanup, removal based only on structure type, deletion of completed Structures, construction progress migration, or automatic rebuilding at another coordinate.</p>
  <p>Each of those tasks needs separate target-selection, confirmation, and recovery rules.</p>

  <h2 id="faq">Frequently asked questions</h2>
  <h3 id="faq-completed">Can I remove a completed Structure with ConstructionSite.remove()?</h3>
  <p>No. A completed building is a <code>Structure</code> and requires a separate removal workflow.</p>
  <h3 id="faq-visible">Why is the Construction Site still visible after remove() returns OK?</h3>
  <p><code>OK</code> means the operation was scheduled. Check the original ID and position on a later tick.</p>
  <h3 id="faq-owner">Why does ConstructionSite.remove() return ERR_NOT_OWNER?</h3>
  <p>The official API returns <code>ERR_NOT_OWNER</code> when the site is not yours and is not in your room. Recheck the ID, <code>site.my</code>, and the room.</p>
  <h3 id="faq-retry">Should failed removal requests retry automatically?</h3>
  <p>No. Disable the request, inspect the current target again, and create a new explicit request after identifying the failure.</p>
  <h3 id="faq-null">Does Game.getObjectById() returning null prove the site was deleted?</h3>
  <p>Not by itself. Confirm room visibility and inspect the original coordinates before recording the removal as verified.</p>

  <h2 id="related">Related Screeps resources</h2>
  <ul>
    <li><a href="/en/screeps-errors">Look up Screeps return codes</a></li>
    <li><a href="/en/glossary">Review Screeps objects and terminology</a></li>
    <li><a href="/en/knowledge">Browse the Screeps knowledge map</a></li>
    <li><a href="/en/verification">Read the verification policy</a></li>
    <li><a href="/en/tools/room-diagnostics">Inspect a room snapshot with the room diagnostics tool</a></li>
    <li><a href="${chinesePath}">Read the Chinese source article</a></li>
  </ul>

  <h2 id="official-docs">Official documentation</h2>
  <ul>
    <li><a href="https://docs.screeps.com/api/#ConstructionSite.remove" rel="nofollow">ConstructionSite.remove()</a></li>
    <li><a href="https://docs.screeps.com/api/#Game.getObjectById" rel="nofollow">Game.getObjectById()</a></li>
    <li><a href="https://docs.screeps.com/api/#Room.lookForAt" rel="nofollow">Room.lookForAt()</a></li>
    <li><a href="https://docs.screeps.com/game-loop.html" rel="nofollow">Understanding game loops, time, and ticks</a></li>
  </ul>
`;

const faqEntities = [
  {
    "@type": "Question",
    name: "Can I remove a completed Structure with ConstructionSite.remove()?",
    acceptedAnswer: {
      "@type": "Answer",
      text: "No. A completed building is a Structure and requires a separate removal workflow.",
    },
  },
  {
    "@type": "Question",
    name: "Why is the Construction Site still visible after remove() returns OK?",
    acceptedAnswer: {
      "@type": "Answer",
      text: "OK means the operation was scheduled. Check the original ID and position on a later tick.",
    },
  },
  {
    "@type": "Question",
    name: "Why does ConstructionSite.remove() return ERR_NOT_OWNER?",
    acceptedAnswer: {
      "@type": "Answer",
      text: "The API returns ERR_NOT_OWNER when the site is not yours and is not in your room. Recheck the ID, ownership, and room.",
    },
  },
  {
    "@type": "Question",
    name: "Should failed removal requests retry automatically?",
    acceptedAnswer: {
      "@type": "Answer",
      text: "No. Disable the request, inspect the target again, and create a new explicit request after identifying the failure.",
    },
  },
  {
    "@type": "Question",
    name: "Does Game.getObjectById() returning null prove the site was deleted?",
    acceptedAnswer: {
      "@type": "Answer",
      text: "Not by itself. Confirm room visibility and inspect the original coordinates before recording the removal as verified.",
    },
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BlogPosting",
      headline,
      description,
      datePublished: publishedAt,
      dateModified: publishedAt,
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
    {
      "@type": "FAQPage",
      mainEntity: faqEntities,
    },
  ],
};

const toc = [
  ["Quick answer", "quick-answer"],
  ["Construction Site or completed Structure?", "site-or-structure"],
  ["Inspect the target", "inspect-target"],
  ["Create a one-time request", "create-request"],
  ["Complete removal code", "complete-code"],
  ["Cross-tick behavior", "tick-behavior"],
  ["Return codes", "return-codes"],
  ["Common mistakes", "common-mistakes"],
  ["Debugging checklist", "checklist"],
  ["FAQ", "faq"],
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
              <span>12 min read</span>
            </div>
            <div className="tag-list" aria-label="Article tags">
              <span className="tag">Screeps</span>
              <span className="tag">ConstructionSite</span>
              <span className="tag">JavaScript</span>
              <span className="tag">Debugging</span>
            </div>
          </header>

          <section className="english-verification remove-site-verification" aria-labelledby="verification-status-title">
            <div>
              <p className="eyebrow">VERIFICATION</p>
              <h2 id="verification-status-title">Verification status</h2>
            </div>
            <dl>
              <div><dt>Chinese source</dt><dd>Read in full</dd></div>
              <div><dt>Official documentation</dt><dd>Checked</dd></div>
              <div><dt>API and constants</dt><dd>Checked</dd></div>
              <div><dt>JavaScript syntax</dt><dd>Checked</dd></div>
              <div><dt>Offline logic review</dt><dd>Passed</dd></div>
              <div><dt>Screeps Console</dt><dd>Pending</dd></div>
              <div><dt>Live multi-tick test</dt><dd>Pending</dd></div>
              <div><dt>Last verified</dt><dd>July 24, 2026</dd></div>
            </dl>
          </section>

          <nav className="article-toc english-toc" aria-label="Table of contents">
            <p className="article-toc-title">Table of contents</p>
            <ol>
              {toc.map(([label, id]) => (
                <li key={id}><a href={`#${id}`}>{label}</a></li>
              ))}
            </ol>
          </nav>

          <div className="article-content" dangerouslySetInnerHTML={{ __html: articleHtml }} />

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
