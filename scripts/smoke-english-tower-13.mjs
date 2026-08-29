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
    modifiedAt: "2026-08-01",
    tocAnchor: "use-this-guide",
    tocHeading: "Use this guide when",
    expectsFaq: false,
    verificationSignals: [
      "Screeps Console test",
      "Live multi-tick verification",
      "Pending",
    ],
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
      "How to Make Towers Heal the Creep That Needs It Most",
    seoTitle:
      "Screeps Tower Healing: Injury Ratio, Missing Hits, and Range",
    query: "Tower heal Creeps",
    modifiedAt: "2026-08-28",
    tocAnchor: "quick-answer",
    tocHeading: "Quick answer",
    expectsFaq: true,
    verificationSignals: [
      "Screeps Console test",
      "Live Tower heal, falloff, Tower power effects, over-heal and multi-target allocation test",
      "Pending",
    ],
    signals: [
      "FIND_MY_CREEPS",
      "TOWER_ENERGY_COST",
      "heal-partial",
      "Memory.towerHealing",
      "targetVisible",
      "hitsBefore",
      "hitsNow",
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
    modifiedAt: "2026-08-01",
    tocAnchor: "use-this-guide",
    tocHeading: "Use this guide when",
    expectsFaq: false,
    verificationSignals: [
      "Screeps Console test",
      "Live multi-tick verification",
      "Pending",
    ],
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
    ...article.verificationSignals,
    ...article.signals,
    `rel="canonical" href="${canonical}"`,
    `rel="alternate" hrefLang="en" href="${canonical}"`,
    `rel="alternate" hrefLang="zh-CN" href="${chinese}"`,
    `rel="alternate" hrefLang="x-default" href="${canonical}"`,
    `href="#${article.tocAnchor}"`,
    `<h2 id="${article.tocAnchor}">${article.tocHeading}</h2>`,
    `"@type":"BlogPosting"`,
    `"datePublished":"2026-07-26"`,
    `"dateModified":"${article.modifiedAt}"`,
  ]) {
    if (!body.includes(expected)) {
      failures.push(
        `${article.path}: missing “${expected}”`,
      );
    }
  }

  if (article.expectsFaq) {
    for (const expected of [
      `"@type":"FAQPage"`,
      `href="#faq"`,
      `<h2 id="faq">Frequently asked questions</h2>`,
    ]) {
      if (!body.includes(expected)) {
        failures.push(
          `${article.path}: missing “${expected}”`,
        );
      }
    }
  } else {
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
  !healBody.includes("FIND_MY_CREEPS")
  || !healBody.includes("heal-partial")
  || !healBody.includes("Memory.towerHealing")
  || !healBody.includes("targetVisible")
) {
  failures.push(
    "Tower heal page lacks the current regular-Creep priority or later-observation workflow",
  );
}
for (const superseded of [
  "FIND_MY_POWER_CREEPS",
  "verified-tower-healing",
  "EVENT_HEAL_TYPE_RANGED",
  "allocateTowerHealing",
]) {
  if (healBody.includes(superseded)) {
    failures.push(
      `Tower heal page still exposes superseded 2026-08-01 signal: ${superseded}`,
    );
  }
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
    `\nTower 13 production smoke failed: ${failures.length} issue(s).`,
  );
  process.exit(1);
}

console.log(
  "Tower 13 production smoke passed: attack and repair preserve exact-event workflows; Tower heal uses the current regular-Creep priority and later-observation workflow; canonical, hreflang, structured data, search, blog index, and Sitemap are current.",
);
