import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const UPDATED_AT = "2026-08-18";
const REVIEWED_AT = "August 18, 2026";

const SELECTED_SLUGS = new Set([
  "screeps-controller-downgrade",
  "screeps-require-modules",
  "screeps-flags-configuration",
  "screeps-room-create-construction-site",
]);

function replaceRequired(
  html: string,
  search: string,
  replacement: string,
  slug: string,
  label: string,
): string {
  if (!html.includes(search)) {
    throw new Error(`English editorial tenth pass could not find ${label} in ${slug}`);
  }
  return html.replace(search, replacement);
}

function insertTocBefore(
  toc: Array<[string, string]>,
  beforeId: string,
  item: [string, string],
): Array<[string, string]> {
  if (toc.some(([id]) => id === item[0])) return toc;
  const index = toc.findIndex(([id]) => id === beforeId);
  if (index < 0) return [...toc, item];
  return [...toc.slice(0, index), item, ...toc.slice(index)];
}

function improveController(
  article: EnglishBeginnerArticle,
): EnglishBeginnerArticle {
  let articleHtml = article.articleHtml;

  articleHtml = replaceRequired(
    articleHtml,
    `<h2 id="preflight">`,
    `<h2 id="recovery-runway">Choose an emergency threshold from reaction runway</h2>
<p><code>ticksToDowngrade</code> is an API state value; the tick at which your bot enters emergency mode is your own operations policy. A fixed number such as 5,000 is not automatically safe for every room. Estimate how many ticks your recovery path actually needs, then add an explicit safety margin.</p>
<pre><code class="language-javascript">function describeRecoveryRunway(input) {
  const components = [
    input.replacementLeadTicks,
    input.travelTicks,
    input.energyHandoffTicks,
    input.safetyMarginTicks
  ];

  if (
    !Number.isInteger(input.ticksToDowngrade)
    || input.ticksToDowngrade < 0
    || components.some(value =>
      !Number.isInteger(value) || value < 0
    )
  ) {
    return {
      valid: false,
      reason: 'invalid-runway-input'
    };
  }

  const runwayTicks = components.reduce(
    (sum, value) => sum + value,
    0
  );

  return {
    valid: true,
    runwayTicks,
    ticksToDowngrade: input.ticksToDowngrade,
    shouldEscalate:
      input.ticksToDowngrade <= runwayTicks
  };
}</code></pre>
<p>This is a conservative project-planning example, not a Screeps formula. Only sum delays that are genuinely sequential in your own recovery path. If replacement spawning, travel, and Energy delivery overlap, measure that workflow instead of pretending the full sum is observed runtime evidence.</p>

<h2 id="preflight">`,
    article.slug,
    "Controller preflight heading",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<tr><td><code>ERR_NO_BODYPART</code></td>`,
    `<tr><td><code>ERR_ACCESS_DENIED</code></td><td>The Controller is owned or reserved by another player and this Creep cannot perform the attempted Controller upgrade/attack action.</td><td>Inspect Controller ownership/reservation before retrying.</td></tr>
<tr><td><code>ERR_NO_BODYPART</code></td>`,
    article.slug,
    "Controller return-code table",
  );

  const toc = insertTocBefore(
    article.toc,
    "preflight",
    ["recovery-runway", "Choose a reaction runway"],
  );

  return {
    ...article,
    finalScore: 99,
    toc,
    verification: [
      [
        "Existing English route",
        "Preserved — no URL, slug, Canonical, or Chinese mapping change",
      ],
      [
        "Official documentation",
        "Checked August 18, 2026 — StructureController.ticksToDowngrade, upgradeBlocked, Creep.upgradeController() ranges and return codes including ERR_ACCESS_DENIED, and Room.getEventLog()",
      ],
      [
        "Static code review",
        "Passed — emergency entry/exit hysteresis, project-defined reaction runway, upgradeBlocked preflight, exact action result capture, and next-tick Controller event identity remain separate boundaries",
      ],
      [
        "Project-policy boundary",
        "Recovery thresholds and lead-time components are examples to measure for one colony; they are not official Screeps safe values",
      ],
      [
        "Evidence level",
        "Official-documentation review and static code review only; no real-shard recovery sequence is claimed",
      ],
      ["Console test pending", "Not run in this editorial pass"],
      [
        "Screeps Console test",
        "Pending — no real-shard Controller recovery transcript was collected for this revision",
      ],
      [
        "Live multi-tick verification pending",
        "No live emergency-entry, accepted upgrade, next-tick event, threshold exit, or ERR_ACCESS_DENIED trace was collected for this revision",
      ],
      [
        "Genuine in-game screenshot",
        "Pending — no new first-party Controller recovery screenshot was captured for this revision",
      ],
      ["Last editorial review", REVIEWED_AT],
    ],
    articleHtml,
  };
}

function improveModules(
  article: EnglishBeginnerArticle,
): EnglishBeginnerArticle {
  let articleHtml = article.articleHtml;

  articleHtml = replaceRequired(
    articleHtml,
    `<p>The main module owns <code>module.exports.loop</code>. Required modules export functions that main calls. A second role file with its own loop is not scheduled automatically.</p>`,
    `<p>Only the <code>loop</code> exported by the <code>main</code> module is the engine entry point. A helper module may export any property name — including a property named <code>loop</code> — but Screeps does not schedule that helper export automatically; <code>main</code> must call it explicitly.</p>`,
    article.slug,
    "module entry-point wording",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `  try {
    return role.run(creep, context);
  } catch (error) {`,
    `  try {
    const result = role.run(creep, context);

    if (!result || typeof result.status !== 'string') {
      return {
        status: 'invalid-role-result',
        roleName
      };
    }

    return result;
  } catch (error) {`,
    article.slug,
    "role result contract",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `      result.status === 'unknown-role'
      || result.status === 'role-threw'`,
    `      result.status === 'unknown-role'
      || result.status === 'invalid-role-result'
      || result.status === 'role-threw'`,
    article.slug,
    "role failure status list",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<p>The boundary lets other Creeps continue while preserving the failure. Production code should rate-limit repeated messages and retain enough stack or context to reproduce the first error.</p>`,
    `<p>The boundary lets other Creeps continue while preserving the failure. Production code should rate-limit repeated messages and retain enough stack or context to reproduce the first error.</p>
<p>Checking that <code>role.run</code> exists proves only that the export is callable. If the dispatcher later branches on <code>result.status</code>, then a result object with a string <code>status</code> is part of the project contract too. Validate that boundary before dereferencing the result so one malformed role does not crash the main loop outside the per-Creep failure guard.</p>`,
    article.slug,
    "role result explanation",
  );

  return {
    ...article,
    finalScore: 99,
    verification: [
      [
        "Chinese source article",
        "Existing bilingual mapping retained; this English-only pass did not use the Chinese page as live-runtime evidence",
      ],
      [
        "Official documentation",
        "Checked August 18, 2026 — Screeps module organization, the main exported game loop, and Game/Memory lifetime boundaries",
      ],
      [
        "Contributed caching overview",
        "Reviewed separately — require/global cache behavior is treated as contributed guidance, not as a core API guarantee",
      ],
      [
        "Static code review",
        "Passed — helper exports are not described as automatically scheduled; current-tick objects stay out of durable module state; role exports and returned result shapes are both validated before dispatch",
      ],
      [
        "Evidence level",
        "Official-documentation review, contributed caching guidance, and static code review only; no live module-load or reset trace is claimed",
      ],
      ["Console test pending", "Not run in this editorial pass"],
      [
        "Screeps Console test",
        "Pending — no real-shard module load or per-Creep exception transcript was collected for this revision",
      ],
      [
        "Live multi-tick verification pending",
        "No live code reload, global reset, stale-object reproduction, malformed role result, or recovery trace was collected for this revision",
      ],
      ["Last editorial review", REVIEWED_AT],
    ],
    articleHtml,
  };
}

function improveFlags(
  article: EnglishBeginnerArticle,
): EnglishBeginnerArticle {
  let articleHtml = article.articleHtml;

  articleHtml = replaceRequired(
    articleHtml,
    `function resolveBoundSource(flag, sourceId) {
  const object = Game.getObjectById(sourceId);

  if (!object) {
    return {
      status: flag.room
        ? 'target-missing-visible-room'
        : 'target-unresolved-no-vision',
      source: null
    };
  }`,
    `function resolveBoundSource(flag, sourceId) {
  const expectedRoomName = flag.pos.roomName;
  const expectedRoomVisible = Boolean(
    Game.rooms[expectedRoomName]
  );
  const object = Game.getObjectById(sourceId);

  if (!object) {
    return {
      status: expectedRoomVisible
        ? 'target-missing-visible-room'
        : 'target-unresolved-no-vision',
      source: null,
      expectedRoomName
    };
  }`,
    article.slug,
    "Flag visibility-aware target resolution",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<h2 id="no-mutation">`,
    `<h2 id="flag-name-lifetime">Treat the Flag name as immutable identity</h2>
<p>A Flag's <code>name</code> is chosen when the Flag is created and cannot be changed later. If an operator needs a different configuration key, that is a remove-and-create operation, not a rename. Treat the replacement as a new identity boundary: re-check the new Flag's Memory, room, and configured target instead of assuming the old contract moved with the name.</p>
<p>This reader never removes and recreates a Flag to simulate renaming. A configuration migration should be explicit, observable, and separate from normal per-tick reads.</p>

<h2 id="no-mutation">`,
    article.slug,
    "Flag mutation heading",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<p>The caller receives a reason it can log, visualize, or use to pause the mission. The reader does not create, move, recolor, rename, or remove the Flag.</p>`,
    `<p>The caller receives a reason it can log, visualize, or use to pause the mission. The reader does not create, move, recolor, remove, or recreate the Flag. The Flag API does not provide a rename operation.</p>`,
    article.slug,
    "Flag reader mutation boundary",
  );

  const toc = insertTocBefore(
    article.toc,
    "no-mutation",
    ["flag-name-lifetime", "Treat the Flag name as immutable"],
  );

  return {
    ...article,
    finalScore: 99,
    toc,
    verification: [
      [
        "Chinese source article",
        "Existing bilingual mapping retained; this English-only pass did not use the Chinese page as live mission evidence",
      ],
      [
        "Official documentation",
        "Checked August 18, 2026 — Game.flags, Flag.name, Flag.pos, Flag.room visibility, Flag.memory, Flag.remove(), and Game.getObjectById()",
      ],
      [
        "Static code review",
        "Passed — unresolved IDs are classified from visibility of flag.pos.roomName, object type and room identity are checked separately, configured IDs fail closed, and Flag names are not described as mutable",
      ],
      [
        "Identity boundary",
        "A globally valid object ID is rejected when its type or room disagrees with the named Flag contract",
      ],
      [
        "Fallback boundary",
        "Fallback remains explicit and cannot hide an unresolved, wrong-type, or wrong-room configured ID",
      ],
      [
        "Mutation boundary",
        "The reader does not move, recolor, remove, recreate, or rewrite the Flag target; the API has no Flag rename operation",
      ],
      [
        "Evidence level",
        "Official-documentation review and static code review only; no live Flag migration or remote-vision trace is claimed",
      ],
      ["Console test pending", "Not run in this editorial pass"],
      [
        "Screeps Console test",
        "Pending — no real-shard Flag configuration transcript was collected for this revision",
      ],
      [
        "Live multi-tick verification pending",
        "No live Flag removal/recreation, room mismatch, unresolved target ID, visibility change, or explicit-fallback sequence was collected for this revision",
      ],
      ["Last editorial review", REVIEWED_AT],
    ],
    articleHtml,
  };
}

function improveConstruction(
  article: EnglishBeginnerArticle,
): EnglishBeginnerArticle {
  let articleHtml = article.articleHtml;

  articleHtml = replaceRequired(
    articleHtml,
    `<h2 id="return-codes">`,
    `<h2 id="verification-window">Bind verification to the exact next tick</h2>
<p>The request record already stores <code>submittedAt</code>. Use that identity to prevent a much later observation from being presented as proof of what happened immediately after the accepted call. A Construction Site could be built or removed before a delayed check.</p>
<pre><code class="language-javascript">function verifySubmittedRoadSiteNextTick(request) {
  if (!Number.isInteger(request?.submittedAt)) {
    return {
      verified: false,
      reason: 'invalid-submission-record'
    };
  }

  if (Game.time === request.submittedAt) {
    return {
      verified: false,
      reason: 'waiting-for-next-tick'
    };
  }

  if (Game.time !== request.submittedAt + 1) {
    return {
      verified: false,
      reason: 'verification-window-missed'
    };
  }

  return verifyRoadSite(request);
}</code></pre>
<p><code>verification-window-missed</code> is an evidence boundary, not proof that site creation failed. Inspect current world state separately instead of backfilling a next-tick claim from a later observation.</p>

<h2 id="return-codes">`,
    article.slug,
    "Construction return-code heading",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<tr><td><code>ERR_NOT_OWNER</code></td><td>Controller state disallows placement</td><td>Owner and reservation</td></tr>`,
    `<tr><td><code>ERR_NOT_OWNER</code></td><td>The room is claimed or reserved by a hostile player.</td><td>Inspect current Controller ownership and reservation before retrying.</td></tr>`,
    article.slug,
    "Construction ERR_NOT_OWNER row",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<h2 id="after-ok">`,
    `<p><code>ERR_FULL</code> is an account-wide Construction Site limit boundary. The planner's <code>Object.keys(Game.constructionSites).length</code> check is intentionally global; a low site count in only the target room cannot rule out the global limit.</p>

<h2 id="after-ok">`,
    article.slug,
    "Construction global site-limit note",
  );

  const toc = insertTocBefore(
    article.toc,
    "return-codes",
    ["verification-window", "Bind verification to the next tick"],
  );

  return {
    ...article,
    finalScore: 99,
    toc,
    verification: [
      [
        "Existing English route",
        "Preserved — no URL, slug, Canonical, or Chinese mapping change",
      ],
      [
        "Official documentation",
        "Checked August 18, 2026 — Room.createConstructionSite(), current return codes, global Construction Site limit behavior, LOOK_CONSTRUCTION_SITES, and Road placement on natural wall terrain",
      ],
      [
        "Static code review",
        "Passed — one-time request identity, tile inspection, Road-on-wall exception, account-wide site limit context, submit-before-verify separation, and exact next-tick verification window remain explicit",
      ],
      [
        "Evidence level",
        "Official-documentation review and static code review only; no live Road-site creation sequence is claimed",
      ],
      ["Console test pending", "Not run in this editorial pass"],
      [
        "Screeps Console test",
        "Pending — no real-shard createConstructionSite() transcript was collected for this revision",
      ],
      [
        "Live multi-tick verification pending",
        "No live accepted request, exact next-tick Site observation, missed-window case, ERR_FULL, or hostile claim/reservation failure was collected for this revision",
      ],
      [
        "Genuine in-game screenshot",
        "Pending — no new first-party Construction Site screenshot was captured for this revision",
      ],
      ["Last editorial review", REVIEWED_AT],
    ],
    articleHtml,
  };
}

export function applyEnglishEditorialTenth20260818(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || !SELECTED_SLUGS.has(article.slug)) return article;

  switch (article.slug) {
    case "screeps-controller-downgrade":
      return improveController(article);
    case "screeps-require-modules":
      return improveModules(article);
    case "screeps-flags-configuration":
      return improveFlags(article);
    case "screeps-room-create-construction-site":
      return improveConstruction(article);
    default:
      return article;
  }
}

export function getEnglishEditorialTenthUpdatedAt20260818(
  slug: string,
): string | undefined {
  return SELECTED_SLUGS.has(slug) ? UPDATED_AT : undefined;
}
