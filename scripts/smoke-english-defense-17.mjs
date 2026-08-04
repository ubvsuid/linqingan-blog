const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-nuker-launch",
    chinesePath: "/blog/screeps-nuker-launch-checklist",
    headline: "Launch a Nuke Once and Preserve the Exact Operation Record",
    indexTitle: "Screeps launchNuke(): Exact Target Records and Post-Launch Proof",
    query: "launchNuke verification",
    tocId: "evidence-contract",
    tocHeading: "Use two evidence layers",
    expectFaq: false,
    signals: ["Memory.pendingNukeLaunches", "launcher-signature-observed", "FIND_NUKES", "Pending"],
  },
  {
    path: "/en/blog/screeps-rampart-set-public",
    chinesePath: "/blog/screeps-rampart-set-public",
    headline: "Change One Rampart Access State and Verify the Exact Object",
    indexTitle: "Screeps setPublic(): Prevent Same-Tick Rampart Intent Overwrite",
    query: "setPublic verification",
    tocId: "evidence-contract",
    tocHeading: "Start with the intent boundary",
    expectFaq: false,
    signals: [
      "buildRampartConfirmation",
      "createRampartAccessDispatcher",
      "Memory.pendingRampartAccess",
      "accepted-state-not-observed",
      "original-rampart-missing-replacement-present",
      "rampart-already-reserved",
      "creates no Room event",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-wall-rampart-repair-limit",
    chinesePath: "/blog/screeps-wall-rampart-repair-limit",
    headline: "Repair Walls and Ramparts Without Hiding Duplicate Work",
    indexTitle: "Screeps Fortification Repair: Stages, Reservations, and Event Proof",
    query: "EVENT_REPAIR",
    tocId: "decision-model",
    tocHeading: "Separate the repair stage from target identity",
    expectFaq: false,
    signals: ["Memory.pendingFortificationRepairs", "EVENT_REPAIR", "repair-event-window-missed", "Pending"],
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

const { body: rampartBody } = await fetchText("/en/blog/screeps-rampart-set-public");
for (const expected of [
  "typeof request.public !== 'boolean'",
  "reservedRampartIds",
  "rampart.setPublic(request.public)",
  "Memory.pendingRampartAccess[rampart.id]",
  "Game.getObjectById(pending.rampartId)",
  "verification-window-missed",
  "A second call for the same Rampart",
]) {
  if (!rampartBody.includes(expected)) {
    failures.push(`Rampart setPublic evidence boundary missing “${expected}”`);
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
    if (!sitemapBody.includes(expected)) {
      failures.push(`/sitemap.xml: missing ${expected}`);
    }
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\nDefense production smoke failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log(
  `Defense production smoke passed: ${articles.length} articles, exact Nuker, Rampart and repair identity, same-tick overwrite boundary, Canonical, hreflang, JSON-LD, search and Sitemap.`,
);
