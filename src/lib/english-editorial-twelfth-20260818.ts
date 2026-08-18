import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const UPDATED_AT = "2026-08-18";
const REVIEWED_AT = "August 18, 2026";

const SELECTED_SLUGS = new Set([
  "screeps-tick-game-loop",
  "screeps-creep-roles",
  "screeps-clean-dead-creep-memory",
]);

function insertSection(
  html: string,
  addition: string,
  firstId: string,
  preferredAnchors: string[],
): string {
  if (html.includes(`id="${firstId}"`)) return html;

  const fallbackAnchors = [
    `<h2 id="official-docs">`,
    `<h2 id="official-sources">`,
    `<h2 id="scope">`,
    `<h2 id="faq">`,
  ];

  for (const anchor of [...preferredAnchors, ...fallbackAnchors]) {
    if (html.includes(anchor)) {
      return html.replace(anchor, `${addition}\n\n${anchor}`);
    }
  }

  return `${html}\n\n${addition}`;
}

function insertToc(
  toc: Array<[string, string]>,
  items: Array<[string, string]>,
  beforeIds: string[],
): Array<[string, string]> {
  const missing = items.filter(
    ([id]) => !toc.some(([currentId]) => currentId === id),
  );
  if (missing.length === 0) return toc;

  const index = toc.findIndex(([id]) => beforeIds.includes(id));
  if (index < 0) return [...toc, ...missing];
  return [...toc.slice(0, index), ...missing, ...toc.slice(index)];
}

function refreshVerification(
  article: EnglishBeginnerArticle,
  rows: Array<[string, string]>,
  pending: string,
): Array<[string, string]> {
  const replacedTerms = new Set([
    "Official docs",
    "Official documentation",
    "Game-loop model",
    "Role terminology",
    "Deletion boundary",
    "Offline cleanup review",
    "Offline syntax review",
    "Screeps Console",
    "Screeps Console test",
    "Live multi-tick log",
    "Live role behavior",
    "Live death-and-replacement cycle",
    "Last verified",
    "Last editorial review",
    "Publication status",
    "Evidence level",
    "Live multi-tick verification pending",
  ]);

  return [
    ...article.verification.filter(([term]) => !replacedTerms.has(term)),
    ...rows,
    [
      "Evidence level",
      "Current official-documentation review plus static code review; no real-shard execution is claimed",
    ],
    ["Screeps Console test", "Pending — no live Console transcript was collected for this revision"],
    ["Live multi-tick verification pending", pending],
    ["Last editorial review", REVIEWED_AT],
    ["Publication status", "Ready after repository and production gates pass"],
  ];
}

