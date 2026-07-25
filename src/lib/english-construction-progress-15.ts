import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishConstructionProgressArticle = {
  slug: "screeps-construction-site-progress",
  path: "/en/blog/screeps-construction-site-progress",
  chinesePath: "/blog/screeps-construction-site-progress",
  title: "Screeps Construction Progress: progress, progressTotal, and Remaining Work",
  headline: "How to Measure Construction Site Progress Without Guessing Completion Time",
  description:
    "Read progress and progressTotal, clamp remaining work and completion percentage, report FIND_MY_CONSTRUCTION_SITES at a controlled interval, use site.pos.roomName when room is unavailable, distinguish completion from deletion, and avoid unsupported ETA claims.",
  category: "CONSTRUCTION · PROGRESS MONITORING",
  publishedAt: "2026-07-26",
  publishedLabel: "July 26, 2026",
  readingTime: "16 min read",
  breadcrumbLabel: "Construction Progress",
  tags: ["Screeps", "Construction Site", "Progress", "Diagnostics", "Builder"],
  keywords: [
    "Screeps ConstructionSite progress",
    "Screeps progressTotal",
    "Screeps construction remaining work",
    "Screeps FIND_MY_CONSTRUCTION_SITES",
    "Screeps construction progress report",
  ],
  primaryKeyword: "Screeps ConstructionSite progress",
  searchIntent: "Measure current Construction Site progress without inventing a completion-time estimate",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — ConstructionSite progress, progressTotal, room visibility, Game.constructionSites, Room.find() and game-loop timing"],
    ["Calculation boundary", "Percentage rounding, report interval and remaining-work ordering are display policies, not official Construction Site fields"],
    ["Execution boundary", "Current-tick values are observations; build() commands and site-to-Structure replacement require later ticks"],
    ["JavaScript syntax", "Passed"],
    ["Offline reporting review", "Passed — normal progress, over-total clamping, zero total, remaining work, stable sorting and missing room states"],
    ["Screeps Console test", "Pending"],
    ["Live progress, completion replacement, deletion, invisible-room and multi-Builder test", "Pending"],
    ["Last verified", "July 26, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["two-fields", "Use progress and progressTotal"],
    ["calculation", "Calculate remaining work and percentage"],
    ["room-report", "Report one visible room"],
    ["global-report", "Report all owned sites safely"],
    ["stable-order", "Use deterministic sorting"],
    ["same-tick", "Do not expect same-tick progress changes"],
    ["empty-list", "Diagnose an empty site list"],
    ["no-eta", "Do not turn remaining work into an unsupported ETA"],
    ["complete-example", "Complete periodic report"],
    ["debugging", "Debugging checklist"],
    ["scope", "Scope and next steps"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    [
      "Is completion percentage an official ConstructionSite property?",
      "No. The official object provides progress and progressTotal. Percentage and remaining work are calculations made by your code.",
    ],
    [
      "Why can a site disappear from the report?",
      "It may have completed and become a Structure, been removed, become invisible, or no longer match FIND_MY_CONSTRUCTION_SITES.",
    ],
    [
      "Can remaining progress be converted directly into ticks?",
      "Not without Builder WORK, Energy, range, movement, interruptions and task-allocation evidence. Remaining work alone is not an ETA.",
    ],
    [
      "Why use site.pos.roomName instead of site.room.name?",
      "A Construction Site may be listed while its room object is unavailable. RoomPosition still identifies the room name.",
    ],
  ],
  previous: {
    href: "/en/blog/screeps-room-create-construction-site",
    label: "Previous construction guide",
    title: "Create One Road Site",
  },
  next: {
    href: "/en/blog/screeps-structure-destroy",
    label: "Next construction guide",
    title: "Destroy a Misplaced Extension Safely",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Read <code>site.progress</code> and <code>site.progressTotal</code>. Calculate remaining work with <code>Math.max(0, total - progress)</code> and a display percentage only when the total is positive. Use <code>FIND_MY_CONSTRUCTION_SITES</code> for one visible room or <code>Game.constructionSites</code> for your current site collection, report at a controlled interval, and do not convert remaining work into a completion time without Builder throughput evidence.</p>

<h2 id="two-fields">Use progress and progressTotal</h2>
<div class="table-scroll"><table>
<thead><tr><th>Field</th><th>Meaning</th></tr></thead>
<tbody>
<tr><td><code>progress</code></td><td>Construction progress currently accumulated</td></tr>
<tr><td><code>progressTotal</code></td><td>Total progress required to complete the Structure</td></tr>
</tbody></table></div>
<p>The object does not provide a built-in <code>percent</code>, <code>remaining</code> or <code>estimatedTicks</code> field.</p>

<h2 id="calculation">Calculate remaining work and percentage</h2>
<pre><code class="language-javascript">function summarizeConstructionProgress(site) {
  const progress = Number.isFinite(site?.progress)
    ? site.progress
    : 0;
  const total = Number.isFinite(site?.progressTotal)
    ? site.progressTotal
    : 0;
  const remaining = Math.max(0, total - progress);
  const percent = total > 0
    ? Math.min(
        100,
        Math.max(
          0,
          Math.floor((progress / total) * 100)
        )
      )
    : 0;

  return {
    progress,
    total,
    remaining,
    percent
  };
}</code></pre>
<p>The clamps protect a display layer from malformed or transitional input. They do not modify the official object.</p>

<h2 id="room-report">Report one visible room</h2>
<pre><code class="language-javascript">function getVisibleRoomSiteReport(roomName) {
  const room = typeof roomName === 'string'
    ? Game.rooms[roomName]
    : null;

  if (!room) {
    return {
      roomVisible: false,
      roomName,
      sites: []
    };
  }

  const sites = room.find(
    FIND_MY_CONSTRUCTION_SITES
  );

  return {
    roomVisible: true,
    roomName: room.name,
    sites: sites.map(site => ({
      id: site.id,
      structureType: site.structureType,
      roomName: site.pos.roomName,
      x: site.pos.x,
      y: site.pos.y,
      ...summarizeConstructionProgress(site)
    }))
  };
}</code></pre>
<p><code>FIND_MY_CONSTRUCTION_SITES</code> deliberately excludes another player's visible sites. Choose a different query only when the monitoring goal is different.</p>

<h2 id="global-report">Report all owned sites safely</h2>
<pre><code class="language-javascript">function getAllOwnedConstructionSiteReport() {
  return Object.values(Game.constructionSites)
    .map(site => ({
      id: site.id,
      structureType: site.structureType,
      roomName: site.pos.roomName,
      roomVisible: Boolean(site.room),
      x: site.pos.x,
      y: site.pos.y,
      ...summarizeConstructionProgress(site)
    }));
}</code></pre>
<p>Do not require <code>site.room.name</code>. The room property may be unavailable when the room is not visible, while <code>site.pos.roomName</code> remains suitable for identification.</p>

<h2 id="stable-order">Use deterministic sorting</h2>
<pre><code class="language-javascript">function sortConstructionReport(items) {
  return [...items].sort((left, right) =>
    left.remaining - right.remaining
    || left.roomName.localeCompare(right.roomName)
    || left.structureType.localeCompare(
      right.structureType
    )
    || left.id.localeCompare(right.id)
  );
}</code></pre>
<p>Remaining-work-first is a reporting choice, not a Builder priority. Stable ties prevent the Console order from changing without a meaningful state change.</p>

<h2 id="same-tick">Do not expect same-tick progress changes</h2>
<p>Player code reads the current tick state and submits commands. A Builder can receive <code>OK</code> from <code>build()</code>, but code later in the same loop should not assume <code>site.progress</code> already contains the resolved increase.</p>
<pre><code class="language-javascript">function snapshotSite(site) {
  return {
    gameTick: Game.time,
    siteId: site.id,
    progress: site.progress,
    progressTotal: site.progressTotal
  };
}</code></pre>
<p>Recover the site by ID on a later tick, or inspect the coordinate if the object has disappeared.</p>

<h2 id="empty-list">Diagnose an empty site list</h2>
<ul>
<li>The room may not be visible.</li>
<li>There may be no owned sites in the room.</li>
<li>The site may have completed and become a Structure.</li>
<li>The site may have been removed.</li>
<li>The code may be using a query that excludes the visible site.</li>
</ul>
<pre><code class="language-javascript">function inspectFinishedOrMissingSite(snapshot) {
  const site = Game.getObjectById(snapshot.siteId);
  const room = Game.rooms[snapshot.roomName];

  if (site) {
    return {
      state: 'site-visible',
      progress: site.progress,
      progressTotal: site.progressTotal
    };
  }

  if (!room) {
    return { state: 'room-not-visible' };
  }

  const structures = room.lookForAt(
    LOOK_STRUCTURES,
    snapshot.x,
    snapshot.y
  );

  return structures.some(structure =>
    structure.structureType === snapshot.structureType
  )
    ? { state: 'completed-structure-observed' }
    : { state: 'site-missing-or-removed' };
}</code></pre>

<h2 id="no-eta">Do not turn remaining work into an unsupported ETA</h2>
<p>Completion time depends on active Builder <code>WORK</code> parts, carried Energy, range, movement, roads, task interruptions, spawning, damage and competing sites. A current remaining value is useful state, but not enough to promise a tick count or wall-clock time.</p>

<h2 id="complete-example">Complete periodic report</h2>
<pre><code class="language-javascript">function logConstructionSiteReport(
  roomName,
  interval = 50
) {
  if (
    !Number.isInteger(interval)
    || interval <= 0
    || Game.time % interval !== 0
  ) {
    return;
  }

  const report = getVisibleRoomSiteReport(roomName);
  if (!report.roomVisible) {
    console.log(JSON.stringify({
      type: 'construction-site-report',
      roomName,
      status: 'room-not-visible'
    }));
    return;
  }

  const sites = sortConstructionReport(
    report.sites
  );

  console.log(JSON.stringify({
    type: 'construction-site-report',
    gameTick: Game.time,
    roomName,
    siteCount: sites.length,
    sites
  }));
}</code></pre>
<pre><code class="language-javascript">module.exports.loop = function () {
  logConstructionSiteReport('W1N1', 50);
};</code></pre>
<p>The 50-tick interval is a logging policy. It can be changed without changing Construction Site mechanics.</p>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Choose room-level or all-site reporting intentionally.</li>
<li>Read <code>progress</code> and <code>progressTotal</code>.</li>
<li>Clamp remaining work at zero.</li>
<li>Avoid division by zero.</li>
<li>Clamp display percentage from 0 to 100.</li>
<li>Use stable sorting.</li>
<li>Use <code>site.pos.roomName</code> when room visibility is uncertain.</li>
<li>Rate-limit Console output.</li>
<li>Distinguish completion from removal.</li>
<li>Do not promise an ETA without throughput evidence.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not select Builder targets, predict completion time, create sites, remove sites or schedule Energy delivery. Continue with <a href="/en/blog/screeps-structure-destroy">the reviewed Structure destruction workflow</a> for a completed misplaced Extension.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Why can progress exceed total in an offline test?</h3>
<p>The clamp makes the display function defensive. A normal live Construction Site should follow official state, but pure functions should still avoid negative remaining work or percentages above 100.</p>
<h3>Why sort sites closest to completion first?</h3>
<p>It makes the report easy to scan. It does not tell Builders which site to choose.</p>
<h3>Can Game.constructionSites include a site in an invisible room?</h3>
<p>Use the object collection and RoomPosition for identification, while treating the optional room object as unavailable unless present.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#ConstructionSite" rel="nofollow">API Reference: ConstructionSite</a></li>
<li><a href="https://docs.screeps.com/api/#Game.constructionSites" rel="nofollow">API Reference: Game.constructionSites</a></li>
<li><a href="https://docs.screeps.com/api/#Room.find" rel="nofollow">API Reference: Room.find()</a></li>
<li><a href="https://docs.screeps.com/game-loop.html" rel="nofollow">Screeps Documentation: Game loop and ticks</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
