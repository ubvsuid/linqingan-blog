const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const checks = [
  {
    path: "/tools/creep-body-calculator",
    required: ["tool-detail-monochrome-page", "home-brand-wordmark", "Creep 身体计算器"],
  },
  {
    path: "/tools/room-diagnostics",
    required: ["tool-detail-monochrome-page", "home-brand-wordmark", "房间运行诊断"],
  },
  {
    path: "/screeps-api/creep",
    required: ["api-detail-monochrome-page", "home-brand-wordmark", "OBJECT HUB"],
  },
  {
    path: "/en",
    required: ["english-monochrome-system", "english-home-monochrome", "home-brand-wordmark", "Screeps Knowledge OS"],
  },
  {
    path: "/en/diagnostics",
    required: ["english-monochrome-system", "diagnostics-monochrome-page", "home-brand-wordmark"],
  },
  {
    path: "/en/resolver",
    required: ["english-monochrome-system", "resolver-monochrome-page", "home-brand-wordmark", "Screeps Doctor"],
  },
  {
    path: "/en/search?q=creep%20not%20moving",
    required: ["english-monochrome-system", "search-monochrome-page", "home-brand-wordmark"],
  },
  {
    path: "/en/tools/creep-body-calculator",
    required: ["english-monochrome-system", "home-brand-wordmark", "body-calculator-en"],
  },
  {
    path: "/en/screeps-api/creep",
    required: ["english-monochrome-system", "api-detail-monochrome-page", "home-brand-wordmark", "OBJECT HUB"],
  },
  {
    path: "/en/blog/screeps-introduction",
    required: ["english-monochrome-system", "article-reading-system", 'data-reading-system="v1-en"', "home-brand-wordmark"],
  },
  ...[
    "/blog", "/blog/page/2", "/glossary", "/screeps-errors", "/verified",
    "/en/blog", "/en/glossary", "/en/screeps-errors", "/en/verified",
  ].map((path) => ({ path, required: ["resource-monochrome-page", "home-brand-wordmark"] })),
];

const failures = [];

for (const check of checks) {
  const response = await fetch(`${baseUrl}${check.path}`, { redirect: "manual" });
  const body = await response.text();
  if (response.status !== 200) {
    failures.push(`${check.path}: expected 200, received ${response.status}`);
    continue;
  }
  for (const marker of check.required) {
    if (!body.includes(marker)) failures.push(`${check.path}: missing ${marker}`);
  }
}

if (failures.length) {
  console.error("Monochrome Completion V1 smoke failed:\n" + failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log("Monochrome Completion V1 smoke passed: Chinese Tool/API detail surfaces and representative English Home/Solve/Search/Tool/API/Reading routes use the shared monochrome system.");
