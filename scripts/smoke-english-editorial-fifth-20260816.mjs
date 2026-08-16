const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const revised = [
  {
    path: "/en/blog/screeps-creep-body-parts",
    chinesePath: "/blog/screeps-creep-body-parts",
    title: "Screeps Creep Body Parts: WORK, CARRY, and MOVE",
    headline: "Why Your Screeps Creep Cannot Harvest, Carry, or Move",
    signals: [
      "Capability and capacity are separate",
      "Source harvesting has no Store-capacity",
      "do not wait for a Source-harvest",
      "later processing can drop harvested overflow",
      "Official engine source",
      "Cross-guide consistency",
      "Pending — no full-Store Source harvest trace is claimed",
    ],
    forbidden: [
      "The Creep cannot accept more of the harvested resource.",
    ],
  },
  {
    path: "/en/blog/screeps-roomposition-distance",
    chinesePath: "/blog/screeps-roomposition-distance",
    title: "Screeps RoomPosition Distance: Range vs Path",
    headline: "Which Screeps RoomPosition Distance Method Should You Use?",
    signals: [
      "Cross-room RoomPosition methods do not all behave the same way",
      "getRangeTo(target)",
      "Infinity",
      "getDirectionTo(target)",
      "world-space displacement",
      "Game.map.getRoomLinearDistance()",
      "Official engine source",
      "Pending — no live cross-room RoomPosition transcript is claimed",
    ],
    forbidden: [],
  },
  {
    path: "/en/blog/screeps-map-find-route",
    chinesePath: "/blog/screeps-map-find-route",
    title: "Screeps Game.map.findRoute(): Cross-Room Routing",
    headline: "How to Plan and Execute a Cross-Room Route in Screeps",
    signals: [
      "Validate routeCallback policy before the engine sees it",
      "Number(value) || 1",
      "0</code>, <code>false</code>, <code>null</code>, <code>undefined</code>, an empty string, and <code>NaN</code>",
      "findExit()</code>, which calls <code>findRoute()</code> internally",
      "ERR_INVALID_ARGS",
      "Callback normalization",
      "Pending — no live routeCallback return-value transcript is claimed",
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
    failures.push(`${article.path}: expected 200, received ${response.status}`);
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
    `property="article:modified_time" content="2026-08-16"`,
    `"dateModified":"2026-08-16"`,
    `"@type":"BlogPosting"`,
    "Screeps Console test",
    "Pending",
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
  controlBody.includes(`property="article:modified_time" content="2026-08-16"`)
  || controlBody.includes(`"dateModified":"2026-08-16"`)
) {
  failures.push(`${controlPath}: false fifth-batch freshness detected`);
}

const indexResponse = await fetch(`${baseUrl}/en/blog-index.json`, {
  redirect: "manual",
});
const indexBody = await indexResponse.text();

if (indexResponse.status !== 200) {
  failures.push(`/en/blog-index.json: expected 200, received ${indexResponse.status}`);
} else {
  for (const article of revised) {
    if (!indexBody.includes(article.title)) {
      failures.push(`/en/blog-index.json: missing “${article.title}”`);
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
  console.error(`\nFifth English editorial production smoke failed: ${failures.length} item(s).`);
  process.exit(1);
}

console.log(
  "Fifth English editorial smoke passed: Body Parts no longer teaches Source ERR_FULL, RoomPosition preserves cross-room Infinity/false/direction distinctions, findRoute callback falsy values are separated from Infinity, freshness is scoped to three pages, and live evidence remains Pending.",
);
