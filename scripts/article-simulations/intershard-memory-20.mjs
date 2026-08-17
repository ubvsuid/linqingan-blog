import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const chinesePath = path.join(
  root,
  "content/posts/screeps-intershardmemory-sync.md",
);
const englishPath = path.join(
  root,
  "src/app/(en)/en/blog/screeps-intershardmemory-sync/page.tsx",
);
const registryPath = path.join(
  root,
  "src/lib/english-link-source-registry-18.ts",
);
const knowledgePath = path.join(
  root,
  "src/lib/knowledge-base.ts",
);
const discoveryPath = path.join(
  root,
  "src/lib/english-discovery-topic-overrides-20260806.ts",
);

const chinese = fs.readFileSync(chinesePath, "utf8");
const english = fs.readFileSync(englishPath, "utf8");
const registry = fs.readFileSync(registryPath, "utf8");
const knowledge = fs.readFileSync(knowledgePath, "utf8");
const discovery = fs.readFileSync(discoveryPath, "utf8");
const failures = [];
let assertions = 0;

function assert(condition, message) {
  assertions += 1;
  if (!condition) failures.push(message);
}

for (const expected of [
  "Screeps InterShardMemory 怎么用",
  "writerEpoch",
  "revision-regressed",
  "channel-stale",
  "local-write-called",
  "payload-too-large",
  "consoleTested: false",
  "liveTested: false",
]) {
  assert(chinese.includes(expected), `Chinese article lacks ${expected}`);
}

for (const expected of [
  "Screeps InterShardMemory: Versioned Cross-Shard State Without Remote Writes",
  "Use a local observation window",
  "writerEpoch",
  "revision-regressed",
  "channel-stale",
  "Screeps Console test",
  "Official-shard propagation test",
  "Pending",
  "EnglishArticlePage",
  "BlogPosting",
]) {
  assert(english.includes(expected), `English page lacks ${expected}`);
}

const registryStart = registry.indexOf(
  'href: "/en/blog/screeps-intershardmemory-sync"',
);
const registryEnd = registryStart >= 0
  ? registry.indexOf("\n  },", registryStart)
  : -1;
const registryEntry = registryStart >= 0 && registryEnd >= 0
  ? registry.slice(registryStart, registryEnd + 5)
  : "";
assert(
  Boolean(registryEntry),
  "English registry lacks the InterShardMemory entry",
);
for (const expected of [
  'chinesePath: "/blog/screeps-intershardmemory-sync"',
  'readingTime: "19 min read"',
  "finalScore: 98",
]) {
  assert(
    registryEntry.includes(expected),
    `InterShardMemory registry entry lacks ${expected}`,
  );
}

assert(
  chinese.includes("writer-epoch-unavailable")
    && english.includes("writer-epoch-unavailable"),
  "Both article variants must expose the writer epoch failure state",
);

assert(
  knowledge.includes('"screeps-intershardmemory-sync"'),
  "Chinese knowledge module lacks the InterShardMemory slug",
);
const discoveryStart = discovery.indexOf(
  '"/en/blog/screeps-intershardmemory-sync"',
);
const discoveryEnd = discoveryStart >= 0
  ? discovery.indexOf("],", discoveryStart)
  : -1;
const discoveryOverride = discoveryStart >= 0 && discoveryEnd >= 0
  ? discovery.slice(discoveryStart, discoveryEnd + 2)
  : "";
assert(
  Boolean(discoveryOverride),
  "English discovery lacks the InterShardMemory override block",
);
for (const tag of ["memory", "automation", "debugging"]) {
  assert(
    discoveryOverride.includes(`"${tag}"`),
    `InterShardMemory discovery override lacks the ${tag} topic`,
  );
}

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
  chineseBlocks.length >= 12,
  `Chinese JavaScript block count is only ${chineseBlocks.length}`,
);
assert(
  englishBlocks.length >= 12,
  `English JavaScript block count is only ${englishBlocks.length}`,
);

