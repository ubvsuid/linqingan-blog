const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const revised = [
  {
    path: "/en/blog/screeps-creep-harvest-energy",
    chinesePath: "/blog/screeps-first-creep-harvest",
    title: "Screeps Harvest Energy: Build Your First Creep.harvest() Loop",
    indexTitle: "Screeps Harvest Energy: Your First Creep Script",
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
    forbidden: [
      "worker Store full",
      "ERR_FULL</code></td><td>The worker cannot receive more Energy",
    ],
  },
  {
    path: "/en/blog/screeps-first-extension",
    chinesePath: "/blog/screeps-first-extension",
    title: "Screeps First Extension: Build It and Diagnose ERR_INVALID_TARGET",
    indexTitle: "Screeps First Extension: Build It and Diagnose ERR_INVALID_TARGET",
    headline: "Build Your First Screeps Extension Without Missing a Blocked Site",
    modifiedAt: "2026-08-17",
    signals: [
      "blocking object or Creep occupies the target tile",
      "lookFor(LOOK_CREEPS)",
      "owned-room Safe Mode",
      "ERR_INVALID_TARGET",
      "progressBefore: site.progress",
      "Official engine source",
      "Pending — no live occupied Extension-site",
    ],
    forbidden: [],
  },
  {
    path: "/en/blog/screeps-build-repair",
    chinesePath: "/blog/screeps-build-and-repair",
    title: "Screeps Builder Priority: Build, Repair, Then Upgrade Safely",
    indexTitle: "Screeps Builder Priority: Build, Repair, Then Upgrade Safely",
    headline: "Run a Screeps Builder Without Hiding Build, Repair, or Controller Errors",
    modifiedAt: "2026-08-14",
    signals: [
      "controller.my !== true",
      "controller.upgradeBlocked > 0",
      "controller-not-owned",
      "controller-upgrade-blocked",
      "Repair target policy is not the same as a repair() ownership rule",
      "do not require the target structure itself to be yours",
      "Official engine source",
      "Pending — no live blocked-site",
    ],
    forbidden: [],
  },
];

const failures = [];

for (const article of revised) {
  const response = await fetch(`${baseUrl}${article.path}`, {
    redirect: "manual",
  });
  const body = await response.text();

  if (response.status !== 200) {
    failures.push(
      `${article.path}: expected 200, received ${response.status}`,
    );
    continue;
  }

  const canonical = `https://www.linqingan.com${article.path}`;
  const chinese = `https://www.linqingan.com${article.chinesePath}`;

  const required = [
    article.title,
    article.headline,
    ...article.signals,
    `rel="canonical" href="${canonical}"`,
    `rel="alternate" hrefLang="en" href="${canonical}"`,
    `rel="alternate" hrefLang="zh-CN" href="${chinese}"`,
    `rel="alternate" hrefLang="x-default" href="${canonical}"`,
    `property="article:modified_time" content="${article.modifiedAt}"`,
    `"dateModified":"${article.modifiedAt}"`,
    `"@type":"BlogPosting"`,
    "Screeps Console test",
    "Live multi-tick verification",
    "Pending",
  ];

  for (const signal of required) {
    if (!body.includes(signal)) {
      failures.push(`${article.path}: missing “${signal}”`);
    }
  }

  if (body.includes(`"@type":"FAQPage"`)) {
    failures.push(`${article.path}: unexpected FAQPage structured data`);
  }

  for (const signal of article.forbidden) {
    if (body.includes(signal)) {
      failures.push(`${article.path}: forbidden stale signal “${signal}”`);
    }
  }
}

const controlPath = "/en/blog/screeps-transfer-energy-to-spawn";
const controlResponse = await fetch(`${baseUrl}${controlPath}`, {
  redirect: "manual",
});
const controlBody = await controlResponse.text();

if (controlResponse.status !== 200) {
  failures.push(
    `${controlPath}: expected 200, received ${controlResponse.status}`,
  );
} else if (
  controlBody.includes(
    `property="article:modified_time" content="2026-08-14"`,
  )
) {
  failures.push(`${controlPath}: false fourth-batch freshness detected`);
}

const indexResponse = await fetch(`${baseUrl}/en/blog-index.json`, {
  redirect: "manual",
});
const indexBody = await indexResponse.text();

if (indexResponse.status !== 200) {
  failures.push(
    `/en/blog-index.json: expected 200, received ${indexResponse.status}`,
  );
} else {
  for (const article of revised) {
    if (!indexBody.includes(article.indexTitle)) {
      failures.push(`/en/blog-index.json: missing “${article.indexTitle}”`);
    }
  }
}

const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`, {
  redirect: "manual",
});
const sitemapBody = await sitemapResponse.text();

if (sitemapResponse.status !== 200) {
  failures.push(
    `/sitemap.xml: expected 200, received ${sitemapResponse.status}`,
  );
} else {
  for (const article of revised) {
    if (!sitemapBody.includes(`https://www.linqingan.com${article.path}`)) {
      failures.push(`/sitemap.xml: missing ${article.path}`);
    }
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(
    `\nFourth English editorial production smoke failed: ${failures.length} item(s).`,
  );
  process.exit(1);
}

console.log(
  "Fourth English editorial smoke passed: Harvest validates the reviewed August 29 page separately from its discovery listing title, First Extension retains its August 17 revision, Build Repair keeps August 14 freshness, and live evidence remains Pending.",
);
