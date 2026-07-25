import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishFlagsConfigurationArticle = {
  slug: "screeps-flags-configuration",
  path: "/en/blog/screeps-flags-configuration",
  chinesePath: "/blog/screeps-flags-config",
  title: "Screeps Flags as Configuration: Names, Memory, and Object IDs",
  headline: "How to Use Flags as Reviewed Configuration Instead of Hidden Automation",
  description:
    "Resolve exact Flag names from Game.flags, validate flag.memory fields, recover configured targets by ID before a deterministic local fallback, and report missing or stale configuration without mutating Flags.",
  category: "CONFIGURATION · FLAGS AND OBJECT REFERENCES",
  publishedAt: "2026-07-26",
  publishedLabel: "July 26, 2026",
  readingTime: "16 min read",
  breadcrumbLabel: "Flags as Configuration",
  tags: ["Screeps", "Flag", "Configuration", "Memory", "Object ID"],
  keywords: [
    "Screeps Game.flags configuration",
    "Screeps Flag memory",
    "Screeps Flag target ID",
    "Screeps Game.getObjectById flag",
    "Screeps missing Flag diagnostics",
  ],
  primaryKeyword: "Screeps Game.flags configuration",
  searchIntent: "Use named Flags as explicit reviewed configuration without silently mutating the game world",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — Game.flags, Flag.name, Flag.pos, Flag.memory and Game.getObjectById()"],
    ["Policy boundary", "Required Flag names, mode values and fallback rules are project configuration"],
    ["Mutation boundary", "The examples read Flags and write diagnostics only; they do not create, move, rename or remove Flags"],
    ["JavaScript syntax", "Passed"],
    ["Offline configuration review", "Passed — missing Flag, invalid mode, stale object ID, visible-room fallback and stable tie states"],
    ["Screeps Console test", "Pending"],
    ["Live Flag rename, removal, invisible-room and object replacement test", "Pending"],
    ["Last verified", "July 26, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["exact-names", "Use exact Flag names"],
    ["memory", "Treat Flag memory as untrusted input"],
    ["target-id", "Prefer a configured object ID"],
    ["fallback", "Use a narrow local fallback"],
    ["complete-example", "Complete Flag configuration reader"],
    ["no-first", "Do not use the first Flag or Source"],
    ["diagnostics", "Report missing and stale configuration"],
    ["debugging", "Debugging checklist"],
    ["scope", "Scope and next steps"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    ["Why use an exact Flag name?", "A stable name makes the configuration contract visible. Selecting the first Flag can change meaning whenever Flags change."],
    ["Can Flag memory store a Source object?", "Store a serializable Source ID and recover the current object with Game.getObjectById()."],
    ["Should code automatically create a missing required Flag?", "No. Report the missing configuration so room, position, name and mission intent can be reviewed."],
    ["Can a Flag identify an invisible room?", "Its RoomPosition remains useful configuration, but room-local object lookup still requires visibility."],
  ],
  previous: {
    href: "/en/blog/screeps-structure-destroy",
    label: "Previous safety guide",
    title: "Destroy an Extension Safely",
  },
  next: {
    href: "/en/blog/screeps-require-modules",
    label: "Next code organization guide",
    title: "Split Screeps Code into Modules",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Define required Flag names in code, resolve each one directly from <code>Game.flags[name]</code>, validate every custom <code>flag.memory</code> field, recover an optional target ID with <code>Game.getObjectById()</code>, and use only a narrow room-local fallback when the ID is missing or stale. Record configuration status separately. Do not choose the first Flag or mutate Flags as a side effect of reading configuration.</p>

<h2 id="exact-names">Use exact Flag names</h2>
<pre><code class="language-javascript">const FLAG_CONFIG = {
  remoteMine: 'RemoteMine_W2N2',
  rally: 'Rally_W1N1'
};

function getNamedFlag(name) {
  return typeof name === 'string'
    ? Game.flags[name] || null
    : null;
}</code></pre>
<p>Names are a project contract. Document them like role names and Memory schema fields.</p>

<h2 id="memory">Treat Flag memory as untrusted input</h2>
<pre><code class="language-javascript">const ALLOWED_REMOTE_MODES = new Set([
  'observe',
  'harvest',
  'pause'
]);

function readRemoteFlagMemory(flag) {
  if (!flag) {
    return { valid: false, reason: 'flag-missing' };
  }

  const mode = flag.memory?.mode;
  const sourceId = flag.memory?.sourceId;

  if (!ALLOWED_REMOTE_MODES.has(mode)) {
    return { valid: false, reason: 'invalid-mode' };
  }

  if (
    sourceId !== undefined
    && typeof sourceId !== 'string'
  ) {
    return { valid: false, reason: 'invalid-source-id' };
  }

  return {
    valid: true,
    reason: 'valid',
    mode,
    sourceId: sourceId || null
  };
}</code></pre>
<p>A misspelled value should fail closed rather than silently selecting another mission.</p>

<h2 id="target-id">Prefer a configured object ID</h2>
<pre><code class="language-javascript">function recoverConfiguredSource(sourceId) {
  if (typeof sourceId !== 'string') {
    return null;
  }

  const object = Game.getObjectById(sourceId);

  return object
    && object.energy !== undefined
    && object.energyCapacity !== undefined
    ? object
    : null;
}</code></pre>
<p>Recover the current object each tick. An ID can become stale after a typo, object replacement or changed mission.</p>

<h2 id="fallback">Use a narrow local fallback</h2>
<pre><code class="language-javascript">function selectSourceNearFlag(flag) {
  if (!flag?.room) {
    return null;
  }

  return flag.room.find(FIND_SOURCES)
    .map(source => ({
      source,
      range: flag.pos.getRangeTo(source)
    }))
    .sort((left, right) =>
      left.range - right.range
      || left.source.id.localeCompare(right.source.id)
    )[0]?.source || null;
}</code></pre>
<p>The fallback is limited to the visible Flag room and uses stable range and ID ordering. It does not rewrite the configured ID automatically.</p>

<h2 id="complete-example">Complete Flag configuration reader</h2>
<pre><code class="language-javascript">function readRemoteMiningConfiguration() {
  const flagName = FLAG_CONFIG.remoteMine;
  const flag = getNamedFlag(flagName);
  const memory = readRemoteFlagMemory(flag);

  if (!flag || !memory.valid) {
    return {
      ready: false,
      reason: memory.reason,
      flagName
    };
  }

  if (memory.mode === 'pause') {
    return {
      ready: false,
      reason: 'mission-paused',
      flagName,
      roomName: flag.pos.roomName
    };
  }

  const configuredSource = recoverConfiguredSource(
    memory.sourceId
  );
  const fallbackSource = configuredSource
    ? null
    : selectSourceNearFlag(flag);
  const source = configuredSource || fallbackSource;

  if (!source) {
    return {
      ready: false,
      reason: flag.room
        ? 'source-not-found'
        : 'flag-room-not-visible',
      flagName,
      roomName: flag.pos.roomName,
      configuredSourceId: memory.sourceId
    };
  }

  return {
    ready: true,
    reason: 'ready',
    flagName,
    mode: memory.mode,
    roomName: flag.pos.roomName,
    x: flag.pos.x,
    y: flag.pos.y,
    sourceId: source.id,
    sourceSelection: configuredSource
      ? 'configured-id'
      : 'nearest-visible-fallback'
  };
}</code></pre>
<pre><code class="language-javascript">function recordFlagConfigurationStatus(key, status) {
  Memory.configurationStatus ??= {};
  Memory.configurationStatus.flags ??= {};

  Memory.configurationStatus.flags[key] = {
    checkedAt: Game.time,
    ...status
  };
}</code></pre>
<pre><code class="language-javascript">module.exports.loop = function () {
  const configuration = readRemoteMiningConfiguration();
  recordFlagConfigurationStatus('remoteMine', configuration);

  if (!configuration.ready || Game.time % 100 === 0) {
    console.log(JSON.stringify({
      type: 'flag-configuration-status',
      ...configuration
    }));
  }
};</code></pre>

<h2 id="no-first">Do not use the first Flag or Source</h2>
<pre><code class="language-javascript">const unsafeFlag = Object.values(Game.flags)[0];
const unsafeSource = unsafeFlag?.room?.find(FIND_SOURCES)[0];</code></pre>
<p>Object order is not a mission contract. Exact names and stable target selection prevent unrelated additions from changing behavior.</p>

<h2 id="diagnostics">Report missing and stale configuration</h2>
<pre><code class="language-javascript">function summarizeRequiredFlags(names) {
  return names.map(name => {
    const flag = Game.flags[name];

    return flag
      ? {
          name,
          present: true,
          roomName: flag.pos.roomName,
          x: flag.pos.x,
          y: flag.pos.y
        }
      : { name, present: false };
  });
}</code></pre>
<p>Expose the exact missing name and stale ID instead of silently switching missions.</p>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Document every required Flag name.</li>
<li>Resolve Flags by exact name.</li>
<li>Validate custom Flag memory.</li>
<li>Store object IDs, not live objects.</li>
<li>Recover IDs each tick.</li>
<li>Use a narrow deterministic fallback.</li>
<li>Do not select the first Flag or Source.</li>
<li>Do not mutate Flags while reading configuration.</li>
<li>Record missing and stale state.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not create, move, recolor or remove Flags, implement remote harvesting, coordinate invisible rooms or define diplomacy. Continue with <a href="/en/blog/screeps-require-modules">module organization</a>.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Why allow a fallback?</h3>
<p>It keeps visible-room configuration diagnosable when an ID is missing, while clearly marking that the configured identity was not used.</p>
<h3>Should the fallback save the new Source ID?</h3>
<p>Not automatically. Review the reason for the missing ID before changing persistent configuration.</p>
<h3>Can Flag memory be shared across modules?</h3>
<p>Yes, but one documented reader should validate it so different modules do not interpret the same fields differently.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Game.flags" rel="nofollow">API Reference: Game.flags</a></li>
<li><a href="https://docs.screeps.com/api/#Flag" rel="nofollow">API Reference: Flag</a></li>
<li><a href="https://docs.screeps.com/api/#Game.getObjectById" rel="nofollow">API Reference: Game.getObjectById()</a></li>
<li><a href="https://docs.screeps.com/api/#Room.find" rel="nofollow">API Reference: Room.find()</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
