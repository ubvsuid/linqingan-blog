const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-introduction",
    chinesePath: "/blog/screeps-introduction",
    signals: [
      "Persistent world does not mean a permanently reliable JavaScript process",
      "Automation is repeated conditional decision-making",
      "current state → one bounded decision → a later state to inspect",
      "Official-documentation review, Chinese-source review, and static editorial/code review only",
      "Screeps Console",
      "Live multi-tick verification",
    ],
  },
  {
    path: "/en/blog/screeps-first-room",
    chinesePath: "/blog/screeps-first-room",
    signals: [
      "Do not confuse visibility with ownership",
      "Capture one bounded read-only room snapshot",
      "no-currently-visible-room",
      "room.controller.my === true",
      "Game.rooms[roomName]",
      "Official-documentation review, Chinese-source review, and static editorial/code review only",
      "Live multi-tick verification",
    ],
  },
  {
    path: "/en/blog/screeps-tick-game-loop",
    chinesePath: "/blog/screeps-tick-game-loop",
    signals: [
      "Treat <code>OK</code> as same-tick request evidence, not outcome proof",
      "Multiple same-tick requests can change which command wins",
      "A minimal checklist for multi-tick debugging",
      "const creep = Game.creeps[creepName]",
      "const first = creep.moveTo(source)",
      "const second = creep.moveTo(spawn)",
      "Official-documentation review, Chinese-source review, and static editorial/code review only",
      "Live multi-tick verification",
    ],
  },
];

const failures = [];

for (const article of articles) {
  const response = await fetch(`${baseUrl}${article.path}`, { redirect: "manual" });
  const body = await response.text();

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

const negativeControls = [
  "/en/blog/screeps-first-room-code",
  "/en/blog/screeps-memory-basics",
  "/en/blog/screeps-room-visibility",
];

for (const path of negativeControls) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
  const body = await response.text();
  if (response.status !== 200) {
    failures.push(`${path}: expected 200, got ${response.status}`);
    continue;
  }
  if (
    body.includes("Automation is repeated conditional decision-making")
    || body.includes("Capture one bounded read-only room snapshot")
    || body.includes("A minimal checklist for multi-tick debugging")
  ) {
    failures.push(`${path}: received content from the twelfth editorial batch`);
  }
}

const sitemapResponse = await fetch(`${baseUrl}/sitemap-en.xml`, { redirect: "manual" });
const sitemapBody = await sitemapResponse.text();

if (sitemapResponse.status !== 200) {
  failures.push(`/sitemap-en.xml: expected 200, got ${sitemapResponse.status}`);
} else {
  for (const article of articles) {
    const expectedEntry = `<loc>https://www.linqingan.com${article.path}</loc>\n    <lastmod>2026-08-18T00:00:00.000Z</lastmod>`;
    if (!sitemapBody.includes(expectedEntry)) {
      failures.push(`${article.path}: Sitemap lastmod is not aligned with the 2026-08-18 substantive revision`);
    }
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\nTwelfth English editorial smoke failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log(
  "Twelfth English editorial smoke passed: persistent-world/runtime boundaries, visibility-versus-ownership inspection, same-tick request versus later-outcome evidence, canonical/hreflang, structured data, Sitemap freshness, and Pending live evidence.",
);