function improveTickGameLoop(
  article: EnglishBeginnerArticle,
): EnglishBeginnerArticle {
  const addition = String.raw`<h2 id="same-tick-intents">One tick has one starting snapshot, but not one universal action slot</h2>
<p>Every method call in your script reads the same beginning-of-tick game snapshot. Calling <code>move()</code> does not rewrite <code>creep.pos</code> for the next line of JavaScript; the resulting position is visible only after the game processes intents for the tick.</p>
<p>Do not turn that rule into a different myth: <strong>a Creep is not limited to exactly one method call per tick</strong>. Screeps groups actions into execution pipelines. Compatible methods from different pipelines can execute in the same tick, while dependent methods can block one another. Repeating the same method also has an overwrite rule: the last call has priority.</p>
<pre><code class="language-javascript">const creep = Game.creeps.Worker1;

if (creep && !creep.spawning) {
  const before = {
    tick: Game.time,
    x: creep.pos.x,
    y: creep.pos.y
  };

  const firstMove = creep.move(RIGHT);
  const secondMove = creep.move(LEFT);

  console.log(JSON.stringify({
    before,
    firstMove,
    secondMove,
    sameTickPosition: {
      x: creep.pos.x,
      y: creep.pos.y
    }
  }));
}</code></pre>
<p>Both movement calls can return <code>OK</code>, but the later movement intent wins. The unchanged <code>sameTickPosition</code> is still the position from the beginning of the tick. Inspect the Creep on the next tick to learn what actually happened.</p>

<h2 id="return-code-evidence">Treat return codes as submission evidence, not a replay of the future state</h2>
<p>An action return code answers a method-specific question about the command you just submitted. It does not mean every other command for that Creep will execute, and it does not prove the next-tick world state yet.</p>
<div class="table-scroll"><table>
<thead><tr><th>Observation</th><th>What it proves</th><th>What it does not prove</th></tr></thead>
<tbody>
<tr><td><code>move()</code> returned <code>OK</code></td><td>The movement intent was accepted by that method call.</td><td>That this move remains the final movement intent after later calls or conflicts.</td></tr>
<tr><td><code>build()</code> returned <code>OK</code></td><td>The build call was accepted under the current snapshot.</td><td>That another dependent work action cannot take priority during intent processing.</td></tr>
<tr><td><code>Game.time === 123</code></td><td>The script is reading tick 123.</td><td>That tick 124 has already been processed.</td></tr>
</tbody></table></div>
<p>This distinction is why reliable debugging records the method result <em>and</em> later state. If two same-pipeline calls both returned <code>OK</code>, keep both results in the log instead of rewriting the earlier one as though it never happened.</p>
<p>For the exact action-dependency graph and priority rules, use the official simultaneous-actions reference. For beginner production code, one clear work decision per role is often easier to debug, but that is a project design choice rather than an engine rule.</p>`;

  const articleHtml = insertSection(
    article.articleHtml,
    addition,
    "same-tick-intents",
    ["<h2 id=\"common-misunderstandings\">"],
  );

  return {
    ...article,
    description:
      "Understand Screeps ticks, Game.time, module.exports.loop, the beginning-of-tick snapshot, same-tick intent priority, and why accepted commands still require later-tick verification.",
    searchIntent:
      "Beginner explanation of Screeps tick timing, repeated main-loop execution, same-tick intent priority, and later-tick evidence",
    finalScore: 99,
    toc: insertToc(
      [...article.toc],
      [
        ["same-tick-intents", "Same-tick intents and priority"],
        ["return-code-evidence", "Return codes versus later state"],
      ],
      ["common-misunderstandings", "completion-check", "official-sources"],
    ),
    verification: refreshVerification(
      article,
      [
        [
          "Official documentation",
          "Checked August 18, 2026 — game-loop snapshot timing, Game.time, delayed command processing, and simultaneous-action priority/overwrite rules",
        ],
        [
          "Static code review",
          "Passed — same-tick position is not mutated by move(), duplicate movement calls preserve both return codes, and no next-tick outcome is fabricated",
        ],
      ],
      "No real-shard duplicate-movement, cross-pipeline action, CPU-stop, Console, or next-tick position trace was collected for this revision",
    ),
    articleHtml,
  };
}

