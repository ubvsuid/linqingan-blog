import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const chinesePath = path.join(
  root,
  "content/posts/screeps-rawmemory-foreign-segment.md",
);
const englishPath = path.join(
  root,
  "src/app/(en)/en/blog/screeps-rawmemory-foreign-segment/page.tsx",
);
const registryPath = path.join(
  root,
  "src/lib/english-link-source-registry-18.ts",
);
const knowledgePath = path.join(
  root,
  "src/lib/knowledge-base.ts",
);
const englishKnowledgePath = path.join(
  root,
  "src/lib/english-knowledge.ts",
);
const discoveryPath = path.join(
  root,
  "src/lib/english-discovery-topic-overrides-20260806.ts",
);
const smokeAllPath = path.join(root, "scripts/smoke-all.mjs");

const chinese = fs.readFileSync(chinesePath, "utf8");
const english = fs.readFileSync(englishPath, "utf8");
const registry = fs.readFileSync(registryPath, "utf8");
const knowledge = fs.readFileSync(knowledgePath, "utf8");
const englishKnowledge = fs.readFileSync(
  englishKnowledgePath,
  "utf8",
);
const discovery = fs.readFileSync(discoveryPath, "utf8");
const smokeAll = fs.readFileSync(smokeAllPath, "utf8");

const failures = [];
let assertions = 0;

function assert(condition, message) {
  assertions += 1;
  if (!condition) failures.push(message);
}

for (const expected of [
  "Screeps RawMemory Foreign Segment 怎么用",
  "foreign-request-submitted",
  "foreign-segment-matched",
  "public-stream-stale",
  "revision-regressed",
  "default-not-public",
  "项目策略",
  "setDefaultPublicSegment(null)",
  "consoleTested: false",
  "liveTested: false",
]) {
  assert(chinese.includes(expected), `Chinese article lacks ${expected}`);
}

for (const expected of [
  "Screeps RawMemory Foreign Segment: Publish and Read Public Segments Safely",
  "Consume the old response before scheduling the next request",
  "foreign-request-submitted",
  "foreign-segment-matched",
  "public-stream-stale",
  "Official-server foreign publication test",
  "project policy",
  "Pending",
  "EnglishArticlePage",
  "BlogPosting",
  "BreadcrumbList",
]) {
  assert(english.includes(expected), `English page lacks ${expected}`);
}

const registryStart = registry.indexOf(
  'href: "/en/blog/screeps-rawmemory-foreign-segment"',
);
const registryEnd = registryStart >= 0
  ? registry.indexOf("\n  },", registryStart)
  : -1;
const registryEntry = registryStart >= 0 && registryEnd >= 0
  ? registry.slice(registryStart, registryEnd + 5)
  : "";
for (const expected of [
  'chinesePath: "/blog/screeps-rawmemory-foreign-segment"',
  'readingTime: "19 min read"',
  'primaryKeyword: "Screeps RawMemory foreignSegment"',
  "finalScore: 98",
]) {
  assert(
    registryEntry.includes(expected),
    `Foreign Segment registry entry lacks ${expected}`,
  );
}

assert(
  knowledge.includes('"screeps-rawmemory-foreign-segment"'),
  "Chinese knowledge module lacks the foreign-segment slug",
);
assert(
  englishKnowledge.includes(
    '"/en/blog/screeps-rawmemory-foreign-segment": 1',
  ),
  "English knowledge mapping lacks the foreign-segment path",
);
const discoveryStart = discovery.indexOf(
  '"/en/blog/screeps-rawmemory-foreign-segment"',
);
const discoveryEnd = discoveryStart >= 0
  ? discovery.indexOf("],", discoveryStart)
  : -1;
const discoveryEntry = discoveryStart >= 0 && discoveryEnd >= 0
  ? discovery.slice(discoveryStart, discoveryEnd + 2)
  : "";
