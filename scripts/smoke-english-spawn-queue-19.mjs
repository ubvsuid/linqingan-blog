const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const timeoutMs = 15000;

async function fetchText(pathname) {
  try {
    const response = await fetch(`${baseUrl}${pathname}`, {
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });
    return { response, body: await response.text(), error: null };
  } catch (error) {
    return {
      response: null,
      body: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

const englishPath = "/en/blog/screeps-multiple-spawn-queue-coordinator";
const chinesePath = "/blog/screeps-multiple-spawn-queue-coordinator";
const englishUrl = `https://www.linqingan.com${englishPath}`;
const chineseUrl = `https://www.linqingan.com${chinesePath}`;
const englishTitle =
  "Screeps Multiple Spawn Queue: Coordinate Priority, Names, and Energy";
const chineseTitle =
  "Screeps 多个 Spawn 如何共享生成队列：优先级、Energy 预算与同 tick 防冲突";
const failures = [];

for (const [pathname, expectations] of [
  [englishPath, [
    englishTitle,
    "SPAWNING · MULTI-SPAWN QUEUE COORDINATION",
    "Verification status",
    "48 queue planning, finalization, and observation assertions passed",
    "6 article blocks passed Node.js 22 syntax checks",
    "already-finalized-this-tick",
    "waiting-for-room-energy",
    "creep-name-reserved",
    "request-key-conflict",
    "batch-submitted",
    "completion-unverified",
    "Screeps Console test",
    "Pending",
    `rel="canonical" href="${englishUrl}"`,
    `rel="alternate" hrefLang="en" href="${englishUrl}"`,
    `rel="alternate" hrefLang="zh-CN" href="${chineseUrl}"`,
    `rel="alternate" hrefLang="x-default" href="${englishUrl}"`,
    `"@type":"BlogPosting"`,
    `"dateModified":"2026-08-06"`,
    `"articleSection":"Spawn and Creep Lifecycle"`,
  ]],
  [chinesePath, [
    chineseTitle,
    "多个 Spawn 共享队列",
    "48 个离线队列规划与观察断言通过",
    "already-finalized-this-tick",
    "waiting-for-room-energy",
    "creep-name-reserved",
    "completion-unverified",
    `rel="canonical" href="${chineseUrl}"`,
    `hrefLang="en" href="${englishUrl}"`,
    `"@type":"BlogPosting"`,
    "Spawn 与 Creep 生命周期",
  ]],
]) {
  const result = await fetchText(pathname);
  if (result.error) {
    failures.push(`${pathname}: request failed: ${result.error}`);
    continue;
  }
  if (result.response.status !== 200) {
    failures.push(`${pathname}: expected 200, received ${result.response.status}`);
    continue;
  }
  for (const expected of expectations) {
    if (!result.body.includes(expected)) {
      failures.push(`${pathname}: missing “${expected}”`);
    }
  }
  if (result.body.includes('name="robots" content="noindex')) {
    failures.push(`${pathname}: unexpectedly contains noindex`);
  }
  if (result.body.includes('"@type":"FAQPage"')) {
    failures.push(`${pathname}: unexpected FAQPage schema`);
  }
}

const search = await fetchText(
  `/en/search?q=${encodeURIComponent("multiple Spawn queue")}`,
);
if (search.error) {
  failures.push(`/en/search: request failed: ${search.error}`);
} else if (search.response.status !== 200) {
  failures.push(`/en/search: received ${search.response.status}`);
} else if (!search.body.includes(englishTitle)) {
  failures.push(`/en/search: missing “${englishTitle}”`);
}

const blogIndex = await fetchText("/en/blog-index.json");
if (blogIndex.error) {
  failures.push(`/en/blog-index.json: request failed: ${blogIndex.error}`);
} else if (blogIndex.response.status !== 200) {
  failures.push(`/en/blog-index.json: received ${blogIndex.response.status}`);
} else if (!blogIndex.body.includes(englishTitle)) {
  failures.push(`/en/blog-index.json: missing “${englishTitle}”`);
}

for (const [pathname, expected] of [
  ["/sitemap.xml", englishUrl],
  ["/sitemap-zh.xml", chineseUrl],
]) {
  const sitemap = await fetchText(pathname);
  if (sitemap.error) {
    failures.push(`${pathname}: request failed: ${sitemap.error}`);
  } else if (sitemap.response.status !== 200) {
    failures.push(`${pathname}: received ${sitemap.response.status}`);
  } else if (!sitemap.body.includes(expected)) {
    failures.push(`${pathname}: missing ${expected}`);
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\nMultiple Spawn queue production smoke failed: ${failures.length} finding(s).`);
  process.exit(1);
}

console.log(
  "Multiple Spawn queue production smoke passed: bilingual routes, strict queue evidence, Canonical, hreflang, BlogPosting, knowledge mapping, search, index, and sitemaps.",
);
