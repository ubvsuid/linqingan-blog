import type { Metadata } from "next";

import { EnglishArticlePage } from "@/components/english-article-page";
import { getEnglishDiscoveryArticle } from "@/lib/english-discovery";
import { siteConfig } from "@/lib/site";

const path = "/en/blog/screeps-upgrader-controller-link-not-upgrading";
const chinesePath = "/blog/screeps-upgrader-controller-link-not-upgrading";
const headline = "Why a Fixed Screeps Upgrader Is Not Upgrading";
const description =
  "Diagnose a fixed Screeps Upgrader that reaches the Controller but does not upgrade by checking its anchor, Controller Link, Energy, active body parts, upgradeBlocked, return codes, and later evidence.";
const publishedAt = "2026-08-05";
const publishedLabel = "August 5, 2026";
const discovery = getEnglishDiscoveryArticle(path);
const articleUrl = `${siteConfig.url}${path}`;
const modifiedTime = discovery?.updatedAt ?? publishedAt;

export const metadata: Metadata = {
  title: { absolute: `${headline} | Linqingan` },
  description,
  keywords: [
    "Screeps Upgrader not upgrading",
    "Screeps Controller Link",
    "Screeps fixed Upgrader",
    "upgradeController return codes",
    "Screeps Controller Link Energy",
  ],
  alternates: {
    canonical: path,
    languages: { en: path, "zh-CN": chinesePath, "x-default": path },
    types: { "application/rss+xml": "/en/feed.xml" },
  },
  openGraph: {
    type: "article",
    locale: "en_US",
    alternateLocale: ["zh_CN"],
    url: articleUrl,
    siteName: "Linqingan",
    title: `${headline} | Linqingan`,
    description,
    publishedTime: publishedAt,
    modifiedTime,
    tags: discovery?.tags ?? ["Controllers", "Energy", "Debugging"],
    images: [{ url: `${siteConfig.url}${path}/opengraph-image`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${headline} | Linqingan`,
    description,
    images: [`${siteConfig.url}${path}/opengraph-image`],
  },
};

const toc: Array<[string, string]> = [
  ["failure-chain", "Separate the Upgrader from its supply chain"],
  ["quick-triage", "Run a 30-second read-only triage"],
  ["anchor", "Validate one exact anchor tile"],
  ["decision", "Use one diagnosable action per tick"],
  ["return-codes", "Return-code checklist"],
  ["complete-example", "Complete fixed-Upgrader example"],
  ["verification", "Verify the later result"],
  ["boundaries", "Evidence boundaries"],
];

const articleHtml = String.raw`
<h2 id="failure-chain">Separate the Upgrader from its supply chain</h2>
<p>A fixed Upgrader is the final consumer in a longer Energy chain: Source or Storage, hauler or source Link, Controller Link, Upgrader Store, then <code>upgradeController()</code>. A stationary Creep is not automatically broken. It may be waiting for Link Energy, missing an active WORK part, standing on the wrong tile, or facing a blocked Controller.</p>
<p>This guide is different from the <a href="/en/blog/screeps-upgrade-controller">beginner Source-to-Controller loop</a> and the generic <a href="/en/blog/screeps-link-transfer-energy">Link transfer guide</a>. It diagnoses the combined fixed-position system.</p>
<table>
  <thead><tr><th>Layer</th><th>Required condition</th><th>Failure signal</th></tr></thead>
  <tbody>
    <tr><td>Anchor</td><td>Within range 3 of Controller and range 1 of Link</td><td>Range or walkability reason</td></tr>
    <tr><td>Body</td><td>Energy capacity and active WORK; MOVE until anchored</td><td>No capacity, WORK, or MOVE</td></tr>
    <tr><td>Controller Link</td><td>Owned, active, same room, with Energy</td><td><code>controller-link-empty</code></td></tr>
    <tr><td>Controller</td><td>Owned and not upgrade-blocked</td><td><code>controller-upgrade-blocked</code></td></tr>
    <tr><td>Evidence</td><td>Later position, Store delta, or exact event</td><td>Accepted command without observed result</td></tr>
  </tbody>
</table>

<h2 id="quick-triage">Run a 30-second read-only triage</h2>
<p>Before changing the anchor or replacing your loop, inspect the objects that already exist. Replace the two placeholder values, then run this in the Console. It does not issue movement, withdraw, transfer, or upgrade commands.</p>
<pre><code class="language-js">const UPGRADER_NAME = 'Upgrader1';
const CONTROLLER_LINK_ID = 'CONTROLLER_LINK_ID';

const creep = Game.creeps[UPGRADER_NAME];
const controller = creep?.room.controller ?? null;
const link = Game.getObjectById(CONTROLLER_LINK_ID);

console.log(JSON.stringify({
  creepFound: Boolean(creep),
  spawning: creep?.spawning ?? null,
  activeWork: creep?.getActiveBodyparts(WORK) ?? null,
  energy: creep?.store.getUsedCapacity(RESOURCE_ENERGY) ?? null,
  controllerOwned: controller?.my ?? null,
  controllerRange: creep &amp;&amp; controller
    ? creep.pos.getRangeTo(controller)
    : null,
  upgradeBlocked: controller?.upgradeBlocked ?? null,
  linkFound: Boolean(link),
  linkOwned: link?.my ?? null,
  linkType: link?.structureType ?? null,
  linkActive: typeof link?.isActive === 'function'
    ? link.isActive()
    : null,
  linkEnergy: link?.store?.getUsedCapacity(RESOURCE_ENERGY) ?? null,
  linkRange: creep &amp;&amp; link
    ? creep.pos.getRangeTo(link)
    : null
}));</code></pre>
<table>
  <thead><tr><th>Probe result</th><th>Most likely branch</th><th>Next step</th></tr></thead>
  <tbody>
    <tr><td><code>creepFound: false</code> or <code>spawning: true</code></td><td>The worker is missing or not ready.</td><td>Fix the Creep name or wait for spawning to finish.</td></tr>
    <tr><td><code>activeWork: 0</code></td><td>The Creep cannot perform Controller work.</td><td>Inspect its body and damage before changing logistics.</td></tr>
    <tr><td><code>controllerRange &gt; 3</code></td><td>The current position cannot upgrade the Controller.</td><td>Validate the anchor geometry below.</td></tr>
    <tr><td><code>linkRange &gt; 1</code></td><td>The current position cannot withdraw from the Controller Link.</td><td>Validate the same anchor against the Link.</td></tr>
    <tr><td><code>energy: 0</code> and <code>linkEnergy: 0</code></td><td>The Upgrader is starved upstream.</td><td>Repair Link supply instead of changing <code>upgradeController()</code>.</td></tr>
    <tr><td><code>upgradeBlocked &gt; 0</code></td><td>The Controller is temporarily blocked from upgrading.</td><td>Wait for the block to expire; code changes will not bypass it.</td></tr>
    <tr><td>Ranges, body, ownership, Link Energy, and Controller state all look valid</td><td>The next useful signal is the exact action return code.</td><td>Use the checklist below before replacing the whole implementation.</td></tr>
  </tbody>
</table>
<p>If the Creep is not currently on its intended fixed tile, treat the two range values as current-position diagnostics only. The next section checks the configured anchor itself.</p>

<h2 id="anchor">Validate one exact anchor tile</h2>
<p>The chosen tile must satisfy both documented action ranges:</p>
<pre><code class="language-js">anchor.getRangeTo(controller) &lt;= 3;
anchor.getRangeTo(controllerLink) &lt;= 1;</code></pre>
<p>The tile must also be walkable. Moving only to <code>range: 3</code> from the Controller does not guarantee adjacency to the Controller Link. Store the Link ID and anchor coordinates explicitly instead of depending on a structure array position.</p>
<pre><code class="language-js">Memory.fixedUpgraders ??= {};
Memory.fixedUpgraders.W1N1 = {
  enabled: true,
  creepName: 'Upgrader1',
  controllerLinkId: 'CONTROLLER_LINK_ID',
  anchor: { x: 24, y: 25 },
  pending: null,
  history: []
};</code></pre>

<h2 id="decision">Use one diagnosable action per tick</h2>
<pre><code class="language-text">not anchored -&gt; move only
anchored and empty -&gt; withdraw only
anchored with Energy -&gt; upgrade only</code></pre>
<p>Screeps commands are queued against the tick's starting state and settle later. Separating the states is not the only valid architecture, but it makes return codes and next-tick observations easier to interpret.</p>
<p>If the Controller Link is empty, keep the Upgrader fixed and repair upstream logistics. Use the <a href="/en/tools/hauling-throughput-planner">hauling throughput planner</a> and the Link guide instead of silently turning the Upgrader into a Storage hauler.</p>

<h2 id="return-codes">Return-code checklist</h2>
<table>
  <thead><tr><th>Method</th><th>Important results</th><th>Primary diagnosis</th></tr></thead>
  <tbody>
    <tr><td><code>moveTo()</code></td><td><code>OK</code>, <code>ERR_TIRED</code>, <code>ERR_NO_PATH</code>, <code>ERR_NO_BODYPART</code></td><td>Traffic, fatigue, path, active MOVE</td></tr>
    <tr><td><code>withdraw()</code></td><td><code>OK</code>, <code>ERR_NOT_ENOUGH_RESOURCES</code>, <code>ERR_FULL</code>, <code>ERR_NOT_IN_RANGE</code></td><td>Link stock, Creep capacity, range 1</td></tr>
    <tr><td><code>upgradeController()</code></td><td><code>OK</code>, <code>ERR_NOT_ENOUGH_RESOURCES</code>, <code>ERR_INVALID_TARGET</code>, <code>ERR_NOT_IN_RANGE</code>, <code>ERR_NO_BODYPART</code>, <code>ERR_ACCESS_DENIED</code></td><td>Energy, Controller state, range 3, active WORK</td></tr>
  </tbody>
</table>
<p>Preserve the actual result. <code>OK</code> means the command was accepted, not that the same code block can already read the settled state. If the short probe already isolates the problem, stop there; the complete implementation below is a hardened reference, not the first diagnostic step.</p>

<h2 id="complete-example">Complete fixed-Upgrader example</h2>
<p>The implementation below validates object identity, ownership, anchor geometry, walkability, active body parts, Link state, <code>upgradeBlocked</code>, and one later observation. History is bounded to 20 records.</p>
<pre><code class="language-js">const HISTORY_LIMIT = 20;

function evaluateFixedUpgraderState(input) {
  const {
    enabled, creepExists, creepOwned, spawning,
    activeWork, energyCapacity, energy, activeMove,
    atAnchor, anchorWalkable, anchorControllerRange,
    anchorLinkRange, controllerExists, controllerOwned,
    upgradeBlocked, linkExists, linkOwned, linkActive,
    linkEnergy
  } = input;

  if (enabled !== true) return { action: 'none', reason: 'config-disabled' };
  if (!creepExists || !creepOwned) return { action: 'none', reason: 'owned-creep-missing' };
  if (spawning) return { action: 'none', reason: 'creep-spawning' };
  if (!controllerExists || !controllerOwned) return { action: 'none', reason: 'owned-controller-missing' };
  if (!linkExists || !linkOwned) return { action: 'none', reason: 'owned-controller-link-missing' };
  if (!linkActive) return { action: 'none', reason: 'controller-link-inactive' };
  if (!anchorWalkable) return { action: 'none', reason: 'anchor-not-walkable' };
  if (anchorControllerRange &gt; 3) return { action: 'none', reason: 'anchor-outside-controller-range' };
  if (anchorLinkRange &gt; 1) return { action: 'none', reason: 'anchor-outside-link-range' };
  if (energyCapacity &lt;= 0) return { action: 'none', reason: 'no-energy-capacity' };
  if (activeWork &lt;= 0) return { action: 'none', reason: 'no-active-work' };
  if (!atAnchor) {
    return activeMove &gt; 0
      ? { action: 'move', reason: 'move-to-anchor' }
      : { action: 'none', reason: 'no-active-move' };
  }
  if (energy &lt;= 0) {
    return linkEnergy &gt; 0
      ? { action: 'withdraw', reason: 'take-controller-link-energy' }
      : { action: 'none', reason: 'controller-link-empty' };
  }
  if (upgradeBlocked &gt; 0) return { action: 'none', reason: 'controller-upgrade-blocked' };
  return { action: 'upgrade', reason: 'upgrade-ready' };
}

function getState(roomName) {
  Memory.fixedUpgraders ??= {};
  Memory.fixedUpgraders[roomName] ??= {
    enabled: false,
    creepName: null,
    controllerLinkId: null,
    anchor: null,
    pending: null,
    history: []
  };
  return Memory.fixedUpgraders[roomName];
}

function getOwnedLink(id, roomName) {
  if (typeof id !== 'string') return null;
  const link = Game.getObjectById(id);
  return link
    &amp;&amp; link.structureType === STRUCTURE_LINK
    &amp;&amp; link.my === true
    &amp;&amp; link.room.name === roomName
    ? link
    : null;
}

function getAnchor(room, value) {
  if (
    !value
    || !Number.isInteger(value.x)
    || !Number.isInteger(value.y)
    || value.x &lt; 0 || value.x &gt; 49
    || value.y &lt; 0 || value.y &gt; 49
  ) return null;
  return new RoomPosition(value.x, value.y, room.name);
}

function isWalkable(room, position) {
  if (!position) return false;
  if (room.getTerrain().get(position.x, position.y) === TERRAIN_MASK_WALL) return false;

  const blockedStructure = room.lookForAt(
    LOOK_STRUCTURES,
    position.x,
    position.y
  ).some(item =&gt; OBSTACLE_OBJECT_TYPES.includes(item.structureType));

  const blockedSite = room.lookForAt(
    LOOK_CONSTRUCTION_SITES,
    position.x,
    position.y
  ).some(item =&gt; OBSTACLE_OBJECT_TYPES.includes(item.structureType));

  return !blockedStructure &amp;&amp; !blockedSite;
}

function snapshot(creep, controller, link, anchor) {
  return {
    creepEnergy: creep?.store.getUsedCapacity(RESOURCE_ENERGY) ?? null,
    linkEnergy: link?.store.getUsedCapacity(RESOURCE_ENERGY) ?? null,
    controllerProgress: Number.isFinite(controller?.progress)
      ? controller.progress
      : null,
    ticksToDowngrade: controller?.ticksToDowngrade ?? null,
    atAnchor: Boolean(creep &amp;&amp; anchor &amp;&amp; creep.pos.isEqualTo(anchor))
  };
}

function allFinite(values) {
  return values.every(value =&gt; Number.isFinite(value));
}

function verifyPrevious(room, state, creep, controller, link, anchor) {
  const pending = state.pending;
  if (!pending || pending.tick &gt;= Game.time) return null;

  const after = snapshot(creep, controller, link, anchor);
  const exactUpgradeEvent = pending.action === 'upgrade'
    &amp;&amp; room.getEventLog().some(event =&gt;
      event.event === EVENT_UPGRADE_CONTROLLER
      &amp;&amp; event.objectId === pending.creepId
    );

  let status = 'not-observed';
  if (pending.action === 'move' &amp;&amp; after.atAnchor) {
    status = 'anchor-arrival-observed';
  }
  if (pending.action === 'withdraw') {
    const canMeasureWithdraw = allFinite([
      after.creepEnergy,
      pending.before.creepEnergy,
      pending.before.linkEnergy,
      after.linkEnergy
    ]);

    if (!canMeasureWithdraw) {
      status = 'withdraw-evidence-unavailable';
    } else {
      const gain = after.creepEnergy - pending.before.creepEnergy;
      const loss = pending.before.linkEnergy - after.linkEnergy;
      status = gain &gt; 0 &amp;&amp; loss &gt; 0
        ? 'withdraw-deltas-observed'
        : gain &gt; 0 || loss &gt; 0
          ? 'withdraw-partial-observation'
          : 'withdraw-not-observed';
    }
  }
  if (pending.action === 'upgrade') {
    const canMeasureSpent = allFinite([
      after.creepEnergy,
      pending.before.creepEnergy
    ]);
    const canMeasureProgress = allFinite([
      after.controllerProgress,
      pending.before.controllerProgress
    ]);
    const canMeasureDowngrade = allFinite([
      after.ticksToDowngrade,
      pending.before.ticksToDowngrade
    ]);

    if (exactUpgradeEvent) {
      status = 'upgrade-event-observed';
    } else if (!canMeasureSpent || (!canMeasureProgress &amp;&amp; !canMeasureDowngrade)) {
      status = 'upgrade-evidence-unavailable';
    } else {
      const spent = pending.before.creepEnergy - after.creepEnergy;
      const progress = canMeasureProgress
        &amp;&amp; after.controllerProgress &gt; pending.before.controllerProgress;
      const downgrade = canMeasureDowngrade
        &amp;&amp; after.ticksToDowngrade &gt; pending.before.ticksToDowngrade;
      status = spent &gt; 0 &amp;&amp; (progress || downgrade)
        ? 'upgrade-deltas-observed'
        : spent &gt; 0 || progress || downgrade
          ? 'upgrade-partial-observation'
          : 'upgrade-not-observed';
    }
  }

  const record = {
    ...pending,
    verifiedAt: Game.time,
    after: { ...after, exactUpgradeEvent },
    status
  };
  state.history ??= [];
  state.history.push(record);
  state.history = state.history.slice(-HISTORY_LIMIT);
  state.pending = null;
  state.lastVerification = record;
  return record;
}

function runFixedUpgrader(roomName) {
  const state = getState(roomName);
  const room = Game.rooms[roomName];
  if (!room) return { status: 'room-not-visible' };

  const controller = room.controller || null;
  const creep = typeof state.creepName === 'string'
    ? Game.creeps[state.creepName] || null
    : null;
  const link = getOwnedLink(state.controllerLinkId, roomName);
  const anchor = getAnchor(room, state.anchor);
  const verification = verifyPrevious(
    room, state, creep, controller, link, anchor
  );

  const decision = evaluateFixedUpgraderState({
    enabled: state.enabled,
    creepExists: Boolean(creep),
    creepOwned: creep?.my === true,
    spawning: creep?.spawning === true,
    activeWork: creep?.getActiveBodyparts(WORK) ?? 0,
    energyCapacity: creep?.store.getCapacity(RESOURCE_ENERGY) ?? 0,
    energy: creep?.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0,
    activeMove: creep?.getActiveBodyparts(MOVE) ?? 0,
    atAnchor: Boolean(creep &amp;&amp; anchor &amp;&amp; creep.pos.isEqualTo(anchor)),
    anchorWalkable: isWalkable(room, anchor),
    anchorControllerRange: controller &amp;&amp; anchor
      ? anchor.getRangeTo(controller)
      : Infinity,
    anchorLinkRange: link &amp;&amp; anchor
      ? anchor.getRangeTo(link)
      : Infinity,
    controllerExists: Boolean(controller),
    controllerOwned: controller?.my === true,
    upgradeBlocked: controller?.upgradeBlocked ?? 0,
    linkExists: Boolean(link),
    linkOwned: link?.my === true,
    linkActive: link?.isActive() === true,
    linkEnergy: link?.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0
  });

  state.lastReason = decision.reason;
  state.lastDecisionAt = Game.time;
  if (decision.action === 'none') {
    return { status: decision.reason, verification };
  }

  const before = snapshot(creep, controller, link, anchor);
  let result = ERR_INVALID_ARGS;
  if (decision.action === 'move') {
    result = creep.moveTo(anchor, { range: 0, reusePath: 10 });
  } else if (decision.action === 'withdraw') {
    result = creep.withdraw(link, RESOURCE_ENERGY);
  } else if (decision.action === 'upgrade') {
    result = creep.upgradeController(controller);
  }

  state.lastAction = decision.action;
  state.lastResult = result;
  state.lastResultAt = Game.time;
  if (result === OK) {
    state.pending = {
      tick: Game.time,
      action: decision.action,
      creepId: creep.id,
      creepName: creep.name,
      controllerId: controller.id,
      linkId: link.id,
      before
    };
  }

  return {
    status: result === OK ? 'command-accepted' : 'command-rejected',
    action: decision.action,
    reason: decision.reason,
    result,
    before,
    verification
  };
}

module.exports.loop = function () {
  const outcome = runFixedUpgrader('W1N1');
  if (outcome.status !== 'config-disabled' || outcome.verification) {
    console.log(JSON.stringify({
      type: 'fixed-upgrader',
      tick: Game.time,
      roomName: 'W1N1',
      ...outcome
    }));
  }
};</code></pre>

<h2 id="verification">Verify the later result</h2>
<ul>
  <li>Move: the Creep is on the exact anchor.</li>
  <li>Withdraw: Creep Energy increased and Controller Link Energy decreased.</li>
  <li>Upgrade: prefer an exact <code>EVENT_UPGRADE_CONTROLLER</code> whose <code>objectId</code> is the pending Creep ID.</li>
</ul>
<p>If a Creep, Link, or Controller snapshot is missing, the code records <code>withdraw-evidence-unavailable</code> or <code>upgrade-evidence-unavailable</code>; it never lets <code>null</code> participate in arithmetic. When exact events are unavailable, Energy, Controller progress, and downgrade-timer changes are only bounded supporting observations. Concurrent Upgraders can confound pure deltas.</p>

<h2 id="boundaries">Evidence boundaries</h2>
<p>Twenty-four offline cases passed, including missing objects, ownership, spawning, walkability, both action ranges, Energy capacity, active WORK and MOVE, empty Link, blocked Controller, move, withdraw, upgrade, missing Creep, Link and Controller snapshots, and later-observation classifications. The complete example passed a JavaScript syntax check.</p>
<p>These checks do not prove live shard traffic, anchor contention, competing Link senders, every Boost and Power Creep combination, RCL8 throughput, or that production IDs and coordinates are correct. Console and official-shard evidence remain pending.</p>
<p>Continue with <a href="/en/blog/screeps-controller-downgrade">Controller downgrade recovery</a>, <a href="/en/blog/screeps-storage-energy-usage">Storage Energy policy</a>, or <a href="/en/blog/screeps-room-event-log">Room event logs</a>.</p>
`;

export default function FixedUpgraderDiagnosticsPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline,
      description,
      datePublished: publishedAt,
      dateModified: modifiedTime,
      inLanguage: "en-US",
      mainEntityOfPage: articleUrl,
      author: { "@type": "Person", name: "Linqingan", url: `${siteConfig.url}/en/about` },
      publisher: { "@type": "Organization", name: "Linqingan", url: siteConfig.url },
      isBasedOn: `${siteConfig.url}${chinesePath}`,
      about: discovery?.tags,
      articleSection: discovery?.moduleTitle,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${siteConfig.url}/en` },
        { "@type": "ListItem", position: 2, name: "Articles", item: `${siteConfig.url}/en/blog` },
        { "@type": "ListItem", position: 3, name: headline, item: articleUrl },
      ],
    },
  ];

  return (
    <EnglishArticlePage
      articleHref={path}
      chinesePath={chinesePath}
      headline={headline}
      description={description}
      breadcrumbLabel="Fixed Upgrader diagnostics"
      category="CONTROLLER · FIXED UPGRADER DIAGNOSTICS"
      publishedAt={publishedAt}
      publishedLabel={publishedLabel}
      readingTime="20 min read"
      tags={["Controllers", "Energy", "Debugging"]}
      verification={[
        { term: "Documentation", value: "Official API and game-loop references checked" },
        { term: "Syntax", value: "Complete JavaScript example checked offline" },
        { term: "Offline cases", value: "24 passed" },
        { term: "Live shard", value: "Pending" },
      ]}
      toc={toc}
      articleHtml={articleHtml}
      jsonLd={jsonLd}
    />
  );
}
