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
const englishPath = "/en/blog/screeps-store-capacity-api";
const chinesePath = "/blog/screeps-store-capacity-api";
const englishTitle =
  "Screeps Store API: getUsedCapacity, getFreeCapacity, and null";
const chineseTitle =
  "Screeps Store API 怎么判断容量：getUsedCapacity、getFreeCapacity、getCapacity 与 null 陷阱";

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
    "Public engine source",
    "Public engine tests",
    "Screeps Console test",
    "Official-shard action test",
    "Pending",
    "calculateWithdrawAmount",
    "calculateTransferAmount",
    "capacity-not-applicable",
    `rel="canonical" href="${canonical}"`,
    `rel="alternate" hrefLang="en" href="${canonical}"`,
    `rel="alternate" hrefLang="zh-CN" href="${chinese}"`,
    `href="#zero-null"`,
    `<h2 id="zero-null">Treat zero and null as different states</h2>`,
    `"@type":"BlogPosting"`,
    `"dateModified":"2026-08-06"`,
  ]) {
    if (!english.body.includes(expected)) {
      failures.push(`${englishPath}: missing “${expected}”`);
    }
  }

  for (const forbidden of [
    "official-shard action test passed",
    "null means full",
    "Store changes immediately",
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
    "inspectStoreResource",
    "calculateWithdrawAmount",
    "calculateTransferAmount",
    "0 与 null 必须分开",
    "验证状态与适用边界",
  ]) {
    if (!chinese.body.includes(expected)) {
      failures.push(`${chinesePath}: missing “${expected}”`);
    }
  }
}

for (const [pathname, expected] of [
  [`/en/search?q=${encodeURIComponent("Store API")}`, englishTitle],
  [`/search?q=${encodeURIComponent("Store API 容量")}`, chineseTitle],
  ["/en/blog-index.json", englishTitle],
  ["/knowledge/room-economy", chineseTitle],
  ["/en/knowledge/room-economy", englishTitle],
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
  console.error(`\nStore capacity production smoke failed: ${failures.length} finding(s).`);
  process.exit(1);
}

console.log(
  "Store capacity production smoke passed: Chinese and English pages, evidence states, Canonical, hreflang, JSON-LD, search, Room Economy modules, index, and both Sitemap shards.",
);