assert(
  discoveryEntry.includes('"memory"')
    && discoveryEntry.includes('"automation"')
    && discoveryEntry.includes('"debugging"'),
  "Foreign Segment discovery override is incomplete",
);
assert(
  smokeAll.includes(
    'await import("./smoke-english-foreign-segment-21.mjs");',
  ),
  "Aggregate production smoke lacks the foreign-segment batch",
);

const chineseBlocks = [
  ...chinese.matchAll(/```js\n([\s\S]*?)```/g),
].map((match) => match[1]);
const englishBlocks = [
  ...english.matchAll(
    /<pre><code class="language-javascript">([\s\S]*?)<\/code><\/pre>/g,
  ),
].map((match) => match[1]
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">")
  .replaceAll("&amp;", "&"));

assert(
  chineseBlocks.length >= 14,
  `Chinese JavaScript block count is only ${chineseBlocks.length}`,
);
assert(
  englishBlocks.length >= 14,
  `English JavaScript block count is only ${englishBlocks.length}`,
);

const tempDirectory = fs.mkdtempSync(
  path.join(os.tmpdir(), "foreign-segment-21-"),
);
try {
  [...chineseBlocks, ...englishBlocks].forEach((code, index) => {
    const filePath = path.join(
      tempDirectory,
      `block-${index + 1}.js`,
    );
    fs.writeFileSync(filePath, code, "utf8");
    const result = spawnSync(
      process.execPath,
      ["--check", filePath],
      { encoding: "utf8" },
    );

    assert(
      result.status === 0,
      `JavaScript block ${index + 1} failed syntax: ${result.stderr.trim()}`,
    );
  });
} finally {
  fs.rmSync(tempDirectory, {
    recursive: true,
    force: true,
  });
}

function utf8ByteLength(value) {
  const text = String(value);
  let bytes = 0;

  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);

    if (code < 0x80) bytes += 1;
    else if (code < 0x800) bytes += 2;
    else if (
      code >= 0xD800
      && code <= 0xDBFF
      && index + 1 < text.length
      && text.charCodeAt(index + 1) >= 0xDC00
      && text.charCodeAt(index + 1) <= 0xDFFF
    ) {
      bytes += 4;
      index += 1;
    } else bytes += 3;
  }

  return bytes;
}

assert(utf8ByteLength("abc") === 3, "ASCII byte count failed");
assert(utf8ByteLength("中") === 3, "Chinese byte count failed");
assert(utf8ByteLength("😀") === 4, "Emoji byte count failed");
assert(
  utf8ByteLength("a中😀") === 8,
  "Mixed UTF-8 byte count failed",
);

function normalizePublicSegmentIds(ids) {
  if (!Array.isArray(ids)) return null;

  if (!ids.every(id =>
    Number.isInteger(id)
    && id >= 0
    && id <= 99
  )) {
    return null;
  }

  return [...new Set(ids)]
    .sort((left, right) => left - right);
}

assert(
  JSON.stringify(normalizePublicSegmentIds([5, 3]))
    === JSON.stringify([3, 5]),
  "Public IDs were not sorted",
);
assert(
  JSON.stringify(normalizePublicSegmentIds([3, 3]))
    === JSON.stringify([3]),
  "Duplicate public IDs were not normalized",
);
assert(
  normalizePublicSegmentIds([-1]) === null,
  "Negative public ID was not rejected",
);
assert(
  normalizePublicSegmentIds([100]) === null,
  "ID above 99 was not rejected",
);
assert(
  normalizePublicSegmentIds(["3"]) === null,
  "String public ID was not rejected",
);
assert(
  JSON.stringify(normalizePublicSegmentIds([])) === "[]",
  "Empty public list was not accepted",
);

function applyPolicy({ publicIds, defaultId }) {
  const normalized = normalizePublicSegmentIds(publicIds);
  if (!normalized) return { status: "invalid-public-list" };

  if (
    defaultId !== null
    && (
      !Number.isInteger(defaultId)
      || !normalized.includes(defaultId)
    )
  ) {
    return { status: "default-not-public" };
  }

  return {
    status: "public-policy-submitted",
    publicIds: normalized,
    defaultId,
  };
}

