const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const revised = [
  {
    path: "/en/blog/screeps-creep-harvest-energy",
    title: "Screeps Harvest Energy: Build Your First Creep.harvest() Loop",
    headline: "How to Harvest Energy With Your First Creep",
    modifiedAt: "2026-08-29",
    signals: [
      "Source harvesting does not return <code>ERR_FULL</code>",
      "FIND_SOURCES_ACTIVE",
      "const nextBatch = activeWork * HARVEST_POWER",
      "ready-for-delivery",
      "body-store-mismatch",
      "Source-specific Creep.harvest() return codes",
      "Official engine source",
      "Pending — no live near-full, full-Store, or dropped-overflow comparison is claimed",
    ],
    extraRequired: [],
    forbidden: [
      "Screeps Creep.harvest(): Full Stores, Return Codes, and Safe Energy Loops",
      "Screeps Harvest Energy Without the ERR_FULL Mistake",
      "harvestBatch = activeWork * HARVEST_POWER",
      "harvest-batch-exceeds-store",
    ],
  },
  {
    path: "/en/blog/screeps-upgrade-controller",
    title: "Screeps upgradeController(): Build Your First Upgrader Loop",
    headline: "How to Make a Screeps Creep Upgrade the Room Controller",
    modifiedAt: "2026-08-17",
    signals: [
      "harvestBatch = activeWork * HARVEST_POWER",
      "freeEnergy &lt; harvestBatch",
      "Source harvest batch larger than its Energy capacity",
      "<strong>Project policy, not an API contract:</strong>",
      "Source <code>harvest()</code> call has no Store-capacity <code>ERR_FULL</code> preflight",
      "Pending — no live multi-WORK near-full Upgrader overflow comparison is claimed",
    ],
    extraRequired: [
      "Official engine source",
      "80977824199a596d174d392fd0cf8c458c21fcbd",
      "Source harvest capacity policy",
      "Publication status",
      "Published",
    ],
    forbidden: [
      "<strong>Empty → harvest. Full → upgrade. Partly full → continue the current trip.</strong>",
      "<li><code>memory.upgrading</code> becomes true only when the Store is full.</li>",
    ],
  },
  {
    path: "/en/blog/screeps-first-extension",
    title: "Screeps First Extension: Build It and Diagnose ERR_INVALID_TARGET",
    headline: "Build Your First Screeps Extension Without Missing a Blocked Site",
    modifiedAt: "2026-08-17",
    signals: [
      "harvestBatch = activeWork * HARVEST_POWER",
      "freeEnergy &lt; harvestBatch",
      "harvest-batch-exceeds-store",
      "conservative <strong>project policy</strong>",
      "Source <code>harvest()</code> has no Store-capacity <code>ERR_FULL</code> preflight",
      "Pending — no live near-full multi-WORK Builder overflow or occupied-site comparison is claimed",
    ],
    extraRequired: [
      "Official engine source",
      "80977824199a596d174d392fd0cf8c458c21fcbd",
      "Source harvest capacity policy",
      "Publication status",
      "Published",
    ],
    forbidden: [
      "The full/empty switch is hysteresis: partial Energy keeps the previous phase.",
    ],
  },
];

const failures = [];

for (const article of revised) {
  const response = await fetch(`${baseUrl}${article.path}`, {
    redirect: "manual",
  });
  const body = await response.text();

  if (response.status !== 200) {
    failures.push(`${article.path}: expected 200, received ${response.status}`);
    continue;
  }

  const canonical = `https://www.linqingan.com${article.path}`;
  const required = [
    article.title,
    article.headline,
    ...article.signals,
    ...article.extraRequired,
    `rel="canonical" href="${canonical}"`,
    `rel="alternate" hrefLang="en" href="${canonical}"`,
    `rel="alternate" hrefLang="zh-CN"`,
    `rel="alternate" hrefLang="x-default" href="${canonical}"`,
    `property="article:modified_time" content="${article.modifiedAt}"`,
    `"dateModified":"${article.modifiedAt}"`,
    `"@type":"BlogPosting"`,
  ];

  for (const signal of required) {
    if (!body.includes(signal)) {
      failures.push(`${article.path}: missing “${signal}”`);
    }
  }

  for (const signal of article.forbidden) {
    if (body.includes(signal)) {
      failures.push(`${article.path}: forbidden stale signal “${signal}”`);
    }
  }
}

const controlPath = "/en/blog/screeps-global-cache";
const controlResponse = await fetch(`${baseUrl}${controlPath}`, {
  redirect: "manual",
});
const controlBody = await controlResponse.text();

if (controlResponse.status !== 200) {
  failures.push(`${controlPath}: expected 200, received ${controlResponse.status}`);
} else if (
  controlBody.includes(`property="article:modified_time" content="2026-08-17"`)
  || controlBody.includes(`"dateModified":"2026-08-17"`)
) {
  failures.push(`${controlPath}: false seventh-batch freshness detected`);
}

const indexResponse = await fetch(`${baseUrl}/en/blog-index.json`, {
  redirect: "manual",
});
const indexBody = await indexResponse.text();

if (indexResponse.status !== 200) {
  failures.push(`/en/blog-index.json: expected 200, received ${indexResponse.status}`);
} else {
  for (const article of revised) {
    if (!indexBody.includes(article.headline) && !indexBody.includes(article.title)) {
      failures.push(`/en/blog-index.json: missing ${article.path}`);
    }
  }
}

const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`, {
  redirect: "manual",
});
const sitemapBody = await sitemapResponse.text();

if (sitemapResponse.status !== 200) {
  failures.push(`/sitemap.xml: expected 200, received ${sitemapResponse.status}`);
} else {
  for (const article of revised) {
    if (!sitemapBody.includes(`https://www.linqingan.com${article.path}`)) {
      failures.push(`/sitemap.xml: missing ${article.path}`);
    }
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\nSeventh English editorial production smoke failed: ${failures.length} item(s).`);
  process.exit(1);
}

console.log(
  "Seventh English editorial smoke passed: Harvest follows its reviewed August 29 beginner supersession, while Upgrade Controller and First Extension retain the August 17 Source-capacity policy checks and Pending live evidence.",
);
