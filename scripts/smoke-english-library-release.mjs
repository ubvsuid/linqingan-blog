const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const failures = [];

async function read(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    redirect: "manual",
    ...options,
  });
  const body = await response.text();
  return { response, body };
}

const changelog = await read("/changelog");
if (changelog.response.status !== 200) {
  failures.push(`/changelog: 预期 200，实际 ${changelog.response.status}`);
} else {
  for (const expected of [
    "完成 64 篇 Screeps 英文文章库与来源覆盖",
    "新增并验证 28 篇唯一中文来源的英文文章",
    "浏览英文文章库",
    "查看英文验证说明",
  ]) {
    if (!changelog.body.includes(expected)) {
      failures.push(`/changelog: 缺少发布记录 “${expected}”`);
    }
  }
}

const secondPage = await read("/changelog/page/2");
if (secondPage.response.status !== 200) {
  failures.push(`/changelog/page/2: 预期 200，实际 ${secondPage.response.status}`);
} else if (!secondPage.body.includes("合并资料中心与项目页面")) {
  failures.push("/changelog/page/2: 缺少分页后的历史记录");
}

const representativePages = [
  [
    "/en/blog/screeps-link-transfer-energy",
    "How to Transfer Link Energy Without Depending on Structure Array Order",
  ],
  [
    "/en/blog/screeps-select-source-by-path",
    "How to Select an Active Source by Reachable Path Without Target Churn",
  ],
  [
    "/en/blog/screeps-nuker-launch",
    "How to Launch a Nuke Without Reusing a Stale Target Request",
  ],
];

for (const [pathname, headline] of representativePages) {
  const page = await read(pathname);
  if (page.response.status !== 200) {
    failures.push(`${pathname}: 预期 200，实际 ${page.response.status}`);
  } else if (!page.body.includes(headline)) {
    failures.push(`${pathname}: 缺少标题 “${headline}”`);
  }
}

const retired = await read("/en/blog/screeps-memory-write-safety");
if (retired.response.status !== 308) {
  failures.push(
    `/en/blog/screeps-memory-write-safety: 预期 308，实际 ${retired.response.status}`,
  );
}
if (
  retired.response.headers.get("location")
  !== "/en/blog/screeps-memory-basics"
) {
  failures.push(
    `/en/blog/screeps-memory-write-safety: 跳转目标错误 ${retired.response.headers.get("location")}`,
  );
}

const canonicalMemory = await read("/en/blog/screeps-memory-basics");
if (canonicalMemory.response.status !== 200) {
  failures.push(
    `/en/blog/screeps-memory-basics: 预期 200，实际 ${canonicalMemory.response.status}`,
  );
}

const sitemap = await read("/sitemap.xml");
if (sitemap.response.status !== 200) {
  failures.push(`/sitemap.xml: 预期 200，实际 ${sitemap.response.status}`);
} else {
  for (const [pathname] of representativePages) {
    const url = `https://www.linqingan.com${pathname}`;
    if (!sitemap.body.includes(url)) {
      failures.push(`/sitemap.xml: 缺少 ${url}`);
    }
  }

  if (
    sitemap.body.includes(
      "https://www.linqingan.com/en/blog/screeps-memory-write-safety",
    )
  ) {
    failures.push("/sitemap.xml: 不应包含已退役的重复 Memory URL");
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\n英文库发布冒烟测试失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(
  "英文库发布冒烟测试通过：Changelog、分页历史、代表文章、Memory canonical 跳转与 Sitemap 均符合 64 篇英文库发布状态。",
);
