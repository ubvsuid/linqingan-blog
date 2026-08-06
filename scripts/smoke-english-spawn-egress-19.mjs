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
const englishPath = "/en/blog/screeps-spawn-exit-blocked";
const chinesePath = "/blog/screeps-spawn-exit-blocked";
const EnglishTitle = "Screeps Spawn Exit Blocked: directions and Egress Recovery";
const EnglishHeadline = "How to Diagnose a Creep That Finishes Spawning but Cannot Exit";
const ChineseTitle = "Screeps Spawn 出口被堵怎么办：directions、出生阻塞与自动疏通";

const english = await fetchText(englishPath);
if (english.error) {
  failures.push(`${englishPath}: request failed: ${english.error}`);
} else if (english.response.status !== 200) {
  failures.push(`${englishPath}: expected 200, received ${english.response.status}`);
} else {
  const canonical = `https://www.linqingan.com${englishPath}`;
  const chinese = `https://www.linqingan.com${chinesePath}`;
  for (const expected of [
    EnglishTitle,
    EnglishHeadline,
    "Verification status",
    "Public engine source",
    "Screeps Console test",
    "Pending",
    "runSpawnEgressGuard",
    "open-in-current-snapshot",
    "spawn.spawning.setDirections",
    "cancelled spawning does not refund the Energy already spent",
    `rel="canonical" href="${canonical}"`,
    `rel="alternate" hrefLang="en" href="${canonical}"`,
    `rel="alternate" hrefLang="zh-CN" href="${chinese}"`,
    `href="#scan-eight-directions"`,
    `<h2 id="scan-eight-directions">Scan all eight directions</h2>`,
    `"@type":"BlogPosting"`,
    `"@type":"FAQPage"`,
    `"dateModified":"2026-08-06"`,
  ]) {
    if (!english.body.includes(expected)) {
      failures.push(`${englishPath}: missing “${expected}”`);
    }
  }

  for (const forbidden of [
    "live Spawn egress test passed",
    "guaranteed-free",
    "cancel-on-blockage",
  ]) {
    if (english.body.includes(forbidden)) {
      failures.push(`${englishPath}: unsupported or unsafe claim “${forbidden}”`);
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
    ChineseTitle,
    "spawn.spawning.setDirections",
    "open-in-current-snapshot",
    "consoleTested",
    "liveTested",
  ]) {
    if (!chinese.body.includes(expected)) {
      failures.push(`${chinesePath}: missing “${expected}”`);
    }
  }
}

const englishSearch = await fetchText(
  `/en/search?q=${encodeURIComponent("Spawn exit blocked")}`,
);
if (englishSearch.error) {
  failures.push(`/en/search: request failed: ${englishSearch.error}`);
} else if (englishSearch.response.status !== 200) {
  failures.push(`/en/search: received ${englishSearch.response.status}`);
} else if (!englishSearch.body.includes(EnglishTitle)) {
  failures.push(`/en/search: missing “${EnglishTitle}”`);
}

const chineseSearch = await fetchText(
  `/search?q=${encodeURIComponent("Spawn 出口")}`,
);
if (chineseSearch.error) {
  failures.push(`/search: request failed: ${chineseSearch.error}`);
} else if (chineseSearch.response.status !== 200) {
  failures.push(`/search: received ${chineseSearch.response.status}`);
} else if (!chineseSearch.body.includes(ChineseTitle)) {
  failures.push(`/search: missing “${ChineseTitle}”`);
}

for (const [pathname, expected] of [
  ["/en/blog-index.json", EnglishTitle],
  ["/knowledge/spawn-lifecycle", ChineseTitle],
  ["/en/knowledge", EnglishTitle],
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
  console.error(`\nSpawn egress production smoke failed: ${failures.length} finding(s).`);
  process.exit(1);
}

console.log(
  "Spawn egress production smoke passed: Chinese and English pages, Canonical, hreflang, JSON-LD, search, knowledge modules, indexes, and both Sitemap shards.",
);