const tempDirectory = fs.mkdtempSync(
  path.join(os.tmpdir(), "intershard-memory-20-"),
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

function parseEnvelope(raw, expectedShard) {
  if (raw == null || raw === "") return { status: "empty", envelope: null };
  if (typeof raw !== "string") {
    return { status: "invalid-raw-type", envelope: null };
  }

  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    return { status: "invalid-json", envelope: null };
  }

  if (
    !value
    || typeof value !== "object"
    || Array.isArray(value)
  ) {
    return { status: "invalid-envelope", envelope: null };
  }
  if (value.schemaVersion !== 1) {
    return { status: "unsupported-schema", envelope: null };
  }
  if (value.sourceShard !== expectedShard) {
    return {
      status: "source-shard-mismatch",
      envelope: null,
    };
  }
  if (
    typeof value.writerEpoch !== "string"
    || value.writerEpoch === ""
    || !Number.isInteger(value.revision)
    || value.revision < 0
    || !value.channels
    || typeof value.channels !== "object"
    || Array.isArray(value.channels)
  ) {
    return {
      status: "invalid-envelope-fields",
      envelope: null,
    };
  }
  return { status: "valid", envelope: value };
}

const validEnvelope = {
  schemaVersion: 1,
  sourceShard: "shard0",
  writerEpoch: "shard0:100",
  revision: 2,
  writtenAtTick: 150,
  channels: {
    empireStatus: {
      revision: 3,
      updatedAtTick: 150,
      value: { rooms: ["W1N1"] },
    },
  },
};

assert(parseEnvelope("", "shard0").status === "empty", "Empty string state failed");
assert(parseEnvelope(null, "shard0").status === "empty", "Null state failed");
assert(parseEnvelope(undefined, "shard0").status === "empty", "Undefined state failed");
assert(
  parseEnvelope(123, "shard0").status === "invalid-raw-type",
  "Non-string invalid raw type failed",
);
assert(
  parseEnvelope("{", "shard0").status === "invalid-json",
  "Invalid JSON state failed",
);
assert(
  parseEnvelope("[]", "shard0").status === "invalid-envelope",
  "Array envelope state failed",
);
assert(
  parseEnvelope(
    JSON.stringify({ ...validEnvelope, schemaVersion: 2 }),
    "shard0",
  ).status === "unsupported-schema",
  "Unsupported schema state failed",
);
assert(
  parseEnvelope(
    JSON.stringify(validEnvelope),
    "shard1",
  ).status === "source-shard-mismatch",
  "Source mismatch state failed",
);
assert(
  parseEnvelope(
    JSON.stringify({ ...validEnvelope, writerEpoch: "" }),
    "shard0",
  ).status === "invalid-envelope-fields",
  "Invalid writer epoch state failed",
);
assert(
  parseEnvelope(
    JSON.stringify(validEnvelope),
    "shard0",
  ).status === "valid",
  "Valid envelope state failed",
);

function publishChannel({
  localRaw,
  shardName,
  now,
  channelName,
  value,
  safeLimit = 96 * 1024,
}) {
  const parsed = parseEnvelope(localRaw, shardName);
  let envelope;

  if (parsed.status === "valid") envelope = parsed.envelope;
  else if (parsed.status === "empty") {
    if (!Number.isInteger(now)) {
      return {
        status: "writer-epoch-unavailable",
        called: false,
      };
    }
    envelope = {
      schemaVersion: 1,
      sourceShard: shardName,
      writerEpoch: shardName + ":" + now,
      revision: 0,
      writtenAtTick: now,
      channels: {},
    };
  } else {
    return {
      status: "local-data-invalid",
      reason: parsed.status,
      called: false,
    };
  }

  const previous = envelope.channels[channelName];
  const channelRevision = Number.isInteger(previous?.revision)
    ? previous.revision + 1
    : 1;
  const next = {
    ...envelope,
    revision: envelope.revision + 1,
    writtenAtTick: now,
    channels: {
      ...envelope.channels,
      [channelName]: {
        revision: channelRevision,
        updatedAtTick: now,
        value,
      },
    },
  };
  const serialized = JSON.stringify(next);
  const byteLength = utf8ByteLength(serialized);

  if (byteLength > safeLimit) {
    return {
      status: "payload-too-large",
      called: false,
      byteLength,
    };
  }

  return {
    status: "local-write-called",
    called: true,
    serialized,
    envelope: next,
    channelRevision,
  };
}

