import type { Metadata } from "next";

import { EnglishArticlePage } from "@/components/english-article-page";
import { getEnglishDiscoveryArticle } from "@/lib/english-discovery";
import { siteConfig } from "@/lib/site";

const path = "/en/blog/screeps-store-capacity-api";
const chinesePath = "/blog/screeps-store-capacity-api";
const headline =
  "Screeps Store API: getUsedCapacity, getFreeCapacity, and null";
const description =
  "Distinguish general, limited, and read-only Stores; interpret resource arguments, zero and null correctly; handle Lab and specialized capacities; and calculate safe withdraw and transfer amounts.";
const publishedAt = "2026-08-06";
const publishedLabel = "August 6, 2026";
const modifiedTime = "2026-08-06";
const discovery = getEnglishDiscoveryArticle(path);
const articleUrl = `${siteConfig.url}${path}`;

export const metadata: Metadata = {
  title: { absolute: `${headline} | Linqingan` },
  description,
  keywords: [
    "Screeps Store API",
    "Screeps getUsedCapacity",
    "Screeps getFreeCapacity",
    "Screeps getCapacity null",
    "Screeps Lab Store capacity",
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
    tags: discovery?.tags ?? ["Resources", "Energy", "JavaScript"],
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
  ["store-types", "Separate general, limited, and read-only Stores"],
  ["three-methods", "Ask the three capacity questions correctly"],
  ["zero-null", "Treat zero and null as different states"],
  ["general-store", "Understand shared capacity in general Stores"],
  ["limited-store", "Pass a resource to limited Stores"],
  ["lab-specialized", "Handle Lab and specialized capacities"],
  ["read-only", "Recognize Tombstone and Ruin Stores"],
  ["enumeration", "Do not infer validity from Object.keys"],
  ["withdraw", "Calculate a safe withdraw amount"],
  ["transfer", "Calculate a safe transfer amount"],
  ["verification", "Verify Store changes on a later tick"],
  ["debugging", "Debugging checklist"],
  ["evidence", "Evidence and production boundary"],
];

const articleHtml = String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Use <code>getUsedCapacity(resource)</code> for the amount already stored, <code>getFreeCapacity(resource)</code> for the amount that can still be accepted, and <code>getCapacity(resource)</code> for the maximum capacity that applies to that resource. The difficult part is not the method names. It is knowing whether the Store has one shared capacity, several resource-specific capacities, or no writable capacity at all.</p>
<pre><code class="language-javascript">function inspectStoreResource(
  object,
  resourceType
) {
  if (!object?.store) {
    return {
      status: 'store-missing'
    };
  }

  const used = object.store.getUsedCapacity(
    resourceType
  );
  const free = object.store.getFreeCapacity(
    resourceType
  );
  const capacity = object.store.getCapacity(
    resourceType
  );

  return {
    status:
      used === null
      && free === null
      && capacity === null
        ? 'resource-unsupported'
        : 'store-observed',
    resourceType,
    used,
    free,
    capacity
  };
}</code></pre>
<p>Never collapse <code>null</code> into zero with <code>value || 0</code>. Zero usually means the query is valid but empty or full. Null means the requested capacity does not apply, the resource is unsupported by that limited Store, or the object has no writable capacity.</p>

<h2 id="store-types">Separate general, limited, and read-only Stores</h2>
<p>The official API describes two capacity models. General-purpose Stores use one shared capacity for many resources. Creep, Container, Storage, Terminal, and Factory are common examples. Limited Stores accept only the resources required by their object, such as Energy in a Spawn or Tower, Energy and Power in a Power Spawn, or Energy and one mineral channel in a Lab.</p>
<p>A third operational category is useful in code: read-only resource Stores such as Tombstones and Ruins. They expose stored amounts for withdrawal but do not expose writable capacity.</p>
<div class="table-scroll"><table>
<thead><tr><th>Category</th><th>Examples</th><th>Capacity behavior</th></tr></thead>
<tbody>
<tr><td>General</td><td>Creep, Container, Storage, Terminal, Factory</td><td>Resources share one total capacity</td></tr>
<tr><td>Limited</td><td>Spawn, Extension, Tower, Lab, Power Spawn, Nuker</td><td>Capacity depends on a valid resource argument</td></tr>
<tr><td>Read-only</td><td>Tombstone, Ruin</td><td>Used amount is readable; capacity and free space are null</td></tr>
</tbody></table></div>

<h2 id="three-methods">Ask the three capacity questions correctly</h2>
<pre><code class="language-javascript">function readCapacityTriplet(
  store,
  resourceType
) {
  return {
    used: store.getUsedCapacity(resourceType),
    free: store.getFreeCapacity(resourceType),
    capacity: store.getCapacity(resourceType)
  };
}</code></pre>
<p>For a general Store, omitting the resource from <code>getUsedCapacity()</code> returns total used capacity. Omitting it from <code>getCapacity()</code> or <code>getFreeCapacity()</code> returns the shared total and shared remaining capacity. For a limited Store, an omitted resource often produces <code>null</code> because there is no single unrestricted capacity.</p>
<p>Do not assume <code>used + free === capacity</code> until all three values are finite numbers.</p>
<pre><code class="language-javascript">function capacityIsConsistent(snapshot) {
  return Number.isFinite(snapshot.used)
    && Number.isFinite(snapshot.free)
    && Number.isFinite(snapshot.capacity)
    && snapshot.used + snapshot.free
      === snapshot.capacity;
}</code></pre>

<h2 id="zero-null">Treat zero and null as different states</h2>
<pre><code class="language-javascript">function classifyFreeCapacity(value) {
  if (value === null) {
    return 'capacity-not-applicable';
  }

  if (value === 0) {
    return 'store-full';
  }

  if (Number.isFinite(value) && value > 0) {
    return 'space-available';
  }

  return 'unexpected-capacity-value';
}</code></pre>
<p>An empty valid resource slot returns zero used capacity. A full valid Store returns zero free capacity. A Spawn queried for Power returns null because Power is not valid for that Store. A Tombstone queried for free Energy capacity also returns null because it cannot receive resources.</p>

<h2 id="general-store">Understand shared capacity in general Stores</h2>
<p>Suppose a Storage has total capacity 2,000 and currently contains 700 Energy and 200 Hydrogen. Its total used capacity is 900 and its shared free capacity is 1,100. Both of these calls return 1,100:</p>
<pre><code class="language-javascript">const freeForEnergy = storage.store
  .getFreeCapacity(RESOURCE_ENERGY);
const freeForHydrogen = storage.store
  .getFreeCapacity(RESOURCE_HYDROGEN);
</code></pre>
<p>The result does not mean Energy and Hydrogen each have a separate 1,100 slot. They compete for the same remaining space. Resource-specific <code>getUsedCapacity()</code> reports the amount of that resource; resource-specific <code>getFreeCapacity()</code> on a general Store reports the remaining shared capacity.</p>

<h2 id="limited-store">Pass a resource to limited Stores</h2>
<pre><code class="language-javascript">function inspectEnergyOnlyStructure(
  structure
) {
  const used = structure.store.getUsedCapacity(
    RESOURCE_ENERGY
  );
  const free = structure.store.getFreeCapacity(
    RESOURCE_ENERGY
  );
  const capacity = structure.store.getCapacity(
    RESOURCE_ENERGY
  );

  if (
    used === null
    || free === null
    || capacity === null
  ) {
    return {
      status: 'energy-capacity-unavailable'
    };
  }

  return {
    status: free > 0
      ? 'needs-energy'
      : 'full',
    used,
    free,
    capacity
  };
}</code></pre>
<p>Spawn, Extension, and Tower code should explicitly pass <code>RESOURCE_ENERGY</code>. A request for an unsupported resource should remain null rather than being silently treated as an empty slot. That distinction catches bad resource routing before <code>transfer()</code> returns an error.</p>

<h2 id="lab-specialized">Handle Lab and specialized capacities</h2>
<p>A Lab has an Energy capacity and a separate mineral or compound capacity. Power Spawn and Nuker also have multiple allowed resources with separate limits. A total capacity call cannot express those independent channels reliably.</p>
<pre><code class="language-javascript">function inspectLabStore(
  lab,
  mineralType
) {
  return {
    energy: inspectStoreResource(
      lab,
      RESOURCE_ENERGY
    ),
    mineral: inspectStoreResource(
      lab,
      mineralType
    )
  };
}</code></pre>
<p>Use the exact intended mineral type. A Lab that already contains one compound may not be a valid destination for a different compound even when a generic mineral-capacity calculation appears nonzero. Capacity is one precondition; object-specific action rules and return codes still apply.</p>

<h2 id="read-only">Recognize Tombstone and Ruin Stores</h2>
<pre><code class="language-javascript">function canReceiveResource(
  object,
  resourceType
) {
  if (!object?.store) {
    return false;
  }

  const free = object.store.getFreeCapacity(
    resourceType
  );

  return Number.isFinite(free)
    && free > 0;
}</code></pre>
<p>A Tombstone or Ruin can report <code>getUsedCapacity(resource)</code> and total used capacity, but its capacity and free-capacity queries are null. The existence of <code>object.store</code> therefore does not prove that the object is a legal transfer destination.</p>

<h2 id="enumeration">Do not infer validity from Object.keys</h2>
<p>The public engine Store proxy returns zero when a known resource property is absent, but enumeration normally exposes only nonzero resources. This means <code>Object.keys(store)</code> is useful for listing currently present resources, not for testing every supported resource.</p>
<pre><code class="language-javascript">function listStoredResources(store) {
  return Object.keys(store)
    .filter(resourceType =>
      store.getUsedCapacity(resourceType) > 0
    )
    .map(resourceType => ({
      resourceType,
      amount: store.getUsedCapacity(resourceType)
    }));
}</code></pre>
<p>Use a known resource constant and a Store method when you need to determine its amount or capacity behavior.</p>

<h2 id="withdraw">Calculate a safe withdraw amount</h2>
<pre><code class="language-javascript">function calculateWithdrawAmount(
  creep,
  source,
  resourceType,
  requestedAmount = Infinity
) {
  if (!creep?.store || !source?.store) {
    return {
      status: 'store-missing',
      amount: 0
    };
  }

  const available = source.store
    .getUsedCapacity(resourceType);
  const free = creep.store
    .getFreeCapacity(resourceType);

  if (available === null || free === null) {
    return {
      status: 'resource-unsupported',
      amount: 0
    };
  }

  const amount = Math.min(
    available,
    free,
    Number.isFinite(requestedAmount)
      ? Math.max(0, requestedAmount)
      : Infinity
  );

  return {
    status: amount > 0
      ? 'amount-ready'
      : 'nothing-to-withdraw',
    amount,
    available,
    free
  };
}</code></pre>
<p>The amount is bounded by source stock, Creep free capacity, and any caller limit. It is still a current-tick calculation, not proof that the later action will complete.</p>

<h2 id="transfer">Calculate a safe transfer amount</h2>
<pre><code class="language-javascript">function calculateTransferAmount(
  creep,
  target,
  resourceType,
  requestedAmount = Infinity
) {
  if (!creep?.store || !target?.store) {
    return {
      status: 'store-missing',
      amount: 0
    };
  }

  const carried = creep.store
    .getUsedCapacity(resourceType);
  const free = target.store
    .getFreeCapacity(resourceType);

  if (carried === null || free === null) {
    return {
      status: 'resource-unsupported',
      amount: 0
    };
  }

  const amount = Math.min(
    carried,
    free,
    Number.isFinite(requestedAmount)
      ? Math.max(0, requestedAmount)
      : Infinity
  );

  return {
    status: amount > 0
      ? 'amount-ready'
      : 'nothing-to-transfer',
    amount,
    carried,
    free
  };
}</code></pre>
<p>Also validate range, ownership, active structure state, object-specific resource rules, and the actual <code>transfer()</code> return code.</p>

<h2 id="verification">Verify Store changes on a later tick</h2>
<pre><code class="language-javascript">function createStoreActionEvidence(
  creep,
  target,
  resourceType,
  amount,
  result
) {
  return {
    creepName: creep.name,
    targetId: target.id ?? null,
    resourceType,
    amount,
    submittedAt: Game.time,
    result,
    before: {
      creepUsed: creep.store.getUsedCapacity(
        resourceType
      ),
      targetUsed: target.store.getUsedCapacity(
        resourceType
      )
    }
  };
}</code></pre>
<p>An <code>OK</code> action result means the command was accepted. It does not mutate the script-visible Store immediately. Resolve the same identities on a later tick and compare bounded numeric deltas before reporting the transfer or withdrawal as observed.</p>

<h2 id="debugging">Debugging checklist</h2>
<ol>
<li>Confirm that the object exists and has a Store.</li>
<li>Classify it as general, limited, or read-only.</li>
<li>Pass a resource argument to limited Stores.</li>
<li>Record used, free, and capacity separately.</li>
<li>Distinguish zero from null explicitly.</li>
<li>Remember that general resources share one remaining capacity.</li>
<li>Inspect Lab, Power Spawn, and Nuker resources independently.</li>
<li>Use Tombstone and Ruin only as withdrawal sources.</li>
<li>Bound action amounts by source stock and destination space.</li>
<li>Preserve the action result and verify Store deltas later.</li>
</ol>

<h2 id="evidence">Evidence and production boundary</h2>
<p>This revision checks the official Store API, the public engine Store implementation, and the engine Store test suite. Repository tests syntax-check every example and cover general shared capacity, limited resource compatibility, null versus zero, Lab resource channels, read-only Stores, amount calculation, and later-delta classification.</p>
<p>Screeps Console execution, official-shard action settlement, concurrent hauler contention, Power effects, structure activation changes, and live CPU cost remain pending. The guide does not claim that a capacity snapshot guarantees an action result.</p>
<p>Official and source references: <a href="https://docs.screeps.com/api/#Store" rel="nofollow">Store API</a>, <a href="https://docs.screeps.com/creeps.html" rel="nofollow">Creeps and resources</a>, <a href="https://github.com/screeps/engine/blob/master/src/game/store.js" rel="nofollow">public Store implementation</a>, and <a href="https://github.com/screeps/engine/blob/master/spec/engine/game/storeSpec.js" rel="nofollow">public Store tests</a>.</p>
`;

export default function StoreCapacityApiPage() {
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
      breadcrumbLabel="Store capacity API"
      category="ROOM ECONOMY · STORE CAPACITY"
      publishedAt={publishedAt}
      publishedLabel={publishedLabel}
      modifiedAt={modifiedTime}
      readingTime="18 min read"
      tags={["Resources", "Energy", "JavaScript", "Debugging"]}
      verification={[
        {
          term: "Official API",
          value:
            "Checked — Store.getUsedCapacity(), getFreeCapacity(), getCapacity(), resource arguments and null return states",
        },
        {
          term: "Public engine source",
          value:
            "Checked — Store proxy properties, shared-capacity calculation and limited Store compatibility",
        },
        {
          term: "Public engine tests",
          value:
            "Checked — general, limited, inactive, read-only, Lab and specialized Store cases",
        },
        {
          term: "JavaScript syntax",
          value: "Passed by the article simulation gate",
        },
        {
          term: "Offline Store cases",
          value:
            "Passed — null versus zero, shared capacity, specialized resources, safe amounts and later-delta states",
        },
        {
          term: "Screeps Console test",
          value: "Pending",
        },
        {
          term: "Official-shard action test",
          value: "Pending",
        },
        {
          term: "Evidence level",
          value:
            "Official documentation, public source review, repository integration, syntax checks and offline simulation only",
        },
      ]}
      toc={toc}
      articleHtml={articleHtml}
      jsonLd={jsonLd}
    />
  );
}
