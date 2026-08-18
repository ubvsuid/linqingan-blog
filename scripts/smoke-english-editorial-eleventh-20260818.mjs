const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const pages = [
  {
    path: "/en/blog/screeps-first-room-code",
    sectionId: "orchestration-contract",
    staleLiveLabel: "Live Spawn, harvest, transfer, build, repair, upgrade, and recovery test",
  },
  {
    path: "/en/blog/screeps-room-visibility",
    sectionId: "name-position-map-live-room",
    staleLiveLabel: "Live multi-tick visibility test",
  },
  {
    path: "/en/blog/screeps-global-cache",
    sectionId: "cache-key-contract",
    staleLiveLabel: "Live global-reset and cache-invalidation test",
  },
];

const failures = [];

for (const page of pages) {
  const response = await fetch(`${baseUrl}${page.path}`, { redirect: "manual" });
  const body = await response.text();

  if (response.status !== 200) {
    failures.push(`${page.path}: expected 200, received ${response.status}`);
    continue;
  }

  const chineseRows = body.match(/<dt>Chinese source article<\/dt>/g) || [];
  if (chineseRows.length !== 1) {
    failures.push(`${page.path}: expected one visible Chinese source evidence row, found ${chineseRows.length}`);
  }

  const liveRows = body.match(/<dt>Live multi-tick verification pending<\/dt>/g) || [];
  if (liveRows.length !== 1) {
    failures.push(`${page.path}: expected one visible consolidated live-verification row, found ${liveRows.length}`);
  }

  if (body.includes(page.staleLiveLabel)) {
    failures.push(`${page.path}: stale live-evidence row still rendered: ${page.staleLiveLabel}`);
  }

  for (const expected of [
    `id="${page.sectionId}"`,
    `"dateModified":"2026-08-18"`,
    "Pending — no real-shard Console transcript was collected for this revision",
  ]) {
    if (!body.includes(expected)) {
      failures.push(`${page.path}: missing expected content “${expected}”`);
    }
  }
}

if (failures.length) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  process.exit(1);
}

console.log(`Eleventh editorial verification smoke passed: ${pages.length} pages have one Chinese-source row, one consolidated live Pending row, current sections, and 2026-08-18 dateModified.`);
