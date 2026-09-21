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
  ...[
    "/", "/about", "/tags", "/tags/screeps", "/tags/retired",
    "/now", "/changelog", "/knowledge/memory-engineering",
    "/knowledge/coverage", "/verification/coverage", "/tick-lab",
    "/en/about", "/en/roadmap", "/en/tick-lab",
    "/en/verification/coverage", "/en/knowledge/memory-code-structure",
  ].map((path) => ({ path, required: ["home-brand-wordmark", "homepage-site-footer"] })),
  // Global unmatched routes must render a complete Monochrome 404 document
  // without relying on hydration. Matched-segment notFound() remains separate.
  {
    path: "/__visual-closure-missing-route__",
    expectedStatus: 404,
    required: ['<header', '<footer', 'class="home-brand-wordmark"', "homepage-site-footer", "ERROR 404", "这个页面不存在", "Page not found", 'href="/search"', 'href="/en/search"', '<meta name="robots" content="noindex"'],
    forbidden: ['id="__next_error__"'],
  },
  {
    path: "/en/__visual-closure-missing-route__",
    expectedStatus: 404,
    required: ['<header', '<footer', 'class="home-brand-wordmark"', "homepage-site-footer", "ERROR 404", "这个页面不存在", "Page not found", 'href="/search"', 'href="/en/search"', '<meta name="robots" content="noindex"'],
    forbidden: ['id="__next_error__"'],
  },
];

const failures = [];

for (const check of checks) {
  const response = await fetch(`${baseUrl}${check.path}`, { redirect: "manual" });
  const body = await response.text();
  const expectedStatus = check.expectedStatus ?? 200;
  if (response.status !== expectedStatus) {
    failures.push(`${check.path}: expected ${expectedStatus}, received ${response.status}`);
    continue;
  }
  for (const marker of check.required) {
    if (!body.includes(marker)) failures.push(`${check.path}: missing ${marker}`);
  }
  for (const forbidden of check.forbidden ?? []) {
    if (body.includes(forbidden)) failures.push(`${check.path}: forbidden ${forbidden}`);
  }
  for (const oldShellMarker of ['class="brand-logo"', 'class="theme-toggle"', 'class="profile-shortcut"', 'class="site-footer"']) {
    if (body.includes(oldShellMarker)) failures.push(`${check.path}: legacy shell marker ${oldShellMarker}`);
  }
}

if (failures.length) {
  console.error("Monochrome Completion V1 smoke failed:\n" + failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log("Monochrome Completion V1 smoke passed: shared shell, representative templates and bilingual global 404 HTML/status/noindex.");
console.warn("PENDING: three-width real-browser visual and interaction acceptance remain unverified.");
