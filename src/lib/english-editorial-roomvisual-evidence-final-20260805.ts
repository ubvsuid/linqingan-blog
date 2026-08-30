import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { englishEditorialRoomVisualEvidenceArticle20260805 } from "./english-editorial-roomvisual-evidence-20260805";

export const englishEditorialRoomVisualEvidenceFinalArticle20260805: EnglishBeginnerArticle = {
  ...englishEditorialRoomVisualEvidenceArticle20260805,
  title: "Screeps RoomVisual: Draw Debug Labels and Paths",
  headline: "How to Debug Creeps and Targets with RoomVisual",
  description:
    "Draw current-tick circles, labels, and lines with RoomVisual, keep coordinates in the correct Room, understand one-tick lifetime and the 512,000-byte limit, and avoid treating visuals as action evidence.",
  category: "OBSERVABILITY · ROOM VISUAL DEBUGGING",
  readingTime: "10 min read",
  primaryKeyword: "Screeps RoomVisual",
  searchIntent:
    "Draw temporary RoomVisual debug markers for current Creeps and targets without confusing browser visuals with game-state results",
  finalScore: 98,
  keywords: [
    "Screeps RoomVisual",
    "Screeps visual debugging",
    "RoomVisual text circle line",
    "RoomVisual getSize",
    "Screeps debug Creep target",
  ],
  verification: [
    [
      "Official API",
      "Checked — RoomVisual browser output, one-tick lifetime, room coordinates, chaining, clear(), getSize(), export() and import()",
    ],
    [
      "Size boundary",
      "Checked — one Room may contain at most 512,000 bytes of serialized visual data in the current tick",
    ],
    [
      "Evidence boundary",
      "Drawing output is kept separate from movement, combat, harvesting and other game-action results",
    ],
    ["JavaScript syntax", "Checked for the focused examples in this guide"],
    ["Screeps Console test", "Pending"],
    ["Live browser rendering test", "Pending"],
    ["Last verified", "August 30, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["first-visual", "Draw one label and circle"],
    ["creep-target", "Draw a Creep and its target"],
    ["same-room", "Keep coordinates in the correct Room"],
    ["tick-lifetime", "Redraw visuals every tick"],
    ["size-limit", "Watch the Room visual size"],
    ["clear-export-import", "Use clear, export, and import deliberately"],
    ["evidence-boundary", "Visuals are not action evidence"],
    ["debugging", "Debugging checklist"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    [
      "How long does a RoomVisual drawing last?",
      "One tick. Draw it again on later ticks when you want it to stay visible.",
    ],
    [
      "Can RoomVisual draw in a Room I cannot currently see?",
      "Yes. You can construct RoomVisual with a Room name even without script visibility, but the drawing does not create game visibility or reveal Room objects.",
    ],
    [
      "Does drawing OK prove a Creep moved or completed an action?",
      "No. RoomVisual methods only add browser visual data. Keep action return codes and later game-state observations separate.",
    ],
  ],
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Use <code>RoomVisual</code> to draw temporary debug information directly over a Room: circles around Creeps, text labels for state, and lines toward targets. The drawings are visible only to you and last for one tick unless your code draws them again.</p>
<p>For a visible Room, <code>room.visual</code> is the simplest entry point. Keep every position in the same Room as the visual, and remember that a drawing only describes what your debug code chose to render. It does not prove that a movement, harvest, build, or combat action succeeded.</p>

<h2 id="first-visual">Draw one label and circle</h2>
<p>Start with one visible Creep. This example does not change game state; it only adds current-tick browser visuals.</p>
<pre><code class="language-javascript">const creep = Game.creeps.Worker1;

if (creep) {
  creep.room.visual
    .circle(creep.pos, {
      radius: 0.45,
      fill: 'transparent',
      stroke: '#ffffff'
    })
    .text(
      creep.memory.role ?? creep.name,
      creep.pos.x,
      creep.pos.y - 0.7,
      { font: 0.4 }
    );
}</code></pre>
<p>Every drawing method returns the same <code>RoomVisual</code> object, so chaining calls is supported by the API.</p>

<h2 id="creep-target">Draw a Creep and its target</h2>
<p>A useful debug layer often answers three questions at a glance: where is the Creep, what state is it in, and which target is it trying to use?</p>
<pre><code class="language-javascript">function drawCreepTarget(creep, target, label) {
  if (!creep?.pos) return 'creep-missing';

  const visual = creep.room.visual;
  visual.circle(creep.pos, {
    radius: 0.4,
    fill: 'transparent',
    stroke: '#ffffff'
  });
  visual.text(
    String(label).slice(0, 60),
    creep.pos.x,
    creep.pos.y - 0.7,
    { font: 0.4 }
  );

  if (!target?.pos) {
    return 'target-missing';
  }

  if (target.pos.roomName !== creep.pos.roomName) {
    return 'target-in-another-room';
  }

  visual.line(creep.pos, target.pos, {
    lineStyle: 'dashed',
    opacity: 0.5
  });
  visual.circle(target.pos, {
    radius: 0.35,
    fill: 'transparent',
    stroke: '#ffffff'
  });

  return 'visual-added';
}</code></pre>
<p>The explicit Room check prevents numeric coordinates such as <code>25,25</code> in one Room from being drawn as though they referred to the same tile in another Room.</p>

<h2 id="same-room">Keep coordinates in the correct Room</h2>
<p><code>room.visual</code> belongs to that Room. A <code>RoomPosition</code> also contains a <code>roomName</code>, so compare Room identity before drawing a target path or copying coordinates.</p>
<p>You can also create <code>new RoomVisual('W1N1')</code> for a Room that is not currently visible to your script. That lets you post known coordinates, but it does <strong>not</strong> grant visibility and does not make <code>Game.rooms.W1N1</code> or unseen game objects available.</p>

<h2 id="tick-lifetime">Redraw visuals every tick</h2>
<p>Room visuals are not stored as persistent game state. They last one tick and disappear if they are not updated.</p>
<p>That makes them useful for current decisions such as:</p>
<ul>
<li>the target selected this tick;</li>
<li>the current role or task label;</li>
<li>a path or anchor your code is considering;</li>
<li>an immediate API return code you already captured.</li>
</ul>
<p>If a marker seems to flicker or vanish, first check whether the code that draws it actually ran on the current tick. Do not solve one-tick lifetime by storing large visual payloads in Memory unless replay is a real requirement.</p>

<h2 id="size-limit">Watch the Room visual size</h2>
<p><code>visual.getSize()</code> returns the total serialized size of visuals already added to that Room in the current tick. The official per-Room limit is <strong>512,000 bytes</strong>.</p>
<pre><code class="language-javascript">function drawDebugLabel(room, pos, text) {
  if (!room || !pos || pos.roomName !== room.name) {
    return 'invalid-room-or-position';
  }

  const visual = room.visual;
  const softLimit = 480000;

  if (visual.getSize() >= softLimit) {
    return 'soft-visual-limit-reached';
  }

  visual.text(
    String(text).slice(0, 80),
    pos.x,
    pos.y,
    { font: 0.4 }
  );

  return visual.getSize() <= 512000
    ? 'visual-added'
    : 'hard-limit-crossed';
}</code></pre>
<p>The 480,000-byte value is a project safety margin, not an official threshold. Because the next serialized drawing has a nonzero size, checking a soft margin before adding more debug labels is safer than intentionally filling the full 512,000-byte limit.</p>

<h2 id="clear-export-import">Use clear, export, and import deliberately</h2>
<p><code>clear()</code> removes all visual data already added to that Room in the current tick. If several modules draw to the same Room, a late <code>clear()</code> can remove another module's diagnostics too.</p>
<p><code>export()</code> returns a compact string containing the current Room visual data. <code>import()</code> adds previously exported visual data to the current tick. These methods are useful for deliberate replay or composition, but most debugging code only needs direct drawing calls each tick.</p>
<pre><code class="language-javascript">const room = Game.rooms.W1N1;

if (room) {
  const snapshot = room.visual.export();

  if (typeof snapshot === 'string') {
    Memory.lastRoomVisual = snapshot;
  }
}

// On a later tick, when deliberate replay is useful:
const currentRoom = Game.rooms.W1N1;
if (currentRoom && typeof Memory.lastRoomVisual === 'string') {
  currentRoom.visual.import(Memory.lastRoomVisual);
}</code></pre>
<p>Keep replay payloads bounded and temporary. Exporting a visual does not turn the underlying game objects or actions into historical evidence.</p>

<h2 id="evidence-boundary">Visuals are not action evidence</h2>
<p>A RoomVisual method returning its <code>RoomVisual</code> object means the drawing call was chained successfully. It does not report the success of a separate Screeps action.</p>
<p>For example, if <code>creep.moveTo(target)</code> returned <code>OK</code>, you may draw that numeric result beside the Creep. The label still only records what your code knew during that tick. Verify movement from the Creep's position on a later tick; use <a href="/en/blog/screeps-moveto-not-moving">the moveTo() diagnostic</a> when the accepted movement does not produce position progress.</p>
<p>For event-based follow-up around repairs, attacks, and similar Room activity, use <a href="/en/blog/screeps-room-event-log">the Room.getEventLog() guide</a>. The visual layer and the event log answer different questions.</p>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Confirm the drawing code ran on the current tick.</li>
<li>Use <code>room.visual</code> for a currently visible Room.</li>
<li>Check <code>roomName</code> before connecting two positions.</li>
<li>Remember that visuals disappear after one tick unless redrawn.</li>
<li>Use <code>getSize()</code> when a large diagnostic layer may approach the 512,000-byte Room limit.</li>
<li>Use <code>clear()</code> carefully when several modules write visuals.</li>
<li>Keep export/import as an optional replay tool, not the default debug architecture.</li>
<li>Preserve actual action return codes separately.</li>
<li>Verify game-state results from later objects, Stores, positions, or event data rather than from the drawing itself.</li>
</ul>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#RoomVisual" rel="nofollow noopener noreferrer">Screeps API: RoomVisual</a></li>
<li><a href="https://docs.screeps.com/api/#Room.visual" rel="nofollow noopener noreferrer">Screeps API: Room.visual</a></li>
<li><a href="https://docs.screeps.com/api/#RoomVisual.getSize" rel="nofollow noopener noreferrer">Screeps API: RoomVisual.getSize()</a></li>
<li><a href="https://docs.screeps.com/api/#RoomVisual.export" rel="nofollow noopener noreferrer">Screeps API: RoomVisual export() and import()</a></li>
</ul>`,
};
