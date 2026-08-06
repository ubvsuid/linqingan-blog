import type { Metadata } from "next";

import { EnglishArticlePage } from "@/components/english-article-page";
import { getEnglishDiscoveryArticle } from "@/lib/english-discovery";
import { siteConfig } from "@/lib/site";

const path = "/en/blog/screeps-rawmemory-foreign-segment";
const chinesePath = "/blog/screeps-rawmemory-foreign-segment";
const headline =
  "Screeps RawMemory Foreign Segment: Publish and Read Public Segments Safely";
const description =
  "Publish versioned public RawMemory segments, request one foreign segment for the next tick, validate untrusted JSON, rotate subscriptions, and detect stream changes without confusing local, cross-shard, and foreign storage.";
const publishedAt = "2026-08-06";
const publishedLabel = "August 6, 2026";
const modifiedTime = "2026-08-06";
const discovery = getEnglishDiscoveryArticle(path);
const articleUrl = `${siteConfig.url}${path}`;

export const metadata: Metadata = {
  title: { absolute: `${headline} | Linqingan` },
  description,
  keywords: [
    "Screeps RawMemory foreignSegment",
    "RawMemory setActiveForeignSegment",
    "Screeps public memory segment",
    "RawMemory setPublicSegments",
    "Screeps foreign segment next tick",
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
    tags: discovery?.tags ?? ["RawMemory", "Memory", "Automation"],
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
  ["boundaries", "Separate local, cross-shard, and foreign data"],
  ["publisher-activation", "Activate the publisher's local segment first"],
  ["envelope", "Publish a versioned envelope"],
  ["utf8-budget", "Budget UTF-8 bytes"],
  ["write", "Stage one complete local write"],
  ["normalize-public", "Normalize the public ID list"],
  ["public-policy", "Submit one coherent public policy"],
  ["normalize-request", "Normalize a request"],
  ["submit-request", "Request one foreign segment"],
  ["clear-request", "Clear the next request"],
  ["match", "Match the previous response"],
  ["parse", "Parse untrusted public data"],
  ["observe", "Use a local observation window"],
  ["rotate", "Rotate subscriptions"],
  ["coordinator", "Coordinate one request per tick"],
  ["failure-modes", "Common failure modes"],
  ["evidence", "Evidence and production boundary"],
];

const articleHtml = String.raw`

<h2 id="quick-answer">Quick answer</h2>
<p><code>RawMemory.foreignSegment</code> reads data that another player deliberately exposed on the current shard. It is not a way to inspect private Memory, and it is not the same system as <code>InterShardMemory</code>. The owner writes one of their local segments, marks selected IDs public, and may choose one default public ID. A reader requests one username and optional ID; the matching object becomes available on the next tick.</p>
<p>A reliable implementation keeps publication and subscription in separate coordinators. It validates IDs from 0 through 99, remembers the previous-tick request, accepts only a matching username and explicit ID, treats default-ID changes as a new stream, parses the returned string as untrusted data, and rotates multiple subscriptions because only one foreign segment can be active at a time.</p>

<h2 id="boundaries">Separate local, cross-shard, and foreign data</h2><p><code>RawMemory.segments</code> stores your own on-demand data on one shard. <code>InterShardMemory</code> exchanges your own shard-owned strings across shards. <code>RawMemory.foreignSegment</code> reads another player's public segment on the current shard. The foreign API never grants remote write access.</p>
<h2 id="publisher-activation">Activate the publisher's local segment first</h2><p>Public visibility does not activate the owner's local segment for reading or writing. Request the local ID on tick N, then inspect and write it on tick N+1.</p><pre><code class="language-javascript">function requestPublisherSegment(segmentId) {
  if (
    !Number.isInteger(segmentId)
    || segmentId &lt; 0
    || segmentId &gt; 99
  ) {
    return {
      status: 'invalid-segment-id'
    };
  }

  RawMemory.setActiveSegments([segmentId]);

  return {
    status: 'activation-requested',
    segmentId,
    requestedAt: Game.time
  };
}
</code></pre>
<h2 id="envelope">Publish a versioned envelope</h2><p>A compact envelope gives readers stable identity and migration boundaries. Keep the public payload bounded and avoid serializing live game objects.</p><pre><code class="language-javascript">function createPublicEnvelope({
  publisher,
  segmentId,
  publisherEpoch,
  revision,
  updatedAt,
  payload
}) {
  return {
    schemaVersion: 1,
    publisher,
    segmentId,
    publisherEpoch,
    revision,
    updatedAt,
    payload
  };
}
</code></pre>
<h2 id="utf8-budget">Budget UTF-8 bytes, not JavaScript length</h2><p>Every segment is limited to 100 KB. JavaScript string length counts UTF-16 code units, so non-ASCII text needs explicit UTF-8 accounting.</p><pre><code class="language-javascript">function utf8ByteLength(value) {
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
}
</code></pre>
<h2 id="write">Stage one complete local write</h2><p>Only write after the segment appears in RawMemory.segments. The status below means the local assignment was staged; it does not claim that any reader already observed the revision.</p><pre><code class="language-javascript">const PUBLIC_SEGMENT_SAFE_LIMIT = 96 * 1024;

function writePublicSegment(
  segmentId,
  envelope
) {
  if (!Object.prototype.hasOwnProperty.call(
    RawMemory.segments,
    segmentId
  )) {
    return {
      status: 'segment-not-active',
      segmentId
    };
  }

  const serialized = JSON.stringify(envelope);
  const byteLength = utf8ByteLength(serialized);

  if (byteLength &gt; PUBLIC_SEGMENT_SAFE_LIMIT) {
    return {
      status: 'payload-too-large',
      segmentId,
      byteLength
    };
  }

  RawMemory.segments[segmentId] = serialized;

  return {
    status: 'local-segment-write-staged',
    segmentId,
    byteLength,
    revision: envelope.revision
  };
}
</code></pre>
<h2 id="normalize-public">Normalize the public ID list</h2><p>Later setPublicSegments calls replace earlier lists. Reject duplicates and invalid IDs before one coordinator submits the complete desired list.</p><pre><code class="language-javascript">function normalizePublicSegmentIds(ids) {
  if (!Array.isArray(ids)) {
    return null;
  }

  const normalized = [...new Set(ids)]
    .filter(id =&gt;
      Number.isInteger(id)
      &amp;&amp; id &gt;= 0
      &amp;&amp; id &lt;= 99
    )
    .sort((left, right) =&gt; left - right);

  return normalized.length === ids.length
    ? normalized
    : null;
}
</code></pre>
<h2 id="public-policy">Submit one coherent public policy</h2><p>A default segment should also be in the public list. Use an empty array to expose no segments and null to remove the default.</p><pre><code class="language-javascript">function applyPublicSegmentPolicy({
  publicIds,
  defaultId
}) {
  const normalized =
    normalizePublicSegmentIds(publicIds);

  if (!normalized) {
    return {
      status: 'invalid-public-list'
    };
  }

  if (
    defaultId !== null
    &amp;&amp; (
      !Number.isInteger(defaultId)
      || !normalized.includes(defaultId)
    )
  ) {
    return {
      status: 'default-not-public'
    };
  }

  RawMemory.setPublicSegments(normalized);
  RawMemory.setDefaultPublicSegment(defaultId);

  return {
    status: 'public-policy-submitted',
    publicIds: normalized,
    defaultId
  };
}
</code></pre>
<h2 id="normalize-request">Normalize an explicit or default request</h2><p>Omitting the ID asks for the publisher's default public segment. Do not use a second null argument; clearing is performed by passing null as the username.</p><pre><code class="language-javascript">function normalizeForeignRequest(input) {
  if (
    !input
    || typeof input.username !== 'string'
    || input.username.trim() === ''
  ) {
    return {
      status: 'invalid-username'
    };
  }

  if (
    input.id !== undefined
    &amp;&amp; (
      !Number.isInteger(input.id)
      || input.id &lt; 0
      || input.id &gt; 99
    )
  ) {
    return {
      status: 'invalid-segment-id'
    };
  }

  return {
    status: 'valid',
    request: {
      username: input.username.trim(),
      id: input.id,
      mode: input.id === undefined
        ? 'default'
        : 'explicit'
    }
  };
}
</code></pre>
<h2 id="submit-request">Request one foreign segment for the next tick</h2><p>The call schedules the next-tick view. Preserve the request identity in Memory so the next tick can match the returned object.</p><pre><code class="language-javascript">function submitForeignRequest(request) {
  if (request.mode === 'default') {
    RawMemory.setActiveForeignSegment(
      request.username
    );
  } else {
    RawMemory.setActiveForeignSegment(
      request.username,
      request.id
    );
  }

  return {
    status: 'foreign-request-submitted',
    username: request.username,
    requestedId: request.id ?? null,
    mode: request.mode,
    requestedAt: Game.time
  };
}
</code></pre>
<h2 id="clear-request">Clear the next foreign request</h2><p>Clear the reader when no subscription should remain active.</p><pre><code class="language-javascript">function clearForeignRequest() {
  RawMemory.setActiveForeignSegment(null);

  return {
    status: 'foreign-request-cleared',
    clearedAt: Game.time
  };
}
</code></pre>
<h2 id="match">Match the previous-tick response</h2><p>An explicit request must match both username and ID. A default request matches the username and records the actual returned ID.</p><pre><code class="language-javascript">function matchForeignSegment(
  pending,
  foreignSegment
) {
  if (!pending) {
    return {
      status: 'no-pending-request'
    };
  }

  if (
    !foreignSegment
    || typeof foreignSegment !== 'object'
  ) {
    return {
      status: 'foreign-segment-unavailable'
    };
  }

  if (
    foreignSegment.username
      !== pending.username
  ) {
    return {
      status: 'username-mismatch'
    };
  }

  if (
    pending.mode === 'explicit'
    &amp;&amp; foreignSegment.id !== pending.id
  ) {
    return {
      status: 'segment-id-mismatch'
    };
  }

  return {
    status: 'foreign-segment-matched',
    username: foreignSegment.username,
    segmentId: foreignSegment.id,
    data: foreignSegment.data,
    mode: pending.mode
  };
}
</code></pre>
<h2 id="parse">Parse public strings as untrusted input</h2><p>Validate JSON shape, schema, publisher identity, segment identity, epoch, and revision. Never execute foreign data with eval, Function, or dynamic module loading.</p><pre><code class="language-javascript">function parsePublicEnvelope(
  raw,
  expectedPublisher,
  expectedSegmentId
) {
  if (typeof raw !== 'string') {
    return {
      status: 'invalid-data-type',
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

  if (value.publisher !== expectedPublisher) {
    return {
      status: 'publisher-mismatch',
      envelope: null
    };
  }

  if (value.segmentId !== expectedSegmentId) {
    return {
      status: 'envelope-segment-mismatch',
      envelope: null
    };
  }

  if (
    typeof value.publisherEpoch !== 'string'
    || value.publisherEpoch === ''
    || !Number.isInteger(value.revision)
    || value.revision &lt; 0
  ) {
    return {
      status: 'invalid-version-fields',
      envelope: null
    };
  }

  return {
    status: 'valid',
    envelope: value
  };
}
</code></pre>
<h2 id="observe">Use a local observation window</h2><p>A writer epoch or observed default-segment ID change starts a new stream. Within one stream, a lower revision is a regression. Staleness means the local reader has not seen progress; it does not prove the publisher stopped.</p><pre><code class="language-javascript">function observePublicStream({
  previous,
  envelope,
  observedSegmentId,
  now,
  maxSilentTicks = 100
}) {
  const streamChanged =
    !previous
    || previous.publisherEpoch
      !== envelope.publisherEpoch
    || previous.segmentId
      !== observedSegmentId;

  if (
    !streamChanged
    &amp;&amp; envelope.revision
      &lt; previous.revision
  ) {
    return {
      status: 'revision-regressed',
      state: previous
    };
  }

  const advanced =
    streamChanged
    || envelope.revision
      &gt; previous.revision;
  const next = {
    publisherEpoch: envelope.publisherEpoch,
    segmentId: observedSegmentId,
    revision: envelope.revision,
    lastCheckedAt: now,
    lastAdvancedAt: advanced
      ? now
      : previous.lastAdvancedAt
  };

  if (
    !advanced
    &amp;&amp; now - next.lastAdvancedAt
      &gt; maxSilentTicks
  ) {
    return {
      status: 'public-stream-stale',
      state: next,
      silentTicks:
        now - next.lastAdvancedAt
    };
  }

  return {
    status: streamChanged
      ? 'public-stream-started'
      : advanced
        ? 'public-stream-advanced'
        : 'public-stream-unchanged',
    state: next,
    silentTicks:
      now - next.lastAdvancedAt
  };
}
</code></pre>
<h2 id="rotate">Rotate multiple subscriptions</h2><p>Only one foreign segment can be active at once. Round-robin selection makes the polling cadence explicit.</p><pre><code class="language-javascript">function rotateSubscriptionQueue(
  subscriptions,
  cursor
) {
  if (
    !Array.isArray(subscriptions)
    || subscriptions.length === 0
  ) {
    return {
      status: 'no-subscriptions',
      nextCursor: 0,
      subscription: null
    };
  }

  const safeCursor =
    Number.isInteger(cursor)
      ? Math.max(0, cursor)
      : 0;
  const index =
    safeCursor % subscriptions.length;

  return {
    status: 'subscription-selected',
    nextCursor:
      (index + 1) % subscriptions.length,
    subscription: subscriptions[index]
  };
}
</code></pre>
<h2 id="coordinator">Consume the old response before scheduling the next request</h2><p>One coordinator owns the API. It first handles the object requested on the prior tick, then submits exactly one next request.</p><pre><code class="language-javascript">function finalizeForeignSegmentTick(
  subscriptions
) {
  Memory.foreignSegmentReader ??= {
    cursor: 0,
    pending: null,
    observations: {}
  };

  const state = Memory.foreignSegmentReader;
  const previousMatch = matchForeignSegment(
    state.pending,
    RawMemory.foreignSegment
  );
  const selected = rotateSubscriptionQueue(
    subscriptions,
    state.cursor
  );

  if (!selected.subscription) {
    clearForeignRequest();
    state.pending = null;

    return {
      previousMatch,
      nextRequest: {
        status: 'no-subscriptions'
      }
    };
  }

  const normalized = normalizeForeignRequest(
    selected.subscription
  );

  if (normalized.status !== 'valid') {
    clearForeignRequest();
    state.pending = null;

    return {
      previousMatch,
      nextRequest: normalized
    };
  }

  const submitted = submitForeignRequest(
    normalized.request
  );

  state.cursor = selected.nextCursor;
  state.pending = {
    ...normalized.request,
    requestedAt: Game.time
  };

  return {
    previousMatch,
    nextRequest: submitted
  };
}
</code></pre>

<h2 id="failure-modes">Common failure modes</h2>
<ul>
<li><strong>Requesting several publishers in one tick:</strong> only the final one can be active for the next tick.</li>
<li><strong>Reading immediately after the request:</strong> the data belongs to the previous activation state.</li>
<li><strong>Scattered public-list calls:</strong> a later module silently replaces an earlier list.</li>
<li><strong>Treating setPublicSegments as append:</strong> the method submits the complete replacement list.</li>
<li><strong>Default ID is not public:</strong> readers cannot rely on the default request.</li>
<li><strong>Default request passes a null ID:</strong> the wrapper no longer represents the documented omitted-ID call.</li>
<li><strong>No username or ID match:</strong> stale or unrelated data can be attributed to the wrong subscription.</li>
<li><strong>Default ID changes but revision baseline remains:</strong> two different public streams are conflated.</li>
<li><strong>Foreign JSON is trusted:</strong> malformed or hostile public data reaches business logic.</li>
<li><strong>Secrets are published:</strong> public segments are intentionally readable by other players.</li>
</ul>


<h2 id="evidence">Evidence and production boundary</h2>
<p>The repository simulation syntax-checks every Chinese and English JavaScript example and runs deterministic cases for ID validation, public-list replacement, default membership, next-tick request identity, explicit and default matching, UTF-8 sizing, envelope parsing, stream restarts, revision regression, stale observation, queue rotation, and single-request coordination.</p>
<p>Screeps Console execution, official-server publication delay, live changes to another player's default segment, private-server differences, long-running CPU cost, and the truthfulness of third-party payloads remain Pending. The guide therefore distinguishes <code>activation-requested</code>, <code>local-segment-write-staged</code>, <code>foreign-request-submitted</code>, <code>foreign-segment-matched</code>, and later observed stream states.</p>
<p>Official references: <a href="https://docs.screeps.com/api/#RawMemory.foreignSegment" rel="nofollow">RawMemory.foreignSegment</a>, <a href="https://docs.screeps.com/api/#RawMemory.setActiveForeignSegment" rel="nofollow">setActiveForeignSegment()</a>, <a href="https://docs.screeps.com/api/#RawMemory.setPublicSegments" rel="nofollow">setPublicSegments()</a>, <a href="https://docs.screeps.com/api/#RawMemory.setDefaultPublicSegment" rel="nofollow">setDefaultPublicSegment()</a>, and <a href="https://docs.screeps.com/api/#RawMemory.segments" rel="nofollow">RawMemory.segments</a>.</p>

`;

export default function RawMemoryForeignSegmentPage() {
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
      breadcrumbLabel="RawMemory foreign segment"
      category="MEMORY · PUBLIC FOREIGN SEGMENTS"
      publishedAt={publishedAt}
      publishedLabel={publishedLabel}
      modifiedAt={modifiedTime}
      readingTime="19 min read"
      tags={["RawMemory", "Memory", "Automation", "Debugging"]}
      verification={[
        {
          term: "Official API",
          value:
            "Checked — foreignSegment, setActiveForeignSegment(), setPublicSegments(), setDefaultPublicSegment(), and local segments",
        },
        {
          term: "Timing and access model",
          value:
            "Checked — next-tick availability, one foreign segment at a time, public-only access, and replacement configuration",
        },
        {
          term: "JavaScript syntax",
          value: "Passed by the article simulation gate",
        },
        {
          term: "Offline protocol cases",
          value:
            "Passed — IDs, public lists, defaults, matching, UTF-8 sizing, parsing, stream identity, regression, staleness, and rotation",
        },
        {
          term: "Screeps Console test",
          value: "Pending",
        },
        {
          term: "Official-server foreign publication test",
          value: "Pending",
        },
        {
          term: "Evidence level",
          value:
            "Official documentation review, repository integration, syntax checks, and deterministic offline simulation only",
        },
      ]}
      toc={toc}
      articleHtml={articleHtml}
      jsonLd={jsonLd}
    />
  );
}
