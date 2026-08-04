const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-renew-creep",
    chinesePath: "/blog/screeps-spawn-renew-creep",
    headline: "Renew a Creep Without Hiding Spawn Contention or Boost Loss",
    indexTitle: "Screeps renewCreep(): Coordinate Spawn Time and Verify TTL Gain",
    query: "renewCreep verification",
    tocId: "evidence-contract",
    tocHeading: "Start with the missing event",
    signals: [
      "createRenewalDispatcher",
      "Memory.pendingRenewals",
      "renewal-ttl-signature-mismatch",
      "renewal-observed-energy-confounded",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-recycle-creep",
    chinesePath: "/blog/screeps-spawn-recycle-creep",
    headline: "Recycle One Creep Without Retrying an Irreversible Request",
    indexTitle: "Screeps recycleCreep(): Verify the Exact Creep Retirement",
    query: "recycleCreep verification",
    tocId: "evidence-contract",
    tocHeading: "Use the event and artifact contract",
    signals: [
      "buildRecycleConfirmation",
      "createRecycleDispatcher",
      "Memory.pendingRecycleOperations",
      "EVENT_OBJECT_DESTROYED",
      "event.objectId === pending.creepId",
      "event.data?.type === 'creep'",
      "FIND_TOMBSTONES",
      "tombstone.creep?.id === pending.creepId",
      "STRUCTURE_CONTAINER",
      "recycle-event-and-tombstone-observed",
      "recycle-artifacts-observed-container-confounded",
      "Pending",
    ],
  },
];

const failures = [];

async function fetchText(path) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
  return { response, body: await response.text() };
}

for (const article of articles) {
  const { response, body } = await fetchText(article.path);
  if (response.status !== 200) {
    failures.push(`${article.path}: expected 200, received ${response.status}`);
    continue;
  }

  const canonical = `https://www.linqingan.com${article.path}`;
  const chinese = `https://www.linqingan.com${article.chinesePath}`;
  for (const expected of [
    article.headline,
    "Verification status",
    "Screeps Console test",
    ...article.signals,
    `rel="canonical" href="${canonical}"`,
    `rel="alternate" hrefLang="en" href="${canonical}"`,
    `rel="alternate" hrefLang="zh-CN" href="${chinese}"`,
    `rel="alternate" hrefLang="x-default" href="${canonical}"`,
    `href="#${article.tocId}"`,
    `<h2 id="${article.tocId}">${article.tocHeading}</h2>`,
    `"@type":"BlogPosting"`,
  ]) {
    if (!body.includes(expected)) failures.push(`${article.path}: missing “${expected}”`);
  }

  if (body.includes(`"@type":"FAQPage"`)) {
    failures.push(`${article.path}: unexpected FAQPage`);
  }

  const { response: searchResponse, body: searchBody } = await fetchText(
    `/en/search?q=${encodeURIComponent(article.query)}`,
  );
  if (searchResponse.status !== 200) {
    failures.push(`/en/search?q=${article.query}: received ${searchResponse.status}`);
  } else if (!searchBody.includes(article.indexTitle)) {
    failures.push(`/en/search?q=${article.query}: missing “${article.indexTitle}”`);
  }
}

const { body: recycleBody } = await fetchText("/en/blog/screeps-recycle-creep");
for (const expected of [
  "request.spawnId",
  "request.creepId",
  "spawn.recycleCreep(creep)",
  "Game.getObjectById(pending.creepId)",
  "room.getEventLog()",
  "room.find(FIND_TOMBSTONES)",
  "pending.before.creepX",
  "tombstone.store",
  "containerBefore",
  "containerAfter",
]) {
  if (!recycleBody.includes(expected)) {
    failures.push(`recycleCreep evidence boundary missing “${expected}”`);
  }
}
for (const forbidden of [
  "if (spawn.spawning)",
  "creep.suicide();",
  "request.enabled = true",
  "LOOK_RESOURCES",
  "pending.before.spawnX",
]) {
  if (recycleBody.includes(forbidden)) {
    failures.push(`recycleCreep contains forbidden legacy signal “${forbidden}”`);
  }
}

const { response: indexResponse, body: indexBody } = await fetchText("/en/blog-index.json");
if (indexResponse.status !== 200) {
  failures.push(`/en/blog-index.json: received ${indexResponse.status}`);
} else {
  for (const article of articles) {
    if (!indexBody.includes(article.indexTitle)) {
      failures.push(`/en/blog-index.json: missing “${article.indexTitle}”`);
    }
  }
}

const { response: sitemapResponse, body: sitemapBody } = await fetchText("/sitemap.xml");
if (sitemapResponse.status !== 200) {
  failures.push(`/sitemap.xml: received ${sitemapResponse.status}`);
} else {
  for (const article of articles) {
    const expected = `https://www.linqingan.com${article.path}`;
    if (!sitemapBody.includes(expected)) failures.push(`/sitemap.xml: missing ${expected}`);
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\nLifecycle production smoke failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log(
  `Lifecycle production smoke passed: ${articles.length} articles, exact renewal and recycling identity, previous-tick destruction event, Creep-tile Tombstone and Container evidence, Canonical, hreflang, JSON-LD, search and Sitemap.`,
);
