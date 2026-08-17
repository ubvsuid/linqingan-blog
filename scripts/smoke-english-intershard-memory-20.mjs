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

const failures = [];
const englishPath = "/en/blog/screeps-intershardmemory-sync";
const chinesePath = "/blog/screeps-intershardmemory-sync";
const englishTitle =
  "Screeps InterShardMemory: Versioned Cross-Shard State Without Remote Writes";
const chineseTitle =
  "Screeps InterShardMemory 怎么用：跨 Shard 状态同步、版本校验与过期数据";

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
    "Official API",
    "Screeps Console test",
    "Official-shard propagation test",
    "Pending",
    "writerEpoch",
    "revision-regressed",
    "channel-stale",
    "local-write-called",
    `rel="canonical" href="${canonical}"`,
    `rel="alternate" hrefLang="en" href="${canonical}"`,
    `rel="alternate" hrefLang="zh-CN" href="${chinese}"`,
    `href="#freshness"`,
    `<h2 id="freshness">Use a local observation window</h2>`,
    `"@type":"BlogPosting"`,
    `"dateModified":"2026-08-17"`,
  ]) {
    if (!english.body.includes(expected)) {
      failures.push(`${englishPath}: missing “${expected}”`);
    }
  }
  for (const forbidden of [
    "Official-shard propagation test passed",
    "remote synchronized immediately",
    "shared tick clock guaranteed",
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
    "InterShardMemory",
    "writerEpoch",
    "revision-regressed",
    "channel-stale",
    "local-write-called",
    "验证状态与适用边界",
  ]) {
    if (!chinese.body.includes(expected)) {
      failures.push(`${chinesePath}: missing “${expected}”`);
    }
  }
}

for (const [pathname, expected] of [
  [`/en/search?q=${encodeURIComponent("InterShardMemory")}`, englishTitle],
  [`/search?q=${encodeURIComponent("InterShardMemory")}`, chineseTitle],
  ["/en/blog-index.json", englishTitle],
  ["/knowledge/memory-engineering", chineseTitle],
  ["/en/knowledge/memory-code-structure", englishTitle],
  ["/sitemap-zh.xml", `https://www.linqingan.com${chinesePath}`],
  ["/sitemap-en.xml", `https://www.linqingan.com${englishPath}`],
]) {
  const result = await fetchText(pathname);
  if (result.error) failures.push(`${pathname}: request failed: ${result.error}`);
  else if (result.response.status !== 200) failures.push(`${pathname}: received ${result.response.status}`);
  else if (!result.body.includes(expected)) failures.push(`${pathname}: missing “${expected}”`);
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\nInterShardMemory production smoke failed: ${failures.length} finding(s).`);
  process.exit(1);
}

console.log(
  "InterShardMemory production smoke passed: Chinese and English pages, evidence states, Canonical, hreflang, JSON-LD, search, knowledge modules, index, and both Sitemap shards.",
);
