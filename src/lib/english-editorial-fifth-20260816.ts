import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const UPDATED_AT = "2026-08-16";
const SELECTED_SLUGS = new Set([
  "screeps-creep-body-parts",
  "screeps-roomposition-distance",
  "screeps-map-find-route",
]);

function replaceRequired(
  html: string,
  search: string,
  replacement: string,
  slug: string,
  label: string,
): string {
  if (!html.includes(search)) {
    throw new Error(`English editorial fifth pass could not find ${label} in ${slug}`);
  }
  return html.replace(search, replacement);
}

function replaceLastVerified(
  verification: Array<[string, string]>,
  additions: Array<[string, string]>,
): Array<[string, string]> {
  const filtered = verification.filter(([term]) =>
    term !== "Last verified"
    && term !== "Last editorial review"
    && !additions.some(([newTerm]) => newTerm === term)
  );
  return [
    ...filtered,
    ...additions,
    ["Last editorial review", "August 16, 2026"],
  ];
}

function insertTocAfter(
  toc: Array<[string, string]>,
  afterId: string,
  item: [string, string],
): Array<[string, string]> {
  if (toc.some(([id]) => id === item[0])) return toc;
  const index = toc.findIndex(([id]) => id === afterId);
  if (index < 0) return [...toc, item];
  return [...toc.slice(0, index + 1), item, ...toc.slice(index + 1)];
}

function improveBodyParts(article: EnglishBeginnerArticle): EnglishBeginnerArticle {
  let articleHtml = article.articleHtml;

  articleHtml = replaceRequired(
    articleHtml,
    `<tr><td><code>ERR_FULL</code></td><td>The Creep cannot accept more of the harvested resource.</td><td>Inspect free Store capacity.</td></tr>`,
    `<tr><td><code>OK</code> while the Store is already full</td><td>A Source harvest request can still be accepted. The current API submission path does not return <code>ERR_FULL</code> just because the Creep has no free Store capacity.</td><td>Use free Store capacity as your application phase boundary; do not wait for a Source-harvest <code>ERR_FULL</code> signal that is not part of the current submission contract.</td></tr>`,
    article.slug,
    "stale Source ERR_FULL row",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<p>Return to the <a href="/en/blog/screeps-creep-harvest-energy">first harvesting lesson</a> for the complete action → range check → movement pattern.</p>`,
    `<p><strong>Capability and capacity are separate.</strong> An active <code>WORK</code> part answers whether the Creep can submit a Source harvest intent. <code>creep.store.getFreeCapacity(RESOURCE_ENERGY)</code> answers whether your role should still be in its harvesting phase. In the current official engine, Source harvesting has no Store-capacity <code>ERR_FULL</code> preflight; later processing can drop harvested overflow that does not fit. A beginner loop should switch away from harvesting when free capacity reaches zero instead of using an invented return code as its state machine.</p>
<p>This distinction is intentionally Source-specific. Mineral and Deposit harvesting have additional target, Extractor, cooldown, and RCL boundaries. Return to the <a href="/en/blog/screeps-creep-harvest-energy">first harvesting lesson</a> for the complete Source action → range check → movement pattern.</p>`,
    article.slug,
    "harvest follow-up paragraph",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<li>match harvesting failure first to <code>WORK</code> and the action result;</li>`,
    `<li>match harvesting capability first to active <code>WORK</code>, then keep Store free capacity as a separate phase boundary;</li>`,
    article.slug,
    "body-parts completion signal",
  );

  return {
    ...article,
    finalScore: 99,
    verification: replaceLastVerified(article.verification, [
      ["Official engine source", "Checked August 16, 2026 — current Creep.harvest() Source submission path has no Store-capacity ERR_FULL preflight"],
      ["Processor boundary", "Checked — Source harvest overflow and Store phase policy are kept separate from active WORK capability"],
      ["Cross-guide consistency", "Checked — matches the focused Source harvesting guide corrected on August 14, 2026"],
      ["Screeps Console test", "Pending — no full-Store Source harvest trace is claimed"],
      ["Live damaged-body test", "Pending — no damaged WORK/CARRY/MOVE trace is claimed"],
    ]),
    articleHtml,
  };
}

