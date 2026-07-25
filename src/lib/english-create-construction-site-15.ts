import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishCreateConstructionSiteArticle = {
  slug: "screeps-room-create-construction-site",
  path: "/en/blog/screeps-room-create-construction-site",
  chinesePath: "/blog/screeps-room-create-construction-site",
  title: "Screeps createConstructionSite(): Safe One-Time Road Placement",
  headline: "How to Create One Road Construction Site Safely",
  description:
    "Use a one-time Memory request, validate a visible room and 0–49 coordinates, allow Road placement on natural wall terrain, reject an existing Road or Construction Site, respect MAX_CONSTRUCTION_SITES, disable before createConstructionSite(), and verify later.",
  category: "CONSTRUCTION · ROAD SITE PLACEMENT",
  publishedAt: "2026-07-26",
  publishedLabel: "July 26, 2026",
  readingTime: "17 min read",
  breadcrumbLabel: "Create Road Site",
  tags: ["Screeps", "Construction Site", "Road", "Room API", "Operational Safety"],
  keywords: [
    "Screeps Room createConstructionSite",
    "Screeps Road construction site",
    "Screeps MAX_CONSTRUCTION_SITES",
    "Screeps Construction Site coordinates",
    "Screeps createConstructionSite ERR_FULL",
  ],
  primaryKeyword: "Screeps Room createConstructionSite",
  searchIntent: "Create one reviewed Road Construction Site without repeated calls or stale coordinates",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — Room.createConstructionSite(), Game.constructionSites, Road terrain behavior, coordinates and return codes"],
    ["Scope boundary", "The request permits only STRUCTURE_ROAD; it is not a generic blueprint or arbitrary-structure placement API"],
    ["Execution boundary", "OK schedules site creation; the Construction Site object must be observed on a later tick"],
    ["JavaScript syntax", "Passed"],
    ["Offline placement review", "Passed — request, coordinates, visibility, existing Road, existing site, global site limit, natural wall and ready states"],
    ["Screeps Console test", "Pending"],
    ["Live Road placement, wall terrain, RCL, special-tile and site-limit test", "Pending"],
    ["Last verified", "July 26, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["site-not-structure", "A Construction Site is not a completed Road"],
    ["road-wall", "Do not reject natural wall terrain for Roads"],
    ["request", "Create a one-time Road request"],
    ["preflight", "Build a testable placement plan"],
    ["complete-example", "Complete Road site handler"],
    ["disable-first", "Disable stale and submitted requests"],
    ["site-limit", "Respect the current site limit"],
    ["after-ok", "Verify the next tick"],
    ["return-codes", "Handle return codes"],
    ["debugging", "Debugging checklist"],
    ["scope", "Scope and next steps"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    [
      "Does createConstructionSite() build the Road immediately?",
      "No. It creates a Construction Site. A Builder still needs Energy and successful build() actions before a Road Structure exists.",
    ],
    [
      "Can a Road Construction Site be placed on natural wall terrain?",
      "Roads are a special case and may be built on natural wall terrain at a much higher construction cost. Do not apply that exception to arbitrary structures.",
    ],
    [
      "Why disable the request when the room is not visible?",
      "Leaving a stale request enabled allows it to execute later when visibility returns, even though the player may no longer intend the placement.",
    ],
    [
      "Does OK prove the site now exists?",
      "No. Save the result, then inspect the coordinate for a matching Construction Site on a later tick.",
    ],
  ],
  previous: {
    href: "/en/blog/screeps-reserve-vs-claim-controller",
    label: "Previous control guide",
    title: "Choose Reserve or Claim",
  },
  next: {
    href: "/en/blog/screeps-construction-site-progress",
    label: "Next construction guide",
    title: "Track Construction Progress",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Store one reviewed request containing a room, X, Y and <code>STRUCTURE_ROAD</code>. Require a visible room, integer coordinates from 0 through 49, no existing Road, no existing Construction Site, and a current site count below <code>MAX_CONSTRUCTION_SITES</code>. Record wall terrain instead of rejecting it, set <code>request.enabled = false</code>, call <code>room.createConstructionSite()</code> once, save the return code, and inspect the coordinate again on a later tick.</p>

<h2 id="site-not-structure">A Construction Site is not a completed Road</h2>
<p><code>Room.createConstructionSite()</code> creates a planning object. It does not produce a completed Structure and does not spend Builder Energy by itself.</p>
<div class="table-scroll"><table>
<thead><tr><th>Stage</th><th>Object</th><th>Action</th></tr></thead>
<tbody>
<tr><td>Planned</td><td><code>ConstructionSite</code></td><td>Create or remove the site</td></tr>
<tr><td>Under construction</td><td><code>ConstructionSite</code></td><td>Creeps call <code>build()</code></td></tr>
<tr><td>Completed</td><td><code>StructureRoad</code></td><td>Use, repair or destroy the Structure</td></tr>
</tbody></table></div>

<h2 id="road-wall">Do not reject natural wall terrain for Roads</h2>
<pre><code class="language-javascript">function inspectRoadTerrain(room, x, y) {
  const terrain = room.getTerrain().get(x, y);

  return {
    terrain,
    onNaturalWall:
      terrain === TERRAIN_MASK_WALL
  };
}</code></pre>
<p>Roads are allowed on natural wall terrain, with different construction cost behavior. That does not mean a Spawn, Extension or arbitrary Structure can use the same placement rule.</p>

<h2 id="request">Create a one-time Road request</h2>
<pre><code class="language-javascript">Memory.constructionSiteRequest = {
  enabled: true,
  roomName: 'W1N1',
  x: 20,
  y: 20,
  structureType: STRUCTURE_ROAD
};</code></pre>
<p>The narrow structure type prevents a single-coordinate example from becoming an unreviewed generic blueprint engine.</p>

<h2 id="preflight">Build a testable placement plan</h2>
<pre><code class="language-javascript">function evaluateRoadSiteRequest(input) {
  const request = input.request;

  if (!request || request.enabled !== true) {
    return { ready: false, reason: 'disabled' };
  }

  if (
    typeof request.roomName !== 'string'
    || !Number.isInteger(request.x)
    || !Number.isInteger(request.y)
    || request.x < 0
    || request.x > 49
    || request.y < 0
    || request.y > 49
    || request.structureType !== STRUCTURE_ROAD
  ) {
    return { ready: false, reason: 'invalid-request' };
  }

  if (!input.roomVisible) {
    return { ready: false, reason: 'room-not-visible' };
  }

  if (input.hasRoad) {
    return { ready: false, reason: 'road-exists' };
  }

  if (input.hasSite) {
    return { ready: false, reason: 'site-exists' };
  }

  if (
    !Number.isInteger(input.siteCount)
    || input.siteCount >= MAX_CONSTRUCTION_SITES
  ) {
    return { ready: false, reason: 'site-limit' };
  }

  return { ready: true, reason: 'ready' };
}</code></pre>
<p>This preflight catches obvious stale inputs. It cannot reproduce every Controller, edge, terrain-overlay and structure-count rule, so the API result remains authoritative.</p>

<h2 id="complete-example">Complete Road site handler</h2>
<pre><code class="language-javascript">function inspectRoadSiteTile(room, x, y) {
  const structures = room.lookForAt(
    LOOK_STRUCTURES,
    x,
    y
  );
  const sites = room.lookForAt(
    LOOK_CONSTRUCTION_SITES,
    x,
    y
  );
  const terrain = inspectRoadTerrain(room, x, y);

  return {
    hasRoad: structures.some(structure =>
      structure.structureType === STRUCTURE_ROAD
    ),
    hasSite: sites.length > 0,
    onNaturalWall: terrain.onNaturalWall
  };
}</code></pre>
<pre><code class="language-javascript">function handleRoadSiteRequest() {
  const request = Memory.constructionSiteRequest;
  if (!request || request.enabled !== true) {
    return { status: 'disabled' };
  }

  const coordinatesValid =
    Number.isInteger(request.x)
    && Number.isInteger(request.y)
    && request.x >= 0
    && request.x <= 49
    && request.y >= 0
    && request.y <= 49;
  const room = typeof request.roomName === 'string'
    ? Game.rooms[request.roomName]
    : null;
  const tile = room && coordinatesValid
    ? inspectRoadSiteTile(room, request.x, request.y)
    : {
        hasRoad: false,
        hasSite: false,
        onNaturalWall: null
      };
  const siteCount = Object.keys(
    Game.constructionSites
  ).length;
  const plan = evaluateRoadSiteRequest({
    request,
    roomVisible: Boolean(room),
    hasRoad: tile.hasRoad,
    hasSite: tile.hasSite,
    siteCount
  });

  request.checkedAt = Game.time;
  request.status = plan.reason;

  if (!plan.ready) {
    request.enabled = false;
    return { status: plan.reason };
  }

  request.enabled = false;
  request.status = 'submitted';
  request.submittedAt = Game.time;
  request.before = {
    roomName: room.name,
    x: request.x,
    y: request.y,
    structureType: STRUCTURE_ROAD,
    onNaturalWall: tile.onNaturalWall,
    siteCount
  };

  const result = room.createConstructionSite(
    request.x,
    request.y,
    STRUCTURE_ROAD
  );

  request.result = result;
  request.resultAt = Game.time;
  request.status = result === OK
    ? 'accepted'
    : 'failed-review-required';

  return {
    status: request.status,
    result,
    before: request.before
  };
}</code></pre>
<pre><code class="language-javascript">module.exports.loop = function () {
  const outcome = handleRoadSiteRequest();

  if (
    outcome.status === 'accepted'
    || outcome.status === 'failed-review-required'
  ) {
    console.log(JSON.stringify({
      type: 'road-site-request-result',
      ...outcome
    }));
  }
};</code></pre>

<h2 id="disable-first">Disable stale and submitted requests</h2>
<p>The handler disables preflight failures because a request that is invalid now should not silently execute when visibility, site count or tile occupancy changes later. It also disables immediately before the API call to prevent repetition after an exception.</p>
<pre><code class="language-javascript">request.enabled = false;
const result = room.createConstructionSite(
  request.x,
  request.y,
  STRUCTURE_ROAD
);</code></pre>

<h2 id="site-limit">Respect the current site limit</h2>
<pre><code class="language-javascript">const mySiteCount = Object.keys(
  Game.constructionSites
).length;

const capacityRemaining = Math.max(
  0,
  MAX_CONSTRUCTION_SITES - mySiteCount
);</code></pre>
<p>The local count is diagnostic. Handle <code>ERR_FULL</code> even after preflight because current rules and simultaneous actions can still reject placement.</p>

<h2 id="after-ok">Verify the next tick</h2>
<pre><code class="language-javascript">function verifyRoadSite(request) {
  const room = Game.rooms[request.roomName];
  if (!room) {
    return { verified: false, reason: 'room-not-visible' };
  }

  const site = room.lookForAt(
    LOOK_CONSTRUCTION_SITES,
    request.x,
    request.y
  ).find(item =>
    item.structureType === STRUCTURE_ROAD
  ) || null;

  return site
    ? { verified: true, siteId: site.id }
    : { verified: false, reason: 'site-not-observed' };
}</code></pre>
<p>Only a later matching object proves the site became observable. A Builder and Energy supply are still required for completion.</p>

<h2 id="return-codes">Handle return codes</h2>
<div class="table-scroll"><table>
<thead><tr><th>Code</th><th>Typical meaning</th><th>Review</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>Site creation scheduled</td><td>Inspect the tile later</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>Controller state disallows placement</td><td>Owner and reservation</td></tr>
<tr><td><code>ERR_INVALID_TARGET</code></td><td>Tile cannot accept the site</td><td>Terrain and existing objects</td></tr>
<tr><td><code>ERR_FULL</code></td><td>Construction Site limit reached</td><td><code>Game.constructionSites</code></td></tr>
<tr><td><code>ERR_INVALID_ARGS</code></td><td>Coordinates or type invalid</td><td>0–49 integers and Road constant</td></tr>
<tr><td><code>ERR_RCL_NOT_ENOUGH</code></td><td>Controller or structure limit</td><td>RCL and room structures</td></tr>
</tbody></table></div>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Require a one-time enabled request.</li>
<li>Allow only <code>STRUCTURE_ROAD</code>.</li>
<li>Validate 0–49 integer coordinates.</li>
<li>Require current room visibility.</li>
<li>Check existing structures and sites.</li>
<li>Record natural wall terrain without rejecting it.</li>
<li>Check <code>MAX_CONSTRUCTION_SITES</code>.</li>
<li>Disable stale requests.</li>
<li>Save the official return code.</li>
<li>Verify a matching site later.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not place a path, validate a full room blueprint, create arbitrary Structures, manage site batches, assign Builders or remove old layouts. Continue with <a href="/en/blog/screeps-construction-site-progress">Construction Site progress reporting</a>.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Why use MAX_CONSTRUCTION_SITES instead of only 100?</h3>
<p>The named game constant makes the code's dependency explicit. The API return remains the final authority.</p>
<h3>Why reject any existing site instead of only an existing Road site?</h3>
<p>A different site on the same coordinate is a layout conflict that needs review rather than automatic replacement.</p>
<h3>Can the request stay enabled until visibility returns?</h3>
<p>This guide deliberately does not do that because the old coordinate may no longer reflect current player intent.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Room.createConstructionSite" rel="nofollow">API Reference: Room.createConstructionSite()</a></li>
<li><a href="https://docs.screeps.com/api/#Game.constructionSites" rel="nofollow">API Reference: Game.constructionSites</a></li>
<li><a href="https://docs.screeps.com/api/#ConstructionSite" rel="nofollow">API Reference: ConstructionSite</a></li>
<li><a href="https://docs.screeps.com/api/#StructureRoad" rel="nofollow">API Reference: StructureRoad</a></li>
<li><a href="https://docs.screeps.com/api/#Constants" rel="nofollow">API Reference: MAX_CONSTRUCTION_SITES</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
