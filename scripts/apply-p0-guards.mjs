import fs from "node:fs";

function replaceIfNeeded(source, before, after, alreadyApplied, label) {
  if (source.includes(before)) {
    return source.replace(before, after);
  }
  if (source.includes(alreadyApplied)) {
    return source;
  }
  throw new Error(`Unable to apply ${label}: expected source shape not found`);
}

function patchEmergencyPseudocode() {
  const filePath = "content/posts/screeps-spawn-emergency-recovery.md";
  let source = fs.readFileSync(filePath, "utf8");
  const invalidExample = /```js\n(for \(const spawn of Object\.values\(Game\.spawns\)\) \{\n  if \(harvesterCount === 0\) \{\n    spawn\.spawnCreep\(\.\.\.\);\n  \}\n\})\n```/;

  if (invalidExample.test(source)) {
    source = source.replace(invalidExample, "```text\n$1\n```");
    fs.writeFileSync(filePath, source);
    return;
  }

  if (!source.includes("```text\nfor (const spawn of Object.values(Game.spawns))")) {
    throw new Error("Unable to classify emergency recovery pseudocode block");
  }
}

function patchVerificationLabels() {
  const filePath = "src/app/(zh)/blog/[slug]/page.tsx";
  let source = fs.readFileSync(filePath, "utf8");

  source = replaceIfNeeded(
    source,
    `  const visibleUpdatedAt =\n    post.updatedAt && post.updatedAt !== post.publishedAt\n      ? post.updatedAt\n      : null;`,
    `  const visibleUpdatedAt =\n    post.updatedAt && post.updatedAt !== post.publishedAt\n      ? post.updatedAt\n      : null;\n  const hasRuntimeVerification =\n    post.verification.consoleTested || post.verification.liveTested;`,
    "const hasRuntimeVerification =",
    "runtime verification flag",
  );

  source = replaceIfNeeded(
    source,
    "                  <dt>测试环境</dt>",
    '                  <dt>{hasRuntimeVerification ? "运行测试环境" : "离线验证环境"}</dt>',
    "运行测试环境",
    "verification environment label",
  );
  source = replaceIfNeeded(
    source,
    "                  <dt>测试日期</dt>",
    '                  <dt>{hasRuntimeVerification ? "运行测试日期" : "离线验证日期"}</dt>',
    "运行测试日期",
    "verification date label",
  );
  source = replaceIfNeeded(
    source,
    "                  <dt>测试结果</dt>",
    '                  <dt>{hasRuntimeVerification ? "运行测试结果" : "离线验证结果"}</dt>',
    "运行测试结果",
    "verification result label",
  );

  fs.writeFileSync(filePath, source);
}

