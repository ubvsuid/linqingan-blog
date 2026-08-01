const baseUrl =
  process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path:
      "/en/blog/screeps-tower-auto-attack-hostiles",
    chinesePath:
      "/blog/screeps-tower-auto-attack-hostiles",
    headline:
      "Assign Tower Fire by ID and Verify Every Attack Event",
    seoTitle:
      "Screeps Tower.attack(): Verify One Multi-Tower Volley",
    query: "Tower.attack event",
    signals: [
      "EVENT_ATTACK_TYPE_RANGED",
      "verified-tower-volley",
      "event-window-missed",
      "estimatedRawDamage",
      "room.getEventLog()",
      "Live Tower falloff, Power effect, TOUGH, healing, diplomacy and multi-Tower event test",
    ],
  },
  {
    path:
      "/en/blog/screeps-tower-heal-creeps",
    chinesePath:
      "/blog/screeps-tower-heal-creeps",
    headline:
      "Heal Owned Creeps and Power Creeps Without Guessing the Result",
    seoTitle:
      "Screeps Tower.heal(): Verify Exact Heal Events",
    query: "Tower.heal event",
    signals: [
      "FIND_MY_POWER_CREEPS",
      "EVENT_HEAL_TYPE_RANGED",
      "verified-tower-healing",
      "allocateTowerHealing",
      "room.getEventLog()",
      "Live Power Creep, falloff, Power effect, incoming damage, over-heal and multi-target event test",
    ],
  },
  {
    path:
      "/en/blog/screeps-tower-repair-threshold",
    chinesePath:
      "/blog/screeps-tower-repair-threshold",
    headline:
      "Repair One Structure Without Confusing Decay or Other Workers",
    seoTitle:
      "Screeps Tower.repair(): Verify Exact Repair Events",
    query: "Tower.repair event",
    signals: [
      "EVENT_REPAIR",
      "energySpent",
      "verified-tower-repair",
      "allocateTowerRepair",
      "TOWER_POWER_REPAIR",
      "Live decay, incoming damage, Creep repair, Power effect, over-repair, reserve and event test",
    ],
  },
];

const failures = [];

for (const article of articles) {
  const response = await fetch(
    `${baseUrl}${article.path}`,
    { redirect: "manual" },
  );
  const body = await response.text();

  if (response.status !== 200) {
    failures.push(
      `${article.path}: expected 200, received ${response.status}`,
    );
    continue;
  }

  const canonical =
    `https://www.linqingan.com${article.path}`;
  const chinese =
    `https://www.linqingan.com${article.chinesePath}`;

  for (const expected of [
    article.headline,
    article.seoTitle,
    "Verification status",
    "Screeps Console test",
    "Live multi-tick verification",
    "Pending",
    ...article.signals,
    `rel="canonical" href="${canonical}"`,
    `rel="alternate" hrefLang="en" href="${canonical}"`,
    `rel="alternate" hrefLang="zh-CN" href="${chinese}"`,
    `rel="alternate" hrefLang="x-default" href="${canonical}"`,
    `href="#use-this-guide"`,
    `<h2 id="use-this-guide">Use this guide when</h2>`,
    `"@type":"BlogPosting"`,
    `"datePublished":"2026-07-26"`,
    `"dateModified":"2026-08-01"`,
  ]) {
    if (!body.includes(expected)) {
      failures.push(
        `${article.path}: missing “${expected}”`,
      );
    }
  }

  for (const prohibited of [
    `"@type":"FAQPage"`,
    `href="#quick-answer"`,
    `<h2 id="faq">`,
  ]) {
    if (body.includes(prohibited)) {
      failures.push(
        `${article.path}: still contains “${prohibited}”`,
      );
    }
  }

  const searchResponse = await fetch(
    `${baseUrl}/en/search?q=${encodeURIComponent(
      article.query,
    )}`,
    { redirect: "manual" },
  );
  const searchBody = await searchResponse.text();

  if (searchResponse.status !== 200) {
    failures.push(
      `/en/search?q=${article.query}: received ${searchResponse.status}`,
    );
  } else if (!searchBody.includes(article.seoTitle)) {
    failures.push(
      `/en/search?q=${article.query}: missing “${article.seoTitle}”`,
    );
  }
}

const attackBody = await (
  await fetch(
    `${baseUrl}/en/blog/screeps-tower-auto-attack-hostiles`,
  )
).text();
if (
  !attackBody.includes("EVENT_ATTACK_TYPE_RANGED")
  || !attackBody.includes("verified-tower-volley")
  || !attackBody.includes("estimatedRawDamage")
) {
  failures.push(
    "Tower attack page lacks exact event or output-estimate boundaries",
  );
}

const healBody = await (
  await fetch(
    `${baseUrl}/en/blog/screeps-tower-heal-creeps`,
  )
).text();
if (
  !healBody.includes("FIND_MY_POWER_CREEPS")
  || !healBody.includes("EVENT_HEAL_TYPE_RANGED")
  || !healBody.includes("verified-tower-healing")
) {
  failures.push(
    "Tower heal page lacks Power Creep or exact event boundaries",
  );
}

const repairBody = await (
  await fetch(
    `${baseUrl}/en/blog/screeps-tower-repair-threshold`,
  )
).text();
if (
  !repairBody.includes("EVENT_REPAIR")
  || !repairBody.includes("energySpent")
  || !repairBody.includes("verified-tower-repair")
) {
  failures.push(
    "Tower repair page lacks exact actor, target, amount, or Energy evidence",
  );
}

const blogResponse = await fetch(
  `${baseUrl}/en/blog-index.json`,
  { redirect: "manual" },
);
const blogBody = await blogResponse.text();

if (blogResponse.status !== 200) {
  failures.push(
    `/en/blog-index.json: received ${blogResponse.status}`,
  );
} else {
  for (const article of articles) {
    if (!blogBody.includes(article.seoTitle)) {
      failures.push(
        `/en/blog-index.json: missing “${article.seoTitle}”`,
      );
    }
  }
}

const sitemapResponse = await fetch(
  `${baseUrl}/sitemap.xml`,
  { redirect: "manual" },
);
const sitemapBody = await sitemapResponse.text();

if (sitemapResponse.status !== 200) {
  failures.push(
    `/sitemap.xml: received ${sitemapResponse.status}`,
  );
} else {
  for (const article of articles) {
    const expected =
      `https://www.linqingan.com${article.path}`;
    if (!sitemapBody.includes(expected)) {
      failures.push(
        `/sitemap.xml: missing ${expected}`,
      );
    }
  }
}

if (failures.length > 0) {
  failures.forEach((failure) =>
    console.error(`ERROR: ${failure}`),
  );
  console.error(
    `\nDeep Tower event production smoke failed: ${failures.length} issue(s).`,
  );
  process.exit(1);
}

console.log(
  "Deep Tower event production smoke passed: 3 existing pages, exact prior-tick attack/heal/repair actor-target events, Power Creep healing, Pending live evidence, Canonical, hreflang, BlogPosting, search, and Sitemap.",
);