assert(
  applyPolicy({
    publicIds: [5, 20, 21],
    defaultId: 5,
  }).status === "public-policy-submitted",
  "Valid public policy failed",
);
assert(
  applyPolicy({
    publicIds: [5, 20],
    defaultId: 21,
  }).status === "default-not-public",
  "Non-public default was not rejected",
);
assert(
  applyPolicy({
    publicIds: [],
    defaultId: null,
  }).status === "public-policy-submitted",
  "Empty policy clear failed",
);
assert(
  applyPolicy({
    publicIds: [5],
    defaultId: undefined,
  }).status === "default-not-public",
  "Undefined default was not rejected",
);

function normalizeForeignRequest(input) {
  if (
    !input
    || typeof input.username !== "string"
    || input.username.trim() === ""
  ) {
    return { status: "invalid-username" };
  }

  if (
    input.id !== undefined
    && (
      !Number.isInteger(input.id)
      || input.id < 0
      || input.id > 99
    )
  ) {
    return { status: "invalid-segment-id" };
  }

  return {
    status: "valid",
    request: {
      username: input.username.trim(),
      id: input.id,
      mode: input.id === undefined
        ? "default"
        : "explicit",
    },
  };
}

assert(
  normalizeForeignRequest({
    username: " player ",
    id: 10,
  }).request.username === "player",
  "Username trim failed",
);
assert(
  normalizeForeignRequest({
    username: "player",
  }).request.mode === "default",
  "Default request mode failed",
);
assert(
  normalizeForeignRequest({
    username: "player",
    id: 0,
  }).request.mode === "explicit",
  "Explicit ID zero failed",
);
assert(
  normalizeForeignRequest({
    username: "",
    id: 1,
  }).status === "invalid-username",
  "Empty username was not rejected",
);
assert(
  normalizeForeignRequest({
    username: "player",
    id: null,
  }).status === "invalid-segment-id",
  "Null ID was not rejected",
);
assert(
  normalizeForeignRequest({
    username: "player",
    id: 100,
  }).status === "invalid-segment-id",
  "Foreign ID above 99 was not rejected",
);

function matchForeignSegment(pending, foreignSegment) {
  if (!pending) return { status: "no-pending-request" };
  if (
    !foreignSegment
    || typeof foreignSegment !== "object"
  ) {
    return { status: "foreign-segment-unavailable" };
  }
  if (foreignSegment.username !== pending.username) {
    return { status: "username-mismatch" };
  }
  if (
    pending.mode === "explicit"
    && foreignSegment.id !== pending.id
  ) {
    return { status: "segment-id-mismatch" };
  }
  return {
    status: "foreign-segment-matched",
    username: foreignSegment.username,
    segmentId: foreignSegment.id,
    data: foreignSegment.data,
    mode: pending.mode,
  };
}

const explicitPending = {
  username: "player",
  id: 10,
  mode: "explicit",
};
assert(
  matchForeignSegment(
    explicitPending,
    { username: "player", id: 10, data: "{}" },
  ).status === "foreign-segment-matched",
  "Explicit match failed",
);
assert(
  matchForeignSegment(
    explicitPending,
    { username: "other", id: 10, data: "{}" },
  ).status === "username-mismatch",
  "Username mismatch failed",
);
assert(
  matchForeignSegment(
    explicitPending,
    { username: "player", id: 11, data: "{}" },
  ).status === "segment-id-mismatch",
  "Explicit ID mismatch failed",
);
assert(
  matchForeignSegment(
    { username: "player", mode: "default" },
    { username: "player", id: 21, data: "{}" },
  ).segmentId === 21,
  "Default request did not retain observed ID",
);
assert(
  matchForeignSegment(null, null).status
    === "no-pending-request",
  "No-pending state failed",
);
assert(
  matchForeignSegment(explicitPending, null).status
    === "foreign-segment-unavailable",
  "Unavailable state failed",
);

