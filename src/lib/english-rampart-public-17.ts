import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishRampartPublicArticle = {
  slug: "screeps-rampart-set-public",
  path: "/en/blog/screeps-rampart-set-public",
  chinesePath: "/blog/screeps-rampart-set-public",
  title: "Screeps setPublic(): Safe Rampart Access Changes by Exact Identity",
  headline: "How to Change Rampart Access Without Treating Public as an Ally List",
  description:
    "Lock a one-time setPublic() request to Rampart ID, room, coordinates, target boolean and target-bound confirmation, verify ownership and current state, disable before the call, save the result, and re-read isPublic later.",
  category: "DEFENSE · RAMPART ACCESS CONTROL",
  publishedAt: "2026-07-26",
  publishedLabel: "July 26, 2026",
  readingTime: "17 min read",
  breadcrumbLabel: "Rampart Public State",
  tags: ["Screeps", "Rampart", "Defense", "Access Control", "Operational Safety"],
  keywords: [
    "Screeps Rampart setPublic",
    "Screeps rampart isPublic",
    "Screeps public Rampart access",
    "Screeps Rampart confirmation request",
    "Screeps setPublic return codes",
  ],
  primaryKeyword: "Screeps Rampart setPublic",
  searchIntent: "Change one owned Rampart's public state with exact identity and one-time confirmation",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — StructureRampart.setPublic(), isPublic, ownership and return codes"],
    ["Access boundary", "Public permits other players' Creeps to pass; it is not a per-player allow-list or intent check"],
    ["Execution boundary", "OK schedules the change; the current Rampart must be recovered and isPublic observed later"],
    ["JavaScript syntax", "Passed"],
    ["Offline access review", "Passed — request, confirmation, ownership, type, room, position, matching state and ready states"],
    ["Screeps Console test", "Pending"],
    ["Live public/private passage, object replacement, ownership and next-tick state test", "Pending"],
    ["Last verified", "July 26, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["meaning", "Understand what public means"],
    ["inspect", "Inspect Ramparts read-only first"],
    ["confirmation", "Bind confirmation to target state and position"],
    ["preflight", "Build a testable access plan"],
    ["complete-example", "Complete setPublic() handler"],
    ["matching-state", "Stop when the state already matches"],
    ["disable-first", "Disable before the call"],
    ["after-ok", "Verify the next tick"],
    ["not-whitelist", "Public is not a visitor whitelist"],
    ["return-codes", "Handle return codes"],
    ["debugging", "Debugging checklist"],
    ["scope", "Scope and next steps"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    ["Does setPublic(true) allow only allies?", "No. The method accepts one boolean and does not distinguish players, alliances, body parts, rooms, or intent."],
    ["Why lock the request to coordinates as well as ID?", "Room and position checks make stale, copied, or rebuilt-object requests fail closed."],
    ["Why disable a request when isPublic already matches?", "The request may be stale or already handled. Repeating the check each tick has no business value."],
    ["Does setPublic() consume Energy or require range?", "No Creep is performing the operation. Keep only the method's relevant ownership result and verify state later."],
  ],
  previous: {
    href: "/en/blog/screeps-nuker-launch",
    label: "Previous defense operation",
    title: "Launch a Nuke Safely",
  },
  next: {
    href: "/en/blog/screeps-wall-rampart-repair-limit",
    label: "Next defense maintenance guide",
    title: "Use Staged Fortification Limits",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Inspect the Rampart first, then create one request containing its exact ID, expected room, X, Y, desired boolean state, and a confirmation generated from that state and position. Recover the current object, verify it is your Rampart and all identity fields match, stop if <code>isPublic</code> already equals the requested value, disable the request before <code>setPublic()</code>, save the return code, and re-read the Rampart later.</p>

<h2 id="meaning">Understand what public means</h2>
<pre><code class="language-javascript">rampart.setPublic(true);</code></pre>
<p>Public access permits other players' Creeps to pass through the Rampart. The method does not implement an alliance list, player-specific access, a visitor schedule, hostile-body filtering, or intent detection.</p>
<pre><code class="language-javascript">rampart.setPublic(false);</code></pre>
<p>Setting the value to false restores private passage behavior. It does not transfer ownership, change other Ramparts, activate Safe Mode, or run Tower logic.</p>

<h2 id="inspect">Inspect Ramparts read-only first</h2>
<pre><code class="language-javascript">function inspectOwnedRamparts(roomName) {
  const room = Game.rooms[roomName];
  if (!room) {
    return [];
  }

  return room.find(FIND_MY_STRUCTURES, {
    filter: structure =>
      structure.structureType === STRUCTURE_RAMPART
  }).map(rampart => ({
    id: rampart.id,
    roomName: rampart.pos.roomName,
    x: rampart.pos.x,
    y: rampart.pos.y,
    isPublic: rampart.isPublic,
    hits: rampart.hits,
    hitsMax: rampart.hitsMax
  }));
}</code></pre>
<p>Review the ID, coordinate, current state and defensive context before creating a mutation request.</p>

<h2 id="confirmation">Bind confirmation to target state and position</h2>
<pre><code class="language-javascript">function buildRampartConfirmation(
  roomName,
  x,
  y,
  shouldBePublic
) {
  const state = shouldBePublic
    ? 'PUBLIC'
    : 'PRIVATE';

  return `SET_RAMPART_${state}_${roomName}_${x}_${y}`;
}</code></pre>
<pre><code class="language-javascript">Memory.rampartPublicRequest = {
  enabled: true,
  rampartId: 'replace-with-owned-rampart-id',
  roomName: 'W1N1',
  x: 20,
  y: 20,
  public: true,
  confirmation: 'SET_RAMPART_PUBLIC_W1N1_20_20'
};</code></pre>
<p>Changing public to private, moving the expected coordinate, or copying the request to another room invalidates the old phrase.</p>

<h2 id="preflight">Build a testable access plan</h2>
<pre><code class="language-javascript">function evaluateRampartRequest(input) {
  const request = input.request;
  const rampart = input.rampart;

  if (!request || request.enabled !== true) {
    return { ready: false, reason: 'disabled' };
  }

  if (
    typeof request.rampartId !== 'string'
    || typeof request.roomName !== 'string'
    || !Number.isInteger(request.x)
    || !Number.isInteger(request.y)
    || request.x < 0
    || request.x > 49
    || request.y < 0
    || request.y > 49
    || typeof request.public !== 'boolean'
  ) {
    return { ready: false, reason: 'invalid-request' };
  }

  const expected = buildRampartConfirmation(
    request.roomName,
    request.x,
    request.y,
    request.public
  );
  if (request.confirmation !== expected) {
    return { ready: false, reason: 'confirmation-mismatch' };
  }

  if (!rampart) {
    return { ready: false, reason: 'rampart-missing' };
  }

  if (input.owned !== true) {
    return { ready: false, reason: 'not-owner' };
  }

  if (rampart.structureType !== STRUCTURE_RAMPART) {
    return { ready: false, reason: 'type-mismatch' };
  }

  if (rampart.pos.roomName !== request.roomName) {
    return { ready: false, reason: 'room-mismatch' };
  }

  if (
    rampart.pos.x !== request.x
    || rampart.pos.y !== request.y
  ) {
    return { ready: false, reason: 'position-mismatch' };
  }

  if (rampart.isPublic === request.public) {
    return { ready: false, reason: 'state-already-matches' };
  }

  return { ready: true, reason: 'ready' };
}</code></pre>

<h2 id="complete-example">Complete setPublic() handler</h2>
<pre><code class="language-javascript">function handleRampartPublicRequest() {
  const request = Memory.rampartPublicRequest;

  if (!request || request.enabled !== true) {
    return { status: 'disabled' };
  }

  const rampart = typeof request.rampartId === 'string'
    ? Game.getObjectById(request.rampartId)
    : null;
  const owned = Boolean(
    rampart
    && Game.structures[rampart.id]
  );
  const plan = evaluateRampartRequest({
    request,
    rampart,
    owned
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
    rampartId: rampart.id,
    roomName: rampart.pos.roomName,
    x: rampart.pos.x,
    y: rampart.pos.y,
    beforePublic: rampart.isPublic,
    requestedPublic: request.public
  };

  const result = rampart.setPublic(request.public);

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
  const outcome = handleRampartPublicRequest();

  if (
    outcome.status === 'accepted'
    || outcome.status === 'failed-review-required'
  ) {
    console.log(JSON.stringify({
      type: 'rampart-public-result',
      ...outcome
    }));
  }
};</code></pre>

<h2 id="matching-state">Stop when the state already matches</h2>
<p>A matching state can mean the request is stale or another module already handled it. Close the request, record <code>state-already-matches</code>, and avoid a permanent per-tick no-op loop.</p>

<h2 id="disable-first">Disable before the call</h2>
<pre><code class="language-javascript">request.enabled = false;
const result = rampart.setPublic(request.public);</code></pre>
<p>Opening a Rampart can change real room access. A rejected request must be reviewed and explicitly resubmitted instead of retrying automatically.</p>

<h2 id="after-ok">Verify the next tick</h2>
<pre><code class="language-javascript">function verifyRampartPublicRequest(request) {
  const rampart = typeof request?.rampartId === 'string'
    ? Game.getObjectById(request.rampartId)
    : null;

  if (!rampart) {
    return {
      verified: false,
      reason: 'rampart-not-visible'
    };
  }

  return {
    verified: rampart.isPublic === request.public,
    rampartId: rampart.id,
    isPublic: rampart.isPublic,
    requestedPublic: request.public
  };
}</code></pre>
<p>Recover the current object. Do not reuse a previous-tick Rampart reference.</p>

<h2 id="not-whitelist">Public is not a visitor whitelist</h2>
<p>One boolean cannot represent allowed usernames, permitted body parts, time windows, room-specific access, or automatic closure after hostile behavior. Those policies need a higher-level dispatcher, and the safest default remains private unless a reviewed operation requires public passage.</p>

<h2 id="return-codes">Handle return codes</h2>
<div class="table-scroll"><table>
<thead><tr><th>Code</th><th>Meaning</th><th>Review</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>State change scheduled</td><td>Re-read <code>isPublic</code> later</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>Rampart is not yours</td><td>ID, <code>Game.structures</code> and ownership</td></tr>
</tbody></table></div>
<p>Do not copy Creep range or Energy return codes into this method.</p>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Inspect Ramparts read-only first.</li>
<li>Use the exact Rampart ID.</li>
<li>Lock room, X, Y and target boolean.</li>
<li>Bind the confirmation to state and position.</li>
<li>Verify ownership through current objects.</li>
<li>Stop on type, room or position mismatch.</li>
<li>Close a matching-state request.</li>
<li>Disable before the call.</li>
<li>Save the return code and before snapshot.</li>
<li>Re-read <code>isPublic</code> later.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not implement alliances, scheduled gates, body-part access, automatic threat response, Safe Mode coordination, or multi-Rampart batches. Continue with <a href="/en/blog/screeps-wall-rampart-repair-limit">staged fortification maintenance</a>.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Can I pass a username array to setPublic()?</h3>
<p>No. The method accepts a boolean, not a player list.</p>
<h3>Why not make every road Rampart public automatically?</h3>
<p>Layout alone does not prove access intent. A copied rule can expose protected interior paths or critical Structures.</p>
<h3>Should public Ramparts automatically return to private?</h3>
<p>That can be a separate reviewed task, but this one-time handler does not invent a timeout or silently reverse another request.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#StructureRampart" rel="nofollow">API Reference: StructureRampart</a></li>
<li><a href="https://docs.screeps.com/api/#StructureRampart.setPublic" rel="nofollow">API Reference: setPublic()</a></li>
<li><a href="https://docs.screeps.com/defense.html" rel="nofollow">Screeps Documentation: Defending your room</a></li>
<li><a href="https://docs.screeps.com/api/#Game.structures" rel="nofollow">API Reference: Game.structures</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
