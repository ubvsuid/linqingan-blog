import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishNukerLaunchArticle = {
  slug: "screeps-nuker-launch",
  path: "/en/blog/screeps-nuker-launch",
  chinesePath: "/blog/screeps-nuker-launch-checklist",
  title: "Screeps launchNuke(): Target-Bound Confirmation and One-Time Execution",
  headline: "How to Launch a Nuke Without Reusing a Stale Target Request",
  description:
    "Bind confirmation to target room and coordinates, recover an owned active Nuker by ID, check cooldown, NUKE_RANGE, Energy and Ghodium capacities, disable before launchNuke(), save the return code, and verify later evidence without requiring target-room visibility.",
  category: "DEFENSE · IRREVERSIBLE NUKER OPERATION",
  publishedAt: "2026-07-26",
  publishedLabel: "July 26, 2026",
  readingTime: "19 min read",
  breadcrumbLabel: "Nuker Launch",
  tags: ["Screeps", "Nuker", "Defense", "Ghodium", "Operational Safety"],
  keywords: [
    "Screeps launchNuke",
    "Screeps StructureNuker checklist",
    "Screeps NUKE_RANGE",
    "Screeps Nuker Ghodium Energy",
    "Screeps launchNuke return codes",
  ],
  primaryKeyword: "Screeps launchNuke",
  searchIntent: "Submit one explicitly confirmed Nuker launch with current structure, resource, range, and target evidence",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — StructureNuker.launchNuke(), RoomPosition, NUKE_RANGE, capacities, cooldown and return codes"],
    ["Target boundary", "The article does not choose enemy rooms, claim strategic benefit, or predict damage outcomes"],
    ["Execution boundary", "OK schedules the command; cooldown, target-room Nuke objects and later game state must be observed afterward"],
    ["JavaScript syntax", "Passed"],
    ["Offline launch review", "Passed — confirmation, coordinates, ownership, active state, cooldown, range, Energy, Ghodium and ready states"],
    ["Screeps Console test", "Pending"],
    ["Live protected-area, launch, cooldown, target Nuke object and resource-consumption test", "Pending"],
    ["Last verified", "July 26, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["irreversible", "Treat launchNuke() as irreversible"],
    ["confirmation", "Bind confirmation to the exact target"],
    ["request", "Create a one-time request"],
    ["preflight", "Build a testable launch plan"],
    ["recover", "Recover and validate the Nuker"],
    ["complete-example", "Complete launch handler"],
    ["disable-first", "Disable before the API call"],
    ["after-ok", "Verify later evidence"],
    ["visibility", "Do not require target-room visibility"],
    ["return-codes", "Handle return codes"],
    ["debugging", "Debugging checklist"],
    ["scope", "Scope and next steps"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    ["Why bind confirmation to room and coordinates?", "Changing any target field invalidates the old confirmation, preventing a reviewed request from being reused for another location."],
    ["Why use NUKE_RANGE and capacity constants?", "Named constants keep the preflight coupled to current game data instead of scattering copied numbers through business code."],
    ["Why disable a request when preflight fails?", "An old request must not launch automatically later when resources, cooldown, or range conditions change."],
    ["Does OK prove a Nuke object is visible in the target room?", "No. Save the result, inspect the Nuker later, and check FIND_NUKES only when target-room visibility exists."],
  ],
  previous: {
    href: "/en/blog/screeps-memory-basics",
    label: "Previous operations guide",
    title: "Write Memory Safely",
  },
  next: {
    href: "/en/blog/screeps-rampart-set-public",
    label: "Next defense operation",
    title: "Change Rampart Access Safely",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Create one Memory request containing the exact Nuker ID, target room, X, Y, and a confirmation string generated from those target fields. Require integer coordinates from 0 through 49, an owned active Nuker, zero cooldown, linear distance within <code>NUKE_RANGE</code>, at least <code>NUKER_ENERGY_CAPACITY</code> Energy, and at least <code>NUKER_GHODIUM_CAPACITY</code> Ghodium. Disable the request before calling <code>launchNuke()</code>, store the return code, and verify later state.</p>

<h2 id="irreversible">Treat launchNuke() as irreversible</h2>
<p>A submitted launch cannot be converted into a different target by later code. This guide therefore does not automatically choose rooms, players, coordinates, or timing.</p>
<pre><code class="language-javascript">function describeNuker(nuker) {
  if (!nuker) {
    return { found: false };
  }

  return {
    found: true,
    id: nuker.id,
    roomName: nuker.pos.roomName,
    owned: nuker.my === true,
    active: nuker.isActive() === true,
    cooldown: nuker.cooldown,
    energy: nuker.store.getUsedCapacity(
      RESOURCE_ENERGY
    ),
    ghodium: nuker.store.getUsedCapacity(
      RESOURCE_GHODIUM
    )
  };
}</code></pre>

<h2 id="confirmation">Bind confirmation to the exact target</h2>
<pre><code class="language-javascript">function buildNukeConfirmation(roomName, x, y) {
  return 'LAUNCH_NUKE_' + roomName + '_' + x + '_' + y;
}</code></pre>
<p>A generic value such as <code>LAUNCH</code> does not prove that the player reviewed the current target. A target-bound phrase becomes invalid whenever the room or coordinate changes.</p>

<h2 id="request">Create a one-time request</h2>
<pre><code class="language-javascript">Memory.nuker ??= {};
Memory.nuker.launchRequest = {
  enabled: true,
  nukerId: 'replace-with-owned-nuker-id',
  targetRoom: 'W2N2',
  x: 25,
  y: 25,
  confirmation: 'LAUNCH_NUKE_W2N2_25_25'
};</code></pre>
<p>Review the whole object. Turning on only <code>enabled</code> is not sufficient confirmation.</p>

<h2 id="preflight">Build a testable launch plan</h2>
<pre><code class="language-javascript">function evaluateNukeRequest(input) {
  const request = input.request;

  if (!request || request.enabled !== true) {
    return { ready: false, reason: 'disabled' };
  }

  if (
    typeof request.targetRoom !== 'string'
    || !Number.isInteger(request.x)
    || !Number.isInteger(request.y)
    || request.x < 0
    || request.x > 49
    || request.y < 0
    || request.y > 49
  ) {
    return { ready: false, reason: 'invalid-target' };
  }

  if (
    request.confirmation !== buildNukeConfirmation(
      request.targetRoom,
      request.x,
      request.y
    )
  ) {
    return { ready: false, reason: 'confirmation-mismatch' };
  }

  if (input.owned !== true) {
    return { ready: false, reason: 'not-owner' };
  }

  if (input.active !== true) {
    return { ready: false, reason: 'structure-inactive' };
  }

  if (!Number.isFinite(input.cooldown) || input.cooldown > 0) {
    return { ready: false, reason: 'nuker-waiting' };
  }

  if (!Number.isFinite(input.distance) || input.distance > NUKE_RANGE) {
    return { ready: false, reason: 'target-out-of-range' };
  }

  if (input.energyAvailable < NUKER_ENERGY_CAPACITY) {
    return { ready: false, reason: 'energy-shortage' };
  }

  if (input.ghodiumAvailable < NUKER_GHODIUM_CAPACITY) {
    return { ready: false, reason: 'ghodium-shortage' };
  }

  return { ready: true, reason: 'ready' };
}</code></pre>
<p>Preflight cannot reproduce every protected-location rule. The API return code remains authoritative.</p>

<h2 id="recover">Recover and validate the Nuker</h2>
<pre><code class="language-javascript">function getOwnedNuker(nukerId) {
  const structure = typeof nukerId === 'string'
    ? Game.getObjectById(nukerId)
    : null;

  if (
    !structure
    || structure.structureType !== STRUCTURE_NUKER
    || structure.my !== true
  ) {
    return null;
  }

  return structure;
}</code></pre>
<p>Use the exact ID instead of selecting the first Nuker in a room. Multiple Nukers or copied configuration must not change the source structure.</p>

<h2 id="complete-example">Complete launch handler</h2>
<pre><code class="language-javascript">function handleNukeRequest() {
  const request = Memory.nuker?.launchRequest;

  if (!request || request.enabled !== true) {
    return { status: 'disabled' };
  }

  const nuker = getOwnedNuker(request.nukerId);
  if (!nuker) {
    request.enabled = false;
    request.status = 'nuker-missing';
    return { status: request.status };
  }

  const distance = Game.map.getRoomLinearDistance(
    nuker.room.name,
    request.targetRoom
  );
  const energyAvailable = nuker.store.getUsedCapacity(
    RESOURCE_ENERGY
  );
  const ghodiumAvailable = nuker.store.getUsedCapacity(
    RESOURCE_GHODIUM
  );
  const plan = evaluateNukeRequest({
    request,
    owned: nuker.my,
    active: nuker.isActive(),
    cooldown: nuker.cooldown,
    distance,
    energyAvailable,
    ghodiumAvailable
  });

  request.checkedAt = Game.time;
  request.status = plan.reason;

  if (!plan.ready) {
    request.enabled = false;
    return { status: plan.reason };
  }

  const target = new RoomPosition(
    request.x,
    request.y,
    request.targetRoom
  );

  request.enabled = false;
  request.status = 'submitted';
  request.submittedAt = Game.time;
  request.before = {
    nukerId: nuker.id,
    sourceRoom: nuker.room.name,
    targetRoom: target.roomName,
    x: target.x,
    y: target.y,
    distance,
    cooldown: nuker.cooldown,
    energyAvailable,
    ghodiumAvailable
  };

  const result = nuker.launchNuke(target);

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
  const outcome = handleNukeRequest();

  if (
    outcome.status === 'accepted'
    || outcome.status === 'failed-review-required'
  ) {
    console.log(JSON.stringify({
      type: 'launch-nuke-result',
      ...outcome
    }));
  }
};</code></pre>

<h2 id="disable-first">Disable before the API call</h2>
<pre><code class="language-javascript">request.enabled = false;
const result = nuker.launchNuke(target);</code></pre>
<p>Any retry requires a new review. A failed request should not fire later when cooldown, resources, or room state changes.</p>

<h2 id="after-ok">Verify later evidence</h2>
<pre><code class="language-javascript">function inspectSubmittedNukeRequest(request) {
  const nuker = getOwnedNuker(request?.nukerId);
  const targetRoom = Game.rooms[
    request?.targetRoom
  ];

  return {
    nukerFound: Boolean(nuker),
    nukerCooldown: nuker?.cooldown ?? null,
    energy: nuker
      ? nuker.store.getUsedCapacity(RESOURCE_ENERGY)
      : null,
    ghodium: nuker
      ? nuker.store.getUsedCapacity(RESOURCE_GHODIUM)
      : null,
    targetVisible: Boolean(targetRoom),
    visibleNukes: targetRoom
      ? targetRoom.find(FIND_NUKES).map(nuke => ({
          id: nuke.id,
          x: nuke.pos.x,
          y: nuke.pos.y,
          timeToLand: nuke.timeToLand
        }))
      : []
  };
}</code></pre>

<h2 id="visibility">Do not require target-room visibility</h2>
<p>A missing <code>Game.rooms[targetRoom]</code> entry means the room is not currently visible. It does not prove the launch failed. Use the saved API result and source Nuker state, then inspect target-room Nuke objects when visibility becomes available.</p>

<h2 id="return-codes">Handle return codes</h2>
<div class="table-scroll"><table>
<thead><tr><th>Code</th><th>Meaning</th><th>Review</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>Launch scheduled</td><td>Cooldown, resources and later Nuke evidence</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>Nuker not yours</td><td>ID and ownership</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>Energy or Ghodium missing</td><td>Both Store resources</td></tr>
<tr><td><code>ERR_INVALID_TARGET</code></td><td>Target location rejected</td><td>Protected areas and target rules</td></tr>
<tr><td><code>ERR_NOT_IN_RANGE</code></td><td>Room beyond Nuker range</td><td><code>NUKE_RANGE</code> and linear distance</td></tr>
<tr><td><code>ERR_INVALID_ARGS</code></td><td>Invalid RoomPosition</td><td>Room name and coordinates</td></tr>
<tr><td><code>ERR_TIRED</code></td><td>Nuker cooldown active</td><td><code>nuker.cooldown</code></td></tr>
<tr><td><code>ERR_RCL_NOT_ENOUGH</code></td><td>Structure inactive</td><td>RCL and <code>isActive()</code></td></tr>
</tbody></table></div>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Use the exact owned Nuker ID.</li>
<li>Validate 0–49 coordinates.</li>
<li>Bind confirmation to target room and position.</li>
<li>Check active state and cooldown.</li>
<li>Calculate current linear distance.</li>
<li>Use named Energy and Ghodium capacity constants.</li>
<li>Disable stale and submitted requests.</li>
<li>Save the full before snapshot and return code.</li>
<li>Do not require target-room visibility.</li>
<li>Verify later evidence without claiming damage outcomes.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not choose a target, estimate damage, model Ramparts, select launch timing, coordinate multiple Nukers, or retry rejected launches. Continue with <a href="/en/blog/screeps-rampart-set-public">reviewed Rampart access changes</a>.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Can one generic confirmation phrase be reused?</h3>
<p>It should not be. Build the phrase from the exact target so copied or edited requests fail closed.</p>
<h3>Why close the request after a resource shortage?</h3>
<p>Otherwise it may launch later as soon as logistics fill the Nuker, without a new human review.</p>
<h3>Can preflight guarantee the location is valid?</h3>
<p>No. Keep <code>ERR_INVALID_TARGET</code> and the current official result as the final same-tick authority.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#StructureNuker" rel="nofollow">API Reference: StructureNuker</a></li>
<li><a href="https://docs.screeps.com/api/#StructureNuker.launchNuke" rel="nofollow">API Reference: launchNuke()</a></li>
<li><a href="https://docs.screeps.com/api/#RoomPosition" rel="nofollow">API Reference: RoomPosition</a></li>
<li><a href="https://docs.screeps.com/api/#Game.map.getRoomLinearDistance" rel="nofollow">API Reference: getRoomLinearDistance()</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