function improveCreepRoles(
  article: EnglishBeginnerArticle,
): EnglishBeginnerArticle {
  const addition = String.raw`<h2 id="role-contract">Make role dispatch fail closed when you outgrow fixed teaching names</h2>
<p>The three fixed names in this lesson are intentionally simple. When you later move the responsibility into <code>creep.memory.role</code>, do not silently send an unknown value to a default worker. Treat the saved role as persisted input that must match a known handler.</p>
<pre><code class="language-javascript">const ROLE_HANDLERS = {
  harvester: runHarvester,
  upgrader: runUpgrader,
  builder: runBuilder
};

function runAssignedRole(creep) {
  const role = creep.memory.role;

  if (
    typeof role !== 'string'
    || !Object.prototype.hasOwnProperty.call(
      ROLE_HANDLERS,
      role
    )
  ) {
    return {
      status: 'invalid-role',
      role: role ?? null
    };
  }

  const result = ROLE_HANDLERS[role](creep);

  if (!result || typeof result.status !== 'string') {
    return {
      status: 'invalid-role-result',
      role
    };
  }

  return result;
}</code></pre>
<p>This is a project contract, not an official list of Screeps roles. The engine does not know what <code>harvester</code>, <code>upgrader</code>, or <code>builder</code> means. The benefit of validating the value is operational: a typo such as <code>upgarder</code> becomes an explicit <code>invalid-role</code> state instead of quietly running the wrong behavior.</p>

<h2 id="role-capability-boundary">A valid role label still does not prove the Creep can perform the job</h2>
<p>Role validation answers “which behavior owns this Creep?” It does not answer whether the current body, target, range, Store state, room ownership, or action pipeline will let the behavior succeed. Keep those checks inside the role handler and preserve the API return code.</p>
<pre><code class="language-text">role assignment
→ choose one handler

handler preconditions
→ body / target / room / resources / range

action return code
→ accepted or rejected command

later tick
→ verify resulting world state</code></pre>
<p>That separation prevents the role field from becoming a false success signal. A Creep can have a perfectly valid <code>builder</code> role and still return <code>ERR_NO_BODYPART</code>, <code>ERR_NOT_ENOUGH_RESOURCES</code>, or <code>ERR_NOT_IN_RANGE</code> from the action it attempts.</p>
<p>The <a href="/en/blog/screeps-require-modules">module-organization guide</a> shows how to keep these handlers separate without implying that helper modules run automatically.</p>`;

  const articleHtml = insertSection(
    article.articleHtml,
    addition,
    "role-contract",
    ["<h2 id=\"completion-check\">"],
  );

  return {
    ...article,
    description:
      "Learn why Screeps roles are player-defined, how they differ from body parts and current actions, and how to validate role dispatch without turning a role label into false success evidence.",
    searchIntent:
      "Beginner explanation of player-defined Creep responsibilities, fixed-name teaching roles, strict role dispatch, and the boundary between assignment and action success",
    finalScore: 99,
    toc: insertToc(
      [...article.toc],
      [
        ["role-contract", "Strict role dispatch"],
        ["role-capability-boundary", "Role versus capability"],
      ],
      ["completion-check", "next-lesson", "official-sources"],
    ),
    verification: refreshVerification(
      article,
      [
        [
          "Official documentation",
          "Checked August 18, 2026 — configurable Creep bodies, Game.creeps name keys, Creep Memory, modules, repeated ticks, and action return-code boundaries",
        ],
        [
          "Role terminology",
          "Harvester, Upgrader, Builder, role, status, and handler names in the examples are explicitly player/project-defined",
        ],
        [
          "Static code review",
          "Passed — unknown roles fail closed, inherited object keys are rejected, malformed handler results do not escape as successful role outcomes",
        ],
      ],
      "No live role migration, typoed-memory role, damaged-body, handler-failure, or multi-tick role-dispatch trace was collected for this revision",
    ),
    articleHtml,
  };
}

