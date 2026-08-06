import type { Metadata } from "next";

import { EnglishArticlePage } from "@/components/english-article-page";
import { getEnglishDiscoveryArticle } from "@/lib/english-discovery";
import { siteConfig } from "@/lib/site";

const path = "/en/blog/screeps-intershardmemory-sync";
const chinesePath = "/blog/screeps-intershardmemory-sync";
const headline =
  "Screeps InterShardMemory: Versioned Cross-Shard State Without Remote Writes";
const description =
  "Publish versioned shard-owned channels, validate remote strings, enforce a UTF-8 byte budget, detect writer restarts and revision regressions, and measure freshness with local observation windows.";
const publishedAt = "2026-08-06";
const publishedLabel = "August 6, 2026";
const modifiedTime = "2026-08-06";
const discovery = getEnglishDiscoveryArticle(path);
const articleUrl = `${siteConfig.url}${path}`;

export const metadata: Metadata = {
  title: { absolute: `${headline} | Linqingan` },
  description,
  keywords: [
    "Screeps InterShardMemory",
    "Screeps cross shard Memory",
    "InterShardMemory getRemote",
    "InterShardMemory setLocal",
    "Screeps shard state synchronization",
  ],
  alternates: {
    canonical: path,
    languages: {
      en: path,
      "zh-CN": chinesePath,
      "x-default": path,
    },
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
    tags: discovery?.tags ?? ["Memory", "InterShardMemory", "Automation"],
    images: [
      {
        url: `${siteConfig.url}${path}/opengraph-image`,
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${headline} | Linqingan`,
    description,
    images: [`${siteConfig.url}${path}/opengraph-image`],
  },
};

const toc: Array<[string, string]> = [
  ["quick-answer", "Quick answer"],
  ["storage-boundary", "Separate Memory, Segments, and InterShardMemory"],
  ["writer-epoch", "Create a writer epoch for stream restarts"],
  ["byte-budget", "Measure UTF-8 bytes before setLocal()"],
  ["envelope", "Define one versioned envelope"],
  ["parse", "Parse without erasing damaged evidence"],
  ["local-write", "Load and publish the local document"],
  ["remote-read", "Read a remote channel as read-only data"],
  ["freshness", "Use a local observation window"],
  ["handoff", "Use offer and acknowledgement channels"],
  ["bounded-history", "Keep the publication bounded"],
  ["complete-loop", "Build the complete publication loop"],
  ["failure-modes", "Common failure modes"],
  ["evidence", "Evidence and production boundary"],
];

const articleHtml = String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Treat <code>InterShardMemory</code> as one versioned, shard-owned publication per shard. The current shard may replace only its own string; other shards can read that string but cannot edit it. Put a schema version, source shard, writer epoch, envelope revision, and channel revisions around the data, enforce a conservative UTF-8 byte budget, and keep remote freshness in the receiver's local <code>Memory</code>.</p>
<p>Do not subtract a remote <code>writtenAtTick</code> from the local <code>Game.time</code> unless you have separately proven that clock relationship. The official API documents isolated shard execution and storage, but it does not promise one shared tick clock for application-level freshness decisions.</p>
<h2 id="storage-boundary">Separate Memory, Segments, and InterShardMemory</h2>
<table>
<thead><tr><th>Container</th><th>Write scope</th><th>Primary use</th></tr></thead>
<tbody>
<tr><td><code>Memory</code></td><td>Current shard</td><td>Frequently used persistent state</td></tr>
<tr><td><code>RawMemory.segments</code></td><td>Current shard</td><td>Large data activated on demand</td></tr>
<tr><td><code>InterShardMemory</code></td><td>Current shard writes its own string; remote strings are read-only</td><td>Cross-shard state exchange</td></tr>
</tbody>
</table>
<p>The API currently gives every shard a separate 100 KB string. <code>setLocal()</code> replaces the whole local string, so one coordinator must merge all channel updates before writing.</p>
<h2 id="writer-epoch">Create a writer epoch for stream restarts</h2>
<pre><code class="language-javascript">function createWriterEpoch(shardName, now) {
  if (
    typeof shardName !== 'string'
    || shardName.trim() === ''
    || !Number.isInteger(now)
  ) {
    return null;
  }

  return shardName + ':' + now;
}</code></pre>
<p>A revision can restart at zero after a local reset or migration. The writer epoch distinguishes a new stream from an invalid revision regression. Reuse the existing epoch while the local envelope is valid; create a new one only when starting a new local stream.</p>
<h2 id="byte-budget">Measure UTF-8 bytes before setLocal()</h2>
<pre><code class="language-javascript">function utf8ByteLength(value) {
  const text = String(value);
  let bytes = 0;

  for (let index = 0; index &lt; text.length; index += 1) {
    const code = text.charCodeAt(index);

    if (code &lt; 0x80) {
      bytes += 1;
    } else if (code &lt; 0x800) {
      bytes += 2;
    } else if (
      code &gt;= 0xD800
      &amp;&amp; code &lt;= 0xDBFF
      &amp;&amp; index + 1 &lt; text.length
      &amp;&amp; text.charCodeAt(index + 1) &gt;= 0xDC00
      &amp;&amp; text.charCodeAt(index + 1) &lt;= 0xDFFF
    ) {
      bytes += 4;
      index += 1;
    } else {
      bytes += 3;
    }
  }

  return bytes;
}</code></pre>
<p>JavaScript string length counts UTF-16 code units, not UTF-8 bytes. Use an exact byte counter and a conservative limit such as 96 KiB rather than publishing at the documented 100 KB edge.</p>
<h2 id="envelope">Define one versioned envelope</h2>
<pre><code class="language-javascript">function createEmptyEnvelope(
  shardName,
  writerEpoch,
  now
) {
  return {
    schemaVersion: 1,
    sourceShard: shardName,
    writerEpoch,
    revision: 0,
    writtenAtTick: now,
    channels: {}
  };
}</code></pre>
<p>The envelope owns global schema and stream identity. Each business channel should also own a monotonically increasing channel revision so unrelated channel updates do not make stale data appear fresh.</p>
<h2 id="parse">Parse without erasing damaged evidence</h2>
<pre><code class="language-javascript">function parseInterShardEnvelope(
  raw,
  expectedShard
) {
  if (raw === '') {
    return {
      status: 'empty',
      envelope: null
    };
  }

  if (typeof raw !== 'string') {
    return {
      status: 'invalid-raw-type',
      envelope: null
    };
  }

  let value;

  try {
    value = JSON.parse(raw);
  } catch {
    return {
      status: 'invalid-json',
      envelope: null
    };
  }

  if (
    !value
    || typeof value !== 'object'
    || Array.isArray(value)
  ) {
    return {
      status: 'invalid-envelope',
      envelope: null
    };
  }

  if (value.schemaVersion !== 1) {
    return {
      status: 'unsupported-schema',
      envelope: null
    };
  }

  if (value.sourceShard !== expectedShard) {
    return {
      status: 'source-shard-mismatch',
      envelope: null
    };
  }

  if (
    typeof value.writerEpoch !== 'string'
    || value.writerEpoch === ''
    || !Number.isInteger(value.revision)
    || value.revision &lt; 0
    || !value.channels
    || typeof value.channels !== 'object'
    || Array.isArray(value.channels)
  ) {
    return {
      status: 'invalid-envelope-fields',
      envelope: null
    };
  }

  return {
    status: 'valid',
    envelope: value
  };
}</code></pre>
<p>Keep empty data, invalid JSON, unsupported schemas, source mismatches, and malformed fields as separate states. Do not turn a damaged local string into an empty object and immediately overwrite it.</p>
<h2 id="local-write">Load and publish the local document</h2>
<pre><code class="language-javascript">function loadLocalEnvelope() {
  const shardName = Game.shard.name;
  const raw = InterShardMemory.getLocal();
  const parsed = parseInterShardEnvelope(
    raw,
    shardName
  );

  if (parsed.status === 'valid') {
    Memory.interShard ??= {};
    Memory.interShard.writerEpoch =
      parsed.envelope.writerEpoch;

    return {
      status: 'loaded',
      envelope: parsed.envelope
    };
  }

  if (parsed.status !== 'empty') {
    return {
      status: 'local-data-invalid',
      reason: parsed.status,
      envelope: null
    };
  }

  Memory.interShard ??= {};
  const writerEpoch = createWriterEpoch(
    shardName,
    Game.time
  );

  Memory.interShard.writerEpoch = writerEpoch;

  return {
    status: 'created-empty',
    envelope: createEmptyEnvelope(
      shardName,
      writerEpoch,
      Game.time
    )
  };
}</code></pre><pre><code class="language-javascript">const INTERSHARD_SAFE_BYTE_LIMIT = 96 * 1024;

function publishLocalChannel(
  channelName,
  nextValue
) {
  if (
    typeof channelName !== 'string'
    || channelName.trim() === ''
  ) {
    return {
      status: 'invalid-channel-name'
    };
  }

  const loaded = loadLocalEnvelope();

  if (!loaded.envelope) {
    return loaded;
  }

  const previousChannel =
    loaded.envelope.channels[channelName];
  const nextChannelRevision =
    Number.isInteger(previousChannel?.revision)
      ? previousChannel.revision + 1
      : 1;

  const nextEnvelope = {
    ...loaded.envelope,
    revision: loaded.envelope.revision + 1,
    writtenAtTick: Game.time,
    channels: {
      ...loaded.envelope.channels,
      [channelName]: {
        revision: nextChannelRevision,
        updatedAtTick: Game.time,
        value: nextValue
      }
    }
  };
  const serialized = JSON.stringify(nextEnvelope);
  const byteLength = utf8ByteLength(serialized);

  if (byteLength &gt; INTERSHARD_SAFE_BYTE_LIMIT) {
    return {
      status: 'payload-too-large',
      byteLength
    };
  }

  InterShardMemory.setLocal(serialized);

  return {
    status: 'local-write-called',
    byteLength,
    envelopeRevision: nextEnvelope.revision,
    channelRevision: nextChannelRevision
  };
}</code></pre>
<p><code>setLocal()</code> has no documented <code>OK</code> return code. The status <code>local-write-called</code> therefore describes only the local function call. It is not evidence that another shard has already observed the new revision.</p>
<h2 id="remote-read">Read a remote channel as read-only data</h2>
<pre><code class="language-javascript">function readRemoteChannel(
  remoteShard,
  channelName
) {
  if (
    typeof remoteShard !== 'string'
    || remoteShard === ''
    || remoteShard === Game.shard.name
  ) {
    return {
      status: 'invalid-remote-shard'
    };
  }

  const raw = InterShardMemory.getRemote(
    remoteShard
  );
  const parsed = parseInterShardEnvelope(
    raw,
    remoteShard
  );

  if (parsed.status !== 'valid') {
    return {
      status: parsed.status,
      remoteShard
    };
  }

  const channel =
    parsed.envelope.channels[channelName];

  if (
    !channel
    || !Number.isInteger(channel.revision)
    || channel.revision &lt; 0
  ) {
    return {
      status: 'channel-missing',
      remoteShard,
      writerEpoch:
        parsed.envelope.writerEpoch
    };
  }

  return {
    status: 'channel-read',
    remoteShard,
    writerEpoch:
      parsed.envelope.writerEpoch,
    envelopeRevision:
      parsed.envelope.revision,
    channelRevision: channel.revision,
    value: channel.value
  };
}</code></pre>
<p>Validate the declared source shard before accepting a remote channel. A shard must never attempt to update another shard's publication; acknowledgements and responses belong in the receiver's own local document.</p>
<h2 id="freshness">Use a local observation window</h2>
<pre><code class="language-javascript">function observeRemoteChannel(
  remoteShard,
  channelName,
  maxSilentTicks = 100
) {
  const result = readRemoteChannel(
    remoteShard,
    channelName
  );

  if (result.status !== 'channel-read') {
    return result;
  }

  Memory.interShardObservers ??= {};
  const key = remoteShard + ':' + channelName;
  const previous =
    Memory.interShardObservers[key];
  const streamChanged =
    !previous
    || previous.writerEpoch
      !== result.writerEpoch;

  if (
    !streamChanged
    &amp;&amp; result.channelRevision
      &lt; previous.channelRevision
  ) {
    return {
      status: 'revision-regressed',
      remoteShard,
      channelName,
      previousRevision:
        previous.channelRevision,
      observedRevision:
        result.channelRevision
    };
  }

  const advanced =
    streamChanged
    || result.channelRevision
      &gt; previous.channelRevision;
  const next = {
    writerEpoch: result.writerEpoch,
    channelRevision:
      result.channelRevision,
    lastCheckedAt: Game.time,
    lastAdvancedAt: advanced
      ? Game.time
      : previous.lastAdvancedAt
  };

  Memory.interShardObservers[key] = next;

  if (
    !advanced
    &amp;&amp; Game.time - next.lastAdvancedAt
      &gt; maxSilentTicks
  ) {
    return {
      ...result,
      status: 'channel-stale',
      silentTicks:
        Game.time - next.lastAdvancedAt
    };
  }

  return {
    ...result,
    status: streamChanged
      ? 'stream-started'
      : advanced
        ? 'channel-advanced'
        : 'channel-unchanged',
    silentTicks:
      Game.time - next.lastAdvancedAt
  };
}</code></pre>
<p>The receiver records when a remote channel revision last advanced in its own local tick space. An unchanged revision can become <code>channel-stale</code>, but that state means only that this receiver has not observed progress within its configured window. It does not prove that the remote shard is offline.</p>
<h2 id="handoff">Use offer and acknowledgement channels</h2>
<pre><code class="language-javascript">function buildOutboundHandoff(
  creep,
  targetShard
) {
  if (
    !creep
    || typeof targetShard !== 'string'
    || targetShard === ''
  ) {
    return null;
  }

  return {
    handoffId:
      Game.shard.name
      + ':'
      + creep.name
      + ':'
      + Game.time,
    creepName: creep.name,
    sourceShard: Game.shard.name,
    targetShard,
    state: 'offered',
    offeredAtTick: Game.time,
    memory: {
      role: creep.memory.role ?? null,
      missionId:
        creep.memory.missionId ?? null
    }
  };
}</code></pre><pre><code class="language-javascript">function acknowledgeRemoteHandoff(
  offer,
  observedCreep
) {
  if (
    !offer
    || offer.targetShard
      !== Game.shard.name
    || !observedCreep
    || observedCreep.name
      !== offer.creepName
  ) {
    return {
      status: 'handoff-not-confirmed'
    };
  }

  const acknowledgement = {
    handoffId: offer.handoffId,
    sourceShard: offer.sourceShard,
    targetShard: Game.shard.name,
    creepName: observedCreep.name,
    state: 'observed-on-target',
    observedAtTick: Game.time
  };

  return publishLocalChannel(
    'handoffAcknowledgements',
    {
      [offer.handoffId]:
        acknowledgement
    }
  );
}</code></pre>
<p>For a Creep handoff, the source publishes an offer. The destination reads it, waits until it observes the exact Creep, then publishes an acknowledgement in its own local channel. The source later reads that acknowledgement. Neither side writes the other's data.</p>
<h2 id="bounded-history">Keep the publication bounded</h2>
<pre><code class="language-javascript">function pruneRecordMap(
  records,
  maxRecords = 32
) {
  if (
    !records
    || typeof records !== 'object'
    || Array.isArray(records)
  ) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(records)
      .sort((left, right) =&gt; {
        const leftTick =
          left[1]?.updatedAtTick ?? 0;
        const rightTick =
          right[1]?.updatedAtTick ?? 0;

        return rightTick - leftTick
          || left[0].localeCompare(right[0]);
      })
      .slice(0, maxRecords)
  );
}</code></pre>
<p>Store current snapshots, unresolved messages, and only a small completion history. Never serialize complete Room, Creep, or structure objects, and do not place external authentication secrets in this synchronization layer.</p>
<h2 id="complete-loop">Build the complete publication loop</h2>
<pre><code class="language-javascript">function runInterShardSync(
  remoteShards
) {
  const localStatus = {
    shard: Game.shard.name,
    tick: Game.time,
    ownedRooms: Object.values(Game.rooms)
      .filter(room =&gt; room.controller?.my)
      .map(room =&gt; room.name)
      .sort()
  };
  const publication = publishLocalChannel(
    'empireStatus',
    localStatus
  );
  const observations = [];

  for (const remoteShard of remoteShards) {
    observations.push(
      observeRemoteChannel(
        remoteShard,
        'empireStatus',
        100
      )
    );
  }

  return {
    publication,
    observations
  };
}</code></pre>
<p>This loop publishes the current shard's owned-room names and observes the same channel from configured remote shards. It intentionally makes no fixed propagation-delay claim.</p>
<h2 id="failure-modes">Common failure modes</h2>
<ul>
<li><strong>Shared writable-object assumption:</strong> remote shard strings are read-only.</li>
<li><strong>Blind JSON.parse():</strong> empty, corrupt, old-schema, and wrong-source states collapse together.</li>
<li><strong>Partial setLocal update:</strong> another channel disappears because the entire string was replaced.</li>
<li><strong>String length as byte length:</strong> non-ASCII payloads can exceed the real byte budget.</li>
<li><strong>Cross-shard tick subtraction:</strong> freshness depends on an undocumented clock assumption.</li>
<li><strong>Revision without writer epoch:</strong> a valid stream restart looks like permanent regression.</li>
<li><strong>setLocal means synchronized:</strong> a local call is confused with later remote observation.</li>
<li><strong>Unbounded message history:</strong> serialization work and payload size grow forever.</li>
</ul>
<h2 id="evidence">Evidence and production boundary</h2>
<p>This guide is based on the current official <code>InterShardMemory</code> and <code>Game.shard</code> APIs. Repository tests syntax-check the examples and simulate UTF-8 byte counts, damaged inputs, schema and source validation, revisions, writer-epoch changes, regressions, local observation freshness, size rejection, and handoff identity checks.</p>
<p>Official-shard propagation delay, real portal traversal, cross-shard CPU cost, restricted-shard access behavior, and live multi-tick evidence remain Pending.</p>
<p>Official references: <a href="https://docs.screeps.com/api/#InterShardMemory" rel="nofollow">InterShardMemory</a>, <a href="https://docs.screeps.com/api/#Game.shard" rel="nofollow">Game.shard</a>, <a href="https://docs.screeps.com/global-objects.html" rel="nofollow">Global Objects and Memory</a>, and <a href="https://docs.screeps.com/game-loop.html" rel="nofollow">the game loop</a>.</p>
`;

export default function InterShardMemorySyncPage() {
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
      url: articleUrl,
      author: {
        "@type": "Person",
        name: "Linqingan",
        url: `${siteConfig.url}/en/about`,
        sameAs: [siteConfig.links.github],
      },
      publisher: {
        "@type": "Person",
        name: "Linqingan",
        url: `${siteConfig.url}/en/about`,
      },
      isBasedOn: `${siteConfig.url}${chinesePath}`,
      about: discovery?.tags,
      articleSection: discovery?.moduleTitle,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${siteConfig.url}/en`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Guides",
          item: `${siteConfig.url}/en/blog`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: headline,
          item: articleUrl,
        },
      ],
    },
  ];

  return (
    <EnglishArticlePage
      articleHref={path}
      chinesePath={chinesePath}
      headline={headline}
      description={description}
      breadcrumbLabel="InterShardMemory"
      category="MEMORY · CROSS-SHARD STATE"
      publishedAt={publishedAt}
      publishedLabel={publishedLabel}
      modifiedAt={modifiedTime}
      readingTime="19 min read"
      tags={["Memory", "InterShardMemory", "Automation", "Debugging"]}
      verification={[
        {
          term: "Official API",
          value:
            "Checked — InterShardMemory.getLocal(), setLocal(), getRemote(), the 100 KB shard-owned string, and remote read-only scope",
        },
        {
          term: "Shard identity",
          value:
            "Checked — Game.shard.name identifies the shard executing the current script",
        },
        {
          term: "JavaScript syntax",
          value: "Passed by the article simulation gate",
        },
        {
          term: "Offline state cases",
          value:
            "Passed — byte counts, parsing, schema and source guards, revisions, writer epochs, stale observations, size rejection, and handoff identity",
        },
        {
          term: "Screeps Console test",
          value: "Pending",
        },
        {
          term: "Official-shard propagation test",
          value: "Pending",
        },
        {
          term: "Evidence level",
          value:
            "Official source review, repository integration, syntax checks and deterministic offline simulation only",
        },
      ]}
      toc={toc}
      articleHtml={articleHtml}
      jsonLd={jsonLd}
    />
  );
}