function parseEnvelope(raw, expectedPublisher, expectedId) {
  if (typeof raw !== "string") {
    return { status: "invalid-data-type", envelope: null };
  }
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    return { status: "invalid-json", envelope: null };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { status: "invalid-envelope", envelope: null };
  }
  if (value.schemaVersion !== 1) {
    return { status: "unsupported-schema", envelope: null };
  }
  if (value.publisher !== expectedPublisher) {
    return { status: "publisher-mismatch", envelope: null };
  }
  if (value.segmentId !== expectedId) {
    return {
      status: "envelope-segment-mismatch",
      envelope: null,
    };
  }
  if (
    typeof value.publisherEpoch !== "string"
    || value.publisherEpoch === ""
    || !Number.isInteger(value.revision)
    || value.revision < 0
  ) {
    return {
      status: "invalid-version-fields",
      envelope: null,
    };
  }
  return { status: "valid", envelope: value };
}

const valid = {
  schemaVersion: 1,
  publisher: "player",
  segmentId: 10,
  publisherEpoch: "player:100",
  revision: 3,
  updatedAt: 120,
  payload: { rooms: ["W1N1"] },
};
assert(
  parseEnvelope(
    JSON.stringify(valid),
    "player",
    10,
  ).status === "valid",
  "Valid envelope failed",
);
assert(
  parseEnvelope("{", "player", 10).status === "invalid-json",
  "Invalid JSON state failed",
);
assert(
  parseEnvelope("[]", "player", 10).status
    === "invalid-envelope",
  "Array envelope was not rejected",
);
assert(
  parseEnvelope(
    JSON.stringify({ ...valid, schemaVersion: 2 }),
    "player",
    10,
  ).status === "unsupported-schema",
  "Unsupported schema failed",
);
assert(
  parseEnvelope(
    JSON.stringify(valid),
    "other",
    10,
  ).status === "publisher-mismatch",
  "Publisher mismatch failed",
);
assert(
  parseEnvelope(
    JSON.stringify(valid),
    "player",
    11,
  ).status === "envelope-segment-mismatch",
  "Envelope segment mismatch failed",
);
assert(
  parseEnvelope(
    JSON.stringify({ ...valid, publisherEpoch: "" }),
    "player",
    10,
  ).status === "invalid-version-fields",
  "Empty epoch was not rejected",
);
assert(
  parseEnvelope(
    JSON.stringify({ ...valid, revision: -1 }),
    "player",
    10,
  ).status === "invalid-version-fields",
  "Negative revision was not rejected",
);

function observe({
  previous,
  envelope,
  observedSegmentId,
  now,
  maxSilentTicks = 100,
}) {
  const streamChanged =
    !previous
    || previous.publisherEpoch !== envelope.publisherEpoch
    || previous.segmentId !== observedSegmentId;

  if (
    !streamChanged
    && envelope.revision < previous.revision
  ) {
    return {
      status: "revision-regressed",
      state: previous,
    };
  }

  const advanced =
    streamChanged
    || envelope.revision > previous.revision;
  const next = {
    publisherEpoch: envelope.publisherEpoch,
    segmentId: observedSegmentId,
    revision: envelope.revision,
    lastCheckedAt: now,
    lastAdvancedAt: advanced
      ? now
      : previous.lastAdvancedAt,
  };

  if (
    !advanced
    && now - next.lastAdvancedAt > maxSilentTicks
  ) {
    return {
      status: "public-stream-stale",
      state: next,
      silentTicks: now - next.lastAdvancedAt,
    };
  }

  return {
    status: streamChanged
      ? "public-stream-started"
      : advanced
        ? "public-stream-advanced"
        : "public-stream-unchanged",
    state: next,
    silentTicks: now - next.lastAdvancedAt,
  };
}