function improveDeadCreepMemory(
  article: EnglishBeginnerArticle,
): EnglishBeginnerArticle {
  const addition = String.raw`<h2 id="spawning-names">Do not delete Memory for a Creep that is still spawning</h2>
<p>The simple rule “delete every <code>Memory.creeps[name]</code> entry missing from <code>Game.creeps</code>” needs one production safety boundary. <code>spawnCreep()</code> can store the new Creep's Memory immediately, while the Spawn separately exposes the in-progress name through <code>spawn.spawning.name</code>. Protect names that are currently being produced before classifying an absent <code>Game.creeps[name]</code> entry as stale.</p>
<p>This is a conservative race-avoidance rule derived from the official API surfaces. It does not claim that every server state exposes spawning Creeps identically through every collection; it simply avoids deleting Memory that the spawning API has already associated with an active production request.</p>
<pre><code class="language-javascript">function getSpawningCreepNames() {
  const names = new Set();

  for (const spawn of Object.values(Game.spawns)) {
    const spawningName = spawn.spawning?.name;

    if (
      typeof spawningName === 'string'
      && spawningName.length > 0
    ) {
      names.add(spawningName);
    }
  }

  return names;
}

function collectStaleCreepMemoryNames() {
  const spawningNames = getSpawningCreepNames();
  const staleNames = [];

  for (const name of Object.keys(Memory.creeps || {})) {
    if (Game.creeps[name]) {
      continue;
    }

    if (spawningNames.has(name)) {
      continue;
    }

    staleNames.push(name);
  }

  return staleNames;
}</code></pre>
<p>A name is now eligible for cleanup only when it is absent from both the current Creep collection and the current set of Spawn production names. If a spawn is cancelled or fails before a Creep becomes live, the production protection disappears and the leftover Memory can be collected by a later cleanup pass.</p>

<h2 id="cleanup-evidence">Record cleanup reason without inventing a death cause</h2>
<p>Absence is enough to classify a name-indexed Memory entry as stale after the spawning guard. It is <strong>not</strong> enough to prove why the Creep disappeared. The Creep may have expired, died in combat, been recycled, suicided, or never completed a cancelled production request.</p>
<pre><code class="language-javascript">function cleanDeadCreepMemory() {
  const staleNames = collectStaleCreepMemoryNames();
  const removed = [];

  for (const name of staleNames) {
    delete Memory.creeps[name];
    removed.push({
      name,
      reason: 'absent-from-live-and-spawning-name-sets',
      cleanedAt: Game.time
    });
  }

  return removed;
}</code></pre>
<p>The reason describes the evidence used by the cleanup algorithm, not the biological or combat cause of death. If the project needs a death cause, collect separate evidence such as event logs or your own lifecycle records before the object disappears.</p>`;

  const articleHtml = insertSection(
    article.articleHtml,
    addition,
    "spawning-names",
    ["<h2 id=\"minimal-function\">", "<h2 id=\"managed-indexes\">"],
  );

  return {
    ...article,
    description:
      "Clean stale Screeps Creep Memory without deleting a live or currently spawning name, then synchronize only project-owned indexes and record evidence without inventing a death cause.",
    searchIntent:
      "Safe dead-Creep Memory cleanup that distinguishes live names, currently spawning names, stale entries, managed indexes, and unknown death cause",
    finalScore: 99,
    toc: insertToc(
      [...article.toc],
      [
        ["spawning-names", "Protect currently spawning names"],
        ["cleanup-evidence", "Record cleanup evidence"],
      ],
      ["minimal-function", "managed-indexes", "complete-example", "official-docs"],
    ),
    verification: refreshVerification(
      article,
      [
        [
          "Official documentation",
          "Checked August 18, 2026 — Game.creeps, StructureSpawn.spawnCreep({memory}), immediate Memory.creeps[name] storage, StructureSpawn.spawning, and spawning.name",
        ],
        [
          "Deletion boundary",
          "Delete only project-owned name-indexed state when the name is absent from Game.creeps and not protected by any current spawn.spawning.name",
        ],
        [
          "Static code review",
          "Passed — live names survive, spawning names survive, stale names are collected first, and cleanup reason does not claim an unobserved death cause",
        ],
      ],
      "No live spawn-start, mid-spawn Memory, spawn-cancel, natural-death, recycle, suicide, replacement, or multi-spawn cleanup trace was collected for this revision",
    ),
    articleHtml,
  };
}

export function applyEnglishEditorialTwelfth20260818(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || !SELECTED_SLUGS.has(article.slug)) return article;

  switch (article.slug) {
    case "screeps-tick-game-loop":
      return improveTickGameLoop(article);
    case "screeps-creep-roles":
      return improveCreepRoles(article);
    case "screeps-clean-dead-creep-memory":
      return improveDeadCreepMemory(article);
    default:
      return article;
  }
}

export function getEnglishEditorialTwelfthUpdatedAt20260818(
  slug: string,
): string | undefined {
  return SELECTED_SLUGS.has(slug) ? UPDATED_AT : undefined;
}
