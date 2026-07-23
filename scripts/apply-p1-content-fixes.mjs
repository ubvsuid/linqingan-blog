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

function patchPowerSpawnBoundaryWording() {
  const filePath = "content/posts/screeps-power-spawn-process-power.md";
  let source = fs.readFileSync(filePath, "utf8");
  const before = "这与市场成交不同，不需要每 tick 人工确认同一笔处理；但仍应保留：";
  const after = "Power 处理属于持续资源行为，不需要每 tick 人工确认同一轮调用；但仍应保留：";

  if (source.includes(before)) {
    source = source.replace(before, after);
  } else if (!source.includes(after)) {
    throw new Error("Unable to update Power Spawn boundary wording");
  }

  fs.writeFileSync(filePath, source);
}

function patchContentWarnings() {
  const filePath = "scripts/content-check.mjs";
  let source = fs.readFileSync(filePath, "utf8");

  const oldMarketCheck = `  const marketScanText = plainContent.replace(/部件价格/g, "");
  if (
    !marketSlugs.has(slug)
    && !marketBoundarySlugs.has(slug)
    && /预测价格|承诺收益|订单|成交|市场操作/.test(marketScanText)
  ) {
    addWarning(\`${"${fileName}"}: 非市场文章出现价格、订单、收益或成交词，请确认是否为主题残留\`);
  }`;

  const newMarketCheck = `  const marketScanText = plainContent.replace(/部件价格/g, "");
  const marketResidueLines = marketScanText
    .split("\\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => /预测价格|承诺收益|订单|成交|市场操作/.test(line))
    .filter((line) => !/(?:与市场成交不同|不(?:属于|是|涉及|执行|包含).*市场操作|不(?:涉及|创建|提交|处理).*订单|不(?:进行|执行|涉及).*成交)/.test(line));

  if (
    !marketSlugs.has(slug)
    && !marketBoundarySlugs.has(slug)
    && marketResidueLines.length > 0
  ) {
    const excerpts = marketResidueLines.slice(0, 3).join("｜");
    addWarning(\`${"${fileName}"}: 非市场文章出现疑似市场残留：${"${excerpts}"}\`);
  }`;

  source = replaceIfNeeded(
    source,
    oldMarketCheck,
    newMarketCheck,
    "const marketResidueLines =",
    "line-aware market residue check",
  );

  const oldActionPattern = `    const hasRelevantAction = /\\.(?:attack|build|claimController|dismantle|drop|harvest|heal|move|moveTo|pickup|rangedAttack|rangedHeal|repair|reserveController|transfer|upgradeController|withdraw|renewCreep|recycleCreep|boostCreep|runReaction|observeRoom)\\s*\\(/.test(code);`;
  const newActionPattern = `    const hasRelevantAction = /\\.(?:attack|build|claimController|dismantle|drop|harvest|heal|move|moveTo|pickup|rangedAttack|rangedHeal|repair|reserveController|transfer|transferEnergy|upgradeController|withdraw|renewCreep|recycleCreep|boostCreep|runReaction|observeRoom|launchNuke)\\s*\\(/.test(code);`;

  source = replaceIfNeeded(
    source,
    oldActionPattern,
    newActionPattern,
    "transferEnergy|upgradeController",
    "range-related action recognition",
  );

  fs.writeFileSync(filePath, source);
}

patchPowerSpawnBoundaryWording();
patchContentWarnings();
console.log("P1 content warning fixes applied.");
