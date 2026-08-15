const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const checks = [
  {
    path: "/en/blog/screeps-rawmemory-segments",
    required: [
      "const length = raw.length;",
      "segment-too-large-for-current-driver",
      "JavaScript string length, not UTF-8 encoded bytes",
      "RawMemory.setActiveSegments(activeNextTick)",
      "activation-already-finalized",
      "segment-unavailable",
      "current official driver",
      `"dateModified":"2026-08-14"`,
    ],
  },
  {
    path: "/en/blog/screeps-lab-run-reaction",
    required: [
      "function getReactionAmount(outputLab)",
      "PWR_OPERATE_LAB",
      "POWER_INFO[PWR_OPERATE_LAB].effect[effect.level - 1]",
      "reactionAmount: plan.reactionAmount",
      "inputADelta === -snapshot.reactionAmount",
      "inputBDelta === -snapshot.reactionAmount",
      "verified-exact-reaction",
      "input Lab ownership/activity is not an API precondition",
      `"dateModified":"2026-08-14"`,
    ],
  },
  {
    path: "/en/blog/screeps-lab-boost-creep",
    required: [
      "function getEligibleBoostParts(creep, bodyType, mineralType)",
      "&& !part.boost",
      "LAB_BOOST_MINERAL * bodyPartsCount",
      "LAB_BOOST_ENERGY * bodyPartsCount",
      "TOUGH",
      "request.creepId",
      "body-identity-mismatch",
      "partial-or-ambiguous-boost",
      "verified-exact-boost",
      "target ownership is not an API precondition",
      `"dateModified":"2026-08-14"`,
    ],
    prohibited: [
      "&& part.hits > 0",
    ],
  },
];

const failures = [];

for (const check of checks) {
  const response = await fetch(`${baseUrl}${check.path}`, {
    redirect: "manual",
  });
  const body = await response.text();

  if (response.status !== 200) {
    failures.push(
      `${check.path}: expected 200, received ${response.status}`,
    );
    continue;
  }

  for (const signal of check.required) {
    if (!body.includes(signal)) {
      failures.push(`${check.path}: missing “${signal}”`);
    }
  }

  for (const signal of check.prohibited ?? []) {
    if (body.includes(signal)) {
      failures.push(`${check.path}: prohibited “${signal}”`);
    }
  }

  for (const boundary of [
    "Screeps Console test",
    "Live multi-tick verification",
    "Pending",
    `rel="canonical" href="https://www.linqingan.com${check.path}"`,
    `"@type":"BlogPosting"`,
  ]) {
    if (!body.includes(boundary)) {
      failures.push(`${check.path}: missing boundary “${boundary}”`);
    }
  }

  if (body.includes(`"@type":"FAQPage"`)) {
    failures.push(`${check.path}: unexpected FAQPage structured data`);
  }
}

const factoryResponse = await fetch(
  `${baseUrl}/en/blog/screeps-factory-produce`,
  { redirect: "manual" },
);
const factoryBody = await factoryResponse.text();

if (factoryResponse.status !== 200) {
  failures.push(
    `/en/blog/screeps-factory-produce: expected 200, received ${factoryResponse.status}`,
  );
} else {
  for (const signal of [
    "permanent-level-mismatch",
    "operate-effect-missing",
    `"dateModified":"2026-08-01"`,
  ]) {
    if (!factoryBody.includes(signal)) {
      failures.push(`factory control page: missing “${signal}”`);
    }
  }

  if (factoryBody.includes(`"dateModified":"2026-08-14"`)) {
    failures.push(
      "factory control page received false third-batch freshness",
    );
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(
    `\nThird English editorial smoke failed: ${failures.length} issue(s).`,
  );
  process.exit(1);
}

console.log(
  "Third English editorial smoke passed: current driver Segment length, operated Lab reaction amount, boost eligibility/partial-result boundaries, Pending live evidence, and no false Factory freshness.",
);