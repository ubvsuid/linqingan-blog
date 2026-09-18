const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const requestTimeoutMs = 15_000;
const failures = [];

async function fetchText(path) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    signal: AbortSignal.timeout(requestTimeoutMs),
  });
  return { response, body: await response.text() };
}

const path = "/en/blog/screeps-creep-roles";
const chinesePath = "/blog/screeps-creep-roles";
const { response, body } = await fetchText(path);

if (response.status !== 200) {
  failures.push(`${path}: expected 200, got ${response.status}`);
} else {
  const canonical = `https://www.linqingan.com${path}`;
  const chinese = `https://www.linqingan.com${chinesePath}`;

  for (const expected of [
    "Screeps Creep Roles: Harvester, Upgrader, and Builder",
    "Why Multiple Screeps Creeps Need Simple Roles",
    "Learn why Harvester, Upgrader, and Builder are player-defined responsibilities, how roles differ from body parts, and why a Creep name does not create behavior.",
    "Body ability, player-defined role, and current action",
    "Harvester1",
    "Upgrader1",
    "Builder1",
    "Game.creeps",
    "fixed names are a beginner simplification",
    "Current official-documentation review plus static content/code review",
    "Last editorial review",
    "September 17, 2026",
    "Screeps Console test",
    "Live multi-tick verification pending",
    'href="/en/blog/screeps-upgrade-controller"',
    `rel="canonical" href="${canonical}"`,
    `rel="alternate" hrefLang="en" href="${canonical}"`,
    `rel="alternate" hrefLang="zh-CN" href="${chinese}"`,
    `rel="alternate" hrefLang="x-default" href="${canonical}"`,
    '"@type":"BlogPosting"',
    '"dateModified":"2026-09-17"',
  ]) {
    if (!body.includes(expected)) {
      failures.push(`${path}: missing “${expected}”`);
    }
  }

  for (const forbidden of [
    "ROLE_HANDLERS",
    "invalid-role-result",
    'id="role-contract"',
    'id="role-capability-boundary"',
    "Make role dispatch fail closed",
    "A valid role label still does not prove the Creep can perform the job",
    "strict role dispatch",
    "Publication status",
  ]) {
    if (body.includes(forbidden)) {
      failures.push(`${path}: current Beginner surface still contains “${forbidden}”`);
    }
  }
}

const { response: sitemapResponse, body: sitemapBody } = await fetchText(
  "/sitemap-en.xml",
);
if (sitemapResponse.status !== 200) {
  failures.push(`/sitemap-en.xml: expected 200, got ${sitemapResponse.status}`);
} else {
  const expectedEntry = `<loc>https://www.linqingan.com${path}</loc>\n    <lastmod>2026-09-17T00:00:00.000Z</lastmod>`;
  if (!sitemapBody.includes(expectedEntry)) {
    failures.push(`${path}: Sitemap lastmod is not aligned with the current 2026-09-17 scope correction`);
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(
    `\nCreep roles current-layer smoke failed: ${failures.length} issue(s).`,
  );
  process.exit(1);
}

console.log(
  "Creep roles current-layer smoke passed: Beginner body/role/action intent restored, advanced role-dispatch overlay absent, current verification/freshness aligned, and canonical/hreflang preserved.",
);
