export const englishBeginnerTickArticleOverrides = {
  "screeps-tick-game-loop": {
    title: "Screeps Ticks and Game Loop: Why Your Code Runs Repeatedly",
    headline: "What Is a Screeps Tick and Why Does module.exports.loop Keep Running?",
    description:
      "Understand a Screeps tick, Game.time, and module.exports.loop, then run safe observations that show why actions and state changes appear across later ticks.",
    category: "GETTING STARTED · BEGINNER LESSON 3 OF 12",
    readingTime: "8 min read",
    breadcrumbLabel: "Ticks and game loop",
    tags: ["Screeps", "JavaScript", "Console"],
    keywords: [
      "Screeps tick",
      "Screeps game loop",
      "Game.time",
      "module.exports.loop",
      "Screeps action next tick",
      "Screeps beginner",
    ],
    primaryKeyword: "Screeps tick",
    searchIntent:
      "Beginner explanation of Screeps tick timing, repeated main-loop execution, and safe observation across later ticks",
    finalScore: 98,
    verification: [
      ["Chinese source", "Read in full"],
      ["Official documentation", "Checked"],
      ["Game-loop model", "Checked"],
      ["JavaScript syntax", "Checked"],
      ["Offline syntax review", "Passed"],
      ["Screeps Console", "Pending"],
      ["Live multi-tick log", "Pending"],
      ["Tick interval", "Server-dependent"],
      ["Last verified", "July 27, 2026"],
      ["Publication status", "Ready"],
    ],
    toc: [
      ["lesson-goal", "Lesson goal"],
      ["tick-cycle", "One tick cycle"],
      ["game-time", "Observe Game.time"],
      ["main-loop", "The main loop"],
      ["loop-probe", "Optional loop probe"],
      ["later-ticks", "Why tasks need later ticks"],
      ["common-misunderstandings", "Common misunderstandings"],
      ["completion-check", "Completion check"],
      ["next-lesson", "Next lesson"],
      ["official-sources", "Official sources"],
    ],
    faq: [],
    articleHtml: `
<h2 id="lesson-goal">What you will complete in this lesson</h2>
<p>This lesson has one goal: understand why Screeps code runs again, why <code>Game.time</code> changes, and why a Creep usually needs several ticks to complete a task.</p>
<p>You will perform one read-only Console observation. An optional code-editor probe logs the tick number only; it does not move a Creep, create a unit, submit a structure action, or write to Memory.</p>
<p>By the end, you should be able to describe Screeps as a repeated sequence:</p>
<p><strong>read the current state → choose commands for this tick → let the game advance → read the new state.</strong></p>

<h2 id="tick-cycle">What happens in one Screeps tick?</h2>
<p>A tick is one update cycle of the Screeps world. It is closer to a turn or simulation step than to a fixed number of real-world seconds.</p>
<ol>
<li>The tick begins with a current game state: object positions, Stores, Controller progress, hits, cooldowns, and other properties.</li>
<li>Your main module and the modules it requires run against that current state.</li>
<li>Your code reads objects and submits commands for Creeps and structures.</li>
<li>The other players' scripts also complete for the tick.</li>
<li>The game resolves the submitted commands and prepares the state visible at the beginning of the next tick.</li>
</ol>
<p>This timing explains an important beginner rule: after you call a movement or work method, do not expect the related object properties to show the future result immediately in the same script execution. Read the object again on a later tick.</p>

<h2 id="game-time">Observe the current tick with Game.time</h2>
<p><strong>State impact:</strong> read-only. The following Console expression reads the current tick counter and changes nothing in the game.</p>
<pre><code>Game.time;</code></pre>
<p>Record the returned number. Run the same expression again later. A larger value means that the world has advanced through additional ticks.</p>
<p>Your numbers will not match the numbers in another account, screenshot, or tutorial. <code>Game.time</code> is a server-wide counter, and the real-time duration of a tick depends on server load.</p>

<h2 id="main-loop">Why module.exports.loop keeps running</h2>
<p>A normal one-off JavaScript program can start, finish its work, and exit. Screeps instead operates a persistent game world, so the game repeatedly invokes the exported main loop.</p>
<pre><code>module.exports.loop = function () {
  // Read the current state.
  // Choose this tick's commands.
};</code></pre>
<p>You do not need to study the full CommonJS module system yet. At this stage, treat <code>module.exports.loop</code> as the main function Screeps runs for each tick.</p>
<p>The function should finish. Screeps provides the repetition by calling it again on a later tick.</p>

<h2 id="loop-probe">Optional: add a controlled main-loop probe</h2>
<p><strong>State impact:</strong> Console logs only. Do not replace working live-colony logic with this example. Add the <code>if</code> block inside your existing loop, or test the complete example only in an empty tutorial branch.</p>
<pre><code>module.exports.loop = function () {
  if (Game.time % 20 === 0) {
    console.log(
      '[tick-probe] current tick: ' + Game.time
    );
  }

  // Keep your existing colony logic here.
};</code></pre>
<p>The value <code>20</code> is only a logging interval for this observation. It is not an official tick length or a special Screeps constant.</p>
<p>After you have seen several increasing tick numbers, remove the temporary probe so it does not keep adding routine messages to the Console.</p>

<h2 id="later-ticks">Why one Creep task needs later ticks</h2>
<p>Imagine a Creep that is several squares away from a Source. The complete job cannot normally finish inside one call to the main loop.</p>
<div class="table-scroll"><table>
<thead><tr><th>Tick state</th><th>What the script can decide</th><th>What you inspect later</th></tr></thead>
<tbody>
<tr><td>The Creep is outside harvest range.</td><td>Submit movement toward the Source.</td><td>Read its new position on a later tick.</td></tr>
<tr><td>The Creep reaches harvest range.</td><td>Submit <code>harvest()</code>.</td><td>Read its Store and the Source state later.</td></tr>
<tr><td>The Creep carries Energy.</td><td>Choose a delivery, building, or upgrading task.</td><td>Read the resulting Store or progress later.</td></tr>
</tbody></table></div>
<p>The exact number of ticks depends on current game state, including distance, terrain, fatigue, roads, body parts, traffic, and target availability. Do not convert a tutorial example into a fixed time promise.</p>
<p>When an action method returns <code>OK</code>, treat that as evidence that the command was accepted or scheduled. It is not proof that every visible property has already changed during the same script execution.</p>

<h2 id="common-misunderstandings">Avoid four common misunderstandings</h2>
<h3>A tick is not a fixed number of seconds</h3>
<p>Official documentation states that tick duration depends on current server load. Write logic around game state and tick numbers rather than assuming an exact wall-clock delay.</p>

<h3>The Console does not bypass tick timing</h3>
<p>A Console command runs within one tick under the same general execution model. It can inspect current state or submit a command, but it does not create a separate instant future state for you to read.</p>

<h3>Do not create your own infinite loop</h3>
<pre><code>while (true) {
  // Do not use this for continuous Screeps behavior.
}</code></pre>
<p>An infinite JavaScript loop prevents the current execution from finishing and can consume the CPU available for that tick. Put repeated game decisions in <code>module.exports.loop</code> instead.</p>

<h3>Re-read live objects on later ticks</h3>
<p><code>Game.creeps</code>, <code>Game.rooms</code>, and other live game collections describe the current tick. Retrieve the current object again when the loop runs later instead of treating an earlier object snapshot as proof of the new state.</p>
<p>Persistent decision state is a separate topic. The later <a href="/en/blog/screeps-memory-basics">Memory guide</a> explains how to preserve simple serializable values across ticks.</p>

<h2 id="completion-check">Completion check</h2>
<p>You have completed this lesson when you can do all of the following:</p>
<ul>
<li>define a tick as one Screeps world update cycle;</li>
<li>use <code>Game.time</code> to confirm that ticks are advancing;</li>
<li>explain why <code>module.exports.loop</code> runs again without a manual <code>while</code> loop;</li>
<li>explain why movement, harvesting, and delivery usually span several ticks;</li>
<li>distinguish an accepted command from a later visible state change;</li>
<li>avoid assuming that a tick has a fixed number of seconds.</li>
</ul>

<h2 id="next-lesson">Continue to your first Creep action</h2>
<p>The next lesson connects this timing model to a real unit. You will find a Creep and Source, inspect <code>harvest()</code> return codes, move only when range is insufficient, and observe the result across later ticks:</p>
<p><a href="/en/blog/screeps-creep-harvest-energy">Make your first Screeps Creep harvest Energy →</a></p>
<p>Return to the <a href="/en/beginner">English beginner roadmap</a> to review the full twelve-lesson sequence, or open the <a href="/en/glossary">glossary</a> for short definitions of tick, game loop, return code, CPU, and Memory.</p>

<h2 id="official-sources">Official sources</h2>
<ul>
<li><a href="https://docs.screeps.com/game-loop.html" rel="nofollow noopener noreferrer">Screeps Documentation: Understanding Game Loop, Time, and Ticks</a></li>
<li><a href="https://docs.screeps.com/scripting-basics.html" rel="nofollow noopener noreferrer">Screeps Documentation: Scripting Basics</a></li>
<li><a href="https://docs.screeps.com/api/#Game.time" rel="nofollow noopener noreferrer">Screeps API: Game.time</a></li>
</ul>`,
  },
} as const;
