const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const timeoutMs = 15000;

async function fetchText(pathname) {
  try {
    const response = await fetch(`${baseUrl}${pathname}`, {
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });
    return {
      response,
      body: await response.text(),
      error: null,
    };
  } catch (error) {
    return {
      response: null,
      body: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

const failures = [];
const englishPath = "/en/blog/screeps-multi-spawn-queue";
const chinesePath = "/blog/screeps-multi-spawn-queue";
const englishTitle =
  "Screeps Multi-Spawn Queue: Priority, Deduplication, and Shared Energy";
const chineseTitle =
  "Screeps 多 Spawn 队列怎么设计：优先级、去重、Energy 预留与任务分配";

const english = await fetchText(englishPath);
if (english.error) {
  failures.push(`${englishPath}: request failed: ${english.error}`);
} else if (english.response.status !== 200) {
  failures.push(`${englishPath}: expected 200, received ${english.response.status}`);
} else {
  const canonical = `https://www.linqingan.com${englishPath}`;
  const chinese = `https://www.linqingan.com${chinesePath}`;

  for (const expected of [
    englishTitle,
    "Verification status",
    "Tick and Energy model",
    "Screeps Console test",
    "Official-shard multi-Spawn test",
    "Pending",
    "deduplicateRequests",
    "submitted-locally",
    "spawning-observed",
    "creep-released",
    "reservedEnergy",
    `rel="canonical" href="${canonical}"`,
    `rel="alternate" hrefLang="en" href="${canonical}"`,
    `rel="alternate" hrefLang="zh-CN" href="${chinese}"`,
    `href="#shared-energy"`,
    `<h2 id="shared-energy">Reserve one shared room Energy budget</h2>`,
    `"@type":"BlogPosting"`,
    `"dateModified":"2026-08-06"`,
  ]) {
    if (!english.body.includes(expected)) {
      failures.push(`${englishPath}: missing “${expected}”`);
    }
  }

  for (const forbidden of [
    "official-shard multi-Spawn test passed",
    "spawn completed immediately",
    "dryRun reserves Energy",
  ]) {
    if (english.body.includes(forbidden)) {
      failures.push(`${englishPath}: unsupported claim “${forbidden}”`);
    }
  }
}

const chinese = await fetchText(chinesePath);
if (chinese.error) {
  failures.push(`${chinesePath}: request failed: ${chinese.error}`);
} else if (chinese.response.status !== 200) {
  failures.push(`${chinesePath}: expected 200, received ${chinese.response.status}`);
} else {
  for (const expected of [
    chineseTitle,
    "requestKey",
    "createRoomEnergyBudget",
    "dryRun: true",
    "submitted-locally",
    "验证状态与适用边界",
  ]) {
    if (!chinese.body.includes(expected)) {
      failures.push(`${chinesePath}: missing “${expected}”`);
    }
  }
}

for (const [pathname, expected] of [
  [`/en/search?q=${encodeURIComponent("multi Spawn queue")}`, englishTitle],
  [`/search?q=${encodeURIComponent("多 Spawn 队列")}`, chineseTitle],
  ["/en/blog-index.json", englishTitle],
  ["/knowledge/spawn-lifecycle", chineseTitle],
  ["/en/knowledge", englishTitle],
  ["/sitemap-zh.xml", `https://www.linqingan.com${chinesePath}`],
  ["/sitemap-en.xml", `https://www.linqingan.com${englishPath}`],
]) {
  const result = await fetchText(pathname);

  if (result.error) {
    failures.push(`${pathname}: request failed: ${result.error}`);
  } else if (result.response.status !== 200) {
    failures.push(`${pathname}: received ${result.response.status}`);
  } else if (!result.body.includes(expected)) {
    failures.push(`${pathname}: missing “${expected}”`);
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\nMulti-Spawn queue production smoke failed: ${failures.length} finding(s).`);
  process.exit(1);
}

console.log(
  "Multi-Spawn queue production smoke passed: Chinese and English pages, evidence states, Canonical, hreflang, JSON-LD, search, knowledge modules, index, and both Sitemap shards.",
);