function patchContentChecks() {
  const filePath = "scripts/content-check.mjs";
  let source = fs.readFileSync(filePath, "utf8");

  const rawMemoryOld = `  "screeps-rawmemory-segments": {\n    forbidden: ["本 tick 写入后立即从目标 Segment 读取"],\n    required: ["RawMemory.segments", "setActiveSegments", "下一 tick", "JSON"],\n  },`;
  const rawMemoryNew = `  "screeps-rawmemory-segments": {\n    forbidden: ["本 tick 写入后立即从目标 Segment 读取"],\n    required: [\n      "RawMemory.segments",\n      "setActiveSegments",\n      "下一 tick",\n      "0 到 99",\n      "最多请求 10",\n      "undefined",\n      "空字符串",\n      "离线模拟",\n      "JSON",\n    ],\n  },\n  "screeps-pathfinder-costmatrix": {\n    required: [\n      "PathFinder.CostMatrix",\n      "roomCallback",\n      "return false",\n      "return undefined",\n      "search.incomplete",\n      "255",\n      "离线模拟",\n    ],\n  },\n  "screeps-tower-repair-threshold": {\n    required: [\n      "FIND_HOSTILE_CREEPS",\n      "FIND_MY_CREEPS",\n      "TOWER_REPAIR_ENERGY_RESERVE",\n      "TOWER_ENERGY_COST",\n      "tower.repair",\n      "Wall和Rampart",\n      "离线模拟",\n    ],\n  },\n  "screeps-structure-destroy": {\n    required: [\n      "ALLOWED_DESTROY_TYPES",\n      "DESTROY_EXTENSION",\n      "request.enabled = false",\n      "structure.destroy",\n      "ERR_BUSY",\n      "离线模拟",\n    ],\n  },`;
  source = replaceIfNeeded(
    source,
    rawMemoryOld,
    rawMemoryNew,
    '"screeps-pathfinder-costmatrix"',
    "P0 article rules",
  );

  const observerOld = `  "screeps-observer-observe-room": {\n    required: ["observeRoom", "下一 tick", "Game.rooms", "ERR_RCL_NOT_ENOUGH"],\n  },`;
  const observerNew = `  "screeps-observer-observe-room": {\n    required: [\n      "observeRoom",\n      "下一 tick",\n      "Game.rooms",\n      "Memory.observerState",\n      "requestedAt",\n      "ERR_RCL_NOT_ENOUGH",\n      "离线模拟",\n    ],\n  },`;
  source = replaceIfNeeded(
    source,
    observerOld,
    observerNew,
    '"Memory.observerState"',
    "Observer P0 rules",
  );

  const nukerOld = `  "screeps-nuker-launch-checklist": {\n    required: [\n      "Memory.nuker",\n      "result === OK",\n      "失败后必须人工",\n      "不可逆",\n      "RESOURCE_GHODIUM",\n    ],\n  },`;
  const nukerNew = `  "screeps-nuker-launch-checklist": {\n    required: [\n      "Memory.nuker",\n      "buildNukeConfirmation",\n      "request.enabled = false",\n      "NUKER_RANGE",\n      "ERR_INVALID_TARGET",\n      "result === OK",\n      "失败后必须人工",\n      "不可逆",\n      "RESOURCE_GHODIUM",\n      "离线模拟",\n    ],\n  },`;
  source = replaceIfNeeded(
    source,
    nukerOld,
    nukerNew,
    '"buildNukeConfirmation"',
    "Nuker P0 rules",
  );

  const evidenceOld = `    if (hasRuntimeEvidence) {\n      if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(data.verification.testedAt ?? "")) {\n        addError(\`${"${fileName}"}: 已标记运行验证时必须填写 verification.testedAt\`);\n      }\n      for (const field of ["testEnvironment", "testResult"]) {\n        if (typeof data.verification[field] !== "string" || data.verification[field].trim() === "") {\n          addError(\`${"${fileName}"}: 已标记运行验证时必须填写 verification.${"${field}"}\`);\n        }\n      }\n    }`;
  const evidenceNew = `    if (hasRuntimeEvidence) {\n      if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(data.verification.testedAt ?? "")) {\n        addError(\`${"${fileName}"}: 已标记运行验证时必须填写 verification.testedAt\`);\n      }\n      for (const field of ["testEnvironment", "testResult"]) {\n        if (typeof data.verification[field] !== "string" || data.verification[field].trim() === "") {\n          addError(\`${"${fileName}"}: 已标记运行验证时必须填写 verification.${"${field}"}\`);\n        }\n      }\n      if (/离线模拟|不是\\s*Screeps\\s*官方服务器/i.test(data.verification.testEnvironment ?? "")) {\n        addError(\`${"${fileName}"}: 已标记 Console/真实主循环验证时，测试环境不能仍写成离线模拟\`);\n      }\n    } else {\n      const hasOfflineEvidence = Boolean(\n        data.verification.testedAt\n        || data.verification.testEnvironment\n        || data.verification.testResult,\n      );\n\n      if (hasOfflineEvidence) {\n        if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(data.verification.testedAt ?? "")) {\n          addError(\`${"${fileName}"}: 有离线验证记录时必须填写 verification.testedAt\`);\n        }\n        for (const field of ["testEnvironment", "testResult"]) {\n          if (typeof data.verification[field] !== "string" || data.verification[field].trim() === "") {\n            addError(\`${"${fileName}"}: 有离线验证记录时必须填写 verification.${"${field}"}\`);\n          }\n        }\n\n        const environment = String(data.verification.testEnvironment ?? "");\n        if (!environment.includes("离线模拟") || !/不是\\s*Screeps\\s*官方服务器/i.test(environment)) {\n          addError(\`${"${fileName}"}: 未标记运行验证时，验证环境必须明确写出“离线模拟”和“不是 Screeps 官方服务器”\`);\n        }\n      }\n    }`;
  source = replaceIfNeeded(
    source,
    evidenceOld,
    evidenceNew,
    "const hasOfflineEvidence = Boolean(",
    "verification evidence consistency",
  );

  const orderOld = `  const rule = articleRules[slug];\n  if (rule) {`;
  const orderNew = `  const rule = articleRules[slug];\n\n  const p0OrderChecks = {\n    "screeps-tower-repair-threshold": ["FIND_HOSTILE_CREEPS", "tower.repair"],\n    "screeps-structure-destroy": ["request.enabled = false", "structure.destroy"],\n    "screeps-nuker-launch-checklist": ["request.enabled = false", "nuker.launchNuke"],\n    "screeps-observer-observe-room": ["Game.rooms[state.requestedRoom]", "observer.observeRoom"],\n  };\n\n  const orderCheck = p0OrderChecks[slug];\n  if (orderCheck) {\n    const [guardText, actionText] = orderCheck;\n    const guardIndex = code.indexOf(guardText);\n    const actionIndex = code.indexOf(actionText);\n    if (guardIndex < 0 || actionIndex < 0 || guardIndex > actionIndex) {\n      addError(\`${"${fileName}"}: P0 安全顺序不正确，必须先出现“${"${guardText}"}”，再执行“${"${actionText}"}”\`);\n    }\n  }\n\n  if (rule) {`;
  source = replaceIfNeeded(
    source,
    orderOld,
    orderNew,
    "const p0OrderChecks =",
    "P0 action ordering checks",
  );

  fs.writeFileSync(filePath, source);
}

patchEmergencyPseudocode();
patchVerificationLabels();
patchContentChecks();
console.log("P0 verification guards applied.");
