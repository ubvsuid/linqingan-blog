const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const requestTimeoutMs = 15_000;

const articles = [
  {
    path: "/en/blog/screeps-introduction",
    chinesePath: "/blog/screeps-introduction",
    modifiedAt: "2026-08-18",
    signals: [
      "Persistent world does not make",
      "runtime-state-boundary",
      "automation-decision-cycle",
      "Rebuildable runtime cache",
      "Game.getObjectById()",
      "Current official-documentation review plus Chinese-source and static editorial/code review",
      "Screeps Console test",
      "Live multi-tick verification pending",
    ],
  },
  {
    path: "/en/blog/screeps-first-room",
    chinesePath: "/blog/screeps-first-room",
    modifiedAt: "2026-08-28",
    signals: [
      "Find and open the three work areas",
      "semantic arrival checks",
      "visibility-ownership-boundary",
      "Object.keys(Game.rooms)",
      "FIND_MY_SPAWNS",
      "FIND_MY_CREEPS",
      "room.controller?.my",
      "JavaScript syntax",
      "Semantic navigation only",
      "Screeps Console test",
      "Live multi-tick verification",
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
    `"dateModified":"${article.modifiedAt}"`,
  ]) {
    if (!body.includes(expected)) {
      failures.push(`${article.path}: missing “${expected}”`);
    }
  }
}

const { body: introBody } = await fetchText("/en/blog/screeps-introduction");
if (introBody.includes("permanently reliable JavaScript process")) {
  failures.push("Introduction still overstates runtime-process persistence as the core boundary");
}
if (introBody.includes("runtime cache persists across ticks")) {
  failures.push("Introduction presents rebuildable runtime cache as guaranteed durable state");
}
if (!introBody.includes("object is created from scratch and filled with current data on every tick")) {
  failures.push("Introduction does not explain the per-tick Game snapshot boundary");
}

const { body: roomBody } = await fetchText("/en/blog/screeps-first-room");
if (roomBody.includes("Game.rooms is your owned rooms")) {
  failures.push("First Room still conflates Game.rooms visibility with ownership");
}
if (!roomBody.includes("first confirm that a live <code>Room</code> exists before reading deeper Room state")) {
  failures.push("First Room does not preserve the current-visibility evidence boundary");
}
if (roomBody.includes("bounded-room-snapshot")) {
  failures.push("First Room still exposes the superseded bounded-room-snapshot section");
}

for (const path of [
  "/en/blog/screeps-room-visibility",
  "/en/blog/screeps-tick-game-loop",
]) {
  const { body } = await fetchText(path);
  if (
    body.includes("runtime-state-boundary")
    || body.includes("visibility-ownership-boundary")
  ) {
    failures.push(`${path}: received content from the thirteenth editorial batch`);
  }
}

const { response: sitemapResponse, body: sitemapBody } = await fetchText(
  "/sitemap-en.xml",
);
if (sitemapResponse.status !== 200) {
  failures.push(`/sitemap-en.xml: expected 200, got ${sitemapResponse.status}`);
} else {
  for (const article of articles) {
    const expectedEntry = `<loc>https://www.linqingan.com${article.path}</loc>\n    <lastmod>${article.modifiedAt}T00:00:00.000Z</lastmod>`;
    if (!sitemapBody.includes(expectedEntry)) {
      failures.push(`${article.path}: Sitemap lastmod is not aligned with the ${article.modifiedAt} substantive revision`);
    }
  }

  for (const path of [
    "/en/blog/screeps-tick-game-loop",
    "/en/blog/screeps-creep-roles",
    "/en/blog/screeps-clean-dead-creep-memory",
  ]) {
    const expectedEntry = `<loc>https://www.linqingan.com${path}</loc>\n    <lastmod>2026-08-18T00:00:00.000Z</lastmod>`;
    if (!sitemapBody.includes(expectedEntry)) {
      failures.push(`${path}: twelfth-pass Sitemap freshness regressed`);
    }
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\nThirteenth English editorial smoke failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log(
  "Thirteenth English editorial smoke passed: the August 18 introduction boundaries remain intact, First Room uses its August 28 navigation/visibility supersession, and canonical/hreflang/structured-data/Sitemap freshness stay aligned.",
);
