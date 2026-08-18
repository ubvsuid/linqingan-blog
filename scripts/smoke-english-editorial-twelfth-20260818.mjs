const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const requestTimeoutMs = 15_000;

const articles = [
  {
    path: "/en/blog/screeps-tick-game-loop",
    chinesePath: "/blog/screeps-tick-and-game-loop",
    signals: [
      "One tick has one starting snapshot, but not one universal action slot",
      "firstMove",
      "secondMove",
      "sameTickPosition",
      "return-code-evidence",
      "last call has priority",
      "Current official-documentation review plus static code review",
      "Screeps Console test",
      "Live multi-tick verification pending",
    ],
  },
  {
    path: "/en/blog/screeps-creep-roles",
    chinesePath: "/blog/screeps-creep-roles",
    signals: [
      "Make role dispatch fail closed",
      "ROLE_HANDLERS",
      "invalid-role",
      "invalid-role-result",
      "Object.prototype.hasOwnProperty.call",
      "A valid role label still does not prove",
      "Current official-documentation review plus static code review",
      "Screeps Console test",
      "Live multi-tick verification pending",
    ],
  },
  {
    path: "/en/blog/screeps-clean-dead-creep-memory",
    chinesePath: "/blog/screeps-clean-dead-creep-memory",
    signals: [
      "Do not delete Memory for a Creep that is still spawning",
      "getSpawningCreepNames",
      "spawn.spawning?.name",
      "spawningNames.has(name)",
      "absent-from-live-and-spawning-name-sets",
      "Record cleanup reason without inventing a death cause",
      "Current official-documentation review plus static code review",
      "Screeps Console test",
      "Live multi-tick verification pending",
    ],
  },
];

const failures = [];

async function fetchText(path) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    signal: AbortSignal.timeout(requestTimeoutMs),
  });
  return { response, body: await response.text() };
}

for (const article of articles) {
  const { response, body } = await fetchText(article.path);
  if (response.status !== 200) {
    failures.push(`${article.path}: expected 200, got ${response.status}`);
    continue;
  }

  const canonical = `https://www.linqingan.com${article.path}`;
  const chinese = `https://www.linqingan.com${article.chinesePath}`;

  for (const expected of [
    ...article.signals,
    `rel="canonical" href="${canonical}"`,
    `rel="alternate" hrefLang="en" href="${canonical}"`,
    `rel="alternate" hrefLang="zh-CN" href="${chinese}"`,
    `rel="alternate" hrefLang="x-default" href="${canonical}"`,
    `"@type":"BlogPosting"`,
    `"dateModified":"2026-08-18"`,
  ]) {
    if (!body.includes(expected)) {
      failures.push(`${article.path}: missing “${expected}”`);
    }
  }
}

const { body: tickBody } = await fetchText("/en/blog/screeps-tick-game-loop");
if (tickBody.includes("a Creep can execute only one method per tick")) {
  failures.push("Tick page still states a false universal one-method-per-tick rule");
}
if (!tickBody.includes("later movement intent wins")) {
  failures.push("Tick page does not explain duplicate movement intent priority");
}

const { body: rolesBody } = await fetchText("/en/blog/screeps-creep-roles");
if (!rolesBody.includes("invalid-role-result")) {
  failures.push("Roles page does not guard malformed handler results");
}
if (rolesBody.includes("Harvester, Upgrader, and Builder are official")) {
  failures.push("Roles page presents player-defined role names as official engine classes");
}

const { body: cleanupBody } = await fetchText(
  "/en/blog/screeps-clean-dead-creep-memory",
);
if (!cleanupBody.includes("spawn.spawning?.name")) {
  failures.push("Dead-memory cleanup does not protect names currently being spawned");
}
if (cleanupBody.includes("absent-from-Game.creeps means the Creep died")) {
  failures.push("Dead-memory cleanup still invents a death cause from absence alone");
}

const negativeControls = [
  "/en/blog/screeps-controller-downgrade",
  "/en/blog/screeps-pathfinder-costmatrix",
];
for (const path of negativeControls) {
  const { body } = await fetchText(path);
  if (
    body.includes("getSpawningCreepNames")
    || body.includes("ROLE_HANDLERS")
    || body.includes("sameTickPosition")
  ) {
    failures.push(`${path}: received content from the twelfth editorial batch`);
  }
}

const { response: sitemapResponse, body: sitemapBody } = await fetchText(
  "/sitemap-en.xml",
);
if (sitemapResponse.status !== 200) {
  failures.push(`/sitemap-en.xml: expected 200, got ${sitemapResponse.status}`);
} else {
  for (const article of articles) {
    const expectedEntry = `<loc>https://www.linqingan.com${article.path}</loc>\n    <lastmod>2026-08-18T00:00:00.000Z</lastmod>`;
    if (!sitemapBody.includes(expectedEntry)) {
      failures.push(`${article.path}: Sitemap lastmod is not aligned with the 2026-08-18 substantive revision`);
    }
  }

  for (const path of [
    "/en/blog/screeps-first-room-code",
    "/en/blog/screeps-room-visibility",
    "/en/blog/screeps-global-cache",
  ]) {
    const expectedEntry = `<loc>https://www.linqingan.com${path}</loc>\n    <lastmod>2026-08-18T00:00:00.000Z</lastmod>`;
    if (!sitemapBody.includes(expectedEntry)) {
      failures.push(`${path}: eleventh-pass Sitemap freshness regressed`);
    }
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\nTwelfth English editorial smoke failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log(
  "Twelfth English editorial smoke passed: tick snapshot/intent priority, strict role dispatch, spawning-safe dead-memory cleanup, scoped freshness, canonical/hreflang, structured data, and Pending live evidence.",
);
