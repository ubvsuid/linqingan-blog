const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-room-create-construction-site",
    chinesePath: "/blog/screeps-room-create-construction-site",
    headline: "How to Create One Road Construction Site Safely",
    indexTitle: "How to Create One Road Construction Site Safely",
    query: "createConstructionSite",
    tocId: "quick-answer",
    tocHeading: "Quick answer",
    expectFaq: true,
    signals: ["MAX_CONSTRUCTION_SITES", "room.createConstructionSite", "Pending"],
  },
  {
    path: "/en/blog/screeps-construction-site-progress",
    chinesePath: "/blog/screeps-construction-site-progress",
    headline: "Measure Construction Progress and Verify the Exact Builder Event",
    indexTitle: "Screeps ConstructionSite Progress: Verify One Builder Across Ticks",
    query: "EVENT_BUILD progress",
    tocId: "use-this-guide",
    tocHeading: "Use this guide when",
    expectFaq: false,
    signals: ["submitTrackedBuild", "EVENT_BUILD", "verification-window-missed", "Pending"],
  },
  {
    path: "/en/blog/screeps-structure-destroy",
    chinesePath: "/blog/screeps-structure-destroy",
    headline: "Destroy One Extension Without Losing Object or Room Identity",
    indexTitle: "Screeps Structure.destroy(): Verify One Exact Extension Removal",
    query: "Structure destroy verification",
    tocId: "evidence-contract",
    tocHeading: "Separate accepted destruction from removal proof",
    expectFaq: false,
    signals: [
      "buildDestroyConfirmation",
      "FIND_HOSTILE_CREEPS",
      "FIND_HOSTILE_POWER_CREEPS",
      "createDestructionDispatcher",
      "Memory.pendingStructureDestructions",
      "original-destroyed-replacement-present",
      "room-controller-not-owned",
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
    if (!body.includes(expected)) {
      failures.push(`${article.path}: missing “${expected}”`);
    }
  }

  if (body.includes(`"@type":"FAQPage"`) !== article.expectFaq) {
    failures.push(`${article.path}: FAQPage expectation mismatch`);
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

const { body: destroyBody } = await fetchText("/en/blog/screeps-structure-destroy");
for (const expected of [
  "request.structureId",
  "request.expectedType !== STRUCTURE_EXTENSION",
  "controller.my !== true",
  "room.find(FIND_HOSTILE_CREEPS)",
  "room.find(FIND_HOSTILE_POWER_CREEPS)",
  "structure.destroy()",
  "Game.getObjectById(pending.structureId)",
  "original-destroyed-tile-empty",
  "does not create a Room event",
]) {
  if (!destroyBody.includes(expected)) {
    failures.push(`Structure.destroy evidence boundary missing “${expected}”`);
  }
}
if (destroyBody.includes("confirmation !== 'DESTROY_EXTENSION'")) {
  failures.push("Structure.destroy still uses a static confirmation phrase");
}
if (destroyBody.includes("Game.structures[structure.id]")) {
  failures.push("Structure.destroy incorrectly treats Game.structures membership as the engine authority boundary");
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
    if (!sitemapBody.includes(expected)) {
      failures.push(`/sitemap.xml: missing ${expected}`);
    }
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\nConstruction production smoke failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log(
  `Construction production smoke passed: ${articles.length} articles, exact Builder and destruction identity, hostile Power Creep boundary, replacement states, Canonical, hreflang, JSON-LD, search and Sitemap.`,
);
