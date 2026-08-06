import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishRoomErrorIsolationArticle = {
  slug: "screeps-room-error-isolation",
  path: "/en/blog/screeps-room-error-isolation",
  chinesePath: "/blog/screeps-room-error-isolation",
  title: "Screeps Room Error Isolation: Keep Other Rooms Running",
  headline: "How to Isolate One Room Error Without Stopping Every Other Room",
  description:
    "Catch JavaScript exceptions at room or subsystem boundaries, preserve structured rate-limited evidence, pause repeatedly failing optional work, and retry after cooldown without confusing API return codes or CPU termination with exceptions.",
  category: "OPERATIONS · ROOM ERROR ISOLATION",
  publishedAt: "2026-08-06",
  publishedLabel: "August 6, 2026",
  readingTime: "18 min read",
  breadcrumbLabel: "Room Error Isolation",
  tags: ["Screeps", "JavaScript", "Error Isolation", "Main Loop", "Diagnostics"],
  keywords: [
    "Screeps room error isolation",
    "Screeps try catch room loop",
    "Screeps one room error stops other rooms",
    "Screeps runtime circuit breaker",
    "Screeps structured error logging",
  ],
  primaryKeyword: "Screeps room error isolation",
  searchIntent:
    "Keep unaffected rooms running after one room or optional subsystem throws a JavaScript exception",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — repeated main-loop execution, later command resolution, CPU execution boundaries, and Game.notify() limits"],
    ["Language semantics", "Checked — try...catch handles thrown JavaScript values, not ordinary Screeps API return codes"],
    ["Evidence boundary", "Isolation limits blast radius; it does not prove that the failed task completed or that an external notification arrived"],
    ["JavaScript syntax", "Passed by the repository code-block check"],
    ["Offline guard review", "Passed by repository assertions for continuation, cooldown, retry, non-Error throws, and rate-limited logging"],
    ["Screeps Console test", "Pending"],
    ["Live multi-room, CPU cost, global reset, and notification delivery test", "Pending"],
    ["Last verified", "August 6, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["why-other-rooms-stop", "Why later rooms stop"],
    ["three-failure-types", "Separate three failure types"],
    ["wrong-boundary", "Why one outer catch is insufficient"],
    ["minimum-room-boundary", "Add the minimum room boundary"],
    ["state-required", "Store bounded failure state"],
    ["runtime-guard", "Build a reusable runtime guard"],
    ["critical-optional", "Separate critical and optional work"],
    ["structured-evidence", "Read structured error evidence"],
    ["cooldown-recovery", "Retry after cooldown"],
    ["debugging", "Debugging checklist"],
    ["scope", "Scope and limitations"],
    ["faq", "Frequently asked questions"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    [
      "Does ERR_NOT_IN_RANGE enter catch?",
      "No. It is an ordinary API return code. Save and branch on the result separately.",
    ],
    [
      "Should critical Spawn or defense work use a long circuit breaker?",
      "Usually no. Record the failure, skip the damaged room remainder, continue other rooms, and retry the critical boundary on the next tick.",
    ],
    [
      "Can try...catch recover a CPU termination?",
      "Do not rely on it. CPU measurement, task ordering, bucket protection, and degradation need a separate scheduler.",
    ],
    [
      "Why keep only a short stack trace?",
      "A bounded stack normally identifies the failing function and callers without growing Memory or repeating oversized logs every tick.",
    ],
  ],
  previous: {
    href: "/en/blog/screeps-roomvisual-debug",
    label: "Previous observability guide",
    title: "Coordinate RoomVisual Diagnostics",
  },
  next: null,
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Wrap each owned room, independent subsystem, or similarly recoverable execution unit in its own <code>try...catch</code> boundary. When one unit throws, save a bounded structured record and continue the loop. Keep ordinary Screeps <code>OK</code> and <code>ERR_*</code> results in explicit branches, and keep CPU protection in a separate scheduler.</p>
<p>For optional work, add a small failure window, log interval, cooldown, and automatic retry. For critical Spawn, harvesting, Controller safety, or defense work, prefer next-tick retry instead of a long automatic pause.</p>

<h2 id="why-other-rooms-stop">Why later rooms stop</h2>
<p>A loop does not automatically skip a failed iteration when a called function throws. Without a matching catch, control leaves the current call chain before later rooms run.</p>
<pre><code class="language-javascript">module.exports.loop = function () {
  for (const room of Object.values(Game.rooms)) {
    if (room.controller?.my !== true) {
      continue;
    }

    runRoom(room);
  }
};</code></pre>
<p>If <code>runRoom(W1N1)</code> reads <code>anchor.x</code> while <code>anchor</code> is undefined, the later W2N2 and W3N3 calls are not reached in that execution. The next tick starts the main loop again, but unchanged input can reproduce the same failure.</p>

<h2 id="three-failure-types">Separate three failure types</h2>
<div class="table-scroll"><table>
<thead><tr><th>Failure</th><th>Example</th><th>Correct handling</th></tr></thead>
<tbody>
<tr><td>JavaScript exception</td><td><code>TypeError</code>, <code>ReferenceError</code>, explicit <code>throw</code></td><td>Catch at a recoverable boundary, record evidence, fix the cause</td></tr>
<tr><td>Screeps API return code</td><td><code>ERR_NOT_IN_RANGE</code>, <code>ERR_FULL</code></td><td>Save the returned number and branch explicitly</td></tr>
<tr><td>CPU execution boundary</td><td>Later work is not reached after the tick budget is exhausted</td><td>Measure, prioritize, throttle, and degrade separately</td></tr>
</tbody></table></div>
<pre><code class="language-javascript">const result = creep.transfer(
  target,
  RESOURCE_ENERGY
);

if (result === ERR_NOT_IN_RANGE) {
  return {
    status: 'moving',
    result,
    moveResult: creep.moveTo(target)
  };
}

return {
  status: result === OK
    ? 'submitted'
    : 'failed',
  result
};</code></pre>
<p>An API return code does not become an exception merely because the call is inside <code>try...catch</code>.</p>

<h2 id="wrong-boundary">Why one outer catch is insufficient</h2>
<pre><code class="language-javascript">module.exports.loop = function () {
  try {
    runRoom(Game.rooms.W1N1);
    runRoom(Game.rooms.W2N2);
    runRoom(Game.rooms.W3N3);
  } catch (error) {
    console.log(error);
  }
};</code></pre>
<p>If W1N1 throws, control jumps to the single catch and then leaves the function. The catch prevents an uncaught exception from escaping, but it does not resume at W2N2.</p>

<h2 id="minimum-room-boundary">Add the minimum room boundary</h2>
<pre><code class="language-javascript">function runOwnedRooms(runRoom) {
  const rooms = Object.values(Game.rooms)
    .filter(room =&gt; room.controller?.my === true)
    .sort((left, right) =&gt;
      left.name.localeCompare(right.name)
    );

  const outcomes = [];

  for (const room of rooms) {
    try {
      outcomes.push({
        roomName: room.name,
        ok: true,
        value: runRoom(room)
      });
    } catch (error) {
      outcomes.push({
        roomName: room.name,
        ok: false,
        errorName: error instanceof Error
          ? error.name
          : 'NonErrorThrow',
        message: error instanceof Error
          ? error.message
          : String(error)
      });
    }
  }

  return outcomes;
}</code></pre>
<p>This is the smallest useful blast-radius boundary: one failure becomes one result, while the loop continues. It still needs rate limits and bounded state before production use.</p>

<h2 id="state-required">Store bounded failure state</h2>
<p>A useful optional-task record needs only enough data to decide whether to log, pause, retry, and report recovery:</p>
<pre><code class="language-javascript">function getGuardState(key) {
  Memory.runtimeGuard ??= { units: {} };
  Memory.runtimeGuard.units ??= {};
  Memory.runtimeGuard.units[key] ??= {
    errorTicks: [],
    consecutiveErrors: 0,
    totalErrors: 0,
    disabledUntil: null,
    lastLogAt: null,
    lastSuccessAt: null,
    lastError: null
  };

  return Memory.runtimeGuard.units[key];
}</code></pre>
<p>Do not serialize an entire Room, Creep, or large configuration object. Keep a stable key, tick, short message, bounded stack, counters, and retry time.</p>

<h2 id="runtime-guard">Build a reusable runtime guard</h2>
<pre><code class="language-javascript">function normalizeThrown(thrown) {
  if (thrown instanceof Error) {
    return {
      name: thrown.name || 'Error',
      message: thrown.message || String(thrown),
      stack: typeof thrown.stack === 'string'
        ? thrown.stack.split('\n').slice(0, 6).join('\n')
        : null
    };
  }

  let message;

  try {
    message = typeof thrown === 'string'
      ? thrown
      : JSON.stringify(thrown);
  } catch {
    message = String(thrown);
  }

  return {
    name: 'NonErrorThrow',
    message: message ?? String(thrown),
    stack: null
  };
}

function runGuarded(key, task, options = {}) {
  const config = {
    windowTicks: 100,
    maxErrors: 3,
    cooldownTicks: 50,
    logIntervalTicks: 20,
    breakerEnabled: true,
    ...options
  };
  const state = getGuardState(key);
  const firstTick = Game.time - config.windowTicks + 1;

  state.errorTicks = state.errorTicks.filter(
    tick =&gt; tick &gt;= firstTick
  );

  if (
    config.breakerEnabled
    &amp;&amp; Number.isInteger(state.disabledUntil)
    &amp;&amp; Game.time &lt; state.disabledUntil
  ) {
    return {
      ok: false,
      status: 'cooldown',
      retryAt: state.disabledUntil
    };
  }

  if (
    Number.isInteger(state.disabledUntil)
    &amp;&amp; Game.time &gt;= state.disabledUntil
  ) {
    state.disabledUntil = null;
    state.errorTicks = [];
    state.consecutiveErrors = 0;
  }

  try {
    const value = task();
    const recovered = state.consecutiveErrors &gt; 0;
    state.consecutiveErrors = 0;
    state.lastSuccessAt = Game.time;
    state.lastError = null;

    return {
      ok: true,
      status: recovered ? 'recovered' : 'ok',
      value
    };
  } catch (thrown) {
    const error = normalizeThrown(thrown);
    state.errorTicks.push(Game.time);
    state.consecutiveErrors += 1;
    state.totalErrors += 1;
    state.lastError = {
      tick: Game.time,
      ...error
    };

    const breakerTripped =
      config.breakerEnabled
      &amp;&amp; state.errorTicks.length &gt;= config.maxErrors;

    if (breakerTripped) {
      state.disabledUntil = Game.time + config.cooldownTicks;
    }

    const logDue =
      !Number.isInteger(state.lastLogAt)
      || Game.time - state.lastLogAt
        &gt;= config.logIntervalTicks;

    if (logDue) {
      console.log(JSON.stringify({
        type: 'runtime-guard-error',
        tick: Game.time,
        key,
        breakerTripped,
        retryAt: state.disabledUntil,
        error
      }));
      state.lastLogAt = Game.time;
    }

    return {
      ok: false,
      status: breakerTripped
        ? 'disabled'
        : 'error',
      retryAt: state.disabledUntil,
      error
    };
  }
}</code></pre>
<p>The numeric thresholds are local policy values, not official recommendations. Tune them from real error frequency and room risk.</p>

<h2 id="critical-optional">Separate critical and optional work</h2>
<pre><code class="language-javascript">module.exports.loop = function () {
  const rooms = Object.values(Game.rooms)
    .filter(room =&gt; room.controller?.my === true);

  for (const room of rooms) {
    const critical = runGuarded(
      'critical:' + room.name,
      () =&gt; roomManager.runCritical(room),
      {
        breakerEnabled: false,
        logIntervalTicks: 20
      }
    );

    if (!critical.ok) {
      continue;
    }

    runGuarded(
      'optional:' + room.name,
      () =&gt; roomManager.runOptional(room),
      {
        breakerEnabled: true,
        windowTicks: 100,
        maxErrors: 3,
        cooldownTicks: 50,
        logIntervalTicks: 20
      }
    );
  }
};</code></pre>
<p>Critical work should remain small and retryable. Optional visuals, statistics, long-range planning, or market scans can use a cooldown when repeated exceptions would otherwise waste CPU every tick.</p>

<h2 id="structured-evidence">Read structured error evidence</h2>
<div class="table-scroll"><table>
<thead><tr><th>Field</th><th>Question it answers</th></tr></thead>
<tbody>
<tr><td><code>key</code></td><td>Which room and task boundary failed?</td></tr>
<tr><td><code>tick</code></td><td>When did this exact observation occur?</td></tr>
<tr><td><code>breakerTripped</code></td><td>Did this failure start a cooldown?</td></tr>
<tr><td><code>retryAt</code></td><td>When may the optional task run again?</td></tr>
<tr><td><code>error.name</code></td><td>What JavaScript failure class was observed?</td></tr>
<tr><td><code>error.message</code></td><td>What immediate condition failed?</td></tr>
<tr><td><code>error.stack</code></td><td>Which bounded call chain reached the failure?</td></tr>
</tbody></table></div>
<p>A catch is not a repair. It preserves the rest of the system while evidence guides the real null check, migration, identity fix, visibility guard, or module correction.</p>

<h2 id="cooldown-recovery">Retry after cooldown</h2>
<p>Before <code>disabledUntil</code>, the optional task returns <code>cooldown</code> without calling its function. At or after the retry tick, clear the current failure window and attempt the task once. A successful call should record a recovery event; another exception starts a new failure sequence.</p>
<pre><code class="language-javascript">function summarizeGuardOutcome(key, outcome) {
  if (outcome.status === 'recovered') {
    return {
      type: 'runtime-guard-recovered',
      tick: Game.time,
      key
    };
  }

  if (outcome.status === 'cooldown') {
    return {
      type: 'runtime-guard-cooldown',
      tick: Game.time,
      key,
      retryAt: outcome.retryAt
    };
  }

  return null;
}</code></pre>

<h2 id="debugging">Debugging checklist</h2>
<ol>
<li>Find the first exception, not only the latest repeated line.</li>
<li>Record its room, task key, tick, type, message, and first project stack frame.</li>
<li>Confirm whether one outer catch still skips later rooms.</li>
<li>Check missing Memory fields, destroyed objects, lost visibility, stale IDs, and unrebuilt heap cache.</li>
<li>Handle <code>ERR_*</code> results in ordinary branches.</li>
<li>Measure CPU separately when there is no exception stack.</li>
<li>After the code or input is fixed, observe a recovery and several later healthy ticks.</li>
</ol>

<h2 id="scope">Scope and limitations</h2>
<p>This pattern applies to multiple owned rooms, role dispatchers, optional diagnostics, market scans, remote planning, and other independently recoverable units. It does not recover syntax errors that prevent loading, infinite loops, top-level module initialization failures, CPU termination, shard outages, or a complete Memory schema migration.</p>
<p>Repository syntax and offline control-flow assertions do not prove live Screeps CPU cost, multi-room behavior, global-reset recovery, or external alert delivery. Those remain explicit live-test tasks.</p>

<h2 id="faq">Frequently asked questions</h2>
<p>The FAQ below keeps return-code handling, critical-task retry, CPU boundaries, and stack-size decisions separate from exception isolation.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/scripting-basics.html">Screeps scripting basics</a></li>
<li><a href="https://docs.screeps.com/game-loop.html">Understanding the game loop, time, and ticks</a></li>
<li><a href="https://docs.screeps.com/cpu-limit.html">How the CPU limit works</a></li>
<li><a href="https://docs.screeps.com/api/Game.html#notify">Game.notify() API</a></li>
<li><a href="https://tc39.es/ecma262/2026/multipage/ecmascript-language-statements-and-declarations.html#sec-try-statement">ECMAScript try statement</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
