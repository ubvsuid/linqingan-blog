const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const revised = [
  {
    path: "/en/blog/screeps-withdraw-container-energy",
    chinesePath: "/blog/screeps-creep-withdraw-container-energy",
    title: "Screeps withdraw(): Take Energy from a Container Safely",
    indexTitle: "How to Make a Screeps Creep Withdraw Energy from a Container",
    headline: "How to Make a Screeps Creep Withdraw Energy from a Container",
    modifiedAt: "2026-08-16",
    signals: [
      "Omitted, zero, and explicit withdraw amounts are different policy choices",
      "an explicit numeric <code>0</code> is also falsy",
      "Negative</td><td><code>ERR_INVALID_ARGS</code>",
      "Submission amount is not final transfer proof",
      "actual withdraw amount can be truncated",
      "Pending — no live zero-amount or competing-withdraw transcript is claimed",
    ],
    forbidden: [
      "The resource type or amount is invalid.",
    ],
  },
  {
    path: "/en/blog/screeps-pickup-dropped-energy",
    chinesePath: "/blog/screeps-creep-pickup-dropped-energy",
    title: "Screeps pickup(): Collect Dropped Energy Safely",
    indexTitle: "How to Make a Screeps Creep Pick Up Dropped Energy",
    headline: "How to Make a Screeps Creep Pick Up Dropped Energy",
    modifiedAt: "2026-08-16",
    signals: [
      "Store capacity is the pickup boundary; active CARRY is diagnostic context",
      "does not use <code>getActiveBodyparts(CARRY)</code> as an API preflight",
      "min(free capacity, current resource amount)",
      "active CARRY is retained only as diagnostic context",
      "Pending — no zero-active-CARRY pickup transcript is claimed",
    ],
    forbidden: [
      "confirm the Creep has active CARRY capacity",
      "Collector1 has no active CARRY part.",
    ],
  },
  {
    path: "/en/blog/screeps-transfer-energy-to-spawn",
    chinesePath: "/blog/screeps-creep-deliver-energy",
    title: "Screeps Energy Delivery: Creep to Spawn",
    headline: "How to Make a Screeps Creep Deliver Energy to a Spawn",
    modifiedAt: "2026-08-29",
    signals: [
      "Keep delivery mode until the Creep is empty",
      "empty Store → harvest",
      "full Store → deliver",
      "creep.memory.delivering = true",
      "spawn.store.getFreeCapacity(RESOURCE_ENERGY)",
      "harvest until the Energy Store is full, then deliver until it is empty",
      "larger-body capacity guard",
      "scheduled action rather than same-line proof of the processed amount",
      "Pending — no live transfer transcript is claimed",
      "Pending — no real-shard multi-tick delivery trace is claimed",
    ],
    forbidden: [
      "Omitted transfer amount is convenient, but it is still a snapshot",
      "freeEnergyCapacity &lt; harvestBatch",
    ],
  },
];

const failures = [];

for (const article of revised) {
  const response = await fetch(`${baseUrl}${article.path}`, {
    redirect: "manual",
  });
  const body = await response.text();

  if (response.status !== 200) {
    failures.push(`${article.path}: expected 200, received ${response.status}`);
    continue;
  }

  const canonical = `https://www.linqingan.com${article.path}`;
  const chinese = `https://www.linqingan.com${article.chinesePath}`;

  const required = [
    article.title,
    article.headline,
    ...article.signals,
    `rel="canonical" href="${canonical}"`,
    `rel="alternate" hrefLang="en" href="${canonical}"`,
    `rel="alternate" hrefLang="zh-CN" href="${chinese}"`,
    `rel="alternate" hrefLang="x-default" href="${canonical}"`,
    `property="article:modified_time" content="${article.modifiedAt}"`,
    `"dateModified":"${article.modifiedAt}"`,
    `"@type":"BlogPosting"`,
    "Screeps Console test",
    "Pending",
  ];

  for (const signal of required) {
    if (!body.includes(signal)) {
      failures.push(`${article.path}: missing “${signal}”`);
    }
  }

  for (const signal of article.forbidden) {
    if (body.includes(signal)) {
      failures.push(`${article.path}: forbidden stale signal “${signal}”`);
    }
  }
}

const controlPath = "/en/blog/screeps-global-cache";
const controlResponse = await fetch(`${baseUrl}${controlPath}`, {
  redirect: "manual",
});
const controlBody = await controlResponse.text();

if (controlResponse.status !== 200) {
  failures.push(`${controlPath}: expected 200, received ${controlResponse.status}`);
} else if (
  controlBody.includes(`property="article:modified_time" content="2026-08-16"`)
  || controlBody.includes(`"dateModified":"2026-08-16"`)
) {
  failures.push(`${controlPath}: false sixth-batch freshness detected`);
}

const indexResponse = await fetch(`${baseUrl}/en/blog-index.json`, {
  redirect: "manual",
});
const indexBody = await indexResponse.text();

if (indexResponse.status !== 200) {
  failures.push(`/en/blog-index.json: expected 200, received ${indexResponse.status}`);
} else {
  for (const article of revised) {
    const expectedIndexTitle = article.indexTitle ?? article.title;
    if (!indexBody.includes(expectedIndexTitle)) {
      failures.push(`/en/blog-index.json: missing “${expectedIndexTitle}”`);
    }
  }
}

const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`, {
  redirect: "manual",
});
const sitemapBody = await sitemapResponse.text();

if (sitemapResponse.status !== 200) {
  failures.push(`/sitemap.xml: expected 200, received ${sitemapResponse.status}`);
} else {
  for (const article of revised) {
    if (!sitemapBody.includes(`https://www.linqingan.com${article.path}`)) {
      failures.push(`/sitemap.xml: missing ${article.path}`);
    }
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\nSixth English editorial production smoke failed: ${failures.length} item(s).`);
  process.exit(1);
}

console.log(
  "Sixth English editorial smoke passed: withdraw and pickup retain their August 16 API-boundary revisions, while Transfer verifies the reviewed August 29 beginner round-trip contract, discovery freshness, and explicit Pending live evidence.",
);
