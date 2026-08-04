import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { englishRampartPublicArticle } from "./english-rampart-public-17";

export const englishEditorialRampartAccessArticle20260804: EnglishBeginnerArticle = {
  ...englishRampartPublicArticle,
  title: "Screeps setPublic(): Prevent Same-Tick Rampart Intent Overwrite",
  headline: "Change One Rampart Access State and Verify the Exact Object",
  description:
    "Bind one reviewed boolean change to the exact Rampart, reserve that ID for the tick, record pending evidence only after OK, and verify the same object's isPublic state on the next tick.",
  category: "DEFENSE · RAMPART INTENT IDENTITY",
  publishedAt: "2026-07-26",
  publishedLabel: "July 26, 2026",
  updatedAt: "2026-08-04",
  readingTime: "21 min read",
  primaryKeyword: "Screeps setPublic verification",
  searchIntent:
    "Submit and verify one exact Rampart public-state change without same-tick overwrite, stale identity, or ally-list assumptions",
  finalScore: 98,
  keywords: [
    "Screeps setPublic verification",
    "Screeps Rampart same-tick intent",
    "Screeps Rampart isPublic next tick",
    "Screeps public Rampart access",
    "Screeps Rampart operation identity",
  ],
  verification: [
    ["Chinese source article", "Reviewed in full"],
    [
      "Official engine",
      "Checked — setPublic requires ownership, coerces the argument to a boolean, stores one setPublic intent for the exact Rampart ID and emits no Room event",
    ],
    [
      "Same-tick boundary",
      "Checked — another setPublic call for the same Rampart can replace the earlier intent before tick processing",
    ],
    [
      "Static code review",
      "Passed — exact Rampart identity, strict boolean input, one dispatcher reservation, accepted-call pending state and next-tick verification",
    ],
    ["JavaScript syntax", "Passed"],
    ["Screeps Console test", "Pending"],
    [
      "Live same-tick overwrite, public/private passage, object replacement and next-tick state verification",
      "Pending",
    ],
    ["Genuine room or Console screenshots", "Pending"],
    ["Last verified", "August 4, 2026"],
  ],
  toc: [
    ["evidence-contract", "Start with the intent boundary"],
    ["request-identity", "Bind approval to one exact Rampart"],
    ["preflight", "Validate current identity and state"],
    ["coordinate", "Reserve the Rampart for the tick"],
    ["submit", "Record only an accepted change"],
    ["verify", "Verify the exact object next tick"],
    ["failure-states", "Preserve missing and overwritten states"],
    ["access-boundary", "Public is not an ally list"],
    ["integration", "Production integration boundary"],
    ["official-docs", "Official documentation"],
  ],
  faq: [],
  articleHtml: String.raw`
<h2 id="evidence-contract">Start with the intent boundary</h2>
<p><code>StructureRampart.setPublic()</code> schedules one boolean state change. In the official engine, the call writes a <code>setPublic</code> intent keyed to the Rampart ID and returns <code>OK</code>. A second call for the same Rampart during the same JavaScript tick can replace the earlier value before the server processes either request.</p>
<p>That makes the method different from a simple configuration assignment. One module may submit <code>true</code>, another may submit <code>false</code>, and both callers may see <code>OK</code> while only the final intent remains. Use one dispatcher, one Rampart reservation and one next-tick verifier.</p>
<p>The method creates no Room event. Visual appearance, a Creep standing nearby or the original return value is not completion evidence.</p>

<h2 id="request-identity">Bind approval to one exact Rampart</h2>
<pre><code class="language-javascript">function buildRampartConfirmation(request) {
  return [
    'SET_RAMPART_ACCESS',
    request.requestId,
    request.rampartId,
    request.roomName,
    request.x,
    request.y,
    request.public ? 'PUBLIC' : 'PRIVATE'
  ].join('_');
}</code></pre>
<pre><code class="language-javascript">Memory.rampartAccessRequests ??= {};

Memory.rampartAccessRequests['gate-west-1'] = {
  requestId: 'gate-west-1',
  enabled: true,
  rampartId: 'replace-with-rampart-id',
  roomName: 'W1N1',
  x: 20,
  y: 20,
  public: true,
  requestedAt: Game.time,
  confirmation:
    'SET_RAMPART_ACCESS_gate-west-1_' +
    'replace-with-rampart-id_W1N1_20_20_PUBLIC'
};</code></pre>
<p>The confirmation includes the request ID, Rampart ID, room, coordinates and target state. Changing any of those fields invalidates the old approval. Require <code>typeof request.public === 'boolean'</code>; the engine coerces truthy and falsy values, but a production request should not silently turn the string <code>"false"</code> into public access.</p>

<h2 id="preflight">Validate current identity and state</h2>
<pre><code class="language-javascript">function evaluateRampartAccess(request, rampart) {
  if (!request || request.enabled !== true) {
    return { ready: false, status: 'request-disabled' };
  }

  if (
    typeof request.requestId !== 'string'
    || request.requestId.length === 0
    || typeof request.rampartId !== 'string'
    || typeof request.roomName !== 'string'
    || !Number.isInteger(request.x)
    || !Number.isInteger(request.y)
    || request.x &lt; 0
    || request.x &gt; 49
    || request.y &lt; 0
    || request.y &gt; 49
    || typeof request.public !== 'boolean'
    || !Number.isInteger(request.requestedAt)
  ) {
    return { ready: false, status: 'request-invalid' };
  }

  if (request.confirmation !== buildRampartConfirmation(request)) {
    return { ready: false, status: 'confirmation-mismatch' };
  }

  if (!rampart) {
    return { ready: false, status: 'rampart-unavailable' };
  }

  if (
    rampart.id !== request.rampartId
    || rampart.structureType !== STRUCTURE_RAMPART
    || rampart.pos.roomName !== request.roomName
    || rampart.pos.x !== request.x
    || rampart.pos.y !== request.y
  ) {
    return { ready: false, status: 'rampart-identity-mismatch' };
  }

  if (rampart.my !== true) {
    return { ready: false, status: 'rampart-not-owned' };
  }

  if (rampart.isPublic === request.public) {
    return { ready: false, status: 'state-already-observed' };
  }

  return { ready: true, status: 'access-change-ready' };
}</code></pre>
<p>A matching state is an observation, not evidence that this request caused it. Close or archive that request separately instead of manufacturing an accepted operation record.</p>

<h2 id="coordinate">Reserve the Rampart for the tick</h2>
<pre><code class="language-javascript">function createRampartAccessDispatcher() {
  const reservedRampartIds = new Set();

  return {
    reserve(rampartId) {
      if (reservedRampartIds.has(rampartId)) {
        return {
          ready: false,
          status: 'rampart-already-reserved'
        };
      }

      reservedRampartIds.add(rampartId);
      return {
        ready: true,
        status: 'rampart-reserved'
      };
    },
    release(rampartId) {
      reservedRampartIds.delete(rampartId);
    }
  };
}</code></pre>
<p>Every module that can change Rampart access must use the same dispatcher. A local reservation inside one role file cannot stop another independent module from overwriting the intent later in the tick.</p>

<h2 id="submit">Record only an accepted change</h2>
<pre><code class="language-javascript">function submitRampartAccess(
  dispatcher,
  requestId
) {
  const request =
    Memory.rampartAccessRequests?.[requestId];

  if (!request || request.requestId !== requestId) {
    return { status: 'request-identity-mismatch' };
  }

  const rampart = typeof request.rampartId === 'string'
    ? Game.getObjectById(request.rampartId)
    : null;

  const decision = evaluateRampartAccess(
    request,
    rampart
  );
  if (!decision.ready) {
    return decision;
  }

  const reservation = dispatcher.reserve(rampart.id);
  if (!reservation.ready) {
    return reservation;
  }

  Memory.pendingRampartAccess ??= {};
  if (Memory.pendingRampartAccess[rampart.id]) {
    dispatcher.release(rampart.id);
    return { status: 'pending-operation-exists' };
  }

  request.enabled = false;
  request.lastAttemptAt = Game.time;

  const before = {
    isPublic: rampart.isPublic,
    roomName: rampart.pos.roomName,
    x: rampart.pos.x,
    y: rampart.pos.y
  };

  const result = rampart.setPublic(request.public);
  request.lastResult = result;

  if (result !== OK) {
    dispatcher.release(rampart.id);
    request.status = 'access-change-rejected';
    return {
      status: request.status,
      result
    };
  }

  Memory.pendingRampartAccess[rampart.id] = {
    submittedAt: Game.time,
    requestId: request.requestId,
    rampartId: rampart.id,
    roomName: rampart.pos.roomName,
    x: rampart.pos.x,
    y: rampart.pos.y,
    requestedPublic: request.public,
    before
  };

  request.status = 'accepted-awaiting-verification';

  return {
    status: request.status,
    result,
    rampartId: rampart.id
  };
}</code></pre>
<p>The request is disabled before the mutation call, but the pending record is created only after <code>OK</code>. A rejection stays disabled for review; do not silently re-enable an access-control operation on the next tick.</p>

<h2 id="verify">Verify the exact object next tick</h2>
<pre><code class="language-javascript">function verifyRampartAccess(pending) {
  if (!pending) {
    return { status: 'no-pending-operation' };
  }

  const expectedTick = pending.submittedAt + 1;
  if (Game.time &lt; expectedTick) {
    return { status: 'waiting-for-next-tick' };
  }
  if (Game.time &gt; expectedTick) {
    return { status: 'verification-window-missed' };
  }

  const rampart =
    Game.getObjectById(pending.rampartId);

  if (!rampart) {
    const room = Game.rooms[pending.roomName];
    const replacement = room
      ? room.lookForAt(
          LOOK_STRUCTURES,
          pending.x,
          pending.y
        ).find(structure =&gt;
          structure.structureType
            === STRUCTURE_RAMPART
        ) || null
      : null;

    return replacement
      ? {
          status: 'original-rampart-missing-replacement-present',
          replacementId: replacement.id
        }
      : { status: 'original-rampart-unavailable' };
  }

  if (
    rampart.structureType !== STRUCTURE_RAMPART
    || rampart.pos.roomName !== pending.roomName
    || rampart.pos.x !== pending.x
    || rampart.pos.y !== pending.y
    || rampart.my !== true
  ) {
    return { status: 'rampart-identity-mismatch' };
  }

  return {
    status: rampart.isPublic
      === pending.requestedPublic
      ? 'rampart-access-state-observed'
      : 'accepted-state-not-observed',
    rampartId: rampart.id,
    beforePublic: pending.before.isPublic,
    requestedPublic: pending.requestedPublic,
    observedPublic: rampart.isPublic
  };
}</code></pre>
<p>Identity is checked before state. A newly built Rampart at the same tile does not prove the original operation. A late observation may show the desired boolean, but it cannot prove which same-tick caller produced it.</p>

<h2 id="failure-states">Preserve missing and overwritten states</h2>
<div class="table-scroll"><table>
<thead><tr><th>Status</th><th>Meaning</th><th>Response</th></tr></thead>
<tbody>
<tr><td><code>rampart-already-reserved</code></td><td>Another request owns this Rampart for the tick</td><td>Do not submit a second call</td></tr>
<tr><td><code>pending-operation-exists</code></td><td>The previous accepted call has not been verified</td><td>Verify or archive it first</td></tr>
<tr><td><code>accepted-state-not-observed</code></td><td><code>OK</code> was returned but the target state is absent next tick</td><td>Investigate a later same-tick overwrite</td></tr>
<tr><td><code>verification-window-missed</code></td><td>The exact next-tick sample was not taken</td><td>Keep the operation unverified</td></tr>
<tr><td><code>original-rampart-missing-replacement-present</code></td><td>The saved ID vanished and another Rampart occupies the tile</td><td>Do not transfer evidence to the replacement</td></tr>
</tbody></table></div>

<h2 id="access-boundary">Public is not an ally list</h2>
<p><code>setPublic(true)</code> allows other players' Creeps to pass. It does not accept usernames, alliances, body-part filters, schedules or intent rules. Those policies belong in a separate access dispatcher that decides whether to open or close the exact Rampart; the API still receives only one boolean.</p>

<h2 id="integration">Production integration boundary</h2>
<p>Run one final Rampart-access dispatcher after all policy modules have proposed changes. Reject duplicate Rampart IDs, verify pending operations before accepting another request, and keep failed or missed samples visible. Console execution, live passage behavior, same-tick overwrite traces, genuine screenshots and CPU measurements remain pending.</p>

<h2 id="official-docs">Official documentation</h2>
<p>Review the official Screeps API for <code>StructureRampart.setPublic()</code>, <code>StructureRampart.isPublic</code>, ownership, object IDs and return codes. The official engine implementation is also relevant when reasoning about same-tick intent replacement.</p>
`,
};
