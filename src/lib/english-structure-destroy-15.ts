import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishStructureDestroyArticle = {
  slug: "screeps-structure-destroy",
  path: "/en/blog/screeps-structure-destroy",
  chinesePath: "/blog/screeps-structure-destroy",
  title: "Screeps Structure.destroy(): Safe Extension Removal by Exact Identity",
  headline: "How to Destroy a Misplaced Extension Without Hitting the Wrong Structure",
  description:
    "Use a one-time request locked to Structure ID, room, X, Y, STRUCTURE_EXTENSION and an exact confirmation phrase, verify ownership through Game.structures, stop when hostile Creeps are present, disable before destroy(), save the result, and verify later disappearance.",
  category: "CONSTRUCTION · DESTRUCTIVE STRUCTURE CHANGE",
  publishedAt: "2026-07-26",
  publishedLabel: "July 26, 2026",
  readingTime: "18 min read",
  breadcrumbLabel: "Destroy Extension",
  tags: ["Screeps", "Structure", "Extension", "Destroy", "Operational Safety"],
  keywords: [
    "Screeps Structure destroy",
    "Screeps destroy Extension",
    "Screeps Game.structures ownership",
    "Screeps Structure.destroy ERR_BUSY",
    "Screeps destructive one-time request",
  ],
  primaryKeyword: "Screeps Structure destroy",
  searchIntent: "Destroy one explicitly confirmed misplaced Extension without targeting another completed Structure",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — Structure.destroy(), Game.structures, Game.getObjectById(), hostile-room restriction and return codes"],
    ["Destructive scope", "Only STRUCTURE_EXTENSION is allowed; no Spawn, Storage, Terminal, Nuker or generic Structure deletion"],
    ["Execution boundary", "OK schedules destruction; object absence and coordinate state require later observation"],
    ["JavaScript syntax", "Passed"],
    ["Offline destruction review", "Passed — request, confirmation, identity, ownership, type, room, coordinates, hostiles and ready states"],
    ["Screeps Console test", "Pending"],
    ["Live Extension removal, hostile-room busy state, capacity impact and coordinate verification test", "Pending"],
    ["Last verified", "July 26, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["site-vs-structure", "Use the method for the correct object stage"],
    ["read-only", "Inspect the tile before creating a request"],
    ["identity", "Lock ID, room, coordinates, type, and confirmation"],
    ["narrow-scope", "Allow only Extension destruction"],
    ["pure-plan", "Build a testable destruction plan"],
    ["complete-example", "Complete destruction request handler"],
    ["hostiles", "Stop when hostile Creeps are present"],
    ["disable-first", "Disable before the destructive call"],
    ["after-ok", "Verify the next tick"],
    ["dependencies", "Review room dependencies first"],
    ["return-codes", "Handle return codes"],
    ["debugging", "Debugging checklist"],
    ["scope", "Scope and next steps"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    [
      "Should a misplaced Construction Site use destroy()?",
      "No. ConstructionSite.remove() handles an unfinished site. Structure.destroy() is for a completed Structure.",
    ],
    [
      "Why verify both ID and coordinates?",
      "The ID recovers the exact object, while room, coordinates and type make stale, copied or rebuilt requests fail closed.",
    ],
    [
      "Why allow only Extension?",
      "A generic allow-list can turn one coordinate or copied request into loss of a critical Spawn, Storage, Terminal or production structure.",
    ],
    [
      "Does OK prove the Extension is already gone?",
      "No. Re-read the ID and original coordinate on a later tick before reporting the Structure as removed.",
    ],
  ],
  previous: {
    href: "/en/blog/screeps-construction-site-progress",
    label: "Previous construction guide",
    title: "Track Construction Progress",
  },
  next: {
    href: "/en/blog",
    label: "Continue reading",
    title: "Return to English Articles",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Inspect the completed Structure read-only, then create one request containing its exact ID, expected room, X, Y, <code>STRUCTURE_EXTENSION</code> and the confirmation phrase <code>DESTROY_EXTENSION</code>. Recover the object, verify it appears in <code>Game.structures</code>, require every identity field to match, stop if hostile Creeps are present, set <code>request.enabled = false</code>, call <code>structure.destroy()</code> once, save the return code, and verify the ID and coordinate on a later tick.</p>

<h2 id="site-vs-structure">Use the method for the correct object stage</h2>
<div class="table-scroll"><table>
<thead><tr><th>Object</th><th>Correct removal method</th></tr></thead>
<tbody>
<tr><td>Unfinished <code>ConstructionSite</code></td><td><code>site.remove()</code></td></tr>
<tr><td>Completed <code>Structure</code></td><td><code>structure.destroy()</code></td></tr>
</tbody></table></div>
<p>Do not infer the object stage from the intended structure type. Inspect the actual object first.</p>

<h2 id="read-only">Inspect the tile before creating a request</h2>
<pre><code class="language-javascript">function inspectStructuresAt(roomName, x, y) {
  const room = Game.rooms[roomName];
  if (!room) {
    return [];
  }

  return room.lookForAt(
    LOOK_STRUCTURES,
    x,
    y
  ).map(structure => ({
    id: structure.id,
    owned: Boolean(Game.structures[structure.id]),
    structureType: structure.structureType,
    roomName: structure.pos.roomName,
    x: structure.pos.x,
    y: structure.pos.y,
    hits: structure.hits,
    hitsMax: structure.hitsMax
  }));
}</code></pre>
<p>Ramparts and other Structures can share a tile. Do not select the first array entry and assume it is the intended Extension.</p>

<h2 id="identity">Lock ID, room, coordinates, type, and confirmation</h2>
<pre><code class="language-javascript">Memory.destroyStructureRequest = {
  enabled: true,
  structureId: 'replace-with-extension-id',
  roomName: 'W1N1',
  x: 20,
  y: 20,
  expectedType: STRUCTURE_EXTENSION,
  confirmation: 'DESTROY_EXTENSION'
};</code></pre>
<p>If the Structure was rebuilt, moved in a blueprint revision, or copied from another room, at least one identity check should fail.</p>

<h2 id="narrow-scope">Allow only Extension destruction</h2>
<pre><code class="language-javascript">const ALLOWED_DESTROY_TYPES = new Set([
  STRUCTURE_EXTENSION
]);</code></pre>
<p>Supporting another Structure type requires its own dependency and resource migration review. This example intentionally cannot destroy Spawn, Storage, Terminal, Lab, Factory, Power Spawn or Nuker.</p>

<h2 id="pure-plan">Build a testable destruction plan</h2>
<pre><code class="language-javascript">function evaluateDestroyRequest(input) {
  const request = input.request;

  if (!request || request.enabled !== true) {
    return { ready: false, reason: 'disabled' };
  }

  if (
    typeof request.structureId !== 'string'
    || typeof request.roomName !== 'string'
    || !Number.isInteger(request.x)
    || !Number.isInteger(request.y)
    || request.x < 0
    || request.x > 49
    || request.y < 0
    || request.y > 49
    || !ALLOWED_DESTROY_TYPES.has(
      request.expectedType
    )
    || request.confirmation !== 'DESTROY_EXTENSION'
  ) {
    return { ready: false, reason: 'invalid-request' };
  }

  if (!input.structure) {
    return { ready: false, reason: 'structure-missing' };
  }

  if (!input.owned) {
    return { ready: false, reason: 'not-owner' };
  }

  if (
    input.structure.structureType
    !== request.expectedType
  ) {
    return { ready: false, reason: 'type-mismatch' };
  }

  if (
    input.structure.pos.roomName
    !== request.roomName
  ) {
    return { ready: false, reason: 'room-mismatch' };
  }

  if (
    input.structure.pos.x !== request.x
    || input.structure.pos.y !== request.y
  ) {
    return { ready: false, reason: 'position-mismatch' };
  }

  if (
    !Number.isInteger(input.hostileCount)
    || input.hostileCount > 0
  ) {
    return { ready: false, reason: 'hostiles-present' };
  }

  return { ready: true, reason: 'ready' };
}</code></pre>

<h2 id="complete-example">Complete destruction request handler</h2>
<pre><code class="language-javascript">function handleDestroyExtensionRequest() {
  const request = Memory.destroyStructureRequest;
  if (!request || request.enabled !== true) {
    return { status: 'disabled' };
  }

  const structure = typeof request.structureId === 'string'
    ? Game.getObjectById(request.structureId)
    : null;
  const owned = Boolean(
    structure
    && Game.structures[structure.id]
  );
  const hostileCount = structure?.room
    ? structure.room.find(
        FIND_HOSTILE_CREEPS
      ).length
    : 0;
  const plan = evaluateDestroyRequest({
    request,
    structure,
    owned,
    hostileCount
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
    structureId: structure.id,
    roomName: structure.pos.roomName,
    x: structure.pos.x,
    y: structure.pos.y,
    structureType: structure.structureType,
    hostileCount,
    energyCapacityAvailable:
      structure.room.energyCapacityAvailable
  };

  const result = structure.destroy();

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
  const outcome = handleDestroyExtensionRequest();

  if (
    outcome.status === 'accepted'
    || outcome.status === 'failed-review-required'
  ) {
    console.log(JSON.stringify({
      type: 'destroy-extension-request-result',
      ...outcome
    }));
  }
};</code></pre>

<h2 id="hostiles">Stop when hostile Creeps are present</h2>
<p>The official method can return <code>ERR_BUSY</code> while hostile Creeps are in the room. The preflight records this state clearly, but the method result remains authoritative because room state can change between inspection and resolution.</p>
<pre><code class="language-javascript">function countVisibleHostiles(room) {
  return room
    ? room.find(FIND_HOSTILE_CREEPS).length
    : 0;
}</code></pre>

<h2 id="disable-first">Disable before the destructive call</h2>
<pre><code class="language-javascript">request.enabled = false;
const result = structure.destroy();</code></pre>
<p>A failed request must be reviewed and explicitly recreated or re-enabled. It should not fire automatically after hostiles leave or another Structure is rebuilt at the coordinate.</p>

<h2 id="after-ok">Verify the next tick</h2>
<pre><code class="language-javascript">function verifyDestroyedExtension(request) {
  const object = Game.getObjectById(
    request.structureId
  );
  const room = Game.rooms[request.roomName];

  if (object) {
    return {
      verified: false,
      reason: 'object-still-visible'
    };
  }

  if (!room) {
    return {
      verified: false,
      reason: 'room-not-visible'
    };
  }

  const matchingExtension = room.lookForAt(
    LOOK_STRUCTURES,
    request.x,
    request.y
  ).find(structure =>
    structure.structureType
      === STRUCTURE_EXTENSION
  ) || null;

  return matchingExtension
    ? {
        verified: false,
        reason: 'extension-at-coordinate',
        structureId: matchingExtension.id
      }
    : { verified: true };
}</code></pre>
<p>ID absence and coordinate inspection together distinguish the intended object from a newly built replacement.</p>

<h2 id="dependencies">Review room dependencies first</h2>
<p>An Extension contributes to <code>room.energyCapacityAvailable</code> and can affect Spawn body plans, logistics paths, Rampart coverage and room blueprints. This guide records capacity before the call but does not promise resource refunds or automatic rebuilding.</p>

<h2 id="return-codes">Handle return codes</h2>
<div class="table-scroll"><table>
<thead><tr><th>Code</th><th>Meaning</th><th>Review</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>Destruction scheduled</td><td>ID and coordinate later</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>Structure is not yours</td><td>ID and <code>Game.structures</code></td></tr>
<tr><td><code>ERR_BUSY</code></td><td>Hostile Creep present</td><td>Current room hostiles</td></tr>
</tbody></table></div>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Distinguish Construction Site from Structure.</li>
<li>Inspect the tile read-only first.</li>
<li>Use the exact Structure ID.</li>
<li>Require room, X and Y matches.</li>
<li>Allow only <code>STRUCTURE_EXTENSION</code>.</li>
<li>Require <code>DESTROY_EXTENSION</code>.</li>
<li>Verify ownership through <code>Game.structures</code>.</li>
<li>Stop when hostiles are present.</li>
<li>Disable before the call.</li>
<li>Save the official return code.</li>
<li>Verify ID and coordinate later.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not destroy critical Structures, remove Construction Sites, migrate resources, redesign the room, calculate refunds or rebuild the Extension. Return to the <a href="/en/blog">English article library</a> for construction and room-planning topics.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Why not use structure.my alone?</h3>
<p>The example cross-checks the recovered ID against <code>Game.structures</code>, which contains your Structures, and then validates the full request identity.</p>
<h3>Why disable a request rejected because of hostiles?</h3>
<p>Executing automatically after combat ends may no longer reflect current layout intent. Require a fresh review.</p>
<h3>Does destroy() return construction resources?</h3>
<p>This guide makes no refund claim. Plan dependencies and resource consequences separately before submitting the destructive request.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Structure.destroy" rel="nofollow">API Reference: Structure.destroy()</a></li>
<li><a href="https://docs.screeps.com/api/#Game.structures" rel="nofollow">API Reference: Game.structures</a></li>
<li><a href="https://docs.screeps.com/api/#Game.getObjectById" rel="nofollow">API Reference: Game.getObjectById()</a></li>
<li><a href="https://docs.screeps.com/api/#ConstructionSite.remove" rel="nofollow">API Reference: ConstructionSite.remove()</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
