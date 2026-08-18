const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const requestTimeoutMs = 15_000;

const articles = [
  {
    path: "/en/blog/screeps-controller-downgrade",
    chinesePath: "/blog/screeps-controller-downgrade",
    signals: [
      "Choose an emergency threshold from reaction runway",
      "describeRecoveryRunway",
      "invalid-runway-input",
      "ERR_ACCESS_DENIED",
      "controller-upgrade-blocked",
      "Official-documentation review and static code review only",
      "Console test pending",
      "Live multi-tick verification pending",
      "Genuine in-game screenshot",
    ],
  },
  {
    path: "/en/blog/screeps-require-modules",
    chinesePath: "/blog/screeps-modules-require",
    signals: [
      "Only the <code>loop</code> exported by the <code>main</code> module is the engine entry point",
      "invalid-role-result",
      "typeof result.status !== 'string'",
      "role-threw",
      "Contributed caching overview",
      "Official-documentation review, contributed caching guidance, and static code review only",
      "Console test pending",
      "Live multi-tick verification pending",
    ],
  },
  {
    path: "/en/blog/screeps-flags-configuration",
    chinesePath: "/blog/screeps-flags-config",
    signals: [
      "expectedRoomName",
      "Game.rooms[expectedRoomName]",
      "target-unresolved-no-vision",
      "target-missing-visible-room",
      "Treat the Flag name as immutable identity",
      "cannot be changed later",
      "The Flag API does not provide a rename operation",
      "Official-documentation review and static code review only",
      "Console test pending",
      "Live multi-tick verification pending",
    ],
  },
  {
    path: "/en/blog/screeps-room-create-construction-site",
    chinesePath: "/blog/screeps-room-create-construction-site",
    signals: [
      "Bind verification to the exact next tick",
      "verifySubmittedRoadSiteNextTick",
      "waiting-for-next-tick",
      "verification-window-missed",
      "claimed or reserved by a hostile player",
      "account-wide Construction Site limit boundary",
      "Official-documentation review and static code review only",
      "Console test pending",
      "Live multi-tick verification pending",
      "Genuine in-game screenshot",
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

const { body: controllerBody } = await fetchText(
  "/en/blog/screeps-controller-downgrade",
);
if (!controllerBody.includes("ERR_ACCESS_DENIED")) {
  failures.push("Controller downgrade page still omits ERR_ACCESS_DENIED");
}
if (controllerBody.includes("5,000 is an official") || controllerBody.includes("5000 is an official")) {
  failures.push("Controller downgrade page presents a project threshold as an official value");
}

const { body: modulesBody } = await fetchText(
  "/en/blog/screeps-require-modules",
);
if (modulesBody.includes("The main module owns <code>module.exports.loop</code>")) {
  failures.push("Modules page still overstates helper-module loop naming restrictions");
}
if (!modulesBody.includes("invalid-role-result")) {
  failures.push("Modules page can still dereference an unchecked role result contract");
}

const { body: flagsBody } = await fetchText(
  "/en/blog/screeps-flags-configuration",
);
if (flagsBody.includes("Live Flag rename")) {
  failures.push("Flags page still describes a nonexistent live Flag rename verification case");
}
if (flagsBody.includes("status: flag.room")) {
  failures.push("Flags page still derives unresolved target identity directly from flag.room");
}

const { body: constructionBody } = await fetchText(
  "/en/blog/screeps-room-create-construction-site",
);
if (constructionBody.includes("Controller state disallows placement")) {
  failures.push("Construction page still uses the vague ERR_NOT_OWNER wording");
}
if (!constructionBody.includes("request.submittedAt + 1")) {
  failures.push("Construction page does not bind verification to the exact next-tick window");
}

const negativeControls = [
  "/en/blog/screeps-cpu-getused-bucket",
  "/en/blog/screeps-rawmemory-segments",
];
for (const path of negativeControls) {
  const { body } = await fetchText(path);
  if (
    body.includes("describeRecoveryRunway")
    || body.includes("invalid-role-result")
    || body.includes("Treat the Flag name as immutable identity")
    || body.includes("verifySubmittedRoadSiteNextTick")
  ) {
    failures.push(`${path}: received content from the tenth editorial batch`);
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
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\nTenth English editorial smoke failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log(
  "Tenth English editorial smoke passed: Controller runway and return-code boundaries, module result-contract isolation, immutable Flag identity with vision-aware saved targets, exact next-tick Construction Site evidence, scoped freshness, canonical/hreflang, structured data, and Pending live evidence.",
);
