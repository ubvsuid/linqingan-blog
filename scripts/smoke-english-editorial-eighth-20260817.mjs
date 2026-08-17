const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-mineral-extractor-harvest",
    chinesePath: "/blog/screeps-mineral-extractor-harvest",
    signals: [
      "HARVEST_MINERAL_POWER",
      "boosted-work-batch-out-of-scope",
      "deliver-before-next-harvest",
      "plannedOutput",
      "current free Store capacity",
      "final depletion harvest",
      "80977824199a596d174d392fd0cf8c458c21fcbd",
      "Publication status",
      "Published",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-storage-energy-usage",
    chinesePath: "/blog/screeps-storage-energy-usage",
    signals: [
      "processed-amount",
      "Treat the coordinator amount as a request ceiling",
      "requestedAmount: pending.amount",
      "processedAmount: event.data?.amount ?? null",
      "request ceiling",
      "current empty space",
      "current free capacity",
      "80977824199a596d174d392fd0cf8c458c21fcbd",
      "Publication status",
      "Published",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-link-transfer-energy",
    chinesePath: "/blog/screeps-link-transfer-energy",
    signals: [
      "processed-amount",
      "Separate requested Link Energy from processed Energy",
      "remainingTargetCapacity",
      "- requestedAmount",
      "does not recycle loss-created capacity",
      "processedAmount: matches[0].data?.amount ?? null",
      "processedEstimate: estimateLinkReceipt",
      "80977824199a596d174d392fd0cf8c458c21fcbd",
      "Publication status",
      "Published",
      "Pending",
    ],
  },
];

const failures = [];

for (const article of articles) {
  const response = await fetch(`${baseUrl}${article.path}`, { redirect: "manual" });
  const body = await response.text();
  if (response.status !== 200) {
    failures.push(`${article.path}: expected 200, got ${response.status}`);
    continue;
  }

  const canonical = `https://www.linqingan.com${article.path}`;
  const chinese = `https://www.linqingan.com${article.chinesePath}`;
  for (const expected of [
    ...article.signals,
    `rel="canonical" href="${canonical}"`,
    `rel="alternate" hrefLang="en" href="${canonical}"`,
    `rel="alternate" hrefLang="zh-CN" href="${chinese}"`,
    `rel="alternate" hrefLang="x-default" href="${canonical}"`,
    `"@type":"BlogPosting"`,
    `"dateModified":"2026-08-17"`,
  ]) {
    if (!body.includes(expected)) {
      failures.push(`${article.path}: missing “${expected}”`);
    }
  }
}

const mineralBody = await (await fetch(`${baseUrl}/en/blog/screeps-mineral-extractor-harvest`)).text();
if (mineralBody.includes("ERR_FULL</code></td><td>Mineral")) {
  failures.push("Mineral page must not teach ERR_FULL as a Mineral harvest Store-capacity return code");
}

const linkBody = await (await fetch(`${baseUrl}/en/blog/screeps-link-transfer-energy`)).text();
if (linkBody.includes("remainingTargetCapacity\n        - estimate.estimatedReceived")) {
  failures.push("Link page still reuses predicted post-loss capacity in the same planning pass");
}

const negativeControls = [
  "/en/blog/screeps-power-spawn-process-power",
  "/en/blog/screeps-select-source-by-path",
];
for (const path of negativeControls) {
  const body = await (await fetch(`${baseUrl}${path}`)).text();
  if (body.includes(`"dateModified":"2026-08-17"`)) {
    failures.push(`${path}: received false August 17 freshness from eighth editorial batch`);
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\nEighth English editorial smoke failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log(
  "Eighth English editorial smoke passed: Mineral next-batch Store policy, Storage requested-versus-processed amounts, conservative Link request-capacity reservation, exact event identity, scoped August 17 freshness, and Pending live contention evidence.",
);