const firstWrite = publishChannel({
  localRaw: "",
  shardName: "shard0",
  now: 100,
  channelName: "empireStatus",
  value: { rooms: ["W1N1"] },
});
assert(
  firstWrite.status === "local-write-called"
  && firstWrite.envelope.revision === 1
  && firstWrite.channelRevision === 1,
  "First local publication failed",
);

const secondWrite = publishChannel({
  localRaw: firstWrite.serialized,
  shardName: "shard0",
  now: 101,
  channelName: "empireStatus",
  value: { rooms: ["W1N1", "W2N2"] },
});
assert(
  secondWrite.envelope.writerEpoch
    === firstWrite.envelope.writerEpoch,
  "Existing writer epoch was not preserved",
);
assert(
  secondWrite.envelope.revision === 2
  && secondWrite.channelRevision === 2,
  "Revision advancement failed",
);

const preservedWrite = publishChannel({
  localRaw: JSON.stringify({
    ...validEnvelope,
    channels: {
      ...validEnvelope.channels,
      alerts: {
        revision: 4,
        updatedAtTick: 140,
        value: { active: true },
      },
    },
  }),
  shardName: "shard0",
  now: 151,
  channelName: "empireStatus",
  value: { rooms: ["W3N3"] },
});
assert(
  preservedWrite.envelope.channels.alerts.revision === 4,
  "Publishing one channel removed another channel",
);

const invalidWrite = publishChannel({
  localRaw: "{",
  shardName: "shard0",
  now: 100,
  channelName: "x",
  value: {},
});
assert(
  invalidWrite.status === "local-data-invalid"
  && invalidWrite.called === false,
  "Damaged local data was not protected",
);

const missingEpochWrite = publishChannel({
  localRaw: "",
  shardName: "shard0",
  now: null,
  channelName: "x",
  value: {},
});
assert(
  missingEpochWrite.status === "writer-epoch-unavailable"
  && missingEpochWrite.called === false,
  "Invalid writer epoch was not rejected",
);

const oversized = publishChannel({
  localRaw: "",
  shardName: "shard0",
  now: 100,
  channelName: "x",
  value: { payload: "中".repeat(100) },
  safeLimit: 100,
});
assert(
  oversized.status === "payload-too-large"
  && oversized.called === false,
  "Oversized publication was not rejected",
);

function observe({
  previous,
  result,
  now,
  maxSilentTicks = 100,
}) {
  if (result.status !== "channel-read") return result;

  const streamChanged =
    !previous
    || previous.writerEpoch !== result.writerEpoch;

  if (
    !streamChanged
    && result.channelRevision < previous.channelRevision
  ) {
    return {
      status: "revision-regressed",
      state: previous,
    };
  }

  const advanced =
    streamChanged
    || result.channelRevision > previous.channelRevision;
  const state = {
    writerEpoch: result.writerEpoch,
    channelRevision: result.channelRevision,
    lastCheckedAt: now,
    lastAdvancedAt: advanced
      ? now
      : previous.lastAdvancedAt,
  };

  if (
    !advanced
    && now - state.lastAdvancedAt > maxSilentTicks
  ) {
    return {
      status: "channel-stale",
      state,
    };
  }

  return {
    status: streamChanged
      ? "stream-started"
      : advanced
        ? "channel-advanced"
        : "channel-unchanged",
    state,
  };
}

const baseRemote = {
  status: "channel-read",
  writerEpoch: "shard1:10",
  channelRevision: 1,
};
const started = observe({
  previous: null,
  result: baseRemote,
  now: 20,
});
assert(started.status === "stream-started", "Stream start failed");