const started = observe({
  previous: null,
  envelope: valid,
  observedSegmentId: 10,
  now: 200,
});
assert(
  started.status === "public-stream-started",
  "Initial stream start failed",
);
const unchanged = observe({
  previous: started.state,
  envelope: valid,
  observedSegmentId: 10,
  now: 250,
});
assert(
  unchanged.status === "public-stream-unchanged"
  && unchanged.silentTicks === 50,
  "Unchanged stream state failed",
);
const advanced = observe({
  previous: unchanged.state,
  envelope: { ...valid, revision: 4 },
  observedSegmentId: 10,
  now: 260,
});
assert(
  advanced.status === "public-stream-advanced"
  && advanced.state.lastAdvancedAt === 260,
  "Advanced stream state failed",
);
const stale = observe({
  previous: advanced.state,
  envelope: { ...valid, revision: 4 },
  observedSegmentId: 10,
  now: 361,
  maxSilentTicks: 100,
});
assert(
  stale.status === "public-stream-stale"
  && stale.silentTicks === 101,
  "Stale stream state failed",
);
const regressed = observe({
  previous: advanced.state,
  envelope: { ...valid, revision: 2 },
  observedSegmentId: 10,
  now: 270,
});
assert(
  regressed.status === "revision-regressed",
  "Revision regression failed",
);
const restarted = observe({
  previous: advanced.state,
  envelope: {
    ...valid,
    publisherEpoch: "player:500",
    revision: 0,
  },
  observedSegmentId: 10,
  now: 500,
});
assert(
  restarted.status === "public-stream-started",
  "Publisher restart was not treated as a new stream",
);
const defaultChanged = observe({
  previous: advanced.state,
  envelope: {
    ...valid,
    segmentId: 20,
    revision: 0,
  },
  observedSegmentId: 20,
  now: 300,
});
assert(
  defaultChanged.status === "public-stream-started",
  "Default segment ID change was not a new stream",
);

function rotate(subscriptions, cursor) {
  if (
    !Array.isArray(subscriptions)
    || subscriptions.length === 0
  ) {
    return {
      status: "no-subscriptions",
      nextCursor: 0,
      subscription: null,
    };
  }
  const safeCursor =
    Number.isInteger(cursor) ? Math.max(0, cursor) : 0;
  const index = safeCursor % subscriptions.length;
  return {
    status: "subscription-selected",
    nextCursor: (index + 1) % subscriptions.length,
    subscription: subscriptions[index],
  };
}

const subscriptions = [
  { username: "a", id: 1 },
  { username: "b" },
  { username: "c", id: 3 },
];
assert(
  rotate(subscriptions, 0).subscription.username === "a",
  "Rotation index zero failed",
);
assert(
  rotate(subscriptions, 1).subscription.username === "b",
  "Rotation index one failed",
);
assert(
  rotate(subscriptions, 2).nextCursor === 0,
  "Rotation wrap failed",
);
assert(
  rotate(subscriptions, -2).subscription.username === "a",
  "Negative cursor normalization failed",
);
assert(
  rotate([], 4).status === "no-subscriptions",
  "Empty rotation failed",
);

function createWriter({
  activeIds,
  segmentId,
  envelope,
  safeLimit = 96 * 1024,
}) {
  if (!activeIds.includes(segmentId)) {
    return { status: "segment-not-active" };
  }
  const serialized = JSON.stringify(envelope);
  const byteLength = utf8ByteLength(serialized);
  if (byteLength > safeLimit) {
    return { status: "payload-too-large", byteLength };
  }
  return {
    status: "local-segment-write-staged",
    serialized,
    byteLength,
  };
}