function improveRoomPosition(article: EnglishBeginnerArticle): EnglishBeginnerArticle {
  let articleHtml = article.articleHtml;

  articleHtml = replaceRequired(
    articleHtml,
    `<p><code>getRangeTo()</code> returns a number. <code>inRangeTo()</code> returns a boolean and expresses the business rule more directly.</p>`,
    `<p><code>getRangeTo()</code> returns a finite Chebyshev range only when the target resolves to the same room. In the current official engine, a target with a different <code>roomName</code> returns <code>Infinity</code>. <code>inRangeTo()</code> includes an explicit room-name equality test, so a different-room target returns <code>false</code> for ordinary finite ranges. Those are useful API signals; they are not path length.</p>`,
    article.slug,
    "RoomPosition range-method explanation",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<h2 id="near-equal">isNearTo() and isEqualTo()</h2>`,
    `<h2 id="cross-room-api">Cross-room RoomPosition methods do not all behave the same way</h2>
<div class="table-scroll"><table>
<thead><tr><th>Method with a RoomPosition/object target</th><th>Different room</th><th>What the result means</th></tr></thead>
<tbody>
<tr><td><code>getRangeTo(target)</code></td><td><code>Infinity</code></td><td>There is no same-room linear range. It is not a travel-distance estimate.</td></tr>
<tr><td><code>inRangeTo(target, n)</code></td><td><code>false</code></td><td>The target cannot satisfy a same-room action-range test.</td></tr>
<tr><td><code>isNearTo(target)</code></td><td><code>false</code></td><td>The positions are not near in the same room.</td></tr>
<tr><td><code>isEqualTo(target)</code></td><td><code>false</code></td><td>Room identity is part of equality for a RoomPosition target.</td></tr>
<tr><td><code>getDirectionTo(target)</code></td><td>Direction 1–8</td><td>The current engine converts room coordinates into world-space displacement and returns a direction, not a route.</td></tr>
</tbody></table></div>
<p>This difference matters in diagnostics. A cross-room <code>Infinity</code> from <code>getRangeTo()</code> is expected API behavior, while a finite path length must come from a routing/pathfinding workflow. Also prefer the RoomPosition/object overload when room identity matters: the two-number overload contains only local <code>x</code> and <code>y</code> and cannot encode another room name.</p>
<pre><code class="language-javascript">function describePositionApiBoundary(from, to) {
  if (!from || !to) {
    return { status: 'position-missing' };
  }

  return {
    status: from.roomName === to.roomName
      ? 'same-room'
      : 'different-room',
    range: from.getRangeTo(to),
    withinThree: from.inRangeTo(to, 3),
    near: from.isNearTo(to),
    equal: from.isEqualTo(to),
    direction: from.getDirectionTo(to)
  };
}</code></pre>
<p>The returned direction is geometric guidance only. It does not prove that an exit exists in that direction, that a room-level route exists, or that a Creep can traverse the intervening tiles.</p>

<h2 id="near-equal">isNearTo() and isEqualTo()</h2>`,
    article.slug,
    "RoomPosition cross-room section insertion",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<p>Every room reuses local coordinates 0–49. Two positions at (25,25) in different rooms are not the same world location. Use <a href="/en/blog/screeps-map-find-route">Game.map.findRoute()</a>, PathFinder, or <code>moveTo()</code> for cross-room travel.</p>`,
    `<p>Every room reuses local coordinates 0–49. Two positions at (25,25) in different rooms are not the same world location. Do not manually subtract their local coordinates. The API already makes that boundary visible: <code>getRangeTo()</code> returns <code>Infinity</code> and finite <code>inRangeTo()</code> tests fail across rooms. Use <a href="/en/blog/screeps-map-find-route">Game.map.findRoute()</a>, <code>Game.map.getRoomLinearDistance()</code> when room-count distance is actually the intended metric, PathFinder, or <code>moveTo()</code> for the corresponding cross-room question.</p>`,
    article.slug,
    "RoomPosition cross-room paragraph",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<li>Check <code>roomName</code> before same-room range logic.</li>`,
    `<li>Expect <code>getRangeTo()</code> to return <code>Infinity</code> for an object or RoomPosition in another room.</li>
<li>Expect finite <code>inRangeTo()</code> and object-target <code>isNearTo()</code> checks to fail across rooms.</li>
<li>Do not reinterpret <code>getDirectionTo()</code> across rooms as route reachability.</li>
<li>Check <code>roomName</code> before manual same-room range logic.</li>`,
    article.slug,
    "RoomPosition debugging checklist",
  );

  return {
    ...article,
    finalScore: 99,
    verification: replaceLastVerified(article.verification, [
      ["Official engine source", "Checked August 16, 2026 — getRangeTo(), inRangeTo(), isNearTo(), isEqualTo(), getDirectionTo(), findInRange(), and findClosestByRange()"],
      ["Cross-room boundary", "Verified in source — object/RoomPosition getRangeTo() returns Infinity across rooms while getDirectionTo() computes a world-space direction"],
      ["Overload boundary", "Reviewed — object/RoomPosition targets preserve room identity; local x/y overloads do not encode another room"],
      ["Screeps Console test", "Pending — no live cross-room RoomPosition transcript is claimed"],
      ["Live path comparison", "Pending — no measured route/path comparison is claimed"],
    ]),
    toc: insertTocAfter(article.toc, "range-methods", [
      "cross-room-api",
      "Cross-room API behavior",
    ]),
    articleHtml,
  };
}

function improveMapRoute(article: EnglishBeginnerArticle): EnglishBeginnerArticle {
  let articleHtml = article.articleHtml;

  articleHtml = replaceRequired(
    articleHtml,
    `<p>The values are relative policy weights, not travel ticks. A large finite cost keeps a room available as a last resort. <code>Infinity</code> removes it completely. Missing or stale intel is uncertainty, not proof of safety.</p>`,
    `<p>The values are relative policy weights, not travel ticks. A large finite cost keeps a room available as a last resort. <code>Infinity</code> removes it completely. Missing or stale intel is uncertainty, not proof of safety.</p>
<p>The current official engine normalizes every non-<code>Infinity</code> callback result with <code>Number(value) || 1</code>. That makes falsy or non-numeric values a subtle trap: <code>0</code>, <code>false</code>, <code>null</code>, <code>undefined</code>, an empty string, and <code>NaN</code> all become room-entry cost <code>1</code>. They are not zero-cost preferences and they do not block the room.</p>

<h2 id="callback-normalization">Validate routeCallback policy before the engine sees it</h2>
<p>Do not overload callback falsiness with business meaning. Normalize your own configuration into either a positive finite cost or the explicit hard-block sentinel <code>Infinity</code>.</p>
<pre><code class="language-javascript">function normalizeRoutePolicyCost(value) {
  if (value === Infinity) {
    return Infinity;
  }

  const cost = Number(value);

  if (!Number.isFinite(cost) || cost <= 0) {
    return 1;
  }

  return cost;
}

function getConfiguredRouteCost(roomName) {
  if (Memory.routeAvoid?.includes(roomName)) {
    return Infinity;
  }

  return normalizeRoutePolicyCost(
    Memory.routeCosts?.[roomName]
  );
}</code></pre>
<p>The helper's <code>cost <= 0 → 1</code> rule is deliberate project validation. The engine expression itself does not repair negative finite values, so accepting only positive finite numbers or <code>Infinity</code> keeps configuration semantics explicit. Numeric strings such as <code>"2.5"</code> are coerced by the engine, but storing numeric policy as numbers is clearer.</p>
<div class="table-scroll"><table>
<thead><tr><th>Callback return</th><th>Current engine entry cost</th><th>Recommended interpretation</th></tr></thead>
<tbody>
<tr><td><code>Infinity</code></td><td>Room skipped</td><td>Explicit hard block</td></tr>
<tr><td><code>0</code>, <code>false</code>, <code>null</code>, <code>undefined</code>, <code>NaN</code></td><td><code>1</code></td><td>Do not use as block or zero-cost preference</td></tr>
<tr><td><code>"2.5"</code></td><td><code>2.5</code></td><td>Works through numeric coercion; prefer numeric configuration</td></tr>
<tr><td>positive finite number</td><td>that number</td><td>Normal room-entry policy cost</td></tr>
</tbody></table></div>`,
    article.slug,
    "final route-policy paragraph",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<p>Do not read <code>route[0]</code> until the result is confirmed to be an array. An empty array is correct when the current room already equals the target room.</p>`,
    `<p>Do not read <code>route[0]</code> until the result is confirmed to be an array. An empty array is correct when the current room already equals the target room. That boundary is specific to <code>findRoute()</code>. <code>Game.map.findExit()</code>, which calls <code>findRoute()</code> internally, returns <code>ERR_INVALID_ARGS</code> when there is no first route step; invalid room names return <code>ERR_NO_PATH</code> from <code>findRoute()</code>.</p>`,
    article.slug,
    "final route array paragraph",
  );

  return {
    ...article,
    finalScore: 99,
    verification: replaceLastVerified(article.verification, [
      ["Official engine source", "Checked August 16, 2026 — Game.map.findRoute(), findExit(), describeExits(), and routeCallback cost handling"],
      ["Callback normalization", "Verified in source — Number(routeCallback(...)) || 1 makes falsy/non-numeric results fall back to cost 1; only Infinity is skipped"],
      ["Same-room boundary", "Verified — findRoute() returns [] for the same room while findExit() returns ERR_INVALID_ARGS when there is no first route step"],
      ["Screeps Console test", "Pending — no live routeCallback return-value transcript is claimed"],
      ["Live cross-room movement test", "Pending — no real-shard route traversal is claimed"],
    ]),
    toc: insertTocAfter(article.toc, "route-policy", [
      "callback-normalization",
      "Normalize callback costs",
    ]),
    articleHtml,
  };
}

export function applyEnglishEditorialFifth20260816(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || !SELECTED_SLUGS.has(article.slug)) return article;

  if (article.slug === "screeps-creep-body-parts") {
    return improveBodyParts(article);
  }
  if (article.slug === "screeps-roomposition-distance") {
    return improveRoomPosition(article);
  }
  if (article.slug === "screeps-map-find-route") {
    return improveMapRoute(article);
  }
  return article;
}

export function getEnglishEditorialFifthUpdatedAt20260816(
  slug: string,
): string | undefined {
  return SELECTED_SLUGS.has(slug) ? UPDATED_AT : undefined;
}