const unchanged = observe({
  previous: started.state,
  result: baseRemote,
  now: 30,
});
assert(
  unchanged.status === "channel-unchanged"
  && unchanged.state.lastAdvancedAt === 20,
  "Unchanged channel state failed",
);

const stale = observe({
  previous: unchanged.state,
  result: baseRemote,
  now: 121,
  maxSilentTicks: 100,
});
assert(stale.status === "channel-stale", "Stale state failed");

const advanced = observe({
  previous: unchanged.state,
  result: { ...baseRemote, channelRevision: 2 },
  now: 31,
});
assert(
  advanced.status === "channel-advanced"
  && advanced.state.lastAdvancedAt === 31,
  "Channel advancement failed",
);

const restarted = observe({
  previous: advanced.state,
  result: {
    ...baseRemote,
    writerEpoch: "shard1:200",
    channelRevision: 0,
  },
  now: 40,
});
assert(
  restarted.status === "stream-started"
  && restarted.state.channelRevision === 0,
  "Writer epoch restart failed",
);

const regressed = observe({
  previous: advanced.state,
  result: { ...baseRemote, channelRevision: 0 },
  now: 40,
});
assert(
  regressed.status === "revision-regressed",
  "Same-epoch revision regression failed",
);

function acknowledge(offer, creep, currentShard) {
  if (
    !offer
    || offer.targetShard !== currentShard
    || !creep
    || creep.my !== true
    || creep.name !== offer.creepName
  ) {
    return "handoff-not-confirmed";
  }
  return "acknowledgement-ready";
}

const offer = {
  targetShard: "shard1",
  creepName: "Traveler1",
};
assert(
  acknowledge(offer, { name: "Traveler1", my: true }, "shard1")
    === "acknowledgement-ready",
  "Exact handoff acknowledgement failed",
);
assert(
  acknowledge(offer, { name: "Other", my: true }, "shard1")
    === "handoff-not-confirmed",
  "Wrong Creep identity was acknowledged",
);
assert(
  acknowledge(offer, { name: "Traveler1", my: true }, "shard2")
    === "handoff-not-confirmed",
  "Wrong target shard was acknowledged",
);
assert(
  acknowledge(offer, { name: "Traveler1", my: false }, "shard1")
    === "handoff-not-confirmed",
  "Non-owned Creep was acknowledged",
);

function pruneRecordMap(records, maxRecords = 32) {
  const entries = Object.entries(records).sort((left, right) => {
    const leftTick = left[1]?.updatedAtTick
      ?? left[1]?.observedAtTick
      ?? left[1]?.offeredAtTick
      ?? 0;
    const rightTick = right[1]?.updatedAtTick
      ?? right[1]?.observedAtTick
      ?? right[1]?.offeredAtTick
      ?? 0;
    return rightTick - leftTick || left[0].localeCompare(right[0]);
  });
  return Object.fromEntries(entries.slice(0, maxRecords));
}

const priorAcknowledgements = {
  older: { observedAtTick: 10 },
  recent: { observedAtTick: 30 },
};
const mergedAcknowledgements = pruneRecordMap({
  ...priorAcknowledgements,
  newest: { observedAtTick: 40 },
}, 2);
assert(
  Boolean(mergedAcknowledgements.newest)
    && Boolean(mergedAcknowledgements.recent)
    && !mergedAcknowledgements.older,
  "Acknowledgement merge/prune did not preserve the two newest records",
);

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(
    `\nInterShardMemory simulation failed: ${failures.length} finding(s), ${assertions} assertions.`,
  );
  process.exit(1);
}

console.log(
  `InterShardMemory simulation passed: ${chineseBlocks.length} Chinese and ${englishBlocks.length} English JavaScript blocks, ${assertions} assertions, versioned envelopes, UTF-8 limits, writer epochs, revisions, local freshness, and handoff identity boundaries.`,
);