assert(
  createWriter({
    activeIds: [10],
    segmentId: 10,
    envelope: valid,
  }).status === "local-segment-write-staged",
  "Active local writer failed",
);
assert(
  createWriter({
    activeIds: [],
    segmentId: 10,
    envelope: valid,
  }).status === "segment-not-active",
  "Inactive writer was not blocked",
);
assert(
  createWriter({
    activeIds: [10],
    segmentId: 10,
    envelope: {
      ...valid,
      payload: "中".repeat(100),
    },
    safeLimit: 100,
  }).status === "payload-too-large",
  "Oversized writer was not blocked",
);

const coordinatorCalls = [];
function submit(request) {
  coordinatorCalls.push(request);
  return "foreign-request-submitted";
}
function finalize(state, subscriptionsInput, foreign) {
  const previousMatch = matchForeignSegment(
    state.pending,
    foreign,
  );
  const selected = rotate(
    subscriptionsInput,
    state.cursor,
  );
  if (!selected.subscription) {
    state.pending = null;
    return {
      previousMatch,
      nextRequest: "no-subscriptions",
    };
  }
  const normalized = normalizeForeignRequest(
    selected.subscription,
  );
  if (normalized.status !== "valid") {
    state.pending = null;
    state.cursor = selected.nextCursor;
    return {
      previousMatch,
      nextRequest: normalized.status,
    };
  }
  const status = submit(normalized.request);
  state.cursor = selected.nextCursor;
  state.pending = normalized.request;
  return { previousMatch, nextRequest: status };
}

const state = { cursor: 0, pending: null };
const firstFinalize = finalize(
  state,
  subscriptions,
  null,
);
assert(
  firstFinalize.nextRequest === "foreign-request-submitted",
  "First coordinator submission failed",
);
assert(
  state.pending.username === "a"
  && state.cursor === 1,
  "Coordinator did not persist first request",
);
const secondFinalize = finalize(
  state,
  subscriptions,
  { username: "a", id: 1, data: "{}" },
);
assert(
  secondFinalize.previousMatch.status
    === "foreign-segment-matched",
  "Coordinator did not consume previous response",
);
assert(
  state.pending.username === "b"
  && state.cursor === 2,
  "Coordinator did not rotate to second subscription",
);
assert(
  coordinatorCalls.length === 2,
  "Coordinator submitted more or fewer than one request per tick",
);

const callsBeforeInvalidSubscription = coordinatorCalls.length;
const invalidSubscriptionState = { cursor: 0, pending: null };
const invalidThenValidSubscriptions = [
  { username: "", id: 1 },
  { username: "good", id: 2 },
];
const invalidSubscriptionResult = finalize(
  invalidSubscriptionState,
  invalidThenValidSubscriptions,
  null,
);
assert(
  invalidSubscriptionResult.nextRequest === "invalid-username",
  "Invalid subscription was not surfaced",
);
assert(
  invalidSubscriptionState.cursor === 1
  && invalidSubscriptionState.pending === null,
  "Invalid subscription did not advance the queue cursor",
);
const validAfterInvalidResult = finalize(
  invalidSubscriptionState,
  invalidThenValidSubscriptions,
  null,
);
assert(
  validAfterInvalidResult.nextRequest === "foreign-request-submitted"
  && invalidSubscriptionState.pending.username === "good",
  "Valid subscription after an invalid entry was starved",
);
assert(
  invalidSubscriptionState.cursor === 0,
  "Queue did not wrap after recovering from an invalid subscription",
);
assert(
  coordinatorCalls.length === callsBeforeInvalidSubscription + 1,
  "Invalid subscription unexpectedly submitted a foreign request",
);

if (failures.length > 0) {
  failures.forEach((failure) =>
    console.error(`ERROR: ${failure}`),
  );
  console.error(
    `\nRawMemory foreign-segment simulation failed: ${failures.length} finding(s) across ${assertions} assertions.`,
  );
  process.exit(1);
}

console.log(
  `RawMemory foreign-segment simulation passed: ${chineseBlocks.length} Chinese blocks, ${englishBlocks.length} English blocks, ${assertions} deterministic assertions.`,
);
