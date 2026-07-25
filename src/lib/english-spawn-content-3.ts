import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishSpawnBatchThreeArticles = [
  {
    slug: "screeps-spawncreep-return-codes",
    path: "/en/blog/screeps-spawncreep-return-codes",
    chinesePath: "/blog/screeps-spawncreep-return-codes",
    title: "Screeps spawnCreep() Return Codes: A Practical Debugging Guide",
    headline: "How to Debug spawnCreep() Return Codes in Screeps",
    description:
      "Validate the Spawn, Creep name, body, Energy, Memory, and optional structures; run dryRun first; preserve the real spawnCreep() result; and map each error code to a concrete fix.",
    category: "SPAWNING · RETURN-CODE DEBUGGING",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    readingTime: "16 min read",
    breadcrumbLabel: "spawnCreep Return Codes",
    tags: ["Screeps", "Spawn", "Return Codes", "Creep Body", "Debugging"],
    keywords: [
      "Screeps spawnCreep return codes",
      "spawnCreep dryRun",
      "ERR_NOT_ENOUGH_ENERGY spawnCreep",
      "ERR_NAME_EXISTS Screeps",
      "Screeps Spawn debugging",
    ],
    primaryKeyword: "Screeps spawnCreep return codes",
    searchIntent: "Focused spawn request diagnosis after a failed spawnCreep call",
    finalScore: 98,
    verification: [
      ["Chinese source article", "Reviewed in full"],
      ["Official docs", "Checked — StructureSpawn.spawnCreep(), Room Energy, body and name limits"],
      ["API boundary", "dryRun checks current conditions but does not start spawning"],
      ["JavaScript syntax", "Passed"],
      ["Offline validation review", "Passed — Spawn, body, name, Energy, Memory, dryRun and final result"],
      ["Screeps Console test", "Pending"],
      ["Live Spawn contention test", "Pending"],
      ["Last verified", "July 25, 2026"],
    ],
    toc: [
      ["quick-answer", "Quick answer"],
      ["five-checks", "The five checks to run first"],
      ["basic-call", "The basic spawnCreep() call"],
      ["body-validation", "Validate a 1–50 part body"],
      ["body-cost", "Calculate body cost from official constants"],
      ["name-validation", "Validate the Creep name"],
      ["dry-run", "What dryRun can and cannot prove"],
      ["safe-submit", "Complete safe submission helper"],
      ["return-codes", "Return-code table"],
      ["energy-structures", "When to use energyStructures"],
      ["debugging", "Debugging checklist"],
      ["scope", "Scope and next steps"],
      ["faq", "FAQ"],
      ["official-docs", "Official documentation"],
    ],
    faq: [
      [
        "Does dryRun: true start spawning a Creep?",
        "No. It checks whether the request is currently valid but does not begin the spawning process.",
      ],
      [
        "Why can the real spawnCreep() call fail after dryRun returned OK?",
        "Another module can use the Spawn, reserve the same name, or change available Energy later in the same tick. Save both results.",
      ],
      [
        "Does room.energyAvailable include Storage or Container Energy?",
        "No. It represents current Energy in the room's Spawns and Extensions.",
      ],
      [
        "Can spawnCreep() return ERR_NOT_IN_RANGE?",
        "No. The documented return codes concern ownership, duplicate names, Spawn availability, Energy, arguments, and RCL availability.",
      ],
    ],
    previous: {
      href: "/en/blog/screeps-clean-dead-creep-memory",
      label: "Previous foundation guide",
      title: "Clean Dead Creep Memory",
    },
    next: {
      href: "/en/blog/screeps-dynamic-creep-body",
      label: "Next spawning guide",
      title: "Build a Dynamic Creep Body",
    },
    articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>When <code>StructureSpawn.spawnCreep()</code> fails, save the return value instead of immediately repeating the call. Check five areas in order: the Spawn, the requested name, the body, currently available Spawn-and-Extension Energy, and the options object. Use <code>dryRun: true</code> for a non-mutating precheck, then save the real call's result separately because current conditions can still change later in the tick.</p>

<h2 id="five-checks">The five checks to run first</h2>
<ol>
<li>The Spawn exists, belongs to you, is active, and is not already spawning.</li>
<li>The requested name is a non-empty string of at most 100 characters and is not already present.</li>
<li>The body is an array containing 1–50 official body-part constants.</li>
<li>The room currently has enough Energy in its Spawns and Extensions.</li>
<li><code>memory</code>, <code>energyStructures</code>, and <code>directions</code> match the API contract.</li>
</ol>
<p>This article is a debugging companion to <a href="/en/blog/screeps-spawn-creep">the beginner spawnCreep() tutorial</a>. It does not repeat the first-Creep walkthrough.</p>

<h2 id="basic-call">The basic spawnCreep() call</h2>
<pre><code class="language-javascript">const result = Game.spawns.Spawn1.spawnCreep(
  [WORK, CARRY, MOVE],
  'Worker1',
  {
    memory: {
      role: 'worker'
    }
  }
);

console.log('spawnCreep() returned ' + result);</code></pre>
<p><code>OK</code> means the spawning process was accepted. It does not mean the Creep is complete in the current tick. Read <code>spawn.spawning</code> and later ticks to observe progress.</p>

<h2 id="body-validation">Validate a 1–50 part body</h2>
<p>The current official API accepts the eight regular body-part constants and requires 1–50 elements:</p>
<pre><code class="language-javascript">const BODY_PARTS = new Set([
  WORK,
  MOVE,
  CARRY,
  ATTACK,
  RANGED_ATTACK,
  HEAL,
  TOUGH,
  CLAIM
]);

function validateBody(body) {
  if (!Array.isArray(body)) {
    return {
      valid: false,
      reason: 'body-not-array'
    };
  }

  if (body.length < 1 || body.length > 50) {
    return {
      valid: false,
      reason: 'body-length-invalid'
    };
  }

  for (const part of body) {
    if (!BODY_PARTS.has(part)) {
      return {
        valid: false,
        reason: 'unknown-body-part'
      };
    }
  }

  return {
    valid: true,
    reason: 'ready'
  };
}</code></pre>
<p>A body that is syntactically valid may still be unsuitable for its role. Use <a href="/en/blog/screeps-creep-body-parts">the body-parts guide</a> for ability design.</p>

<h2 id="body-cost">Calculate body cost from official constants</h2>
<pre><code class="language-javascript">function getBodyCost(body) {
  return body.reduce((total, part) => {
    const cost = BODYPART_COST[part];

    if (!Number.isFinite(cost)) {
      throw new TypeError(
        'Unknown body part: ' + String(part)
      );
    }

    return total + cost;
  }, 0);
}</code></pre>
<p>Compare the result with <code>spawn.room.energyAvailable</code>. That property is the current Energy in all Spawns and Extensions in the room. It does not include Storage, Terminal, Link, or Container inventory.</p>

<h2 id="name-validation">Validate the Creep name</h2>
<pre><code class="language-javascript">function validateCreepName(name) {
  if (typeof name !== 'string') {
    return {
      valid: false,
      reason: 'name-not-string'
    };
  }

  if (name.length < 1 || name.length > 100) {
    return {
      valid: false,
      reason: 'name-length-invalid'
    };
  }

  if (Game.creeps[name]) {
    return {
      valid: false,
      reason: 'name-exists'
    };
  }

  return {
    valid: true,
    reason: 'ready'
  };
}</code></pre>
<p>This precheck improves diagnostics but does not replace handling <code>ERR_NAME_EXISTS</code>. Another module can submit the same name later in the same tick.</p>

<h2 id="dry-run">What dryRun can and cannot prove</h2>
<pre><code class="language-javascript">const dryRunResult = spawn.spawnCreep(
  body,
  name,
  {
    memory,
    dryRun: true
  }
);</code></pre>
<p>A dry run checks the current request without starting the Spawn. It can reveal a busy Spawn, duplicate name, insufficient Energy, malformed body or name, ownership problems, and RCL restrictions. It is not a lock. Code that runs afterward can still consume the Spawn, use the name, or change the Energy state.</p>

<h2 id="safe-submit">Complete safe submission helper</h2>
<p><strong>State impact:</strong> local validation and the dry run do not mutate the game. The final <code>spawnCreep()</code> call can reserve Energy and start spawning one Creep.</p>
<pre><code class="language-javascript">const BODY_PARTS = new Set([
  WORK,
  MOVE,
  CARRY,
  ATTACK,
  RANGED_ATTACK,
  HEAL,
  TOUGH,
  CLAIM
]);

function getBodyCost(body) {
  return body.reduce((total, part) => {
    const cost = BODYPART_COST[part];

    if (!Number.isFinite(cost)) {
      throw new TypeError(
        'Unknown body part: ' + String(part)
      );
    }

    return total + cost;
  }, 0);
}

function validateSpawnRequest(input) {
  const { spawn, body, name, memory } = input;

  if (!spawn) {
    return { valid: false, reason: 'spawn-missing' };
  }

  if (spawn.spawning) {
    return { valid: false, reason: 'spawn-busy' };
  }

  if (
    typeof name !== 'string'
    || name.length < 1
    || name.length > 100
  ) {
    return { valid: false, reason: 'name-invalid' };
  }

  if (Game.creeps[name]) {
    return { valid: false, reason: 'name-exists' };
  }

  if (
    !Array.isArray(body)
    || body.length < 1
    || body.length > 50
    || body.some(part => !BODY_PARTS.has(part))
  ) {
    return { valid: false, reason: 'body-invalid' };
  }

  if (
    memory !== undefined
    && (
      !memory
      || typeof memory !== 'object'
      || Array.isArray(memory)
    )
  ) {
    return { valid: false, reason: 'memory-invalid' };
  }

  const bodyCost = getBodyCost(body);

  if (spawn.room.energyAvailable < bodyCost) {
    return {
      valid: false,
      reason: 'energy-not-enough',
      bodyCost,
      energyAvailable: spawn.room.energyAvailable
    };
  }

  return {
    valid: true,
    reason: 'ready',
    bodyCost,
    energyAvailable: spawn.room.energyAvailable
  };
}

function submitSpawnRequest(input) {
  const validation = validateSpawnRequest(input);

  if (!validation.valid) {
    return {
      status: 'local-validation-failed',
      ...validation
    };
  }

  const { spawn, body, name, memory, directions } = input;
  const dryOptions = {
    memory,
    dryRun: true
  };

  if (Array.isArray(directions)) {
    dryOptions.directions = directions;
  }

  const dryRunResult = spawn.spawnCreep(
    body,
    name,
    dryOptions
  );

  if (dryRunResult !== OK) {
    return {
      status: 'dry-run-failed',
      dryRunResult,
      ...validation
    };
  }

  const actualOptions = { memory };

  if (Array.isArray(directions)) {
    actualOptions.directions = directions;
  }

  const result = spawn.spawnCreep(
    body,
    name,
    actualOptions
  );

  return {
    status: result === OK
      ? 'spawn-submitted'
      : 'spawn-failed-after-dry-run',
    dryRunResult,
    result,
    ...validation
  };
}

module.exports.loop = function () {
  const spawn = Game.spawns.Spawn1;
  const desiredName = 'Worker1';

  if (Game.creeps[desiredName]) {
    return;
  }

  const outcome = submitSpawnRequest({
    spawn,
    body: [WORK, CARRY, MOVE],
    name: desiredName,
    memory: {
      role: 'worker',
      memoryVersion: 1
    },
    directions: [TOP, RIGHT, BOTTOM, LEFT]
  });

  if (outcome.status !== 'spawn-submitted') {
    console.log(JSON.stringify({
      type: 'spawn-request-failed',
      spawnName: spawn?.name ?? null,
      creepName: desiredName,
      ...outcome
    }));
  }
};</code></pre>

<h2 id="return-codes">Return-code table</h2>
<div class="table-scroll"><table>
<thead><tr><th>Code</th><th>Likely cause</th><th>Next check</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>The Spawn accepted the request.</td><td>Inspect <code>spawn.spawning</code> on later ticks.</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>The Spawn is not yours.</td><td>Check ownership and selected object.</td></tr>
<tr><td><code>ERR_NAME_EXISTS</code></td><td>The name is already used.</td><td>Inspect <code>Game.creeps</code> and your naming strategy.</td></tr>
<tr><td><code>ERR_BUSY</code></td><td>The Spawn is already spawning.</td><td>Coordinate all spawn callers.</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_ENERGY</code></td><td>Spawn and Extension Energy is insufficient.</td><td>Compare body cost with current <code>energyAvailable</code>.</td></tr>
<tr><td><code>ERR_INVALID_ARGS</code></td><td>Body, name, directions, or options are malformed.</td><td>Validate each argument independently.</td></tr>
<tr><td><code>ERR_RCL_NOT_ENOUGH</code></td><td>The Spawn is not active at the current RCL.</td><td>Check Controller ownership, level, and <code>spawn.isActive()</code>.</td></tr>
</tbody></table></div>

<h2 id="energy-structures">When to use energyStructures</h2>
<p>By default, the method draws from Spawns and Extensions in the room. An explicit list controls which eligible structures are used and in what order:</p>
<pre><code class="language-javascript">const energyStructures = [
  spawn,
  ...spawn.room.find(FIND_MY_STRUCTURES, {
    filter: structure =>
      structure.structureType === STRUCTURE_EXTENSION
  })
];

const result = spawn.spawnCreep(
  body,
  name,
  {
    memory,
    energyStructures
  }
);</code></pre>
<p>Do not include Storage or Containers. The option accepts Spawns and Extensions used for the spawning process.</p>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Save the local validation, dry-run result, and final result separately.</li>
<li>Confirm the Spawn exists, is yours, is active, and is idle.</li>
<li>Validate body array length and every body-part constant.</li>
<li>Compute cost from <code>BODYPART_COST</code>.</li>
<li>Compare cost with current <code>room.energyAvailable</code>.</li>
<li>Validate name type, length, and uniqueness.</li>
<li>Use a plain object for initial Memory.</li>
<li>Validate optional directions and energy structures.</li>
<li>Coordinate all code that can call the same Spawn.</li>
<li>Use <a href="/en/screeps-errors">the error-code reference</a> for shared constants.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not design quotas, replacement timing, role priorities, multi-Spawn scheduling, boost plans, or automatic names for a large colony. Continue with <a href="/en/blog/screeps-dynamic-creep-body">building a body from current Energy</a>.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Does dryRun start spawning?</h3>
<p>No. It only checks the current request.</p>
<h3>Why can the real call fail after a successful dry run?</h3>
<p>Another caller can use the Spawn, name, or Energy later in the tick.</p>
<h3>Does energyAvailable include Storage?</h3>
<p>No. It represents current Energy in the room's Spawns and Extensions.</p>
<h3>Can spawnCreep() return ERR_NOT_IN_RANGE?</h3>
<p>No. That code is not part of the documented return set for this method.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#StructureSpawn.spawnCreep" rel="nofollow">API Reference: StructureSpawn.spawnCreep()</a></li>
<li><a href="https://docs.screeps.com/api/#Room.energyAvailable" rel="nofollow">API Reference: Room.energyAvailable</a></li>
<li><a href="https://docs.screeps.com/api/#Room.energyCapacityAvailable" rel="nofollow">API Reference: Room.energyCapacityAvailable</a></li>
<li><a href="https://docs.screeps.com/creeps.html" rel="nofollow">Screeps Documentation: Creeps and body parts</a></li>
<li><a href="https://docs.screeps.com/debugging.html" rel="nofollow">Screeps Documentation: Debugging</a></li>
</ul>`,
  },
  {
    slug: "screeps-dynamic-creep-body",
    path: "/en/blog/screeps-dynamic-creep-body",
    chinesePath: "/blog/screeps-dynamic-creep-body-energy",
    title: "Screeps Dynamic Creep Body: Build from Available Energy",
    headline: "How to Build a Screeps Creep Body from Available Energy",
    description:
      "Distinguish current Energy from room capacity, repeat a role-specific body unit, enforce the 50-part limit, calculate cost and spawn time, and decide when to spawn a smaller emergency body.",
    category: "SPAWNING · DYNAMIC BODY DESIGN",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    readingTime: "15 min read",
    breadcrumbLabel: "Dynamic Creep Body",
    tags: ["Screeps", "Spawn", "Creep Body", "Energy", "Automation"],
    keywords: [
      "Screeps dynamic Creep body",
      "build Creep body from energyAvailable",
      "Screeps 50 body part limit",
      "CREEP_SPAWN_TIME",
      "Screeps body cost calculator code",
    ],
    primaryKeyword: "Screeps dynamic Creep body",
    searchIntent: "Body-generation algorithm and current-Energy strategy",
    finalScore: 98,
    verification: [
      ["Chinese source article", "Reviewed in full"],
      ["Official docs", "Checked — Room Energy fields, 50-part maximum, BODYPART_COST, CREEP_SPAWN_TIME"],
      ["Policy boundary", "Body builder chooses a valid body; spawn timing remains a separate decision"],
      ["JavaScript syntax", "Passed"],
      ["Offline calculation review", "Passed — 0, 199, 200, 550, 3200 and high-Energy inputs"],
      ["Screeps Console test", "Pending"],
      ["Live replacement-cycle test", "Pending"],
      ["Last verified", "July 25, 2026"],
    ],
    toc: [
      ["quick-answer", "Quick answer"],
      ["available-vs-capacity", "energyAvailable versus energyCapacityAvailable"],
      ["worker-unit", "Define one role-specific body unit"],
      ["part-limit", "Why the example stops at 16 units"],
      ["pure-builder", "Pure repeated-body builder"],
      ["spawn-time", "Calculate spawn time"],
      ["body-order", "Body order changes damage behavior"],
      ["complete-example", "Complete dynamic spawn example"],
      ["role-cap", "Set a role-specific maximum"],
      ["when-to-wait", "When to spawn now or wait"],
      ["return-codes", "Return-code checks"],
      ["debugging", "Debugging checklist"],
      ["scope", "Scope and next steps"],
      ["faq", "FAQ"],
      ["official-docs", "Official documentation"],
    ],
    faq: [
      [
        "What is the difference between energyAvailable and energyCapacityAvailable?",
        "energyAvailable is current loaded Energy in Spawns and Extensions. energyCapacityAvailable is their total capacity and does not mean the Energy is currently present.",
      ],
      [
        "Why can a repeated three-part unit appear at most 16 times?",
        "Sixteen units use 48 parts. Seventeen use 51 parts, which exceeds the 50-part body limit.",
      ],
      [
        "Should a dynamic body spend every available Energy unit?",
        "No. It should preserve a valid role capability and respect part and role limits. Leftover Energy is normal.",
      ],
      [
        "Does the body-building function decide when to spawn?",
        "No. It creates a valid plan. Emergency priority, replacement timing, and whether to wait for more Energy are separate policies.",
      ],
    ],
    previous: {
      href: "/en/blog/screeps-spawncreep-return-codes",
      label: "Previous spawning guide",
      title: "Debug spawnCreep() Return Codes",
    },
    next: {
      href: "/en/blog/screeps-emergency-harvester-recovery",
      label: "Next spawning guide",
      title: "Recover a Room with No Harvesters",
    },
    articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>A dynamic body should not simply spend every available Energy unit. Start with a role-specific minimum unit, calculate its cost from <code>BODYPART_COST</code>, repeat it only while current <code>room.energyAvailable</code> and the 50-part limit permit, and apply a role-specific maximum. Keep the body-planning function separate from the decision to spawn now or wait for more Energy.</p>

<h2 id="available-vs-capacity">energyAvailable versus energyCapacityAvailable</h2>
<div class="table-scroll"><table>
<thead><tr><th>Property</th><th>Meaning</th><th>Typical policy</th></tr></thead>
<tbody>
<tr><td><code>room.energyAvailable</code></td><td>Energy currently loaded in all room Spawns and Extensions.</td><td>Spawn the best affordable body now.</td></tr>
<tr><td><code>room.energyCapacityAvailable</code></td><td>Total capacity of those Spawns and Extensions.</td><td>Wait until enough Energy is loaded for the desired body.</td></tr>
</tbody></table></div>
<p>This example uses current <code>energyAvailable</code>, which is useful for emergency or degraded spawning. A normal replacement system may prefer to wait when current workers still have enough lifetime.</p>

<h2 id="worker-unit">Define one role-specific body unit</h2>
<pre><code class="language-javascript">const WORKER_UNIT = [WORK, CARRY, MOVE];

function getBodyCost(body) {
  return body.reduce((total, part) => {
    const cost = BODYPART_COST[part];

    if (!Number.isFinite(cost)) {
      throw new TypeError(
        'Unknown body part: ' + String(part)
      );
    }

    return total + cost;
  }, 0);
}</code></pre>
<p>The unit costs 200 Energy using current official constants. The code derives that value instead of scattering the number across multiple branches.</p>

<h2 id="part-limit">Why the example stops at 16 units</h2>
<pre><code class="language-text">16 units × 3 parts = 48 parts
17 units × 3 parts = 51 parts</code></pre>
<p>A regular Creep body can contain at most 50 parts. Therefore this three-part pattern can repeat at most 16 times, even when the room can afford more.</p>

<h2 id="pure-builder">Pure repeated-body builder</h2>
<pre><code class="language-javascript">function buildRepeatedBody(input) {
  const {
    energyAvailable,
    unit,
    maximumParts = 50,
    maximumUnits = Infinity
  } = input;

  if (
    !Number.isFinite(energyAvailable)
    || energyAvailable < 0
    || !Array.isArray(unit)
    || unit.length === 0
    || !Number.isInteger(maximumParts)
    || maximumParts < 1
    || !Number.isFinite(maximumUnits)
    || maximumUnits < 0
  ) {
    return {
      valid: false,
      reason: 'invalid-input',
      body: []
    };
  }

  const unitCost = getBodyCost(unit);
  const unitsByEnergy = Math.floor(
    energyAvailable / unitCost
  );
  const unitsByParts = Math.floor(
    maximumParts / unit.length
  );
  const units = Math.max(
    0,
    Math.min(
      unitsByEnergy,
      unitsByParts,
      Math.floor(maximumUnits)
    )
  );
  const body = [];

  for (let index = 0; index < units; index += 1) {
    body.push(...unit);
  }

  return {
    valid: true,
    reason: body.length > 0
      ? 'ready'
      : 'energy-below-minimum',
    body,
    units,
    unitCost,
    bodyCost: units * unitCost,
    spawnTime: body.length * CREEP_SPAWN_TIME
  };
}</code></pre>
<p>The function uses only input values and official constants. That makes boundary tests independent of a live room.</p>

<h2 id="spawn-time">Calculate spawn time</h2>
<p><code>CREEP_SPAWN_TIME</code> is the base number of ticks per body part. The plan reports:</p>
<pre><code class="language-javascript">const spawnTime = body.length * CREEP_SPAWN_TIME;</code></pre>
<p>A 48-part Creep occupies a Spawn much longer than a three-part Creep. Larger bodies therefore require earlier replacement scheduling.</p>

<h2 id="body-order">Body order changes damage behavior</h2>
<p>These bodies have equal cost and part counts:</p>
<pre><code class="language-javascript">[WORK, CARRY, MOVE, WORK, CARRY, MOVE]

[WORK, WORK, CARRY, CARRY, MOVE, MOVE]</code></pre>
<p>They do not lose abilities in the same order when damaged because earlier parts absorb damage first. Repeating a unit preserves a visible ratio but is not universally optimal. Haulers, fixed miners, upgraders, and combat Creeps need different ordering rules.</p>

<h2 id="complete-example">Complete dynamic spawn example</h2>
<p><strong>State impact:</strong> the planning functions do not mutate the game. The final call may start one Worker when no current Worker exists and the Spawn is idle.</p>
<pre><code class="language-javascript">const WORKER_UNIT = [WORK, CARRY, MOVE];

function getBodyCost(body) {
  return body.reduce((total, part) => {
    const cost = BODYPART_COST[part];

    if (!Number.isFinite(cost)) {
      throw new TypeError(
        'Unknown body part: ' + String(part)
      );
    }

    return total + cost;
  }, 0);
}

function buildRepeatedBody(input) {
  const {
    energyAvailable,
    unit,
    maximumParts = 50,
    maximumUnits = Infinity
  } = input;

  if (
    !Number.isFinite(energyAvailable)
    || energyAvailable < 0
    || !Array.isArray(unit)
    || unit.length === 0
  ) {
    return {
      valid: false,
      reason: 'invalid-input',
      body: []
    };
  }

  const unitCost = getBodyCost(unit);
  const units = Math.max(
    0,
    Math.min(
      Math.floor(energyAvailable / unitCost),
      Math.floor(maximumParts / unit.length),
      Math.floor(maximumUnits)
    )
  );
  const body = [];

  for (let index = 0; index < units; index += 1) {
    body.push(...unit);
  }

  return {
    valid: true,
    reason: body.length > 0
      ? 'ready'
      : 'energy-below-minimum',
    body,
    units,
    unitCost,
    bodyCost: units * unitCost,
    spawnTime: body.length * CREEP_SPAWN_TIME
  };
}

function createUniqueName(spawn, role) {
  return [role, spawn.name, Game.time].join('-');
}

module.exports.loop = function () {
  const spawn = Game.spawns.Spawn1;

  if (!spawn || spawn.spawning) {
    return;
  }

  const existingWorkers = Object.values(Game.creeps)
    .filter(creep =>
      creep.memory?.role === 'worker'
    );

  if (existingWorkers.length > 0) {
    return;
  }

  const plan = buildRepeatedBody({
    energyAvailable: spawn.room.energyAvailable,
    unit: WORKER_UNIT,
    maximumParts: 50,
    maximumUnits: 5
  });

  if (!plan.valid || plan.body.length === 0) {
    return;
  }

  const name = createUniqueName(spawn, 'Worker');
  const memory = {
    role: 'worker',
    bodyUnits: plan.units,
    memoryVersion: 1
  };
  const dryRunResult = spawn.spawnCreep(
    plan.body,
    name,
    {
      memory,
      dryRun: true
    }
  );

  if (dryRunResult !== OK) {
    console.log(JSON.stringify({
      type: 'dynamic-body-dry-run-failed',
      spawnName: spawn.name,
      name,
      dryRunResult,
      plan
    }));
    return;
  }

  const result = spawn.spawnCreep(
    plan.body,
    name,
    { memory }
  );

  if (result !== OK) {
    console.log(JSON.stringify({
      type: 'dynamic-body-spawn-failed',
      spawnName: spawn.name,
      name,
      result,
      plan
    }));
  }
};</code></pre>

<h2 id="role-cap">Set a role-specific maximum</h2>
<p>A room that can afford 48 parts does not necessarily need one 48-part general Worker. Use a project value such as:</p>
<pre><code class="language-javascript">maximumUnits: 5</code></pre>
<p>Reasons include spawn time, movement speed, parallelism, the need to reserve Energy for other roles, and task throughput. This maximum is a project policy, not an official Screeps value.</p>

<h2 id="when-to-wait">When to spawn now or wait</h2>
<ul>
<li>No harvesters remain: spawn the minimum viable recovery body now.</li>
<li>A Builder quota is slightly low: waiting for a larger body may be reasonable.</li>
<li>Defense is urgent: use a current-Energy fallback plan.</li>
<li>Existing workers have long lifetime: wait for the desired capacity.</li>
</ul>
<p>The body builder answers “what can I afford?” It does not answer “should I spawn this tick?”</p>

<h2 id="return-codes">Return-code checks</h2>
<p>Handle <code>ERR_BUSY</code>, <code>ERR_NAME_EXISTS</code>, <code>ERR_NOT_ENOUGH_ENERGY</code>, <code>ERR_INVALID_ARGS</code>, <code>ERR_NOT_OWNER</code>, and <code>ERR_RCL_NOT_ENOUGH</code>. <code>spawnCreep()</code> does not return <code>ERR_NOT_IN_RANGE</code>. Use <a href="/en/blog/screeps-spawncreep-return-codes">the focused return-code guide</a> for full diagnostics.</p>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Choose between current Energy and waiting for capacity deliberately.</li>
<li>Define a minimum body that can perform the role.</li>
<li>Calculate cost from <code>BODYPART_COST</code>.</li>
<li>Enforce the 50-part limit.</li>
<li>Set a role-specific maximum.</li>
<li>Report body cost, unit count, and spawn time.</li>
<li>Consider body ordering under damage.</li>
<li>Keep body planning separate from spawn timing.</li>
<li>Use dryRun before the real request.</li>
<li>Save the final return code.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This article does not optimize specialized miners, haulers, combat bodies, boosts, road movement, lifetime replacement lead time, or multi-Spawn queues. Continue with <a href="/en/blog/screeps-emergency-harvester-recovery">emergency recovery when no harvester remains</a>.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>What is energyAvailable versus energyCapacityAvailable?</h3>
<p>The first is current loaded Energy; the second is total room spawning capacity.</p>
<h3>Why only 16 three-part units?</h3>
<p>Sixteen use 48 parts. Seventeen would use 51 and exceed the limit.</p>
<h3>Should the body spend every Energy unit?</h3>
<p>No. Valid role capability and configured limits matter more than eliminating every remainder.</p>
<h3>Does this function decide when to spawn?</h3>
<p>No. It produces a plan; room policy decides whether to use it now.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Room.energyAvailable" rel="nofollow">API Reference: Room.energyAvailable</a></li>
<li><a href="https://docs.screeps.com/api/#Room.energyCapacityAvailable" rel="nofollow">API Reference: Room.energyCapacityAvailable</a></li>
<li><a href="https://docs.screeps.com/api/#StructureSpawn.spawnCreep" rel="nofollow">API Reference: StructureSpawn.spawnCreep()</a></li>
<li><a href="https://docs.screeps.com/creeps.html" rel="nofollow">Screeps Documentation: Creep body design</a></li>
</ul>`,
  },
  {
    slug: "screeps-emergency-harvester-recovery",
    path: "/en/blog/screeps-emergency-harvester-recovery",
    chinesePath: "/blog/screeps-spawn-emergency-recovery",
    title: "Screeps Emergency Recovery: Spawn a Harvester After Collapse",
    headline: "How to Recover a Screeps Room with No Harvesters",
    description:
      "Count current live harvesters, choose one idle active Spawn, require a minimum WORK-CARRY-MOVE body, use a unique name and dryRun, and prevent multiple Spawns from submitting duplicate recovery requests.",
    category: "SPAWNING · EMERGENCY RECOVERY",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    readingTime: "16 min read",
    breadcrumbLabel: "Emergency Harvester Recovery",
    tags: ["Screeps", "Spawn", "Harvester", "Recovery", "Room Economy"],
    keywords: [
      "Screeps no harvester recovery",
      "Screeps emergency harvester",
      "recover room with no creeps",
      "Screeps Spawn 200 energy recovery",
      "Screeps colony collapse code",
    ],
    primaryKeyword: "Screeps no harvester recovery",
    searchIntent: "Emergency room recovery after the last harvester dies",
    finalScore: 98,
    verification: [
      ["Chinese source article", "Reviewed in full"],
      ["Official docs", "Checked — spawnCreep(), current room Energy, initial Spawn safety refill"],
      ["Safety boundary", "Initial Spawn 1-Energy refill is special and not assumed for ordinary rooms"],
      ["JavaScript syntax", "Passed"],
      ["Offline recovery review", "Passed — missing room, no Spawn, busy Spawns, existing harvester, low Energy, one submission"],
      ["Screeps Console test", "Pending"],
      ["Live colony-collapse recovery", "Pending"],
      ["Last verified", "July 25, 2026"],
    ],
    toc: [
      ["quick-answer", "Quick answer"],
      ["priority-order", "Run emergency recovery before normal spawning"],
      ["live-count", "Count current live harvesters"],
      ["minimum-body", "Use a minimum viable body"],
      ["one-spawn", "Choose only one Spawn"],
      ["unique-name", "Create a unique recovery name"],
      ["complete-example", "Complete emergency recovery example"],
      ["dry-run", "Why the real result still matters after dryRun"],
      ["below-minimum", "What happens below 200 Energy"],
      ["initial-spawn", "The special initial Spawn safety refill"],
      ["debugging", "Debugging checklist"],
      ["scope", "Scope and next steps"],
      ["faq", "FAQ"],
      ["official-docs", "Official documentation"],
    ],
    faq: [
      [
        "Why should emergency recovery run before normal spawn priorities?",
        "Normal logic may wait for a large body or another role. With no harvester, restoring minimum Energy income must take priority.",
      ],
      [
        "Why count Game.creeps instead of Memory.creeps?",
        "Game.creeps contains current Creeps. Memory.creeps can still contain names of dead Creeps until cleanup.",
      ],
      [
        "Why select only one Spawn in a multi-Spawn room?",
        "Every idle Spawn can see the same zero-harvester condition during the tick. A stable single choice prevents duplicate recovery requests.",
      ],
      [
        "Will every empty room regenerate enough Spawn Energy automatically?",
        "No. The documented one-Energy-per-tick safety refill applies to an initial Spawn and stops when room Spawn-and-Extension Energy reaches 300. Do not assume it for an ordinary established room.",
      ],
    ],
    previous: {
      href: "/en/blog/screeps-dynamic-creep-body",
      label: "Previous spawning guide",
      title: "Build a Dynamic Creep Body",
    },
    next: null,
    articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>When an owned room has no live harvesters, run a narrow emergency branch before normal replacement logic. Count current Creeps, choose one active idle Spawn, require enough current Energy for <code>[WORK, CARRY, MOVE]</code>, generate a unique name, run <code>dryRun</code>, and submit exactly one real request. Do not let every Spawn independently react to the same zero-harvester condition.</p>

<h2 id="priority-order">Run emergency recovery before normal spawning</h2>
<pre><code class="language-text">Clean dead Creep Memory
→ count current live roles
→ run emergency recovery
→ if no Spawn was used, run normal spawning</code></pre>
<p>Normal spawning may wait for a larger harvester, Builder, Upgrader, hauler, or full <code>energyCapacityAvailable</code>. When Energy income has collapsed, those goals must yield to restoring the minimum harvesting loop.</p>

<h2 id="live-count">Count current live harvesters</h2>
<pre><code class="language-javascript">function countLiveCreepsByRole(role, roomName) {
  return Object.values(Game.creeps)
    .filter(creep =>
      creep.memory?.role === role
      && (
        creep.memory?.homeRoom === roomName
        || creep.room.name === roomName
      )
    )
    .length;
}</code></pre>
<p>Do not count only <code>Memory.creeps</code>; stale names may remain after death. See <a href="/en/blog/screeps-clean-dead-creep-memory">the cleanup guide</a>. A larger system should also account for a harvester already being spawned so another Spawn does not submit a duplicate.</p>

<h2 id="minimum-body">Use a minimum viable body</h2>
<pre><code class="language-javascript">const EMERGENCY_BODY = [WORK, CARRY, MOVE];

function getBodyCost(body) {
  return body.reduce((total, part) => {
    const cost = BODYPART_COST[part];

    if (!Number.isFinite(cost)) {
      throw new TypeError(
        'Unknown body part: ' + String(part)
      );
    }

    return total + cost;
  }, 0);
}</code></pre>
<p>The current constants make this a 200-Energy body that can harvest, carry, and move. Deriving the threshold from the body keeps the check correct when the body changes.</p>

<h2 id="one-spawn">Choose only one Spawn</h2>
<p>This pattern is unsafe in a multi-Spawn room:</p>
<pre><code class="language-javascript">for (const spawn of Object.values(Game.spawns)) {
  if (harvesterCount === 0) {
    spawn.spawnCreep(body, name);
  }
}</code></pre>
<p>Each Spawn can see the same zero count. Select one active idle Spawn in a stable order:</p>
<pre><code class="language-javascript">function selectEmergencySpawn(room) {
  return room.find(FIND_MY_SPAWNS)
    .filter(spawn =>
      spawn.my === true
      && spawn.isActive()
      && !spawn.spawning
    )
    .sort((left, right) =>
      left.name.localeCompare(right.name)
    )[0] ?? null;
}</code></pre>
<p>Name sorting is a deterministic tie-breaker, not a universal business priority.</p>

<h2 id="unique-name">Create a unique recovery name</h2>
<pre><code class="language-javascript">function createEmergencyName(room, spawn) {
  return [
    'EmergencyHarvester',
    room.name,
    spawn.name,
    Game.time
  ].join('-');
}</code></pre>
<p>A unique name avoids obvious collisions but does not replace centralized Spawn coordination. Two independent modules should not both submit the same recovery role.</p>

<h2 id="complete-example">Complete emergency recovery example</h2>
<p><strong>State impact:</strong> this script can start one minimum harvester in an owned room. Replace <code>W1N1</code> with the real room name. It returns immediately after a successful emergency submission so normal spawning cannot use another Spawn in the same branch.</p>
<pre><code class="language-javascript">const EMERGENCY_BODY = [WORK, CARRY, MOVE];

function getBodyCost(body) {
  return body.reduce((total, part) => {
    const cost = BODYPART_COST[part];

    if (!Number.isFinite(cost)) {
      throw new TypeError(
        'Unknown body part: ' + String(part)
      );
    }

    return total + cost;
  }, 0);
}

function countLiveCreepsByRole(role, roomName) {
  return Object.values(Game.creeps)
    .filter(creep =>
      creep.memory?.role === role
      && (
        creep.memory?.homeRoom === roomName
        || creep.room.name === roomName
      )
    )
    .length;
}

function selectEmergencySpawn(room) {
  return room.find(FIND_MY_SPAWNS)
    .filter(spawn =>
      spawn.my === true
      && spawn.isActive()
      && !spawn.spawning
    )
    .sort((left, right) =>
      left.name.localeCompare(right.name)
    )[0] ?? null;
}

function createEmergencyName(room, spawn) {
  return [
    'EmergencyHarvester',
    room.name,
    spawn.name,
    Game.time
  ].join('-');
}

function runEmergencyRecovery(room) {
  if (!room?.controller?.my) {
    return {
      status: 'owned-room-unavailable'
    };
  }

  const harvesterCount = countLiveCreepsByRole(
    'harvester',
    room.name
  );

  if (harvesterCount > 0) {
    return {
      status: 'harvester-exists',
      harvesterCount
    };
  }

  const spawn = selectEmergencySpawn(room);

  if (!spawn) {
    return {
      status: 'spawn-unavailable'
    };
  }

  const minimumCost = getBodyCost(EMERGENCY_BODY);

  if (room.energyAvailable < minimumCost) {
    return {
      status: 'energy-not-enough',
      energyAvailable: room.energyAvailable,
      minimumCost
    };
  }

  const name = createEmergencyName(room, spawn);
  const memory = {
    role: 'harvester',
    homeRoom: room.name,
    emergency: true,
    memoryVersion: 1
  };
  const dryRunResult = spawn.spawnCreep(
    EMERGENCY_BODY,
    name,
    {
      memory,
      dryRun: true
    }
  );

  if (dryRunResult !== OK) {
    return {
      status: 'dry-run-failed',
      spawnName: spawn.name,
      name,
      dryRunResult
    };
  }

  const result = spawn.spawnCreep(
    EMERGENCY_BODY,
    name,
    { memory }
  );

  return {
    status: result === OK
      ? 'emergency-spawn-submitted'
      : 'emergency-spawn-failed',
    spawnName: spawn.name,
    name,
    minimumCost,
    dryRunResult,
    result
  };
}

module.exports.loop = function () {
  const room = Game.rooms.W1N1;

  if (!room) {
    return;
  }

  const outcome = runEmergencyRecovery(room);

  if (
    outcome.status === 'dry-run-failed'
    || outcome.status === 'emergency-spawn-failed'
  ) {
    console.log(JSON.stringify({
      type: 'emergency-recovery-failed',
      roomName: room.name,
      ...outcome
    }));
  }

  if (outcome.status === 'emergency-spawn-submitted') {
    return;
  }

  // Continue normal spawning only when the
  // emergency branch did not use a Spawn.
};</code></pre>

<h2 id="dry-run">Why the real result still matters after dryRun</h2>
<p>A dry run does not start spawning. Another module can use the selected Spawn, consume Energy, or submit a conflicting name afterward. The real <code>spawnCreep()</code> result remains the final result for that request.</p>

<h2 id="below-minimum">What happens below 200 Energy</h2>
<p>An ordinary owned room with no harvesting workforce and less than the minimum body's current cost cannot create that body from nothing. Recovery may require a surviving hauler, support from another room, manual task reassignment, or ultimately a respawn decision.</p>

<h2 id="initial-spawn">The special initial Spawn safety refill</h2>
<p>Official respawn documentation describes a special safety rule for an initial Spawn: it starts with 300 Energy and receives 1 Energy per tick until the room's Spawns and Extensions together hold 300. This is an initial-Spawn protection mechanism. Do not assume that every established room or reconstructed Spawn will regenerate Energy this way.</p>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Clean stale Creep Memory before role counts.</li>
<li>Count current live Creeps in the intended room.</li>
<li>Run emergency recovery before normal role priorities.</li>
<li>Use a minimum body with the required abilities.</li>
<li>Calculate its cost from <code>BODYPART_COST</code>.</li>
<li>Select one active idle Spawn only.</li>
<li>Generate a unique bounded name.</li>
<li>Save dryRun and final results separately.</li>
<li>Return after a successful emergency submission.</li>
<li>Do not generalize the initial Spawn safety refill.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This article does not implement cross-room aid, Spawn queues, transporting Energy into a collapsed room, detecting a harvester currently in production, replacement lifetime prediction, or respawn automation. Those systems require a broader colony scheduler.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Why run emergency recovery first?</h3>
<p>Normal priorities may wait for larger bodies or less urgent roles while the room has no Energy income.</p>
<h3>Why count Game.creeps?</h3>
<p>It represents current Creeps; Memory may retain dead names.</p>
<h3>Why choose only one Spawn?</h3>
<p>Multiple idle Spawns can see the same zero-harvester state and submit duplicates.</p>
<h3>Does every empty room refill Spawn Energy automatically?</h3>
<p>No. The documented 1-Energy safety refill is specific to an initial Spawn.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#StructureSpawn.spawnCreep" rel="nofollow">API Reference: StructureSpawn.spawnCreep()</a></li>
<li><a href="https://docs.screeps.com/api/#Game.creeps" rel="nofollow">API Reference: Game.creeps</a></li>
<li><a href="https://docs.screeps.com/api/#Room.energyAvailable" rel="nofollow">API Reference: Room.energyAvailable</a></li>
<li><a href="https://docs.screeps.com/respawn.html" rel="nofollow">Screeps Documentation: Initial Spawn and respawning</a></li>
</ul>`,
  },
] satisfies EnglishBeginnerArticle[];

export const englishSpawnBatchThreeBySlug = Object.fromEntries(
  englishSpawnBatchThreeArticles.map((article) => [article.slug, article]),
) as Record<string, EnglishBeginnerArticle>;

export function getEnglishSpawnBatchThreeArticle(
  slug: string,
): EnglishBeginnerArticle | undefined {
  return englishSpawnBatchThreeBySlug[slug];
}
